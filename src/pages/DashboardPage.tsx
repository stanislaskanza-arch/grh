import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'
import { CloudSyncPanel } from '../components/CloudSyncPanel'

const MODULES = [
  {
    to: '/recrutement/captures',
    title: 'Recrutement & Carrière',
    text: "Capture Info du Conseil d'Administration et du Personnel, et suivi du parcours.",
    image: '/images/dashboard/recrutement.png',
    imageAlt: 'Recrutement et parcours de carrière',
    status: 'Actif',
  },
  {
    to: '/presences',
    title: 'Gestion des Présences',
    text: 'Pointages, absences, congés et tableaux de présence.',
    image: '/images/dashboard/presences.png',
    imageAlt: 'Gestion des présences et pointages',
    status: 'À développer',
  },
  {
    to: '/paie',
    title: 'Gestion de Paie',
    text: 'Bulletins, éléments de salaire, charges et historiques.',
    image: '/images/dashboard/paie.png',
    imageAlt: 'Gestion de la paie',
    status: 'À développer',
  },
  {
    to: '/parametres',
    title: 'Paramètres & Sécurité',
    text: 'Utilisateurs, rôles et entreprises.',
    image: '/images/dashboard/parametres.png',
    imageAlt: 'Paramètres et sécurité',
    status: 'Actif',
  },
]

export function DashboardPage() {
  const { user } = useAuth()

  useEffect(() => {
    document.documentElement.classList.add('dashboard-lock')
    document.body.classList.add('dashboard-lock')
    return () => {
      document.documentElement.classList.remove('dashboard-lock')
      document.body.classList.remove('dashboard-lock')
    }
  }, [])

  return (
    <div className="dashboard-hub">
      <header className="page-header dashboard-hub-header">
        <div>
          <p className="eyebrow">Tableau de bord</p>
          <p className="dashboard-hello">Bonjour, {user?.name}</p>
          <h1>Bienvenue dans GRH</h1>
          <p className="lede">
            Choisissez un module pour continuer — chaque espace sera enrichi
            progressivement.
          </p>
        </div>
      </header>

      <CloudSyncPanel />

      <section className="dashboard-cards" aria-label="Modules GRH">
        {MODULES.map((mod) => (
          <Link key={mod.to} to={mod.to} className="dashboard-card">
            <div className="dashboard-card-media">
              <img src={mod.image} alt={mod.imageAlt} loading="lazy" />
            </div>
            <div className="dashboard-card-body">
              <div className="module-tile-top">
                <h2>{mod.title}</h2>
                <span className="status-pill">{mod.status}</span>
              </div>
              <p>{mod.text}</p>
            </div>
          </Link>
        ))}
      </section>
    </div>
  )
}
