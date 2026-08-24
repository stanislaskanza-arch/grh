import { Link } from 'react-router-dom'
import { Banknote, Building2, Users } from 'lucide-react'

const SHORTCUTS = [
  {
    to: '/parametres/fichiers/taux-monnaie',
    title: 'Taux Monnaie',
    text: 'Mettre à jour les taux de change affichés dans le Choix de taux (paie). Déclarez « En cours » sur le taux applicable.',
    Icon: Banknote,
  },
  {
    to: '/parametres/fichiers/entreprises',
    title: 'Entreprise',
    text: 'Consulter et administrer la liste des entreprises.',
    Icon: Building2,
  },
  {
    to: '/parametres/fichiers/utilisateurs',
    title: 'Utilisateurs',
    text: 'Gérer les comptes et l’accès à l’application.',
    Icon: Users,
  },
] as const

export function ParametresHomePage() {
  return (
    <div className="param-home">
      <div className="param-home-media">
        <img
          src="/images/dashboard/parametres.png"
          alt="Paramètres, sécurité et administration"
        />
      </div>
      <div className="param-home-copy">
        <p className="eyebrow">Espace sécurisé</p>
        <h2>Bienvenue dans Paramètres & Sécurité</h2>
        <p>
          Gérez ici les fichiers de référence, les utilisateurs, les entreprises
          et les opérations d’importation. Utilisez la bande de menu ci-dessus
          — par exemple <strong>Fichiers → Taux Monnaie</strong> pour mettre à
          jour le taux utilisé dans le Choix de taux de la paie.
        </p>

        <div className="param-home-shortcuts" aria-label="Accès rapides">
          {SHORTCUTS.map(({ to, title, text, Icon }) => (
            <Link key={to} to={to} className="param-home-shortcut">
              <span className="param-home-shortcut-icon" aria-hidden>
                <Icon size={18} />
              </span>
              <span>
                <strong>{title}</strong>
                <span>{text}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
