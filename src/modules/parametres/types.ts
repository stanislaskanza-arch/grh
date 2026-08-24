export type UserRole =
  | 'Administrateur'
  | 'RH'
  | 'Manager'
  | 'Lecteur'

export type UserStatut = 'actif' | 'inactif'

export type EntrepriseStatut = 'active' | 'inactive'

export type RefStatut = 'actif' | 'inactif'

export type EntrepriseLogo = {
  name: string
  size: number
  type: string
  dataUrl?: string
}

/**
 * Fichier ENTREPRISE — structure métier (sigle, organisation, responsables,
 * lignes d’en-tête, logo, nouveau logo).
 */
export type Entreprise = {
  id: string
  sigle: string
  /** NOM DE L'ORGANISATION */
  raisonSociale: string
  responsable1: string
  responsable2: string
  responsable3: string
  ligneEntete1: string
  ligneEntete2: string
  ligneEntete3: string
  ligneEntete4: string
  ligneEntete5: string
  logo: EntrepriseLogo | null
  /** NouveauLogo — image */
  nouveauLogo: EntrepriseLogo | null
  /** Champs complémentaires conservés */
  numeroRccm: string
  numeroIdNat: string
  adresse: string
  ville: string
  pays: string
  telephone: string
  email: string
  secteur: string
  statut: EntrepriseStatut
  createdAt: string
}

export type AppUser = {
  id: string
  nom: string
  prenom: string
  email: string
  role: UserRole
  categorieUtilisateurId: string
  entrepriseId: string
  telephone: string
  statut: UserStatut
  password: string
  createdAt: string
}

/** Référentiel simple (catégorie, grade, fonction, niveau, site, etc.) */
export type RefItem = {
  id: string
  code: string
  libelle: string
  description: string
  statut: RefStatut
  createdAt: string
}

/** Barème 2 — grille paie par grade */
export type Bareme2Item = {
  id: string
  grade: string
  base: string
  logement: string
  transport: string
  brute: string
  /** IPR 3% */
  ipr3: string
  /** CNSS 5% */
  cnss5: string
  /** Validé par l’Administration RH. */
  valide: boolean
  createdAt: string
}

/** Fichier CONGE — paie / jours de congé */
export type CongeItem = {
  id: string
  mois: string
  datePaie: string
  matricule: string
  nom: string
  postnom: string
  prenom: string
  numeroCnss: string
  dateEngagement: string
  grade: string
  fonction: string
  base: string
  logement: string
  jourConge: string
  totalBrut: string
  retenueCnss: string
  retenueIpr: string
  taux: string
  netAPayer: string
  organisation: string
  annee: string
  siteTravail: string
  direction: string
  createdAt: string
  updatedAt: string
}

/** @deprecated Conservé pour compatibilité d’anciennes données — utiliser Bareme2Item */
export type BaremeItem = {
  id: string
  code: string
  libelle: string
  valeur: string
  description: string
  statut: RefStatut
  createdAt: string
}

/** Barème 1 — grille paie par grade */
export type Bareme1Item = {
  id: string
  grade: string
  libelleGrade: string
  base: string
  logement: string
  transport: string
  jourDuMois: string
  joursDeConge: string
  retenueCnss: string
  retenueIpr: string
  retenueInpp: string
  /** Validé par l’Administration RH. */
  valide: boolean
  createdAt: string
}

export type PeriodeItem = {
  id: string
  code: string
  libelle: string
  dateDebut: string
  dateFin: string
  description: string
  statut: RefStatut
  createdAt: string
}

export type MonnaieItem = {
  id: string
  code: string
  libelle: string
  symbole: string
  description: string
  statut: RefStatut
  createdAt: string
}

/** Taux de change (fichier TauxMonnaie). */
export type TauxMonnaieItem = {
  id: string
  /** DTETAUX */
  dateTaux: string
  /** MONNAIE USD (unité de base, souvent 1) */
  monnaieUsd: string
  /** MONTANT CDF */
  montantCdf: string
  /** MONTANT EURO */
  montantEuro: string
  observation: string
  createdAt: string
}

export type ParametresConfig = {
  /** Mot de passe administrateur de base de données */
  dbAdminPassword: string
}

export type ParametresStore = {
  config: ParametresConfig
  entreprises: Entreprise[]
  utilisateurs: AppUser[]
  categoriesUtilisateurs: RefItem[]
  grades: RefItem[]
  /** FONCTION_AG */
  fonctions: RefItem[]
  baremes1: Bareme1Item[]
  baremes2: Bareme2Item[]
  /** Fichier CONGE */
  conges: CongeItem[]
  niveauxEtudes: RefItem[]
  /** SITE DE TRAVAIL */
  sitesAffectation: RefItem[]
  periodes: PeriodeItem[]
  monnaies: MonnaieItem[]
  /** TauxMonnaie — taux de change */
  tauxMonnaies: TauxMonnaieItem[]
  directions: RefItem[]
  /** STATUT (personnel) */
  statutsPersonnel: RefItem[]
  /** COMPTE_COMPTABLE */
  comptesComptables: RefItem[]
  /** TYPE_CONTRAT */
  typesContrats: RefItem[]
  /** CODE PRIME — types de primes / indemnités */
  primes: RefItem[]
}

export type RefCollectionKey =
  | 'categoriesUtilisateurs'
  | 'grades'
  | 'fonctions'
  | 'niveauxEtudes'
  | 'sitesAffectation'
  | 'directions'
  | 'statutsPersonnel'
  | 'comptesComptables'
  | 'typesContrats'
  | 'primes'

export type BaremeCollectionKey = 'baremes2'
export type Bareme1CollectionKey = 'baremes1'
export type Bareme2CollectionKey = 'baremes2'

export const USER_ROLES: UserRole[] = [
  'Administrateur',
  'RH',
  'Manager',
  'Lecteur',
]

export const SECTEURS_ENTREPRISE = [
  'Administration publique',
  'Énergie',
  'Eau',
  'Transport',
  'Télécommunications',
  'Finance',
  'Santé',
  'Éducation',
  'Autre',
]

export const EMPTY_PARAMETRES_STORE: ParametresStore = {
  config: { dbAdminPassword: 'dbadmin123' },
  entreprises: [],
  utilisateurs: [],
  categoriesUtilisateurs: [],
  grades: [],
  fonctions: [],
  baremes1: [],
  baremes2: [],
  conges: [],
  niveauxEtudes: [],
  sitesAffectation: [],
  periodes: [],
  monnaies: [],
  tauxMonnaies: [],
  directions: [],
  statutsPersonnel: [],
  comptesComptables: [],
  typesContrats: [],
  primes: [],
}
