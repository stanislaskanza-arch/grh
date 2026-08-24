import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'
import { useRecrutement } from '../RecrutementContext'

const TITLES = [
  {
    to: '/recrutement/captures/administrateurs',
    title: 'Enregistrement des Administrateurs',
    text: 'Saisir et gérer les fiches des administrateurs.',
    countKey: 'administrateurs' as const,
    image: '/images/captures/administrateurs.png',
    imageAlt: 'Conseil d’administration en réunion',
  },
  {
    to: '/recrutement/captures/personnel',
    title: 'Enregistrement du Personnel',
    text: 'Saisir et gérer les fiches du personnel.',
    countKey: 'personnel' as const,
    image: '/images/captures/personnel.png',
    imageAlt: 'Personnel en environnement de travail',
  },
  {
    to: '/recrutement/captures/stagiaires',
    title: 'Enregistrement des Stagiaires',
    text: 'Saisir et gérer les fiches des stagiaires.',
    countKey: 'stagiaires' as const,
    image: '/images/captures/stagiaires.png',
    imageAlt: 'Stagiaires accompagnés en formation',
  },
]

export function CapturesInfoPage() {
  const { store } = useRecrutement()

  return (
    <div className="captures-hub">
      <header className="page-header captures-hub-header">
        <div>
          <p className="eyebrow">Recrutement & Carrière</p>
          <h1>Capture Info du Conseil d'Administration et du Personnel</h1>
          <p className="lede">
            Sélectionnez un titre pour ouvrir l’écran d’enregistrement
            correspondant.
          </p>
        </div>
      </header>

      <section className="title-cards" aria-label="Fonctionnalités de capture">
        {TITLES.map((item) => (
          <Link key={item.to} to={item.to} className="title-card">
            <div className="title-card-media">
              <img src={item.image} alt={item.imageAlt} loading="lazy" />
            </div>
            <div className="title-card-body">
              <div className="title-card-text">
                <h2>{item.title}</h2>
                <p>{item.text}</p>
              </div>
              <div className="title-link-meta">
                <span className="count-badge">{store[item.countKey].length}</span>
                <ChevronRight size={18} />
              </div>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
