import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  ChevronDown,
  FileSpreadsheet,
  FolderOpen,
  Gift,
  HandHeart,
  Receipt,
  Scale,
  Umbrella,
  X,
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

const FICHIER_ITEMS: MenuItem[] = [
  {
    to: '/paie/preparation/fichier/dette-personnel',
    label: 'Dette du personnel',
    icon: Receipt,
    color: '#E8915B',
  },
  {
    to: '/paie/preparation/fichier/assistance-sociale',
    label: 'Assistance sociale',
    icon: HandHeart,
    color: '#5EC8A2',
  },
]

const PAIE_PERSONNEL_ITEMS: MenuItem[] = [
  {
    to: '/paie/preparation/paie-personnel/bareme-1',
    label: 'Paie mensuelle Barème 1',
    icon: Scale,
    color: '#7DD3C0',
  },
  {
    to: '/paie/preparation/paie-personnel/bareme-2',
    label: 'Paie mensuelle Barème 2',
    icon: FileSpreadsheet,
    color: '#F0B27A',
  },
  {
    to: '/paie/preparation/paie-personnel/paie-mensuelle-avantage',
    label: 'Paie Mensuelle et avantage',
    icon: Gift,
    color: '#C9A0DC',
  },
]

type OpenMenu = 'fichier' | 'paie-personnel' | null

export function PreparationPaieMenuBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const [primesDialogOpen, setPrimesDialogOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const fichierActive = pathname.startsWith('/paie/preparation/fichier')
  const paiePersonnelActive = pathname.startsWith(
    '/paie/preparation/paie-personnel',
  )
  const primesAvantagesActive = pathname.startsWith(
    '/paie/preparation/primes-avantages',
  )

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) setOpenMenu(null)
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    setOpenMenu(null)
  }, [pathname])

  function renderDropdown(
    id: Exclude<OpenMenu, null>,
    label: string,
    TopIcon: LucideIcon,
    topColor: string,
    items: readonly MenuItem[],
    isActive: boolean,
  ) {
    const isOpen = openMenu === id
    return (
      <li key={id} className="param-menubar-item">
        <button
          type="button"
          className={`param-menubar-btn ${isActive || isOpen ? 'is-active' : ''}`}
          aria-expanded={isOpen}
          aria-haspopup="true"
          onClick={() => setOpenMenu((v) => (v === id ? null : id))}
        >
          <TopIcon
            size={16}
            className="prep-paie-menu-icon"
            style={{ color: topColor }}
            aria-hidden
          />
          {label}
          <ChevronDown size={14} />
        </button>
        {isOpen && (
          <ul className="param-menubar-dropdown" role="menu">
            {items.map((item) => {
              const ItemIcon = item.icon
              return (
                <li key={item.to} role="none">
                  <NavLink
                    to={item.to}
                    role="menuitem"
                    className={({ isActive: linkActive }) =>
                      `param-menubar-link ${linkActive ? 'is-active' : ''}`
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
            {id === 'fichier' && (
              <li role="none">
                <button
                  type="button"
                  role="menuitem"
                  className="param-menubar-link"
                  onClick={() => {
                    setOpenMenu(null)
                    navigate('/')
                  }}
                >
                  <X
                    size={16}
                    className="prep-paie-menu-icon"
                    style={{ color: '#E8915B' }}
                    aria-hidden
                  />
                  Fermer
                </button>
              </li>
            )}
          </ul>
        )}
      </li>
    )
  }

  return (
    <>
      <nav
        className="param-menubar preparation-paie-menubar"
        aria-label="Menu Préparation de la paie"
        ref={rootRef}
      >
        <ul className="param-menubar-list">
          {renderDropdown(
            'fichier',
            'Fichier',
            FolderOpen,
            '#F4C95F',
            FICHIER_ITEMS,
            fichierActive,
          )}
          {renderDropdown(
            'paie-personnel',
            'Paie du personnel',
            FileSpreadsheet,
            '#7DD3C0',
            PAIE_PERSONNEL_ITEMS,
            paiePersonnelActive,
          )}
          <li className="param-menubar-item">
            <button
              type="button"
              className={`param-menubar-btn ${primesAvantagesActive || primesDialogOpen ? 'is-active' : ''}`}
              aria-haspopup="dialog"
              aria-expanded={primesDialogOpen}
              onClick={() => {
                setOpenMenu(null)
                setPrimesDialogOpen(true)
              }}
            >
              <Gift
                size={16}
                className="prep-paie-menu-icon"
                style={{ color: '#F4C95F' }}
                aria-hidden
              />
              Primes et avantages
            </button>
          </li>
          <li className="param-menubar-item">
            <NavLink
              to="/paie/preparation/pecule-conge"
              className={({ isActive }) =>
                `param-menubar-btn ${isActive ? 'is-active' : ''}`
              }
            >
              <Umbrella
                size={16}
                className="prep-paie-menu-icon"
                style={{ color: '#6BB3E0' }}
                aria-hidden
              />
              Pécule de Congé
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
