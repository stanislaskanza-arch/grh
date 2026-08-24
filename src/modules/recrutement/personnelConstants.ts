import {
  COMMUNES_KINSHASA,
  NATIONALITES,
  VILLES_PROVINCES,
} from './administrateurConstants'
import type { Entreprise, ParametresStore, PeriodeItem, RefItem } from '../parametres/types'
import type { Personnel, SexePersonnel } from './types'

export { COMMUNES_KINSHASA, NATIONALITES, VILLES_PROVINCES }

export const NIVEAUX_ETUDES_REF: { code: string; libelle: string }[] = [
  { code: 'CAPA', libelle: 'Capacitariat' },
  { code: 'D6', libelle: 'Diplômé d’Etat' },
  { code: 'Dct', libelle: 'Docteur' },
  { code: 'G3', libelle: 'Gradué' },
  { code: 'L2', libelle: 'Licence' },
  { code: 'Mter', libelle: 'Master' },
]

/** @deprecated Utiliser NIVEAUX_ETUDES_REF (code + libellé) */
export const NIVEAUX_ETUDE_PERSONNEL = NIVEAUX_ETUDES_REF.map((n) => n.libelle)

export const PAYS = [
  'République Démocratique du Congo',
  'Congo-Brazzaville',
  'Belgique',
  'France',
  'Autre',
]

export const CIVILITES = ['Monsieur', 'Madame', 'Mlle'] as const

export const FONCTIONS_REF: { code: string; libelle: string }[] = [
  { code: 'ASS/DGA', libelle: 'ASSISTANT DGA' },
  { code: 'CAJ', libelle: 'Chargé(e) des affaires juridiques' },
  { code: 'CAQ', libelle: 'Chargé(e) des Audits et Enquetes' },
  { code: 'CCPTA', libelle: 'Chef comptable' },
  { code: 'CDI', libelle: 'Chef de Division Informatique' },
  { code: 'CDSG', libelle: 'Chef de Division des Services Généraux' },
  { code: 'CHAGEN', libelle: 'Chargé des Applications Générales' },
  { code: 'CHAPPLI', libelle: 'Chargé des Applications Informatiques' },
  { code: 'CH.CPT', libelle: 'Chargé(e) de Comptabilité' },
  { code: 'CHMR', libelle: 'Chargé de Maintenance et réseau c.' },
  { code: 'CHRECOUV', libelle: 'Chargé de Recouvrement' },
  { code: 'CHSIGMP', libelle: 'Chargé de SIGMAP' },
  { code: 'CLM', libelle: 'Chargé de la logistique et maintenance' },
  { code: 'CMR', libelle: 'Chef de bureau Chargé de Maintance et Réseau' },
  {
    code: 'COORDO',
    libelle: 'COORDONNATEUR DES RATTACHES AU DIRECTEUR GENERAL',
  },
  { code: 'CPP', libelle: 'CHARGE DE PAIE ET POINTAGE' },
  { code: 'CRC', libelle: 'Chargé de recrutement et carriere' },
  { code: 'CS', libelle: 'Chargé(e) du social' },
  { code: 'DAF', libelle: 'Directeur Administrative et Financière' },
  { code: 'DFAT', libelle: 'Directeur de Formation et des Appuis Techniques' },
  { code: 'DPITURI', libelle: 'Directeur Provncial de ITURI' },
  { code: 'DREG', libelle: 'Directeur de la Régulation' },
  {
    code: 'DSC',
    libelle: 'Directeur des statistiques et de la Communication',
  },
  { code: 'SEC/DG', libelle: 'SECRETAIRE DG' },
  { code: 'SEC/DGA', libelle: 'SECRETAIRE DGA' },
  { code: 'SEC/PCA', libelle: 'SECRETAIRE PCA' },
  { code: 'WEBM', libelle: 'Webmaster' },
]

/** @deprecated Utiliser FONCTIONS_REF (code + libellé) */
export const FONCTIONS_PERSONNEL = FONCTIONS_REF.map((f) => f.libelle)

