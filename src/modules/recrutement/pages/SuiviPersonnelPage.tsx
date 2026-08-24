import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useRecrutement } from '../RecrutementContext'

const TITLES = [
  {
    to: '/recrutement/suivi/promotions',
    title: 'Enregistrement des promotions',
    text: 'Suivre les promotions du personnel.',
    countKey: 'promotions' as const,
  },
  {
    to: '/recrutement/suivi/sanctions',
    title: 'Enregistrement des sanctions',
    text: 'Enregistrer les mesures disciplinaires.',
    countKey: 'sanctions' as const,
  },
  {
    to: '/recrutement/suivi/formations',
    title: 'Enregistrement de besoin en formation',
    text: 'Identifier et suivre les besoins de formation.',
    countKey: 'formations' as const,
  },
  {
    to: '/recrutement/suivi/evaluations',
    title: 'Évaluation continue du personnel',
    text: 'Saisir les évaluations périodiques.',
    countKey: 'evaluations' as const,
  },
]

export function SuiviPersonnelPage() {
  const { store } = useRecrutement()

  return (
    <>
      <header className="page-header">
        <div>
          <p className="eyebrow">Recrutement & Carrière</p>
          <h1>Suivi du personnel</h1>
          <p className="lede">
            Sélectionnez un titre pour ouvrir l’écran de suivi correspondant.
          </p>
        </div>
      </header>

      <section className="title-list" aria-label="Fonctionnalités de suivi">
        {TITLES.map((item) => (
          <Link key={item.to} to={item.to} className="title-link">
            <div>
              <h2>{item.title}</h2>
              <p>{item.text}</p>
            </div>
            <div className="title-link-meta">
              <span className="count-badge">
                {store[item.countKey].length}
              </span>
              <ChevronRight size={18} />
            </div>
          </Link>
        ))}
      </section>
    </>
  )
}
