import { loadParametresStore, saveParametresStore, createId } from '../parametres/storage'
import type { Bareme1Item, CongeItem } from '../parametres/types'
import {
  isPersonnelEligiblePaie,
  refLibelleSeul,
} from '../recrutement/personnelConstants'
import { loadRecrutementStore } from '../recrutement/storage'
import type { Personnel } from '../recrutement/types'
import { fonctionLibelleOnly, gradeCodeOnly } from './calculerPaieMensuelleB1'
import { moisCleDepuisDate, normalizeMoisCle } from './paieMois'
import { parseMontantTaux } from './tauxMonnaieEnCours'

const TAUX_CNSS = 0.05
/** RETENUE IPR = (TOTAL BRUT AU PRORATA − RETENUE CNSS) × 3 % */
const TAUX_IPR_SUR_BASE_NETTE_CNSS = 0.03

export type CalculCongeParams = {
  moisCode: string
  moisLabel: string
  datePaie: string
}

export type CalculCongeResult = {
  ok: boolean
  message: string
  calculees: number
  ignoreesSansGrade: number
  ignoreesSansBareme: number
  eligible: number
}

function formatMoney(value: number): string {
  return value.toFixed(2)
}

function normalizeToken(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ')
}

function findBareme1ForPersonnel(
  personnel: Personnel,
  baremes1: Bareme1Item[],
  grades: { id: string; code: string; libelle: string }[],
): Bareme1Item | null {
  const gradeRef = grades.find((g) => g.id === personnel.gradeId)
  if (!gradeRef) return null

  const code = normalizeToken(gradeRef.code)
  const libelle = normalizeToken(gradeRef.libelle)

  return (
    baremes1.find((b) => {
      const g = normalizeToken(b.grade)
      const lg = normalizeToken(b.libelleGrade)
      return (
        (code && (g === code || lg === code)) ||
        (libelle && (g === libelle || lg === libelle))
      )
    }) ?? null
  )
}

function parseRateOrAmount(value: string, base: number, fallbackRate: number): number {
  const raw = parseMontantTaux(value)
  if (!Number.isFinite(raw) || raw === 0) return base * fallbackRate
  if (Math.abs(raw) <= 1) return base * raw
  return raw
}

/**
 * Calcule le pécule de congé (fichier CONGE) pour le personnel éligible,
 * à partir du Barème 1 (JOURS DE CONGE, BASE, LOGEMENT…).
 * TOTAL BRUT = (BASE + LOGEMENT) / JOURS DU MOIS × JOURS DE CONGE
 * RETENUE IPR = (TOTAL BRUT − RETENUE CNSS) × 3 / 100
 */