export const GRADES_REF: { code: string; libelle: string }[] = [
  { code: 'C1', libelle: 'Cadre de collaboration echelon 1' },
  { code: 'C2', libelle: 'Chef de section' },
  { code: 'C3', libelle: 'Chef de Bureau' },
  { code: 'C4', libelle: 'Chef de Bureau' },
  { code: 'CD', libelle: 'Chef de Division' },
  { code: 'DIR', libelle: 'Directeur' },
  { code: 'E1', libelle: 'Agent d’Exécution echelon 1' },
  { code: 'E2', libelle: 'Agent d’Exécution echelon 2' },
  { code: 'E3', libelle: 'Agent d’Exécution echelon 3' },
  { code: 'E4', libelle: 'Agent d’Exécution echelon 4' },
  { code: 'E5', libelle: 'Agent d’Exécution echelon 5' },
  { code: 'E6', libelle: 'Agent d’Exécution echelon 6' },
  { code: 'E7', libelle: 'Agent d’Exécution echelon 7' },
  { code: 'E8', libelle: 'Agent d’Exécution echelon 8' },
  { code: 'E9', libelle: 'Agent d’Exécution echelon 9' },
  { code: 'M1', libelle: 'Maîtrise 1' },
  { code: 'M2', libelle: 'Maîtrise 2' },
  { code: 'M3', libelle: 'Maîtrise 3' },
  { code: 'M4', libelle: 'Maîtrise 4' },
]

/** Types de primes / indemnités (fichier père CODE PRIME). */
export const PRIMES_REF: { code: string; libelle: string }[] = [
  { code: 'VIECH', libelle: 'PRIME DE VIE CHERE' },
  { code: 'TI', libelle: 'PRIME DES TRAVAUX INTENSIFS' },
  { code: 'ALCOGE', libelle: 'ALLOCATIONS DES CONGES' },
  { code: 'RECOUV', libelle: 'PRIME DE RECOUVREMENT' },
  { code: 'PERFOR', libelle: 'PRIME DE PERFORMANCE' },
  { code: 'PCODI', libelle: 'PRIME DE COMITE DES DIRECTIONS' },
  { code: 'PINTERI', libelle: "PRIME D'INTERIM" },
  { code: 'PASTR', libelle: "PRIME D'ASTREINTE" },
  { code: 'PCPTA', libelle: 'PRIME COMPTABLE' },
  { code: 'PRISQ', libelle: 'PRIME DE RISQUE' },
  { code: 'IKA', libelle: 'INDEMNITE KILOMETRIQUE' },
]

/** @deprecated Utiliser GRADES_REF (code + libellé) */
export const GRADES_PERSONNEL = GRADES_REF.map((g) => g.libelle)

export const SITES_TRAVAIL_REF: { code: string; libelle: string }[] = [
  { code: 'CA', libelle: 'Conseil d’Administration' },
  { code: 'DG', libelle: 'Direction Générale' },
  { code: 'DPHKAT', libelle: 'Direction Provinciale du Haut Katanga' },
  { code: 'DPHUELE', libelle: 'Direction Provinciale de Haut-Uélé' },
  { code: 'DPITU', libelle: 'Direction Provinciale d’Ituri' },
  { code: 'DPKC', libelle: 'Direction Provinciale de Kongo Central' },
  { code: 'DPKIN', libelle: 'Direction Provinciale de Kinshasa' },
  { code: 'DPKO', libelle: 'Direction Provinciale de Kasaï Oriental' },
  { code: 'DPKSC', libelle: 'Direction Provinciale de Kasaï Central' },
  { code: 'DPLUA', libelle: 'Direction Provinciale de Lualaba' },
  { code: 'DPNKIV', libelle: 'Direction Provinciale du Nord-Kivu' },
  { code: 'DPSKIV', libelle: 'Direction Provinciale du Sud-Kivu' },
  { code: 'DPTSHO', libelle: 'Direction Provinciale de la Tshopo' },
]

/** @deprecated Utiliser SITES_TRAVAIL_REF (code + libellé) */
export const SITES_AFFECTATION = SITES_TRAVAIL_REF.map((s) => s.libelle)

export const DIRECTIONS_PERSONNEL = [
  'Direction Générale',
  'Direction Administrative et Financière',
  'Direction des Ressources Humaines',
  'Direction de la Régulation',
  'Direction des statistiques et de la Communication',
  'Direction de Formation et des Appuis Techniques',
]

export const STATUTS_PERSONNEL_REF = [
  'Actif',
  'Sortie des effectifs',
  'Suspendu',
  'Retraité',
  'Décédé',
]

