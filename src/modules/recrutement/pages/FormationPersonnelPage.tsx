import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useRecrutement } from '../RecrutementContext'

const TITLES = [
  {
    to: '/recrutement/formation/besoins',
    title: 'Enregistrement de besoin en formation',
    text: 'Identifier et suivre les besoins de formation du personnel.',
    countKey: 'formations' as const,
  },
]

export function FormationPersonnelPage() {
  const { store } = useRecrutement()

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Recrutement & Carrière</p>
          <h1>Formation du personnel</h1>
          <p className="lede">
            Sélectionnez un titre pour ouvrir l’écran de formation correspondant.
          </p>
        </div>
      </header>

      <section className="title-list" aria-label="Fonctionnalités de formation">
        {TITLES.map((item) => (
          <Link key={item.to} to={item.to} className="title-link">
            <div>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </div>
            <div className="title-link-meta">
              <span className="count-badge">{store[item.countKey].length}</span>
              <ChevronRight size={18} />
            </div>
          </Link>
        ))}
      </section>
    </>
  )
}
