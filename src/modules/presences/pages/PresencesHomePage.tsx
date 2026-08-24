import { Link } from 'react-router-dom'
import { CalendarDays, ChevronRight, Clock3, UserX } from 'lucide-react'

const TITLES = [
  {
    to: '/presences/pointage-quotidien',
    title: 'Pointage quotidien',
    text: 'Enregistrer et consulter les entrées / sorties du jour.',
    Icon: Clock3,
  },
  {
    to: '/presences/calendrier-conges',
    title: 'Calendrier de congés',
    text: 'Planifier et visualiser les congés du personnel.',
    Icon: CalendarDays,
  },
  {
    to: '/presences/suivi-absences-retards',
    title: 'Suivi des absences et retards',
    text: 'Suivre les absences, retards et justifications.',
    Icon: UserX,
  },
]

export function PresencesHomePage() {
  return (
    <div className="captures-hub">
      <header className="page-header captures-hub-header">
        <div>
          <p className="eyebrow">Gestion des Présences</p>
          <h1>Présences</h1>
          <p className="lede">
            Sélectionnez un sous-menu pour ouvrir l’écran correspondant.
          </p>
        </div>
      </header>

      <section className="title-cards" aria-label="Fonctionnalités présences">
        {TITLES.map(({ to, title, text, Icon }) => (
          <Link key={to} to={to} className="title-card">
            <div className="title-card-body">
              <div className="title-card-text">
                <span className="presences-hub-icon" aria-hidden>
                  <Icon size={22} strokeWidth={2.2} />
                </span>
                <h2>{title}</h2>
                <p>{text}</p>
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