export const COMPTES_COMPTABLES_REF = [
  '421000 — Rémunérations dues',
  '421100 — Salaires à payer',
  '428000 — Autres charges de personnel',
  '645000 — Charges de sécurité sociale',
]

export const TYPES_CONTRAT_REF: { code: string; libelle: string }[] = [
  { code: 'CDI', libelle: 'Contrat à Durée Indéterminé' },
  { code: 'CDD', libelle: 'Contrat à Durée déterminé' },
]

export type WizardStepDef = {
  id: number
  title: string
  short: string
}

export const PERSONNEL_WIZARD_STEPS: WizardStepDef[] = [
  {
    id: 1,
    title: 'Identité',
    short: 'Identité',
  },
  {
    id: 2,
    title: 'Affectation (fichiers pères)',
    short: 'Affectation',
  },
  {
    id: 3,
    title: 'Coordonnées, banque et CNSS',
    short: 'Coordonnées',
  },
]

export type PersonnelFormState = Omit<Personnel, 'id' | 'createdAt'>

export function createEmptyPersonnel(matricule = ''): PersonnelFormState {
  return {
    matricule,
    nom: '',
    postnom: '',
    prenom: '',
    sexe: 'Masculin',
    dateNaissance: '',
    nationalite: 'Congolaise (RDC)',
    dateEngagement: '',
    gradeId: '',
    fonctionId: '',
    niveauEtudesId: '',
    numeroCompteBancaire1: '',
    numeroCompteBancaire2: '',
    numeroCnss: '',
    telephone: '',
    email: '',
    photo: null,
    entrepriseId: '',
    siteTravailId: '',
    periodeId: '',
    directionId: '',
    statutId: '',
    valide: false,
    compteComptableId: '',
    typeContratId: '',
    updatedAt: new Date().toISOString(),
  }
}

export function generateMatricule(existing: Personnel[]): string {
  const year = new Date().getFullYear()
  const prefix = `PER-${year}-`
  let max = 0
  for (const p of existing) {
    if (!p.matricule?.startsWith(prefix)) continue
    const n = Number(p.matricule.slice(prefix.length))
    if (!Number.isNaN(n) && n > max) max = n
  }
  return `${prefix}${String(max + 1).padStart(4, '0')}`
}

export function fullNamePersonnel(p: {
  prenom?: string
  postnom?: string
  nom?: string
}) {
  return `${p.prenom ?? ''} ${p.postnom ?? ''} ${p.nom ?? ''}`
    .replace(/\s+/g, ' ')
    .trim()
}

function normalizeMatchText(value: string) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, "'")
    .replace(/[—–−]/g, '-')
    .replace(/\s+/g, ' ')
    .trim()
}

export function matchRefId(items: RefItem[], value: unknown): string {
  const text = String(value ?? '').trim()
  if (!text) return ''
  const byId = items.find((i) => i.id === text)
  if (byId) return byId.id

  const lower = normalizeMatchText(text)
  const aliases: Record<string, string[]> = {
    gradue: ['graduat', 'g3'],
    licence: ['licence / bachelor', 'l2', 'licence /bachelor'],
    "diplome d'etat": ['diplome d etat', 'd6'],
  }

  const exact = items.find((i) => {
    const lib = normalizeMatchText(i.libelle)
    const code = normalizeMatchText(i.code)
    if (lib === lower || code === lower) return true
    const comboA = normalizeMatchText(`${i.code} - ${i.libelle}`)
    const comboB = normalizeMatchText(`${i.libelle} ${i.code}`)
    if (comboA === lower || comboB === lower) return true
    const aliasList = aliases[lib]
    return Boolean(aliasList?.some((a) => normalizeMatchText(a) === lower))
  })
  if (exact) return exact.id

  const byCodePrefix = items.find((i) => {
    const code = normalizeMatchText(i.code)
    if (!code) return false
    return (
      lower.startsWith(`${code} -`) ||
      lower.startsWith(`${code} `) ||
      lower.endsWith(` ${code}`)
    )
  })
  if (byCodePrefix) return byCodePrefix.id

  const partial = items.filter((i) => {
    const lib = normalizeMatchText(i.libelle)
    const code = normalizeMatchText(i.code)
    return (lib.length >= 3 && lower.includes(lib)) || (code && lower.includes(code))
  })
  if (partial.length === 1) return partial[0].id

  return ''
}

