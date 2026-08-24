import { Link, Outlet } from 'react-router-dom'
import { PreparationPaieMenuBar } from '../components/PreparationPaieMenuBar'

export function PreparationPaieLayout() {
  return (
    <div className="preparation-paie-shell">
      <header className="param-shell-header">
        <div>
          <p className="eyebrow">Gestion de Paie</p>
          <h1>Préparation de la paie</h1>
        </div>
        <Link to="/" className="btn-ghost">
          Retour au tableau de bord
        </Link>
      </header>
      <PreparationPaieMenuBar />
      <div className="param-shell-content">
        <Outlet />
      </div>
    </div>
  )
}
