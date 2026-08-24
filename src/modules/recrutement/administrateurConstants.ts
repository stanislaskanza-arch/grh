import type { Administrateur } from './types'

export const NATIONALITES = [
  'Congolaise (RDC)',
  'Congolaise (Brazzaville)',
  'Belge',
  'Française',
  'Autre',
]

export const COMMUNES_KINSHASA = [
  'Gombe',
  'Kinshasa',
  'Lingwala',
  'Barumbu',
  'Kalamu',
  'Kasa-Vubu',
  'Ngaliema',
  'Mont-Ngafula',
  'Lemba',
  'Limete',
  'Matete',
  'Ngaba',
  'Makala',
  'Bumbu',
  'Selembao',
  'Ngiri-Ngiri',
  'Kintambo',
  'Masina',
  'Ndjili',
  'Kimbanseke',
  'Nsele',
  'Maluku',
  'Autre',
]

export const VILLES_PROVINCES = [
  'Kinshasa',
  'Kongo Central',
  'Kwilu',
  'Kwango',
  'Mai-Ndombe',
  'Équateur',
  'Mongala',
  'Nord-Ubangi',
  'Sud-Ubangi',
  'Tshuapa',
  'Tshopo',
  'Ituri',
  'Haut-Uele',
  'Bas-Uele',
  'Nord-Kivu',
  'Sud-Kivu',
  'Maniema',
  'Haut-Katanga',
  'Lualaba',
  'Haut-Lomami',
  'Tanganyika',
  'Lomami',
  'Sankuru',
  'Kasaï',
  'Kasaï Central',
  'Kasaï Oriental',
  'Autre',
]

export const ORGANISMES = [
  'SNEL',
  'REGIDESO',
  'RTNC',
  'SONAS',
  'RVF',
  'ONATRA',
  'Autre entreprise publique',
]

export const QUALITES_MANDATAIRE = [
  'Administrateur',
  'Directeur Général',
  'Directeur Général Adjoint',
  'Président du Conseil',
  'Vice-Président du Conseil',
  'Autre',
]

export const TYPES_ACTE = [
  'Ordonnance Présidentielle',
  'Arrêté Ministériel',
  'Décision du Conseil d’Administration',
  'Autre',
]

export const NIVEAUX_ETUDE = [
  'Graduat',
  'Licencié',
  'Master',
  'Doctorat',
  'Autre',
]

export const BANQUES = [
  'RAWBANK',
  'EquityBCDC',
  'TMB',
  'Sofibanque',
  'Trust Merchant Bank',
  'Afriland First Bank',
  'Autre',
]

export const STATUTS_ADMIN: Administrateur['statutActuel'][] = [
  'Actif',
  'En attente',
  'Fin de mandat',
]

export const WIZARD_STEPS = [
  {
    id: 1,
    title: 'Identification personnelle',
    short: 'Identité',
  },
  {
    id: 2,
    title: 'Coordonnées de contact',
    short: 'Contact',
  },
  {
    id: 3,
    title: 'Mandat & nomination',
    short: 'Mandat',
  },
  {
    id: 4,
    title: 'Profil & conformité',
    short: 'Conformité',
  },
  {
    id: 5,
    title: 'Règlementation & rémunération',
    short: 'Rémunération',
  },
] as const

export function generateIdentifiant(existing: { identifiant: string }[]): string {
  const year = new Date().getFullYear()
  const prefix = `ADM-${year}-`
  const nums = existing
    .map((a) => a.identifiant)
    .filter((id) => id.startsWith(prefix))
    .map((id) => Number.parseInt(id.slice(prefix.length), 10))
    .filter((n) => !Number.isNaN(n))
  const next = (nums.length ? Math.max(...nums) : 0) + 1
  return `${prefix}${String(next).padStart(4, '0')}`
}

export type AdminFormState = Omit<Administrateur, 'id' | 'createdAt'>

export function createEmptyAdministrateur(
  identifiant: string,
  creePar: string,
): AdminFormState {
  const now = new Date().toISOString()
  return {
    identifiant,
    nom: '',
    postnom: '',
    prenom: '',
    genre: 'Masculin',
    dateNaissance: '',
    lieuNaissance: '',
    nationalite: 'Congolaise (RDC)',
    nipi: '',
    photoIdentite: null,
    avenueNumero: '',
    commune: '',
    villeProvince: 'Kinshasa',
    telephonePrincipal: '+243 ',
    telephoneSecondaire: '+243 ',
    emailOfficiel: '',
    emailPersonnel: '',
    organisme: '',
    qualiteMandataire: 'Administrateur',
    roleSpecifique: '',
    typeActeNomination: '',
    numeroActe: '',
    dateSignatureActe: '',
    datePriseFonction: '',
    copieActe: null,
    statutActuel: 'Actif',
    dateDebutMandat: '',
    dateFinPrevue: '',
    mandatRenouvelable: false,
    niveauEtude: '',
    domaineExpertise: '',
    cv: null,
    autresMandats: [],
    casierJudiciaireFourni: false,
    casierDateEmission: '',
    casierReference: '',
    attestationBonneConduiteFournie: false,
    attestationDateEmission: '',
    declarationPatrimoineEffectuee: false,
    patrimoineDateDepot: '',
    patrimoineNumeroAccuse: '',
    certificatAptitudeFourni: false,
    eligibleJetonsPresence: true,
    nomBanque: '',
    codeBanque: '',
    numeroCompte: '',
    intituleCompte: '',
    ribCle: '',
    updatedAt: now,
    creePar,
    niveauConfidentialite: 'Confidentiel — Accès RH restreint',
  }
}