export function matchEntrepriseId(items: Entreprise[], value: unknown): string {
  const text = String(value ?? '').trim()
  if (!text) return ''
  const byId = items.find((i) => i.id === text)
  if (byId) return byId.id
  const lower = normalizeMatchText(text)
  const aliases: Record<string, string[]> = {
    armp: ['anmp', 'autorite de regulation des marches publics'],
  }
  return (
    items.find((i) => {
      const sigle = normalizeMatchText(i.sigle)
      const raison = normalizeMatchText(i.raisonSociale)
      const combo = normalizeMatchText(`${i.sigle} - ${i.raisonSociale}`)
      if (sigle === lower || raison === lower || combo === lower) return true
      const aliasList = aliases[sigle]
      return Boolean(aliasList?.some((a) => normalizeMatchText(a) === lower))
    })?.id ?? ''
  )
}

export function matchPeriodeId(items: PeriodeItem[], value: unknown): string {
  const text = String(value ?? '').trim()
  if (!text) return ''
  const byId = items.find((i) => i.id === text)
  if (byId) return byId.id
  const lower = normalizeMatchText(text)
  return (
    items.find((i) => {
      const lib = normalizeMatchText(i.libelle)
      const code = normalizeMatchText(i.code)
      const combo = normalizeMatchText(`${i.code} - ${i.libelle}`)
      return lib === lower || code === lower || combo === lower
    })?.id ?? ''
  )
}

export function refLibelle(items: RefItem[], id: string): string {
  if (!id) return ''
  const item = items.find((i) => i.id === id)
  if (!item) return ''
  return item.code ? `${item.code} — ${item.libelle}` : item.libelle
}

/** Code seul d’une référence (ex. grade « DIR » sans libellé). */
export function refCode(items: RefItem[], id: string): string {
  if (!id) return ''
  const item = items.find((i) => i.id === id)
  if (!item) return ''
  return (item.code || '').trim() || (item.libelle || '').trim()
}

/** Libellé seul d’une référence (ex. fonction sans code). */
export function refLibelleSeul(items: RefItem[], id: string): string {
  if (!id) return ''
  const item = items.find((i) => i.id === id)
  if (!item) return ''
  return (item.libelle || '').trim() || (item.code || '').trim()
}

export function entrepriseLibelle(items: Entreprise[], id: string): string {
  if (!id) return ''
  const e = items.find((i) => i.id === id)
  if (!e) return ''
  return e.sigle ? `${e.sigle} — ${e.raisonSociale}` : e.raisonSociale
}

export function periodeLibelle(items: PeriodeItem[], id: string): string {
  if (!id) return ''
  return items.find((i) => i.id === id)?.libelle ?? ''
}

export function normalizeSexePersonnel(value: unknown): SexePersonnel {
  const raw = String(value ?? '').trim()
  if (!raw) return 'Masculin'
  if (raw === 'F' || raw === 'f') return 'Féminin'

  const n = normalizeMatchText(raw)
  if (
    n === 'f' ||
    n === 'feminin' ||
    n === 'female' ||
    n === 'femme' ||
    n.startsWith('feminin')
  ) {
    return 'Féminin'
  }

  // Variantes / encodage dégradé (ex. « Féminin » → « F?minin »)
  if (/f\W*minin/i.test(raw) && !/masculin/i.test(raw)) return 'Féminin'
  if (raw.includes('minin') && !/masc/i.test(raw)) return 'Féminin'

  return 'Masculin'
}

