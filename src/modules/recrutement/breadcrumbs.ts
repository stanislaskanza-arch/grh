export type Crumb = {
  label: string
  to?: string
}

const LABELS: Record<string, string> = {
  recrutement: 'Recrutement & Carrière',
  captures: "Capture Info du Conseil d'Administration et du Personnel",
  suivi: 'Suivi du personnel',
  formation: 'Formation du personnel',
  'complement-dossier': 'Complément Dossier du Personnel',
  administrateurs: 'Enregistrement des Administrateurs',
  personnel: 'Enregistrement du Personnel',
  stagiaires: 'Enregistrement des Stagiaires',
  promotions: 'Enregistrement des promotions',
  sanctions: 'Enregistrement des sanctions',
  formations: 'Enregistrement de besoin en formation',
  besoins: 'Enregistrement de besoin en formation',
  evaluations: 'Évaluation continue du personnel',
}

/** Construit le fil d’Ariane à partir du chemin courant. */
export function buildRecrutementCrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Tableau de bord', to: '/' }]

  if (!pathname.startsWith('/recrutement')) {
    return crumbs
  }

  const parts = pathname.split('/').filter(Boolean)
  // parts: ['recrutement', ...]
  let path = ''

  parts.forEach((part, index) => {
    path += `/${part}`
    const label = LABELS[part] ?? part
    const isLast = index === parts.length - 1
    crumbs.push({
      label,
      to: isLast ? undefined : path,
    })
  })

  return crumbs
}
