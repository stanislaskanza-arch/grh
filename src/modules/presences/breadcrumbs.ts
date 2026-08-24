export type Crumb = {
  label: string
  to?: string
}

const LABELS: Record<string, string> = {
  presences: 'Gestion des Présences',
  pointage: 'Pointage quotidien',
  'calendrier-conges': 'Calendrier de congés',
  'absences-retards': 'Suivi des absences et retards',
  rapports: 'Rapports de présence',
}

/** Construit le fil d’Ariane à partir du chemin courant. */
export function buildPresencesCrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Tableau de bord', to: '/' }]

  if (!pathname.startsWith('/presences')) {
    return crumbs
  }

  const parts = pathname.split('/').filter(Boolean)
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
