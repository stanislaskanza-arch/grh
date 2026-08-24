export type PaieMensuelleB2Field = {
  header: string
  key: keyof Omit<
    import('./types').PaieMensuelleB2Item,
    'id' | 'createdAt' | 'updatedAt'
  >
  required?: boolean
}

/** Structure du fichier PaieMensuelleB2. */
export const PAIE_MENSUELLE_B2_FIELDS: PaieMensuelleB2Field[] = [
  { header: 'MOIS', key: 'mois', required: true },
  { header: 'DTE PAIE', key: 'datePaie', required: true },
  { header: 'MATRICULE', key: 'matricule', required: true },
  { header: 'NOM', key: 'nom', required: true },
  { header: 'POSTNOM', key: 'postnom' },
  { header: 'PRENOM', key: 'prenom', required: true },
  { header: 'DATE ENGAGEMENT', key: 'dateEngagement' },
  { header: 'GRADE', key: 'grade' },
  { header: 'FONCTION', key: 'fonction' },
  { header: 'IMMATRICULATION CNSS', key: 'immatriculationCnss' },
  { header: 'BASE', key: 'base' },
  { header: 'LOGEMENT', key: 'logement' },
  { header: 'TRANSPORT', key: 'transport' },
  { header: 'TOTAL BRUT', key: 'totalBrut' },
  { header: 'RETENUE CNSS', key: 'retenueCnss' },
  { header: 'RETENUE IPR', key: 'retenueIpr' },
  { header: 'RETENUE INPP', key: 'retenueInpp' },
  { header: 'TOTAL RETENUE', key: 'totalRetenue' },
  { header: 'NET A PAYER', key: 'netAPayer' },
]
