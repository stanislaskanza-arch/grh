import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  BadgeCheck,
  BarChart3,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  ChevronRight,
  FileSpreadsheet,
  FileText,
  FolderOpen,
  MapPinned,
  Network,
  Scale,
  UserRoundCog,
  Users,
  WalletCards,
  X,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const BAREME_ITEMS = [
  {
    to: '/administration-rh/verification-validation/bareme-applique/1er-bareme',
    label: '1er Barème',
    color: '#7DD3C0',
  },
  {
    to: '/administration-rh/verification-validation/bareme-applique/2eme-bareme',
    label: '2ème Barème',
    color: '#F0B27A',
  },
] as const

type OpenMenu = 'fichier' | 'verification' | 'statistiques' | null

export function AdministrationRhMenuBar() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const [openMenu, setOpenMenu] = useState<OpenMenu>(null)
  const [baremeOpen, setBaremeOpen] = useState(false)
  const rootRef = useRef<HTMLElement>(null)

  const fichierActive = pathname.startsWith('/administration-rh/fichier')
  const verificationActive = pathname.startsWith(
    '/administration-rh/verification-validation',
  )
  const baremeActive = pathname.startsWith(
    '/administration-rh/verification-validation/bareme-applique',
  )
  const situationAdminsActive = pathname.startsWith(
    '/administration-rh/verification-validation/situation-administrateurs',
  )
  const listeActive = pathname.startsWith(
    '/administration-rh/verification-validation/liste-personnel',
  )
  const feuilleActive = pathname.startsWith(
    '/administration-rh/verification-validation/feuille-paie-mensuelle',
  )
  const feuilleAdminActive = pathname.startsWith(
    '/administration-rh/verification-validation/feuille-paie-administrateur',
  )
  const organigrammeActive = pathname.startsWith(
    '/administration-rh/fichier/organigramme',
  )
  const descriptionPostesActive = pathname.startsWith(
    '/administration-rh/fichier/description-postes',
  )
  const documentsReglementairesActive = pathname.startsWith(
    '/administration-rh/fichier/documents-reglementaires',
  )
  const statistiquesActive = pathname.startsWith(
    '/administration-rh/statistiques',
  )
  const populationEntrepriseActive = pathname.startsWith(
    '/administration-rh/statistiques/population-entreprise',
  )
  const directionGenGradeActive = pathname.startsWith(
    '/administration-rh/statistiques/direction-gen-par-grade',
  )
  const dirProvincialesGradeActive = pathname.startsWith(
    '/administration-rh/statistiques/dir-provinciales-par-grade',
  )

  const fichierOpen = openMenu === 'fichier'
  const verificationOpen = openMenu === 'verification'
  const statistiquesOpen = openMenu === 'statistiques'

  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!rootRef.current?.contains(e.target as Node)) {
        setOpenMenu(null)
        setBaremeOpen(false)
      }
    }
    document.addEventListener('mousedown', onDocClick)
    return () => document.removeEventListener('mousedown', onDocClick)
  }, [])

  useEffect(() => {
    setOpenMenu(null)
    setBaremeOpen(false)
  }, [pathname])

  return (
    <nav
      className="param-menubar admin-rh-menubar no-print"
      aria-label="Menu Administration RH"
      ref={rootRef}
    >
      <ul className="param-menubar-list">
        <li className="param-menubar-item">
          <button
            type="button"
            className={`param-menubar-btn ${fichierActive || fichierOpen ? 'is-active' : ''}`}
            aria-expanded={fichierOpen}
            aria-haspopup="true"
            onClick={() => {
              setOpenMenu((v) => (v === 'fichier' ? null : 'fichier'))
              setBaremeOpen(false)
            }}
          >
            <FolderOpen
              size={16}
              className="admin-rh-menu-icon"
              style={{ color: '#F4C95F' }}
              aria-hidden
            />
            Fichier
            <ChevronDown size={14} />
          </button>
          {fichierOpen && (
            <ul className="param-menubar-dropdown" role="menu">
              <li role="none">
                <NavLink
                  to="/administration-rh/fichier/organigramme"
                  role="menuitem"
                  className={`param-menubar-link ${organigrammeActive ? 'is-active' : ''}`}
                >
                  <Network
                    size={16}
                    className="admin-rh-menu-icon"
                    style={{ color: '#6BB3E0' }}
                    aria-hidden
                  />
                  Organigramme
                </NavLink>
              </li>
              <li role="none">
                <NavLink
                  to="/administration-rh/fichier/description-postes"
                  role="menuitem"
                  className={`param-menubar-link ${descriptionPostesActive ? 'is-active' : ''}`}
                >
                  <BriefcaseBusiness
                    size={16}
                    className="admin-rh-menu-icon"
                    style={{ color: '#7DD3C0' }}
                    aria-hidden
                  />
                  Description des postes
                </NavLink>
              </li>
              <li role="none">
                <NavLink
                  to="/administration-rh/fichier/documents-reglementaires"
                  role="menuitem"
                  className={`param-menubar-link ${documentsReglementairesActive ? 'is-active' : ''}`}
                >
                  <FileText
                    size={16}
                    className="admin-rh-menu-icon"
                    style={{ color: '#F0B27A' }}
                    aria-hidden
                  />
                  Documents réglementaires
                </NavLink>
              </li>
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
                    className="admin-rh-menu-icon"
                    style={{ color: '#E8915B' }}
                    aria-hidden
                  />
                  Fermer
                </button>
              </li>
            </ul>
          )}
        </li>

        <li className="param-menubar-item">
          <button
            type="button"
            className={`param-menubar-btn ${verificationActive || verificationOpen ? 'is-active' : ''}`}
            aria-expanded={verificationOpen}
            aria-haspopup="true"
            onClick={() => {
              setOpenMenu((v) =>
                v === 'verification' ? null : 'verification',
              )
              setBaremeOpen(false)
            }}
          >
            <BadgeCheck
              size={16}
              className="admin-rh-menu-icon"
              style={{ color: '#7DD3C0' }}
              aria-hidden
            />
            Vérification et Validation
            <ChevronDown size={14} />
          </button>
          {verificationOpen && (
            <ul className="param-menubar-dropdown" role="menu">
              <li role="none">
                <NavLink
                  to="/administration-rh/verification-validation/situation-administrateurs"
                  role="menuitem"
                  className={`param-menubar-link ${situationAdminsActive ? 'is-active' : ''}`}
                >
                  <UserRoundCog
                    size={16}
                    className="admin-rh-menu-icon"
                    style={{ color: '#F0B27A' }}
                    aria-hidden
                  />
                  Situation des administrateurs
                </NavLink>
              </li>

              <li role="none">
                <NavLink
                  to="/administration-rh/verification-validation/liste-personnel"
                  role="menuitem"
                  className={`param-menubar-link ${listeActive ? 'is-active' : ''}`}
                >
                  <Users
                    size={16}
                    className="admin-rh-menu-icon"
                    style={{ color: '#5EC8A2' }}
                    aria-hidden
                  />
                  Liste du Personnel
                </NavLink>
              </li>

              <li
                className="param-menubar-subitem"
                role="none"
                onMouseEnter={() => setBaremeOpen(true)}
                onMouseLeave={() => setBaremeOpen(false)}
              >
                <button
                  type="button"
                  role="menuitem"
                  className={`param-menubar-link param-menubar-subtrigger ${baremeActive || baremeOpen ? 'is-active' : ''}`}
                  aria-expanded={baremeOpen}
                  aria-haspopup="true"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setBaremeOpen((v) => !v)
                  }}
                >
                  <span className="admin-rh-menu-label">
                    <Scale
                      size={16}
                      className="admin-rh-menu-icon"
                      style={{ color: '#6BB3E0' }}
                      aria-hidden
                    />
                    Barème appliqué
                  </span>
                  <ChevronRight size={14} />
                </button>
                {baremeOpen && (
                  <ul
                    className="param-menubar-submenu"
                    role="menu"
                    aria-label="Barème appliqué"
                  >
                    {BAREME_ITEMS.map((item) => (
                      <li key={item.to} role="none">
                        <NavLink
                          to={item.to}
                          role="menuitem"
                          className={({ isActive }) =>
                            `param-menubar-link ${isActive ? 'is-active' : ''}`
                          }
                        >
                          <Scale
                            size={15}
                            className="admin-rh-menu-icon"
                            style={{ color: item.color }}
                            aria-hidden
                          />
                          {item.label}
                        </NavLink>
                      </li>
                    ))}
                  </ul>
                )}
              </li>

              <li role="none">
                <NavLink
                  to="/administration-rh/verification-validation/feuille-paie-mensuelle"
                  role="menuitem"
                  className={`param-menubar-link ${feuilleActive ? 'is-active' : ''}`}
                >
                  <FileSpreadsheet
                    size={16}
                    className="admin-rh-menu-icon"
                    style={{ color: '#E8915B' }}
                    aria-hidden
                  />
                  Feuille de Paie du personnel
                </NavLink>
              </li>

              <li role="none">
                <NavLink
                  to="/administration-rh/verification-validation/feuille-paie-administrateur"
                  role="menuitem"
                  className={`param-menubar-link ${feuilleAdminActive ? 'is-active' : ''}`}
                >
                  <WalletCards
                    size={16}
                    className="admin-rh-menu-icon"
                    style={{ color: '#9B7EBD' }}
                    aria-hidden
                  />
                  Feuille de Paie des administrateurs
                </NavLink>
              </li>
            </ul>
          )}
        </li>

        <li className="param-menubar-item">
          <button
            type="button"
            className={`param-menubar-btn ${statistiquesActive || statistiquesOpen ? 'is-active' : ''}`}
            aria-expanded={statistiquesOpen}
            aria-haspopup="true"
            onClick={() => {
              setOpenMenu((v) =>
                v === 'statistiques' ? null : 'statistiques',
              )
              setBaremeOpen(false)
            }}
          >
            <BarChart3
              size={16}
              className="admin-rh-menu-icon"
              style={{ color: '#6BB3E0' }}
              aria-hidden
            />
            Statistiques
            <ChevronDown size={14} />
          </button>
          {statistiquesOpen && (
            <ul className="param-menubar-dropdown" role="menu">
              <li role="none">
                <NavLink
                  to="/administration-rh/statistiques/population-entreprise"
                  role="menuitem"
                  className={`param-menubar-link ${populationEntrepriseActive ? 'is-active' : ''}`}
                >
                  <Users
                    size={16}
                    className="admin-rh-menu-icon"
                    style={{ color: '#5EC8A2' }}
                    aria-hidden
                  />
                  De la population de l&apos;entreprise
                </NavLink>
              </li>
              <li role="none">
                <NavLink
                  to="/administration-rh/statistiques/direction-gen-par-grade"
                  role="menuitem"
                  className={`param-menubar-link ${directionGenGradeActive ? 'is-active' : ''}`}
                >
                  <Building2
                    size={16}
                    className="admin-rh-menu-icon"
                    style={{ color: '#6BB3E0' }}
                    aria-hidden
                  />
                  Du personnel de la Dir. Gen. par grade
                </NavLink>
              </li>
              <li role="none">
                <NavLink
                  to="/administration-rh/statistiques/dir-provinciales-par-grade"
                  role="menuitem"
                  className={`param-menubar-link ${dirProvincialesGradeActive ? 'is-active' : ''}`}
                >
                  <MapPinned
                    size={16}
                    className="admin-rh-menu-icon"
                    style={{ color: '#F0B27A' }}
                    aria-hidden
                  />
                  Du personnel des Dir. Provinciales par grade
                </NavLink>
              </li>
            </ul>
          )}
        </li>
      </ul>
    </nav>
  )
}
