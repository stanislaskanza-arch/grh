export type ImportStructureField = {
  header: string
  key: string
  required?: boolean
  valeurs?: string
  note?: string
}

export type ImportStructureDef = {
  id: string
  title: string
  fichierPere: string
  description: string
  route: string
  fields: ImportStructureField[]
  exampleRow: string[]
}

const REF_FIELDS: ImportStructureField[] = [
  { header: 'Code', key: 'code', required: true, valeurs: 'Texte court unique' },
  { header: 'Libelle', key: 'libelle', required: true, valeurs: 'Texte' },
  { header: 'Description', key: 'description', valeurs: 'Texte libre' },
  {
    header: 'Statut',
    key: 'statut',
    valeurs: 'actif | inactif',
    note: 'Défaut : actif si vide',
  },
]

export const BAREME1_FIELDS: ImportStructureField[] = [
  { header: 'GRADE', key: 'grade', required: true, valeurs: 'Code grade (ex. C3, E1)' },
  {
    header: 'LIBELLE GRADE',
    key: 'libelleGrade',
    required: true,
    valeurs: 'Libellé du grade',
  },
  { header: 'BASE', key: 'base', valeurs: 'Montant ou valeur' },
  { header: 'LOGEMENT', key: 'logement', valeurs: 'Montant ou valeur' },
  { header: 'TRANSPORT', key: 'transport', valeurs: 'Montant ou valeur' },
  { header: 'JOURS DU MOIS', key: 'jourDuMois', valeurs: 'Nombre de jours' },
  { header: 'JOURS DE CONGE', key: 'joursDeConge', valeurs: 'Nombre de jours' },
  { header: 'RETENUE CNSS', key: 'retenueCnss', valeurs: 'Montant ou taux' },
  { header: 'RETENUE IPR', key: 'retenueIpr', valeurs: 'Montant ou taux' },
  { header: 'RETENUE INPP', key: 'retenueInpp', valeurs: 'Montant ou taux' },
]

export const BAREME2_FIELDS: ImportStructureField[] = [
  { header: 'GRADE', key: 'grade', required: true, valeurs: 'Code grade (ex. C3, E1)' },
  { header: 'BASE', key: 'base', valeurs: 'Montant ou valeur' },
  { header: 'LOGEMENT', key: 'logement', valeurs: 'Montant ou valeur' },
  { header: 'TRANSPORT', key: 'transport', valeurs: 'Montant ou valeur' },
  { header: 'BRUTE', key: 'brute', valeurs: 'Montant brut' },
  { header: 'IPR 3%', key: 'ipr3', valeurs: 'Montant ou taux IPR 3%' },
  { header: 'CNSS 5%', key: 'cnss5', valeurs: 'Montant ou taux CNSS 5%' },
]

export const CONGE_FIELDS: ImportStructureField[] = [
  { header: 'MOIS', key: 'mois', required: true, valeurs: 'Mois (ex. 01 ou 2026-01)' },
  { header: 'DTE PAIE', key: 'datePaie', required: true, valeurs: 'Date ISO AAAA-MM-JJ' },
  { header: 'MATRICULE', key: 'matricule', required: true, valeurs: 'Matricule agent' },
  { header: 'NOM', key: 'nom', required: true, valeurs: 'Texte' },
  { header: 'POSTNOM', key: 'postnom', valeurs: 'Texte' },
  { header: 'PRENOM', key: 'prenom', required: true, valeurs: 'Texte' },
  { header: 'N° CNSS', key: 'numeroCnss', valeurs: 'Numéro CNSS' },
  { header: 'DATE ENGAGEMENT', key: 'dateEngagement', valeurs: 'Date ISO AAAA-MM-JJ' },
  { header: 'GRADE', key: 'grade', valeurs: 'Code grade' },
  { header: 'JOUR CONGE', key: 'jourConge', valeurs: 'Nombre de jours' },
  { header: 'FONCTION', key: 'fonction', valeurs: 'Libellé ou code fonction' },
  { header: 'BASE', key: 'base', valeurs: 'Montant' },
  { header: 'LOGEMENT', key: 'logement', valeurs: 'Montant' },
  {
    header: 'TOTAL BRUT AU PRORATA DE Nbre DE JR. DE CONGE',
    key: 'totalBrut',
    valeurs: 'Montant',
  },
  { header: 'RETENUE CNSS', key: 'retenueCnss', valeurs: 'Montant' },
  { header: 'RETENUE IPR', key: 'retenueIpr', valeurs: 'Montant' },
  { header: 'TAUX', key: 'taux', valeurs: 'Taux' },
  { header: 'NET A PAYER', key: 'netAPayer', valeurs: 'Montant' },
  { header: 'ORGANISATION', key: 'organisation', valeurs: 'Texte' },
  { header: 'ANNEE', key: 'annee', valeurs: 'AAAA' },
  { header: 'SITE DE TRAVAIL', key: 'siteTravail', valeurs: 'Code ou libellé site' },
  { header: 'DIRECTION', key: 'direction', valeurs: 'Code ou libellé direction' },
]

