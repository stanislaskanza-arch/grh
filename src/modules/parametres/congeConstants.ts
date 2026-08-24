/** Structure du fichier CONGE. */
export type CongeField = {
  header: string
  key: keyof Omit<import('./types').CongeItem, 'id' | 'createdAt' | 'updatedAt'>
  required?: boolean
}

export const CONGE_FIELDS: CongeField[] = [
  { header: 'MOIS', key: 'mois', required: true },
  { header: 'DTE PAIE', key: 'datePaie', required: true },
  { header: 'MATRICULE', key: 'matricule', required: true },
  { header: 'NOM', key: 'nom', required: true },
  { header: 'POSTNOM', key: 'postnom' },
  { header: 'PRENOM', key: 'prenom', required: true },
  { header: 'N° CNSS', key: 'numeroCnss' },
  { header: 'DATE ENGAGEMENT', key: 'dateEngagement' },
  { header: 'GRADE', key: 'grade' },
  { header: 'JOUR CONGE', key: 'jourConge' },
  { header: 'FONCTION', key: 'fonction' },
  { header: 'BASE', key: 'base' },
  { header: 'LOGEMENT', key: 'logement' },
  { header: 'TOTAL BRUT AU PRORATA DE Nbre DE JR. DE CONGE', key: 'totalBrut' },
  { header: 'RETENUE CNSS', key: 'retenueCnss' },
  { header: 'RETENUE IPR', key: 'retenueIpr' },
  { header: 'TAUX', key: 'taux' },
  { header: 'NET A PAYER', key: 'netAPayer' },
  { header: 'ORGANISATION', key: 'organisation' },
  { header: 'ANNEE', key: 'annee' },
  { header: 'SITE DE TRAVAIL', key: 'siteTravail' },
  { header: 'DIRECTION', key: 'direction' },
]
