import { NavLink, useLocation } from 'react-router-dom'
import { ChevronDown } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export const FICHIERS_ITEMS = [
  { to: '/parametres/fichiers/entreprises', label: 'Entreprise' },
  { to: '/parametres/fichiers/utilisateurs', label: 'Utilisateurs' },
  { to: '/parametres/fichiers/categories-utilisateurs', label: 'Catégorie utilisateurs' },
  { to: '/parametres/fichiers/grades', label: 'Grade' },
  { to: '/parametres/fichiers/fonctions', label: 'Fonction AG' },
  { to: '/parametres/fichiers/bareme1', label: 'Barème1' },
  { to: '/parametres/fichiers/bareme2', label: 'Barème2' },
  { to: '/parametres/fichiers/primes', label: 'Prime' },
  { to: '/parametres/fichiers/conge', label: 'Congé' },
  { to: '/parametres/fichiers/niveaux-etudes', label: 'Niveau d’études' },
  { to: '/parametres/fichiers/sites-affectation', label: 'Site de travail' },
  { to: '/parametres/fichiers/directions', label: 'Direction' },
  { to: '/parametres/fichiers/statuts-personnel', label: 'Statut' },
  { to: '/parametres/fichiers/comptes-comptables', label: 'Compte comptable' },
  { to: '/parametres/fichiers/types-contrats', label: 'Type de contrat' },
  { to: '/parametres/fichiers/periodes', label: 'Période' },
  { to: '/parametres/fichiers/monnaies', label: 'Monnaie' },
  { to: '/parametres/fichiers/taux-monnaie', label: 'Taux Monnaie' },
] as const

export const IMPORTATION_ITEMS = [
  {
    to: '/parametres/importation/fichier-personnel',
    label: 'Fichier du Personnel',
  },
  {
    to: '/parametres/importation/fonction-ag',
    label: 'Fonction AG',
  },
  {
    to: '/parametres/importation/bareme1',
    label: 'Barème 1',
  },
  {
    to: '/parametres/importation/bareme2',
    label: 'Barème 2',
  },
  {
    to: '/parametres/importation/conge',
    label: 'Congé',
  },
  {
    to: '/parametres/importation/compte-comptable',
    label: 'Compte comptable',
  },
] as const

const TOP_MENUS = [
  { id: 'fichiers', label: 'Fichiers', hasDropdown: true },
  { id: 'edition', label: 'Edition', to: '/parametres/edition' },
  { id: 'importation', label: 'Importation fichier', hasDropdown: true },
  { id: 'suppression', label: 'Suppression Fichier', to: '/parametres/suppression' },
] as const

type OpenMenu = 'fichiers' | 'importation' | null

export function ParametresMenuBar() {
  const { pathname } = useLocation()
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const rootRef = useRef<HTMLDivElement>(null)

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

  const fichiersActive = pathname.startsWith('/parametres/fichiers')
  const importationActive = pathname.startsWith('/parametres/importation')

  function renderDropdown(
    id: 'fichiers' | 'importation',
    label: string,
    items: readonly { to: string; label: string }[],
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
          {label}
          <ChevronDown size={14} />
        </button>
        {isOpen && (
          <ul className="param-menubar-dropdown" role="menu">
            {items.map((item) => (
              <li key={item.to} role="none">
                <NavLink
                  to={item.to}
                  role="menuitem"
                  className={({ isActive: linkActive }) =>
                    `param-menubar-link ${linkActive ? 'is-active' : ''}`
                  }
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        )}
      </li>
    )
  }

  return (
    <nav className="param-menubar" aria-label="Menu Paramètres" ref={rootRef}>
      <ul className="param-menubar-list">
        {TOP_MENUS.map((menu) => {
          if (menu.id === 'fichiers') {
            return renderDropdown('fichiers', 'Fichiers', FICHIERS_ITEMS, fichiersActive)
          }

          if (menu.id === 'importation') {
            return renderDropdown(
              'importation',
              'Importation fichier',
              IMPORTATION_ITEMS,
              importationActive,
            )
          }

          return (
            <li key={menu.id} className="param-menubar-item">
              <NavLink
                to={menu.to}
                className={({ isActive }) =>
                  `param-menubar-btn ${isActive ? 'is-active' : ''}`
                }
              >
                {menu.label}
              </NavLink>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
