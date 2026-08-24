import { loadParametresStore } from '../parametres/storage'
import type { Bareme2Item } from '../parametres/types'
import { isPersonnelEligiblePaie } from '../recrutement/personnelConstants'
import { loadRecrutementStore } from '../recrutement/storage'
import type { Personnel } from '../recrutement/types'
import { fonctionLibelleOnly, gradeCodeOnly } from './calculerPaieMensuelleB1'
import { moisCleDepuisDate, normalizeMoisCle } from './paieMois'
import { createId, loadPaieStore, savePaieStore } from './storage'
import { parseMontantTaux } from './tauxMonnaieEnCours'
import type { PaieMensuelleB2Item } from './types'

/** Taux par défaut si les colonnes IPR 3% / CNSS 5% du Barème 2 sont vides. */
const TAUX_CNSS = 0.05
const TAUX_IPR = 0.03

export type CalculPaieB2Params = {
  moisCode: string
  moisLabel: string
  datePaie: string
  /** Pourcentage SB : multiplicateur du Total Brut (valeur du champ telle quelle). */
  pourcentageSb: number
}

export type CalculPaieB2Result = {
  ok: boolean
  message: string
  calculees: number
  ignoreesSansGrade: number
  ignoreesSansBareme: number
  ignoreesBaremeVide: number
  eligible: number
  baremes2Charges: number
  baremes2AvecMontants: number
}

type GradeRef = { id: string; code: string; libelle: string }

function parseAmount(value: string | undefined | null): number {
  return parseMontantTaux(value)
}

function formatMoney(value: number): string {
  return value.toFixed(2)
}

