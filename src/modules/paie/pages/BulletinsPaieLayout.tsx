import { Link, Outlet } from 'react-router-dom'
import { BulletinsPaieMenuBar } from '../components/BulletinsPaieMenuBar'

export function BulletinsPaieLayout() {
  return (
    <div className="bulletins-paie-shell preparation-paie-shell">
      <header className="param-shell-header">
        <div>
          <p className="eyebrow">Gestion de Paie</p>
          <h1>Bulletins de Paie</h1>
        </div>
        <Link to="/" className="btn-ghost">
          Retour au tableau de bord
        </Link>
      </header>
      <BulletinsPaieMenuBar />
      <div className="param-shell-content">
        <Outlet />
      </div>
    </div>
  )
}
