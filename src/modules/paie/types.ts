/** Ligne du fichier PaieMensuelleB1 (paie mensuelle Barème 1). */
export type PaieMensuelleB1Item = {
  id: string
  mois: string
  datePaie: string
  matricule: string
  nom: string
  postnom: string
  prenom: string
  dateEngagement: string
  grade: string
  fonction: string
  base: string
  logement: string
  transport: string
  totalBrut: string
  retenueCnss: string
  retenueIpr: string
  retenueInpp: string
  netAPayer: string
  createdAt: string
  updatedAt: string
}

/** Ligne du fichier PaieMensuelleB2 (paie mensuelle Barème 2). */
export type PaieMensuelleB2Item = {
  id: string
  mois: string
  /** DTE PAIE */
  datePaie: string
  matricule: string
  nom: string
  postnom: string
  prenom: string
  dateEngagement: string
  grade: string
  fonction: string
  immatriculationCnss: string
  base: string
  logement: string
  transport: string
  totalBrut: string
  retenueCnss: string
  retenueIpr: string
  retenueInpp: string
  totalRetenue: string
  netAPayer: string
  createdAt: string
  updatedAt: string
}

export type PaieStore = {
  paieMensuelleB1: PaieMensuelleB1Item[]
  paieMensuelleB2: PaieMensuelleB2Item[]
}

export const EMPTY_PAIE_STORE: PaieStore = {
  paieMensuelleB1: [],
  paieMensuelleB2: [],
}
