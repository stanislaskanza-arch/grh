import {
  loadParametresStore,
} from '../parametres/storage'
import type { Bareme1Item, TauxMonnaieItem } from '../parametres/types'
import { isPersonnelEligiblePaie } from '../recrutement/personnelConstants'
import { loadRecrutementStore } from '../recrutement/storage'
import type { Personnel } from '../recrutement/types'
import {
  createId,
  loadPaieStore,
  savePaieStore,
} from './storage'
import { moisCleDepuisDate, normalizeMoisCle } from './paieMois'
import type { PaieMensuelleB1Item } from './types'
import {
  findTauxMonnaieEnCours,
  isTauxMonnaieEnCours,
  MESSAGE_TAUX_EN_COURS_MANQUANT,
  parseMontantTaux,
  tauxConversionCdf,
} from './tauxMonnaieEnCours'

const TAUX_CNSS = 0.05
const TAUX_IPR = 0.21

/** Extrait le code grade (« Dir ») depuis « Dir — Directeur » / « Dir - Directeur ». */
export function gradeCodeOnly(value: string | undefined | null): string {
  const text = String(value ?? '').trim()
  if (!text) return ''
  const parts = text.split(/\s+[—–-]\s+/)
  return (parts[0] || text).trim()
}

/** Extrait le libellé fonction depuis « CHRECOUV — Chargé de Recouvrement ». */
export function fonctionLibelleOnly(value: string | undefined | null): string {
  const text = String(value ?? '').trim()
  if (!text) return ''
  const parts = text.split(/\s+[—–-]\s+/)
  if (parts.length >= 2) {
    return parts.slice(1).join(' - ').trim()
  }
  return text
}

function refCode(
  items: { id: string; code: string; libelle: string }[],
  id: string,
): string {
  if (!id) return ''
  const item = items.find((i) => i.id === id)
  if (!item) return ''
  return (item.code || '').trim() || gradeCodeOnly(item.libelle)
}

function refLibelleSeul(
  items: { id: string; code: string; libelle: string }[],
  id: string,
): string {
  if (!id) return ''
  const item = items.find((i) => i.id === id)
  if (!item) return ''
  return (item.libelle || '').trim() || (item.code || '').trim()
}

export type CalculPaieB1Params = {
  moisCode: string
  moisLabel: string
  datePaie: string
  /** ID du taux affiché dans le combo (doit être le « En cours »). */
  tauxMonnaieId?: string
}

export type CalculPaieB1Result = {
  ok: boolean
  message: string
  calculees: number
  ignoreesSansGrade: number
  ignoreesSansBareme: number
  eligible: number
}

function parseAmount(value: string | undefined | null): number {
  return parseMontantTaux(value)
}

function resolveTauxPourCalcul(
  items: TauxMonnaieItem[],
  tauxMonnaieId?: string,
): TauxMonnaieItem | null {
  if (tauxMonnaieId) {
    const byId = items.find((t) => t.id === tauxMonnaieId)
    if (byId && isTauxMonnaieEnCours(byId)) return byId
  }
  return findTauxMonnaieEnCours(items)
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

type GradeRef = { id: string; code: string; libelle: string }

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

function findBareme1ForPersonnel(
  personnel: Personnel,
  baremes1: Bareme1Item[],
  grades: GradeRef[],
): Bareme1Item | null {
  const gradeRef = resolveGradeRef(personnel, grades)

  const personnelCodes = new Set<string>()
  const addToken = (value: string | undefined) => {
    if (!value) return
    for (const t of gradeTokens(value)) {
      if (/^grd-\d+/i.test(t) || /^grade-/i.test(t)) continue
      personnelCodes.add(t)
    }
  }
  if (gradeRef) {
    addToken(gradeRef.code)
    addToken(gradeRef.libelle)
    addToken(`${gradeRef.code} — ${gradeRef.libelle}`)
  }
  addToken(personnel.gradeId)

  if (personnelCodes.size === 0) return null

  const matches = baremes1.filter((b) => {
    const baremeTokens = [
      ...gradeTokens(b.grade || ''),
      ...gradeTokens(b.libelleGrade || ''),
    ]
    return baremeTokens.some((t) => personnelCodes.has(t))
  })
  if (matches.length === 0) return null

  // Préférer la ligne avec les montants les plus complets
  return [...matches].sort((a, b) => {
    const score = (x: Bareme1Item) =>
      parseAmount(x.base) + parseAmount(x.logement) + parseAmount(x.transport)
    return score(b) - score(a)
  })[0]
}

function retenueInppCdf(
  bareme: Bareme1Item,
  baseUsd: number,
  tauxConversion: number,
): number {
  const raw = parseAmount(bareme.retenueInpp)
  if (!raw) return 0
  // Taux (ex. 0.02) ou montant USD
  if (Math.abs(raw) <= 1) {
    return baseUsd * raw * tauxConversion
  }
  return raw * tauxConversion
}

function calculerLigneAgent(params: {
  personnel: Personnel
  bareme: Bareme1Item
  mois: string
  datePaie: string
  tauxConversion: number
  gradeCode: string
  fonctionLabel: string
}): PaieMensuelleB1Item {
  const { personnel, bareme, mois, datePaie, tauxConversion, gradeCode, fonctionLabel } =
    params

  const baseUsd = parseAmount(bareme.base)
  const logementUsd = parseAmount(bareme.logement)
  const transportUsd = parseAmount(bareme.transport)
  const sommeUsd = baseUsd + logementUsd + transportUsd

  // TOTAL BRUTE = (BASE + LOGEMENT + TRANSPORT) * taux
  const totalBrute = sommeUsd * tauxConversion
  // CNSS = 5 % du Total Brut ; IPR = 21 % du Total Brut
  const retenueCnss = totalBrute * TAUX_CNSS
  const retenueIpr = totalBrute * TAUX_IPR
  const retenueInpp = retenueInppCdf(bareme, sommeUsd, tauxConversion)
  const totalRetenue = retenueCnss + retenueIpr + retenueInpp
  const netAPayer = totalBrute - totalRetenue

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
    // Montants affichés en CDF
    base: formatMoney(baseUsd * tauxConversion),
    logement: formatMoney(logementUsd * tauxConversion),
    transport: formatMoney(transportUsd * tauxConversion),
    totalBrut: formatMoney(totalBrute),
    retenueCnss: formatMoney(retenueCnss),
    retenueIpr: formatMoney(retenueIpr),
    retenueInpp: formatMoney(retenueInpp),
    netAPayer: formatMoney(netAPayer),
    createdAt: stamp,
    updatedAt: stamp,
  }
}

