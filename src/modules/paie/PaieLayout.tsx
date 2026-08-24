import { Outlet, useLocation } from 'react-router-dom'
import { PaieBreadcrumb } from './components/PaieBreadcrumb'

export function PaieLayout() {
  const { pathname } = useLocation()
  const hideBreadcrumb =
    pathname.startsWith('/paie/preparation') ||
    pathname.startsWith('/paie/bulletins')

  return (
    <div className="module-page paie-module">
      {!hideBreadcrumb && <PaieBreadcrumb />}
      <Outlet />
    </div>
  )
}
