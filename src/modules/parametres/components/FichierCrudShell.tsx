import type { LucideIcon } from 'lucide-react'
import { Plus } from 'lucide-react'
import type { ReactNode } from 'react'

type Props = {
  title: string
  description: string
  listTitle: string
  count: number
  onAdd: () => void
  addLabel: string
  AddIcon?: LucideIcon
  ListIcon: LucideIcon
  children: ReactNode
  eyebrow?: string
  headerExtra?: ReactNode
  className?: string
}

export function FichierCrudShell({
  title,
  description,
  listTitle,
  count,
  onAdd,
  addLabel,
  AddIcon = Plus,
  ListIcon,
  children,
  eyebrow = 'Fichiers',
  headerExtra,
  className,
}: Props) {
  return (
    <div className={`admin-page fichier-page${className ? ` ${className}` : ''}`}>
      <header className="page-header admin-page-header">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{title}</h1>
          <p className="lede">{description}</p>
        </div>
        <div className="admin-header-actions">
          {headerExtra}
          <button type="button" className="btn-primary admin-cta" onClick={onAdd}>
            <span className="admin-cta-icon" aria-hidden>
              <AddIcon size={18} />
            </span>
            {addLabel}
          </button>
        </div>
      </header>

      <section className="admin-list-panel" aria-label={listTitle}>
        <div className="admin-list-head">
          <div className="admin-list-title">
            <span className="admin-list-icon" aria-hidden>
              <ListIcon size={18} />
            </span>
            <div>
              <h2>{listTitle}</h2>
              <p>
                {count} enregistrement{count > 1 ? 's' : ''}
              </p>
            </div>
          </div>
        </div>
        {children}
      </section>
    </div>
  )
}