/** Normalise / migre une fiche personnel vers le modèle fils ↔ pères. */
export function normalizePersonnel(
  raw: Record<string, unknown>,
  refs?: ParametresStore | null,
): Personnel {
  const base = createEmptyPersonnel()
  const sexe = normalizeSexePersonnel(raw.sexe)

  const gradeId = refs
    ? matchRefId(refs.grades, raw.gradeId ?? raw.grade)
    : String(raw.gradeId ?? '')
  const fonctionId = refs
    ? matchRefId(refs.fonctions, raw.fonctionId ?? raw.fonction ?? raw.poste)
    : String(raw.fonctionId ?? '')
  const niveauEtudesId = refs
    ? matchRefId(refs.niveauxEtudes, raw.niveauEtudesId ?? raw.niveauEtudes)
    : String(raw.niveauEtudesId ?? '')
  const siteRaw =
    raw.siteTravailId ?? raw.siteAffectation ?? raw.siteTravail ?? ''
  const siteMatched = refs ? matchRefId(refs.sitesAffectation, siteRaw) : ''
  const siteTravailId =
    siteMatched ||
    String(siteRaw ?? '').trim() ||
    (refs ? '' : String(raw.siteTravailId ?? ''))
  const directionId = refs
    ? matchRefId(refs.directions, raw.directionId ?? raw.direction)
    : String(raw.directionId ?? '')
  const statutId = refs
    ? matchRefId(refs.statutsPersonnel, raw.statutId ?? raw.statut)
    : String(raw.statutId ?? '')
  const compteComptableId = refs
    ? matchRefId(
        refs.comptesComptables,
        raw.compteComptableId ?? raw.compteComptable,
      )
    : String(raw.compteComptableId ?? '')
  const typeContratId = refs
    ? matchRefId(
        refs.typesContrats,
        raw.typeContratId ?? raw.typeContrat ?? raw.type_contrat,
      )
    : String(raw.typeContratId ?? '')
  const entrepriseId = refs
    ? matchEntrepriseId(refs.entreprises, raw.entrepriseId ?? raw.entreprise)
    : String(raw.entrepriseId ?? '')
  const periodeId = refs
    ? matchPeriodeId(refs.periodes, raw.periodeId ?? raw.periode)
    : String(raw.periodeId ?? '')

  return {
    ...base,
    id: String(raw.id ?? ''),
    createdAt: String(raw.createdAt ?? new Date().toISOString()),
    updatedAt: String(raw.updatedAt ?? raw.createdAt ?? new Date().toISOString()),
    matricule: String(raw.matricule ?? ''),
    nom: String(raw.nom ?? ''),
    postnom: String(raw.postnom ?? ''),
    prenom: String(raw.prenom ?? ''),
    sexe,
    dateNaissance: String(raw.dateNaissance ?? ''),
    nationalite: String(raw.nationalite ?? base.nationalite),
    dateEngagement: String(raw.dateEngagement ?? raw.dateEmbauche ?? ''),
    gradeId,
    fonctionId,
    niveauEtudesId,
    numeroCompteBancaire1: String(
      raw.numeroCompteBancaire1 ?? raw.numeroCompteBancaire ?? '',
    ),
    numeroCompteBancaire2: String(raw.numeroCompteBancaire2 ?? ''),
    numeroCnss: String(raw.numeroCnss ?? ''),
    telephone: String(raw.telephone ?? ''),
    email: String(raw.email ?? raw.emailPersonnel ?? ''),
    photo: (raw.photo as Personnel['photo']) ?? null,
    entrepriseId,
    siteTravailId,
    periodeId,
    directionId,
    statutId,
    valide: parsePersonnelValide(raw.valide),
    compteComptableId,
    typeContratId,
  }
}

function parsePersonnelValide(value: unknown): boolean {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value === 1
  const text = String(value ?? '')
    .trim()
    .toLowerCase()
  return text === '1' || text === 'true' || text === 'oui' || text === 'yes'
}

/** Libellé brut du statut personnel (sans code). */
export function personnelStatutLibelle(
  items: RefItem[],
  statutId: string,
): string {
  return items.find((s) => s.id === statutId)?.libelle ?? ''
}

export function isPersonnelActif(
  personnel: Pick<Personnel, 'statutId'>,
  refs: Pick<ParametresStore, 'statutsPersonnel'>,
): boolean {
  const libelle = personnelStatutLibelle(
    refs.statutsPersonnel,
    personnel.statutId,
  )
  return !libelle || libelle.toLowerCase() === 'actif'
}

/**
 * Personnel éligible à la paie et aux rémunérations :
 * validé par l’Administration RH et statut Actif.
 */
export function isPersonnelEligiblePaie(
  personnel: Pick<Personnel, 'statutId' | 'valide'>,
  refs: Pick<ParametresStore, 'statutsPersonnel'>,
): boolean {
  return Boolean(personnel.valide) && isPersonnelActif(personnel, refs)
}