export function calculerConge(params: CalculCongeParams): CalculCongeResult {
  const { moisCode, moisLabel, datePaie } = params

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
  const mois = moisCleDepuisDate(datePaie, moisCode)
  const annee = datePaie.slice(0, 4) || mois.slice(0, 4)

  const agents = recruteStore.personnel.filter((p) =>
    isPersonnelEligiblePaie(p, paramStore),
  )

  if (agents.length === 0) {
    return {
      ok: false,
      message:
        'Aucun agent éligible (validé et actif). Vérifiez le personnel dans Administration RH.',
      calculees: 0,
      ignoreesSansGrade: 0,
      ignoreesSansBareme: 0,
      eligible: 0,
    }
  }

  if (paramStore.baremes1.length === 0) {
    return {
      ok: false,
      message:
        'Aucun Barème 1 trouvé. Installez le Barème 1 dans Paramètres → Fichiers, puis recalculez.',
      calculees: 0,
      ignoreesSansGrade: 0,
      ignoreesSansBareme: 0,
      eligible: agents.length,
    }
  }

  const entreprise =
    paramStore.entreprises.find((e) => e.statut === 'active') ??
    paramStore.entreprises[0]
  const organisation =
    entreprise?.raisonSociale || entreprise?.sigle || 'ARMP'

  let ignoreesSansGrade = 0
  let ignoreesSansBareme = 0
  const nouvellesLignes: CongeItem[] = []
  const stamp = new Date().toISOString()

  for (const personnel of agents) {
    if (!personnel.gradeId) {
      ignoreesSansGrade += 1
      continue
    }

    const bareme = findBareme1ForPersonnel(
      personnel,
      paramStore.baremes1,
      paramStore.grades,
    )
    if (!bareme) {
      ignoreesSansBareme += 1
      continue
    }

    const gradeRef = paramStore.grades.find((g) => g.id === personnel.gradeId)
    const fonctionRef = paramStore.fonctions.find(
      (f) => f.id === personnel.fonctionId,
    )

    const base = parseMontantTaux(bareme.base) || 0
    const logement = parseMontantTaux(bareme.logement) || 0
    const joursMois = parseMontantTaux(bareme.jourDuMois) || 30
    const jourConge = parseMontantTaux(bareme.joursDeConge) || 0
    const denom = joursMois > 0 ? joursMois : 30

    const totalBrut = ((base + logement) / denom) * jourConge
    const retenueCnss = parseRateOrAmount(
      bareme.retenueCnss,
      totalBrut,
      TAUX_CNSS,
    )
    // RETENUE IPR = (TOTAL BRUT AU PRORATA − RETENUE CNSS) × 3/100
    const retenueIpr = Math.max(
      0,
      (totalBrut - retenueCnss) * TAUX_IPR_SUR_BASE_NETTE_CNSS,
    )
    const netAPayer = totalBrut - retenueCnss - retenueIpr

    nouvellesLignes.push({
      id: createId(),
      mois,
      datePaie,
      matricule: personnel.matricule || '',
      nom: personnel.nom || '',
      postnom: personnel.postnom || '',
      prenom: personnel.prenom || '',
      numeroCnss: personnel.numeroCnss || '',
      dateEngagement: personnel.dateEngagement || '',
      grade: gradeCodeOnly(gradeRef?.code || bareme.grade || ''),
      fonction: fonctionLibelleOnly(
        fonctionRef
          ? `${fonctionRef.code} — ${fonctionRef.libelle}`
          : '',
      ),
      base: formatMoney(base),
      logement: formatMoney(logement),
      jourConge: String(Math.round(jourConge) || jourConge),
      totalBrut: formatMoney(totalBrut),
      retenueCnss: formatMoney(retenueCnss),
      retenueIpr: formatMoney(retenueIpr),
      taux: formatMoney(denom),
      netAPayer: formatMoney(netAPayer),
      organisation,
      annee,
      siteTravail: refLibelleSeul(paramStore.sitesAffectation, personnel.siteTravailId),
      direction: refLibelleSeul(paramStore.directions, personnel.directionId),
      createdAt: stamp,
      updatedAt: stamp,
    })
  }

  nouvellesLignes.sort((a, b) =>
    `${a.nom} ${a.postnom} ${a.prenom}`.localeCompare(
      `${b.nom} ${b.postnom} ${b.prenom}`,
      'fr',
    ),
  )

  const conservees = paramStore.conges.filter(
    (row) => normalizeMoisCle(row.mois, row.datePaie) !== mois,
  )
  saveParametresStore({
    ...paramStore,
    conges: [...conservees, ...nouvellesLignes],
  })

  const message =
    `Pécule de congé calculé pour ${moisLabel} (${mois}).\n` +
    `Formule TOTAL BRUT = (BASE + LOGEMENT) ÷ JOURS DU MOIS × JOURS DE CONGE.\n` +
    `Formule RETENUE IPR = (TOTAL BRUT AU PRORATA − RETENUE CNSS) × 3/100.\n` +
    `• Agents éligibles : ${agents.length}\n` +
    `• Lignes écrites dans CONGE : ${nouvellesLignes.length}\n` +
    `• Sans grade : ${ignoreesSansGrade}\n` +
    `• Grade absent du Barème 1 : ${ignoreesSansBareme}`

  return {
    ok: true,
    message,
    calculees: nouvellesLignes.length,
    ignoreesSansGrade,
    ignoreesSansBareme,
    eligible: agents.length,
  }
}