/**
 * Calcule la paie Barème 1 pour le personnel validé et actif,
 * écrit les lignes dans PaieMensuelleB1 (montants en CDF).
 */
export function calculerPaieMensuelleB1(
  params: CalculPaieB1Params,
): CalculPaieB1Result {
  const { moisCode, moisLabel, datePaie, tauxMonnaieId } = params

  if (!moisCode || !datePaie) {
    return {
      ok: false,
      message: 'Veuillez renseigner le mois et la date.',
      calculees: 0,
      ignoreesSansGrade: 0,
      ignoreesSansBareme: 0,
      eligible: 0,
    }
  }

  const paramStore = loadParametresStore()
  const recruteStore = loadRecrutementStore()
  const taux = resolveTauxPourCalcul(paramStore.tauxMonnaies, tauxMonnaieId)

  if (!taux) {
    return {
      ok: false,
      message: MESSAGE_TAUX_EN_COURS_MANQUANT,
      calculees: 0,
      ignoreesSansGrade: 0,
      ignoreesSansBareme: 0,
      eligible: 0,
    }
  }

  const tauxConversion = tauxConversionCdf(taux)
  if (!tauxConversion) {
    return {
      ok: false,
      message:
        'Le montant CDF du taux « En cours » est invalide (conversion USD → CDF).',
      calculees: 0,
      ignoreesSansGrade: 0,
      ignoreesSansBareme: 0,
      eligible: 0,
    }
  }

  const mois = moisCleDepuisDate(datePaie, moisCode)
  const agents = recruteStore.personnel.filter((p) =>
    isPersonnelEligiblePaie(p, paramStore),
  )

  let ignoreesSansGrade = 0
  let ignoreesSansBareme = 0
  const nouvellesLignes: PaieMensuelleB1Item[] = []

  for (const agent of agents) {
    if (!agent.gradeId) {
      ignoreesSansGrade += 1
      continue
    }

    const bareme = findBareme1ForPersonnel(
      agent,
      paramStore.baremes1,
      paramStore.grades,
    )
    if (!bareme) {
      ignoreesSansBareme += 1
      continue
    }

    const baseOk =
      parseAmount(bareme.base) +
        parseAmount(bareme.logement) +
        parseAmount(bareme.transport) >
      0
    if (!baseOk) {
      ignoreesSansBareme += 1
      continue
    }

    const gradeRef = resolveGradeRef(agent, paramStore.grades)
    const gradeCode =
      (gradeRef
        ? (gradeRef.code || '').trim() || gradeCodeOnly(gradeRef.libelle)
        : '') ||
      refCode(paramStore.grades, agent.gradeId) ||
      gradeCodeOnly(bareme.grade)
    const fonctionLabel = refLibelleSeul(paramStore.fonctions, agent.fonctionId)

    nouvellesLignes.push(
      calculerLigneAgent({
        personnel: agent,
        bareme,
        mois,
        datePaie,
        tauxConversion,
        gradeCode,
        fonctionLabel,
      }),
    )
  }

  const paieStore = loadPaieStore()
  const conservees = paieStore.paieMensuelleB1.filter(
    (row) => normalizeMoisCle(row.mois, row.datePaie) !== mois,
  )
  savePaieStore({
    ...paieStore,
    paieMensuelleB1: [...conservees, ...nouvellesLignes],
  })

  const moisConserves = new Set(
    conservees.map((r) => normalizeMoisCle(r.mois, r.datePaie)).filter(Boolean),
  ).size

  const message =
    `Paie calculée pour ${moisLabel} (${mois}).\n` +
    `Taux « En cours » appliqué : ${formatMoney(tauxConversion)} CDF` +
    ` (date ${taux.dateTaux || '—'}, montant CDF ${taux.montantCdf || '—'}).\n` +
    `• Agents éligibles (validés & actifs) : ${agents.length}\n` +
    `• Lignes écrites dans PaieMensuelleB1 : ${nouvellesLignes.length}\n` +
    `• Sans grade : ${ignoreesSansGrade}\n` +
    `• Grade absent / sans montant dans le Barème 1 : ${ignoreesSansBareme}\n` +
    `• Autres mois conservés : ${moisConserves} (12 paies possibles par année)`

  return {
    ok: true,
    message,
    calculees: nouvellesLignes.length,
    ignoreesSansGrade,
    ignoreesSansBareme,
    eligible: agents.length,
  }
}
