import { Link, useLocation } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { buildPresencesCrumbs } from './breadcrumbs'

export function PresencesBreadcrumb() {
  const { pathname } = useLocation()
  const crumbs = buildPresencesCrumbs(pathname)

  if (crumbs.length <= 1) return null

  return (
    <nav className="breadcrumb" aria-label="Fil d’Ariane">
      <ol className="breadcrumb-list">
        {crumbs.map((crumb: { label: string; to?: string }, index: number) => {
          const isLast = index === crumbs.length - 1
          return (
            <li key={`${crumb.label}-${index}`} className="breadcrumb-item">
              {index > 0 && (
                <ChevronRight size={14} className="breadcrumb-sep" aria-hidden />
              )}
              {crumb.to && !isLast ? (
                <Link to={crumb.to}>{crumb.label}</Link>
              ) : (
                <span aria-current={isLast ? 'page' : undefined}>{crumb.label}</span>
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
