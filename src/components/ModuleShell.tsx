import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

type Props = {
  eyebrow?: string
  title: string
  description: string
  upcoming: string[]
  showBackLink?: boolean
  children?: ReactNode
}

export function ModuleShell({
  eyebrow,
  title,
  description,
  upcoming,
  showBackLink = true,
  children,
}: Props) {
  return (
    <div className="module-page">
      <header className="page-header">
        <div>
          {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          <p className="lede">{description}</p>
        </div>
        {showBackLink ? (
          <Link to="/" className="btn-ghost">
            Retour au tableau de bord
          </Link>
        ) : null}
      </header>

      <section className="roadmap-panel">
        <h2>Prochaines étapes de ce module</h2>
        <ul>
          {upcoming.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </section>

      {children}
    </div>
  )
}