export const IMPORT_STRUCTURES: Record<string, ImportStructureDef> = {
  'fonction-ag': {
    id: 'fonction-ag',
    title: 'Fonction AG',
    fichierPere: 'FONCTION_AG',
    description:
      'Structure du fichier père des fonctions / postes du personnel, utilisée pour l’affectation.',
    route: '/parametres/importation/fonction-ag',
    fields: REF_FIELDS,
    exampleRow: [
      'CRC',
      'Chargé de recrutement et carriere',
      'Recrutement et gestion de carrière',
      'actif',
    ],
  },
  bareme1: {
    id: 'bareme1',
    title: 'Barème 1',
    fichierPere: 'BAREME1',
    description:
      'Structure du fichier Barème 1 : grille de paie par grade (base, logement, transport, retenues).',
    route: '/parametres/importation/bareme1',
    fields: BAREME1_FIELDS,
    exampleRow: [
      'C3',
      'Chef de Bureau',
      '450000',
      '80000',
      '50000',
      '30',
      '24',
      '0.05',
      '0.21',
      '4500',
    ],
  },
  bareme2: {
    id: 'bareme2',
    title: 'Barème 2',
    fichierPere: 'BAREME2',
    description:
      'Structure du fichier Barème 2 : grille de paie par grade (base, logement, transport, brute, IPR 3%, CNSS 5%).',
    route: '/parametres/importation/bareme2',
    fields: BAREME2_FIELDS,
    exampleRow: [
      'C3',
      '450000',
      '80000',
      '50000',
      '580000',
      '17400',
      '29000',
    ],
  },
  conge: {
    id: 'conge',
    title: 'Congé',
    fichierPere: 'CONGE',
    description:
      'Structure du fichier CONGE : paie et jours de congé du personnel.',
    route: '/parametres/importation/conge',
    fields: CONGE_FIELDS,
    exampleRow: [
      '2026-01',
      '2026-01-31',
      'AG001',
      'KABONGO',
      'MUKEBA',
      'Jean',
      'CNSS-001',
      '2018-03-01',
      'C3',
      'Chef de Bureau',
      '450000',
      '80000',
      '24',
      '530000',
      '26500',
      '111300',
      '1',
      '392200',
      'ARMP',
      '2026',
      'DG',
      'Direction Générale',
    ],
  },
  'compte-comptable': {
    id: 'compte-comptable',
    title: 'Compte comptable',
    fichierPere: 'COMPTE_COMPTABLE',
    description:
      'Structure du fichier père des comptes comptables liés au personnel.',
    route: '/parametres/importation/compte-comptable',
    fields: REF_FIELDS,
    exampleRow: [
      '421000',
      'Rémunérations dues',
      'Compte de charges de personnel',
      'actif',
    ],
  },
}

export function headersLine(def: ImportStructureDef): string {
  return def.fields.map((f) => f.header).join('\t')
}
