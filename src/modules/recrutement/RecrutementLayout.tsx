import { Outlet } from 'react-router-dom'
import { RecrutementProvider } from './RecrutementContext'
import { RecrutementBreadcrumb } from './components/RecrutementBreadcrumb'

export function RecrutementLayout() {
  return (
    <RecrutementProvider>
      <div className="module-page recrutement-module">
        <RecrutementBreadcrumb />
        <Outlet />
      </div>
    </RecrutementProvider>
  )
}
