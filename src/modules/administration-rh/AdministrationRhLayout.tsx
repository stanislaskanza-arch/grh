import { Link, Outlet } from 'react-router-dom'
import { RecrutementProvider } from '../recrutement/RecrutementContext'
import { AdministrationRhMenuBar } from './components/AdministrationRhMenuBar'

export function AdministrationRhLayout() {
  return (
    <RecrutementProvider>
      <div className="module-page admin-rh-module">
        <header className="param-shell-header no-print">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>Administration RH</h1>
          </div>
          <Link to="/" className="btn-ghost">
            Retour au tableau de bord
          </Link>
        </header>
        <AdministrationRhMenuBar />
        <div className="param-shell-content">
          <Outlet />
        </div>
      </div>
    </RecrutementProvider>
  )
}
