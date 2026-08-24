export type StatutActeur = 'actif' | 'inactif' | 'termine'

export type FileRef = {
  name: string
  size: number
  type: string
  dataUrl?: string
}

export type AutreMandat = {
  id: string
  organisation: string
  fonction: string
}

export type StatutAdministrateur = 'Actif' | 'En attente' | 'Fin de mandat'

export type Administrateur = {
  id: string
  // Étape 1
  identifiant: string
  nom: string
  postnom: string
  prenom: string
  genre: 'Masculin' | 'Féminin'
  dateNaissance: string
  lieuNaissance: string
  nationalite: string
  nipi: string
  photoIdentite: FileRef | null
  // Étape 2
  avenueNumero: string
  commune: string
  villeProvince: string
  telephonePrincipal: string
  telephoneSecondaire: string
  emailOfficiel: string
  emailPersonnel: string
  // Étape 3
  organisme: string
  qualiteMandataire: string
  roleSpecifique: string
  typeActeNomination: string
  numeroActe: string
  dateSignatureActe: string
  datePriseFonction: string
  copieActe: FileRef | null
  statutActuel: StatutAdministrateur
  dateDebutMandat: string
  dateFinPrevue: string
  mandatRenouvelable: boolean
  // Étape 4
  niveauEtude: string
  domaineExpertise: string
  cv: FileRef | null
  autresMandats: AutreMandat[]
  casierJudiciaireFourni: boolean
  casierDateEmission: string
  casierReference: string
  attestationBonneConduiteFournie: boolean
  attestationDateEmission: string
  declarationPatrimoineEffectuee: boolean
  patrimoineDateDepot: string
  patrimoineNumeroAccuse: string
  certificatAptitudeFourni: boolean
  // Étape 5
  eligibleJetonsPresence: boolean
  nomBanque: string
  codeBanque: string
  numeroCompte: string
  intituleCompte: string
  ribCle: string
  // Métadonnées
  createdAt: string
  updatedAt: string
  creePar: string
  niveauConfidentialite: string
}

export type TypeContrat = 'CDI' | 'CDD' | 'Vacataire' | 'Autre'

export type Civilite = 'Monsieur' | 'Madame' | 'Mlle'

export type SexePersonnel = 'Masculin' | 'Féminin'

export type LienParente = 'Conjoint' | 'Parent' | 'Frère/Sœur' | 'Ami'

/** @deprecated Conservé pour compatibilité d’anciennes données */
export type StatutPersonnel =
  | 'Actif'
  | 'Sortie des effectifs'
  | 'Suspendu'
  | 'Retraité'
  | 'Décédé'

export type TypeContratPersonnel =
  | 'CDI'
  | 'CDD'
  | 'Stage'
  | 'Intérim'
  | 'Contrat de prestation'
  | 'Apprentissage'

export type MotifDepart =
  | 'Démission'
  | 'Licenciement'
  | 'Rupture conventionnelle'
  | 'Fin de CDD'
  | 'Retraite'
  | 'Décès'

/**
 * Fichier Personnel (fils) — champs liés aux fichiers pères via leurs clés (id).
 * Pères : GRADE, FONCTION_AG, NIVEAU_ETUDES, DIRECTION, SITE DE TRAVAIL,
 * PERIODE, STATUT, COMPTE_COMPTABLE, ENTREPRISE, TYPE_CONTRAT.
 */
export type Personnel = {
  id: string
  matricule: string
  nom: string
  postnom: string
  prenom: string
  sexe: SexePersonnel
  dateNaissance: string
  nationalite: string
  dateEngagement: string
  /** FK → GRADE */
  gradeId: string
  /** FK → FONCTION_AG (fonctions) */
  fonctionId: string
  /** FK → NIVEAU_ETUDES */
  niveauEtudesId: string
  numeroCompteBancaire1: string
  numeroCompteBancaire2: string
  /** Immatriculation CNSS */
  numeroCnss: string
  telephone: string
  email: string
  photo: FileRef | null
  /** FK → ENTREPRISE */
  entrepriseId: string
  /** FK → SITE DE TRAVAIL (sitesAffectation) */
  siteTravailId: string
  /** FK → PERIODE */
  periodeId: string
  /** FK → DIRECTION */
  directionId: string
  /** FK → STATUT */
  statutId: string
  /**
   * Validé par l’Administration RH.
   * Seul le personnel validé et actif participe à la paie / rémunérations.
   */
  valide: boolean
  /** FK → COMPTE_COMPTABLE */
  compteComptableId: string
  /** FK → TYPE_CONTRAT */
  typeContratId: string
  createdAt: string
  updatedAt: string
}

export type Stagiaire = {
  id: string
  numero: string
  nom: string
  prenom: string
  sexe: 'M' | 'F'
  telephone: string
  email: string
  ecole: string
  filiere: string
  niveau: string
  service: string
  tuteur: string
  themeStage: string
  dateDebut: string
  dateFin: string
  observations: string
  statut: StatutActeur
  createdAt: string
}

export type Promotion = {
  id: string
  personnelId: string
  datePromotion: string
  ancienPoste: string
  nouveauPoste: string
  ancienGrade: string
  nouveauGrade: string
  motif: string
  decidePar: string
  createdAt: string
}

export type TypeSanction =
  | 'Avertissement'
  | 'Blâme'
  | 'Mise à pied'
  | 'Rétrogradation'
  | 'Autre'

export type Sanction = {
  id: string
  personnelId: string
  dateSanction: string
  type: TypeSanction
  motif: string
  duree: string
  decidePar: string
  observations: string
  createdAt: string
}

export type PrioriteFormation = 'basse' | 'moyenne' | 'haute'
export type StatutFormation = 'identifie' | 'planifie' | 'realise' | 'annule'

export type BesoinFormation = {
  id: string
  personnelId: string
  dateDemande: string
  domaine: string
  description: string
  priorite: PrioriteFormation
  statut: StatutFormation
  createdAt: string
}

export type Evaluation = {
  id: string
  personnelId: string
  periode: string
  dateEvaluation: string
  note: number
  pointsForts: string
  axesAmelioration: string
  objectifs: string
  evaluateur: string
  createdAt: string
}

export type RecrutementStore = {
  administrateurs: Administrateur[]
  personnel: Personnel[]
  stagiaires: Stagiaire[]
  promotions: Promotion[]
  sanctions: Sanction[]
  formations: BesoinFormation[]
  evaluations: Evaluation[]
}

export const EMPTY_STORE: RecrutementStore = {
  administrateurs: [],
  personnel: [],
  stagiaires: [],
  promotions: [],
  sanctions: [],
  formations: [],
  evaluations: [],
}
