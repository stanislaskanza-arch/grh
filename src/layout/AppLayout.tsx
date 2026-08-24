import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ChevronDown, LogOut, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuth } from '../auth/AuthContext'
import { NAV_ITEMS } from './nav'

function activeGroupForPath(pathname: string): string | null {
  const match = NAV_ITEMS.find(
    (item) =>
      Boolean(item.children?.length) &&
      item.to !== '/' &&
      pathname.startsWith(item.to),
  )
  return match?.to ?? null
}

export function AppLayout() {
  const { user, logout } = useAuth()
  const location = useLocation()
  const [open, setOpen] = useState(false)
  const [openGroup, setOpenGroup] = useState<string | null>(() =>
    activeGroupForPath(location.pathname),
  )

  useEffect(() => {
    setOpenGroup(activeGroupForPath(location.pathname))
  }, [location.pathname])

  function toggleGroup(to: string) {
    setOpenGroup((prev) => (prev === to ? null : to))
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${open ? 'is-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-mark" aria-hidden>
            GRH
          </div>
          <div>
            <p className="brand-name">GRH</p>
            <p className="brand-tagline">Ressources Humaines</p>
          </div>
          <button
            type="button"
            className="sidebar-close"
            onClick={() => setOpen(false)}
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        <nav className="sidebar-nav" aria-label="Navigation principale">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const hasChildren = Boolean(item.children?.length)
            const isBranchActive =
              location.pathname.startsWith(item.to) && item.to !== '/'
            const showChildren = hasChildren && openGroup === item.to

            if (hasChildren) {
              return (
                <div key={item.to} className="nav-group">
                  <button
                    type="button"
                    className={`nav-item nav-group-toggle ${isBranchActive ? 'is-active' : ''}`}
                    onClick={() => toggleGroup(item.to)}
                    aria-expanded={showChildren}
                  >
                    <span
                      className="nav-icon"
                      style={{
                        color: item.iconColor,
                        background: `${item.iconColor}22`,
                      }}
                    >
                      <Icon size={18} strokeWidth={2.2} />
                    </span>
                    <span>
                      <strong>{item.label}</strong>
                      <small>{item.description}</small>
                    </span>
                    <ChevronDown
                      size={16}
                      className={`nav-chevron ${showChildren ? 'is-open' : ''}`}
                    />
                  </button>
                  {showChildren && (
                    <div className="nav-sub">
                      {item.children!.map((child) => {
                        const ChildIcon = child.icon
                        return (
                          <NavLink
                            key={child.to}
                            to={child.to}
                            className={({ isActive }) =>
                              `nav-sub-item ${isActive ? 'is-active' : ''}`
                            }
                            onClick={() => setOpen(false)}
                          >
                            {ChildIcon && (
                              <span
                                className="nav-icon nav-icon-sm"
                                style={{
                                  color: child.iconColor,
                                  background: `${child.iconColor}22`,
                                }}
                              >
                                <ChildIcon size={14} strokeWidth={2.2} />
                              </span>
                            )}
                            <span>{child.label}</span>
                          </NavLink>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            }

            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'is-active' : ''}`
                }
                onClick={() => {
                  setOpenGroup(null)
                  setOpen(false)
                }}
              >
                <span
                  className="nav-icon"
                  style={{
                    color: item.iconColor,
                    background: `${item.iconColor}22`,
                  }}
                >
                  <Icon size={18} strokeWidth={2.2} />
                </span>
                <span>
                  <strong>{item.label}</strong>
                  <small>{item.description}</small>
                </span>
              </NavLink>
            )
          })}
        </nav>

        <div className="sidebar-footer">
          <div className="user-chip">
            <div className="user-avatar" aria-hidden>
              {user?.name.slice(0, 1)}
            </div>
            <div>
              <strong>{user?.name}</strong>
              <small>{user?.role}</small>
            </div>
          </div>
          <button type="button" className="logout-btn" onClick={logout}>
            <LogOut size={16} />
            Déconnexion
          </button>
        </div>
      </aside>

      {open && (
        <button
          type="button"
          className="sidebar-backdrop"
          aria-label="Fermer le menu"
          onClick={() => setOpen(false)}
        />
      )}

      <div className="main-area">
        <header className="topbar">
          <button
            type="button"
            className="menu-btn"
            onClick={() => setOpen(true)}
            aria-label="Ouvrir le menu"
          >
            <Menu size={20} />
          </button>
          <p className="topbar-title">Espace RH</p>
          <span className="topbar-email">{user?.email}</span>
        </header>
        <main className="page-content">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
