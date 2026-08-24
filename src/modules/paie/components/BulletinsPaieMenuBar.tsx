import { NavLink, useLocation } from 'react-router-dom'
import {
  BarChart3,
  ChevronDown,
  FileSpreadsheet,
  FolderOpen,
  Gift,
  Scale,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { BulletinsPrimesDialog } from './BulletinsPrimesDialog'

type MenuItem = {
  to: string
  label: string
  icon: LucideIcon
  color: string
}

const MENSUELS_ITEMS: MenuItem[] = [
  {
    to: '/paie/bulletins/mensuels/ancien-bareme',
    label: 'Bulletin avec ancien barème',
    icon: Scale,
    color: '#7DD3C0',
  },
  {
    to: '/paie/bulletins/mensuels/nouveau-bareme',
    label: 'Bulletin avec nouveau barème',
    icon: FileSpreadsheet,
    color: '#F0B27A',
  },
  {
    to: '/paie/bulletins/mensuels/avec-primes',
    label: 'Bulletin avec primes',
    icon: Sparkles,
    color: '#C9A0DC',
  },
]

export function BulletinsPaieMenuBar() {
  const { pathname } = useLocation()
  const [mensuelsOpen, setMensuelsOpen] = useState(false)
  const [primesDialogOpen, setPrimesDialogOpen] = useState(false)
  const rootRef = useRef<HTMLElement>(null)
  const mensuelsActive = pathname.startsWith('/paie/bulletins/mensuels')
  const primesActive = pathname.startsWith('/paie/bulletins/primes-avantages')

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setMensuelsOpen(false)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    setMensuelsOpen(false)
  }, [pathname])

  return (
    <>
      <nav
        className="param-menubar preparation-paie-menubar bulletins-paie-menubar"
        aria-label="Menu Bulletins de Paie"
        ref={rootRef}
      >
        <ul className="param-menubar-list">
          <li className="param-menubar-item">
            <NavLink
              to="/paie/bulletins/fichier"
              className={({ isActive }) =>
                `param-menubar-btn ${isActive ? 'is-active' : ''}`
              }
            >
              <FolderOpen
                size={16}
                className="prep-paie-menu-icon"
                style={{ color: '#F4C95F' }}
                aria-hidden
              />
              Fichier
            </NavLink>
          </li>

          <li className="param-menubar-item">
            <button
              type="button"
              className={`param-menubar-btn ${mensuelsActive || mensuelsOpen ? 'is-active' : ''}`}
              aria-expanded={mensuelsOpen}
              aria-haspopup="true"
              onClick={() => setMensuelsOpen((v) => !v)}
            >
              <FileSpreadsheet
                size={16}
                className="prep-paie-menu-icon"
                style={{ color: '#7DD3C0' }}
                aria-hidden
              />
              Bulletins mensuels
              <ChevronDown size={14} />
            </button>
            {mensuelsOpen && (
              <ul className="param-menubar-dropdown" role="menu">
                {MENSUELS_ITEMS.map((item) => {
                  const ItemIcon = item.icon
                  return (
                    <li key={item.to} role="none">
                      <NavLink
                        to={item.to}
                        role="menuitem"
                        className={({ isActive }) =>
                          `param-menubar-link ${isActive ? 'is-active' : ''}`
                        }
                      >
                        <ItemIcon
                          size={16}
                          className="prep-paie-menu-icon"
                          style={{ color: item.color }}
                          aria-hidden
                        />
                        {item.label}
                      </NavLink>
                    </li>
                  )
                })}
              </ul>
            )}
          </li>

          <li className="param-menubar-item">
            <button
              type="button"
              className={`param-menubar-btn ${primesActive || primesDialogOpen ? 'is-active' : ''}`}
              aria-haspopup="dialog"
              aria-expanded={primesDialogOpen}
              onClick={() => setPrimesDialogOpen(true)}
            >
              <Gift
                size={16}
                className="prep-paie-menu-icon"
                style={{ color: '#C9A0DC' }}
                aria-hidden
              />
              Bulletins Primes et avantages
            </button>
          </li>

          <li className="param-menubar-item">
            <NavLink
              to="/paie/bulletins/statistiques"
              className={({ isActive }) =>
                `param-menubar-btn ${isActive ? 'is-active' : ''}`
              }
            >
              <BarChart3
                size={16}
                className="prep-paie-menu-icon"
                style={{ color: '#6BB3E0' }}
                aria-hidden
              />
              Statistiques
            </NavLink>
          </li>
        </ul>
      </nav>

      <BulletinsPrimesDialog
        open={primesDialogOpen}
        onClose={() => setPrimesDialogOpen(false)}
      />
    </>
  )
}
