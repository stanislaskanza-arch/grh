export type Crumb = {
  label: string
  to?: string
}

const LABELS: Record<string, string> = {
  paie: 'Gestion de Paie',
  preparation: 'Préparation de la paie',
  fichier: 'Fichier',
  'dette-personnel': 'Dette du personnel',
  'assistance-sociale': 'Assistance sociale',
  'paie-personnel': 'Paie du personnel',
  'bareme-1': 'Paie mensuelle Barème 1',
  'bareme-2': 'Paie mensuelle Barème 2',
  'paie-mensuelle-avantage': 'Paie Mensuelle et avantage',
  'primes-avantages': 'Primes et avantages',
  'prime-vie-chere': 'Prime de vie chère',
  'prime-performance': 'Prime de performance',
  'prime-astreinte': "Prime d'astreinte",
  'indemnite-kilometrique': 'Indemnité Kilométrique',
  'prime-travaux-intensifs': 'Prime des travaux intensifs',
  'prime-interim': "Prime d'interim",
  'prime-risque': 'Prime de risque',
  'prime-comite-directions': 'Prime de Comité des directions',
  'pecule-conge': 'Pécule de Congé',
  'feuille-paie': 'Feuille de Paie',
  bulletins: 'Bulletins de Paie',
  mensuels: 'Bulletins mensuels',
  'ancien-bareme': 'Bulletin avec ancien barème',
  'nouveau-bareme': 'Bulletin avec nouveau barème',
  'avec-primes': 'Bulletin avec primes',
  statistiques: 'Statistiques',
  'bulletin-individuel': 'Bulletin Individuel',
}

export function buildPaieCrumbs(pathname: string): Crumb[] {
  const crumbs: Crumb[] = [{ label: 'Tableau de bord', to: '/' }]

  if (!pathname.startsWith('/paie')) {
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
