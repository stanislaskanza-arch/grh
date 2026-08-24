import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

const ITEMS = [
  {
    to: '/presences/pointage',
    title: 'Pointage quotidien',
    text: 'Enregistrer les entrées et sorties du personnel au quotidien.',
  },
  {
    to: '/presences/calendrier-conges',
    title: 'Calendrier de congés',
    text: 'Planifier et consulter les congés sur le calendrier.',
  },
  {
    to: '/presences/absences-retards',
    title: 'Suivi des absences et retards',
    text: 'Suivre les absences, retards et justifications.',
  },
  {
    to: '/presences/rapports',
    title: 'Rapports de présence',
    text: 'Consulter et éditer les rapports de présence par période.',
  },
]

export function PresencesHubPage() {
  return (
    <div className="captures-hub">
      <header className="page-header captures-hub-header">
        <div>
          <p className="eyebrow">Module Présences</p>
          <h1>Gestion des Présences</h1>
          <p className="lede">
            Sélectionnez une fonctionnalité pour ouvrir l’écran correspondant.
          </p>
        </div>
      </header>

      <section className="title-cards" aria-label="Fonctionnalités de présence">
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
