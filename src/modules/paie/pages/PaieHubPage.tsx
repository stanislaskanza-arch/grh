import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const ITEMS = [
  {
    to: '/paie/preparation',
    title: 'Préparation de la paie',
    text: 'Préparer les éléments de paie avant le calcul des salaires.',
  },
  {
    to: '/paie/feuille-paie',
    title: 'Feuille de Paie',
    text: 'Consulter et contrôler la feuille de paie consolidée.',
  },
  {
    to: '/paie/bulletins',
    title: 'Bulletins de Paie',
    text: 'Générer et gérer les bulletins de paie du personnel.',
  },
  {
    to: '/paie/bulletin-individuel',
    title: 'Bulletin Individuel',
    text: 'Afficher et imprimer le bulletin de paie d’un agent.',
  },
]

export function PaieHubPage() {
  return (
    <div className="captures-hub">
      <header className="page-header captures-hub-header">
        <div>
          <p className="eyebrow">Module Paie</p>
          <h1>Gestion de Paie</h1>
          <p className="lede">
            Sélectionnez une fonctionnalité pour ouvrir l’écran correspondant.
          </p>
        </div>
      </header>

      <section className="title-cards" aria-label="Fonctionnalités de paie">
        {ITEMS.map((item) => (
          <Link key={item.to} to={item.to} className="title-card">
            <div className="title-card-body">
              <div className="title-card-text">
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </div>
              <div className="title-link-meta">
                <ChevronRight size={18} />
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
