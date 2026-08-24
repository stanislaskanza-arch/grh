import { Outlet } from 'react-router-dom'
import { PresencesBreadcrumb } from './components/PresencesBreadcrumb'

export function PresencesLayout() {
  return (
    <div className="module-page presences-module">
      <PresencesBreadcrumb />
      <Outlet />
    </div>
  )
}