function normalizeToken(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

function gradeTokens(value: string): string[] {
  const raw = value.trim()
  if (!raw) return []
  const codeOnly = gradeCodeOnly(raw)
  const tokens = new Set<string>()
  const push = (v: string) => {
    const n = normalizeToken(v)
    if (n) tokens.add(n)
  }
  push(raw)
  push(codeOnly)
  for (const part of raw.split(/\s+[—–-]\s+/)) push(part)
  return [...tokens]
}

function resolveGradeRef(
  personnel: Personnel,
  grades: GradeRef[],
): GradeRef | null {
  if (!personnel.gradeId) return null
  const byId = grades.find((g) => g.id === personnel.gradeId)
  if (byId) return byId

  const wanted = normalizeToken(personnel.gradeId)
  const byCodeOrLib = grades.find((g) => {
    const tokens = gradeTokens(`${g.code} — ${g.libelle}`)
    return tokens.includes(wanted) || normalizeToken(g.code) === wanted
  })
  return byCodeOrLib ?? null
}

function refCode(_grades: GradeRef[], gradeRef: GradeRef | null, fallback: string): string {
  if (gradeRef) {
    return (gradeRef.code || '').trim() || gradeCodeOnly(gradeRef.libelle)
  }
  return gradeCodeOnly(fallback)
}

function refLibelleSeul(
  items: { id: string; code: string; libelle: string }[],
  id: string,
): string {
  if (!id) return ''
  const item = items.find((i) => i.id === id)
  if (!item) {
    const wanted = normalizeToken(id)
    const byCode = items.find(
      (i) =>
        normalizeToken(i.code) === wanted ||
        normalizeToken(i.libelle) === wanted,
    )
    if (!byCode) return ''
    return (byCode.libelle || '').trim() || (byCode.code || '').trim()
  }
  return (item.libelle || '').trim() || (item.code || '').trim()
}

/**
 * Montants CDF du Barème 2 : BASE + LOGEMENT + TRANSPORT.
 * BRUTE sert de secours si la somme des 3 est vide.
 */
function montantsDepuisBareme2(bareme: Bareme2Item): {
  base: number
  logement: number
  transport: number
  totalBrut: number
} {
  const base = parseAmount(bareme.base)
  const logement = parseAmount(bareme.logement)
  const transport = parseAmount(bareme.transport)
  const somme = base + logement + transport
  const brute = parseAmount(bareme.brute)
  const totalBrut = somme > 0 ? somme : brute
  return { base, logement, transport, totalBrut }
}

function scoreBareme2(bareme: Bareme2Item): number {
  const m = montantsDepuisBareme2(bareme)
  // Priorité aux lignes qui ont une BASE (évite les doublons « transport seul »)
  const bonusBase = m.base > 0 ? 1_000_000_000 : 0
  const bonusLogement = m.logement > 0 ? 100_000_000 : 0
  return bonusBase + bonusLogement + m.base + m.logement + m.transport + m.totalBrut
}

function bareme2ADesMontants(bareme: Bareme2Item): boolean {
  return scoreBareme2(bareme) > 0
}

/** Code grade seul du Barème 2 (ex. « C3 »), même sans libellé attaché. */
function codeGradeBareme2(bareme: Bareme2Item): string {
  return gradeCodeOnly(bareme.grade || '').trim()
}

/**
 * Une seule ligne par code grade : on garde celle avec les meilleurs
 * montants BASE / LOGEMENT / TRANSPORT.
 */
function dedupeBaremes2ParGrade(baremes2: Bareme2Item[]): Bareme2Item[] {
  const byCode = new Map<string, Bareme2Item>()
  for (const b of baremes2) {
    const code = normalizeToken(codeGradeBareme2(b))
    if (!code) continue
    const prev = byCode.get(code)
    if (!prev || scoreBareme2(b) > scoreBareme2(prev)) {
      byCode.set(code, b)
    }
  }
  return [...byCode.values()]
}

/**
 * Récupère la ligne Barème 2 du personnel par **code grade** uniquement.
 * En cas de doublons, prend la ligne avec BASE/LOGEMENT/TRANSPORT les plus complets.
 */
function findBareme2ForPersonnel(
  personnel: Personnel,
  baremes2: Bareme2Item[],
  grades: GradeRef[],
): Bareme2Item | null {
  const gradeRef = resolveGradeRef(personnel, grades)

  const personnelCodes = new Set<string>()
  const addCode = (value: string | undefined) => {
    if (!value) return
    for (const t of gradeTokens(value)) {
      if (/^grd-\d+/i.test(t) || /^grade-/i.test(t)) continue
      personnelCodes.add(t)
    }
  }
  if (gradeRef) addCode(gradeRef.code)
  if (gradeRef) addCode(gradeRef.libelle)
  addCode(personnel.gradeId)

  if (personnelCodes.size === 0) return null

  const matches = baremes2.filter((b) => {
    const baremeTokens = gradeTokens(b.grade || '')
    return baremeTokens.some((t) => personnelCodes.has(t))
  })
  if (matches.length === 0) return null

  return [...matches].sort((a, b) => scoreBareme2(b) - scoreBareme2(a))[0]
}

/**
 * Colonnes « IPR 3% » / « CNSS 5% » du Barème 2.
 * Si le montant absolu est incohérent (> Total Brut), recalcul au taux.
 */
function retenueDepuisBareme2(
  raw: string | undefined,
  totalBrut: number,
  tauxDefaut: number,
  pourcentEntierAttendu: number,
): number {
  const fromRate = totalBrut * tauxDefaut
  const n = parseAmount(raw)
  if (!n) return fromRate
  if (Math.abs(n) <= 1) return totalBrut * n
  if (Math.abs(n - pourcentEntierAttendu) < 1e-9) {
    return totalBrut * (n / 100)
  }
  if (totalBrut > 0 && n > totalBrut + 0.01) return fromRate
  return n
}

function calculerLigneAgent(params: {
  personnel: Personnel
  bareme: Bareme2Item
  mois: string
  datePaie: string
  gradeCode: string
  fonctionLabel: string
  /** Multiplicateur = valeur du champ Pourcentage SB — appliqué uniquement au Total Brut */
  coefficientSb: number
}): PaieMensuelleB2Item {
  const {
    personnel,
    bareme,
    mois,
    datePaie,
    gradeCode,
    fonctionLabel,
    coefficientSb,
  } = params
  // BASE, LOGEMENT, TRANSPORT : valeurs brutes du Barème 2 (non multipliées)
  const { base, logement, transport, totalBrut: sommeBrute } =
    montantsDepuisBareme2(bareme)

  // TOTAL BRUT = (BASE + LOGEMENT + TRANSPORT) × Pourcentage SB
  const totalBrut = sommeBrute * coefficientSb

  const retenueCnss = retenueDepuisBareme2(
    bareme.cnss5,
    totalBrut,
    TAUX_CNSS,
    5,
  )
  const retenueIpr = retenueDepuisBareme2(bareme.ipr3, totalBrut, TAUX_IPR, 3)
  const totalRetenue = retenueCnss + retenueIpr
  const netAPayer = totalBrut - totalRetenue
  const stamp = new Date().toISOString()

  return {
    id: createId(),
    mois,
    datePaie,
    matricule: personnel.matricule || '',
    nom: personnel.nom || '',
    postnom: personnel.postnom || '',
    prenom: personnel.prenom || '',
    dateEngagement: personnel.dateEngagement || '',
    grade: gradeCodeOnly(gradeCode || bareme.grade || ''),
    fonction: fonctionLibelleOnly(fonctionLabel || ''),
    immatriculationCnss: (personnel.numeroCnss || '').trim(),
    base: formatMoney(base),
    logement: formatMoney(logement),
    transport: formatMoney(transport),
    totalBrut: formatMoney(totalBrut),
    retenueCnss: formatMoney(retenueCnss),
    retenueIpr: formatMoney(retenueIpr),
    retenueInpp: formatMoney(0),
    totalRetenue: formatMoney(totalRetenue),
    netAPayer: formatMoney(netAPayer),
    createdAt: stamp,
    updatedAt: stamp,
  }
}

/**
 * Calcule la Liste PaieMensuelleB2 en récupérant le **Barème 2** (CDF).
 * Pas de conversion monétaire. Remplace les lignes du mois sélectionné.
 */
export function calculerPaieMensuelleB2(
  params: CalculPaieB2Params,
): CalculPaieB2Result {
  const { moisCode, moisLabel, datePaie, pourcentageSb } = params
  const empty = {
    calculees: 0,
    ignoreesSansGrade: 0,
    ignoreesSansBareme: 0,
    ignoreesBaremeVide: 0,
    eligible: 0,
    baremes2Charges: 0,
    baremes2AvecMontants: 0,
  }

  if (!moisCode || !datePaie) {
    return {
      ok: false,
      message: 'Veuillez renseigner le mois et la date.',
      ...empty,
    }
  }

  if (!Number.isFinite(pourcentageSb) || pourcentageSb <= 0) {
    return {
      ok: false,
      message:
        'Veuillez saisir un Pourcentage SB valide (nombre strictement positif, ex. 100).',
      ...empty,
    }
  }

  const coefficientSb = pourcentageSb

  // Toujours relire le store Paramètres pour récupérer le Barème 2 à jour
  const paramStore = loadParametresStore()
  const recruteStore = loadRecrutementStore()
  const baremes2 = dedupeBaremes2ParGrade([...(paramStore.baremes2 ?? [])])
  const baremes2AvecMontants = baremes2.filter(bareme2ADesMontants)

  if (baremes2.length === 0) {
    return {
      ok: false,
      message:
        'Aucun Barème 2 trouvé. Allez dans Paramètres → Fichiers → Barème 2 (ou Importation → Barème 2) pour l’installer, puis recalculez.',
      ...empty,
    }
  }

  if (baremes2AvecMontants.length === 0) {
    return {
      ok: false,
      message:
        `Barème 2 chargé (${baremes2.length} ligne${baremes2.length > 1 ? 's' : ''}) mais sans BASE / LOGEMENT / TRANSPORT.\n` +
        `Renseignez ces montants CDF dans Paramètres → Barème 2, puis relancez « Calculer la Paie ».`,
      ...empty,
      baremes2Charges: baremes2.length,
    }
  }

  const mois = moisCleDepuisDate(datePaie, moisCode)
  const agents = recruteStore.personnel.filter((p) =>
    isPersonnelEligiblePaie(p, paramStore),
  )

  let ignoreesSansGrade = 0
  let ignoreesSansBareme = 0
  let ignoreesBaremeVide = 0
  const nouvellesLignes: PaieMensuelleB2Item[] = []

  for (const agent of agents) {
    if (!agent.gradeId) {
      ignoreesSansGrade += 1
      continue
    }

    const gradeRef = resolveGradeRef(agent, paramStore.grades)
    const bareme = findBareme2ForPersonnel(
      agent,
      baremes2,
      paramStore.grades,
    )
    if (!bareme) {
      ignoreesSansBareme += 1
      continue
    }

    if (!bareme2ADesMontants(bareme)) {
      ignoreesBaremeVide += 1
      continue
    }

    const gradeCode = refCode(paramStore.grades, gradeRef, bareme.grade)
    const fonctionLabel = refLibelleSeul(paramStore.fonctions, agent.fonctionId)

    nouvellesLignes.push(
      calculerLigneAgent({
        personnel: agent,
        bareme,
        mois,
        datePaie,
        gradeCode,
        fonctionLabel,
        coefficientSb,
      }),
    )
  }

  nouvellesLignes.sort((a, b) =>
    `${a.nom} ${a.postnom} ${a.prenom}`.localeCompare(
      `${b.nom} ${b.postnom} ${b.prenom}`,
      'fr',
    ),
  )

  const paieStore = loadPaieStore()
  const conservees = paieStore.paieMensuelleB2.filter(
    (row) => normalizeMoisCle(row.mois, row.datePaie) !== mois,
  )
  savePaieStore({
    ...paieStore,
    paieMensuelleB1: paieStore.paieMensuelleB1,
    paieMensuelleB2: [...conservees, ...nouvellesLignes],
  })

  const moisConserves = new Set(
    conservees.map((r) => normalizeMoisCle(r.mois, r.datePaie)).filter(Boolean),
  ).size

  const message =
    `Paie Barème 2 calculée pour ${moisLabel} (${mois}).\n` +
    `Barème 2 récupéré : ${baremes2.length} ligne(s), dont ${baremes2AvecMontants.length} avec BASE/LOGEMENT/TRANSPORT.\n` +
    `Total Brut = (BASE + LOGEMENT + TRANSPORT) × ${pourcentageSb} (Pourcentage SB).\n` +
    `Correspondance sur le code grade (libellé non requis).\n` +
    `• Agents éligibles (validés & actifs) : ${agents.length}\n` +
    `• Lignes écrites dans PaieMensuelleB2 : ${nouvellesLignes.length}\n` +
    `• Sans grade : ${ignoreesSansGrade}\n` +
    `• Grade absent du Barème 2 : ${ignoreesSansBareme}\n` +
    `• Grade trouvé mais montants vides : ${ignoreesBaremeVide}\n` +
    `• Autres mois conservés : ${moisConserves} (12 paies possibles par année)`

  return {
    ok: true,
    message,
    calculees: nouvellesLignes.length,
    ignoreesSansGrade,
    ignoreesSansBareme,
    ignoreesBaremeVide,
    eligible: agents.length,
    baremes2Charges: baremes2.length,
    baremes2AvecMontants: baremes2AvecMontants.length,
  }
}
