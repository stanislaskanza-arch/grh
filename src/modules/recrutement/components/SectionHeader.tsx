import type { ReactNode } from 'react'

type Props = {
  title: string
  description: string
  count: number
  onAdd: () => void
  addLabel: string
  children: ReactNode
}

export function SectionHeader({
  title,
  description,
  count,
  onAdd,
  addLabel,
  children,
}: Props) {
  return (
    <section className="crud-section">
      <div className="crud-toolbar">
        <div>
          <h2>{title}</h2>
          <p>{description}</p>
        </div>
        <div className="crud-toolbar-right">
          <span className="count-badge">{count} enregistrement{count > 1 ? 's' : ''}</span>
          <button type="button" className="btn-primary" onClick={onAdd}>
            {addLabel}
          </button>
        </div>
      </div>
      {children}
    </section>
  )
}
