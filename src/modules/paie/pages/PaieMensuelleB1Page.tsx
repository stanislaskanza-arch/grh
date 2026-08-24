import {
  Calculator,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Trash2,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DataTable, type SortDir } from '../../recrutement/components/DataTable'
import {
  loadParametresStore,
  PARAMETRES_STORE_CHANGED,
} from '../../parametres/storage'
import type { TauxMonnaieItem } from '../../parametres/types'
import { calculerPaieMensuelleB1, fonctionLibelleOnly, gradeCodeOnly } from '../calculerPaieMensuelleB1'
import { FichePaieB1Modal } from '../components/FichePaieB1Modal'
import { PAIE_MENSUELLE_B1_FIELDS } from '../paieMensuelleB1Constants'
import {
  anneesDisponibles,
  compterMoisDistincts,
  currentMonthValue,
  currentYearValue,
  filtrerLignesParAnnee,
  formatMoisPaie,
  moisClePaie,
  normalizeMoisCle,
  syncDatePaie,
} from '../paieMois'
import {
  loadPaieStore,
  PAIE_STORE_CHANGED,
  savePaieStore,
} from '../storage'
import {
  findTauxMonnaieEnCours,
  isTauxMonnaieEnCours,
  MESSAGE_TAUX_EN_COURS_MANQUANT,
  parseMontantTaux,
} from '../tauxMonnaieEnCours'
import type { PaieMensuelleB1Item } from '../types'

const DATE_KEYS = new Set(['datePaie', 'dateEngagement'])

const MONEY_KEYS = new Set([
  'base',
  'logement',
  'transport',
  'totalBrut',
  'retenueCnss',
  'retenueIpr',
  'retenueInpp',
  'netAPayer',
])

const MOIS_OPTIONS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
] as const

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

function formatDateFr(value: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('fr-FR')
}

function formatMontantCdf(value: string) {
  const trimmed = value?.trim()
  if (!trimmed) return '—'
  const n = parseMontantTaux(trimmed)
  if (Number.isFinite(n) && n !== 0) {
    return `${n.toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} CDF`
  }
  if (n === 0 && /^[\d\s.,]+$/.test(trimmed.replace(/CDF/gi, '').trim())) {
    return `${(0).toLocaleString('fr-FR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} CDF`
  }
  return `${trimmed} CDF`
}

/** Affichage monétaire tableau : 1 234 567,89 */
function formatMontantTableau(value: string) {
  const trimmed = value?.trim()
  if (!trimmed) return '—'
  const n = parseMontantTaux(trimmed)
  if (!Number.isFinite(n)) return trimmed
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function formatTauxLabel(taux: TauxMonnaieItem) {
  const date = formatDateFr(taux.dateTaux)
  const cdf = formatMontantCdf(taux.montantCdf)
  const obs = taux.observation?.trim() || '—'
  return `${date} | ${cdf} | ${obs}`
}

function cellValue(
  row: PaieMensuelleB1Item,
  key: (typeof PAIE_MENSUELLE_B1_FIELDS)[number]['key'],
  fonctions: { code: string; libelle: string }[] = [],
) {
  const raw = row[key]
  if (!raw) return '—'
  if (DATE_KEYS.has(key)) return formatDateFr(raw)
  if (key === 'mois') return formatMoisPaie(raw)
  if (key === 'matricule') {
    return <code className="id-code">{raw}</code>
  }
  if (key === 'grade') {
    return gradeCodeOnly(raw) || '—'
  }
  if (key === 'fonction') {
    const fromCombo = fonctionLibelleOnly(raw)
    if (fromCombo && fromCombo !== raw.trim()) return fromCombo
    const match = fonctions.find(
      (f) =>
        f.code.trim().toLowerCase() === raw.trim().toLowerCase() ||
        f.libelle.trim().toLowerCase() === raw.trim().toLowerCase(),
    )
    return match?.libelle?.trim() || fromCombo || '—'
  }
  if (MONEY_KEYS.has(key)) {
    return formatMontantTableau(raw)
  }
  return raw
}

export function PaieMensuelleB1Page() {
  const [rows, setRows] = useState<PaieMensuelleB1Item[]>(
    () => loadPaieStore().paieMensuelleB1,
  )
  const [tauxMonnaies, setTauxMonnaies] = useState<TauxMonnaieItem[]>(
    () => loadParametresStore().tauxMonnaies,
  )
  const [fonctions, setFonctions] = useState(
    () => loadParametresStore().fonctions,
  )
  const [sortKey, setSortKey] = useState<'matricule' | 'nom' | 'mois' | 'grade'>(
    'matricule',
  )
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [annee, setAnnee] = useState(currentYearValue)
  const [mois, setMois] = useState(currentMonthValue)
  const [datePaie, setDatePaie] = useState(todayIsoDate)
  const [tauxComboOpen, setTauxComboOpen] = useState(false)
  const [ficheLigne, setFicheLigne] = useState<PaieMensuelleB1Item | null>(null)
  const tauxComboRef = useRef<HTMLDivElement>(null)
  const tableAreaRef = useRef<HTMLDivElement>(null)

  function scrollTableHorizontal(direction: 'prev' | 'next') {
    const wrap = tableAreaRef.current?.querySelector(
      '.table-wrap',
    ) as HTMLElement | null
    if (!wrap) return
    const step = Math.max(240, Math.floor(wrap.clientWidth * 0.65))
    wrap.scrollBy({
      left: direction === 'prev' ? -step : step,
      behavior: 'smooth',
    })
  }

  useEffect(() => {
    function refreshPaie() {
      setRows(loadPaieStore().paieMensuelleB1)
    }
    function refreshTaux() {
      const store = loadParametresStore()
      setTauxMonnaies(store.tauxMonnaies)
      setFonctions(store.fonctions)
    }
    window.addEventListener(PAIE_STORE_CHANGED, refreshPaie)
    window.addEventListener(PARAMETRES_STORE_CHANGED, refreshTaux)
    window.addEventListener('storage', refreshPaie)
    window.addEventListener('storage', refreshTaux)
    return () => {
      window.removeEventListener(PAIE_STORE_CHANGED, refreshPaie)
      window.removeEventListener(PARAMETRES_STORE_CHANGED, refreshTaux)
      window.removeEventListener('storage', refreshPaie)
      window.removeEventListener('storage', refreshTaux)
    }
  }, [])

  useEffect(() => {
    if (!tauxComboOpen) return
    function onPointerDown(event: MouseEvent) {
      if (
        tauxComboRef.current &&
        !tauxComboRef.current.contains(event.target as Node)
      ) {
        setTauxComboOpen(false)
      }
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setTauxComboOpen(false)
    }
    window.addEventListener('mousedown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('mousedown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
    }
  }, [tauxComboOpen])

  const tauxEnCours = useMemo(
    () => findTauxMonnaieEnCours(tauxMonnaies),
    [tauxMonnaies],
  )

  const tauxOptions = useMemo(() => {
    return [...tauxMonnaies].sort((a, b) =>
      (b.dateTaux || '').localeCompare(a.dateTaux || '', 'fr'),
    )
  }, [tauxMonnaies])

  const yearOptions = useMemo(() => {
    const set = new Set(anneesDisponibles(rows))
    const y = Number(currentYearValue())
    for (let i = y - 3; i <= y + 1; i++) set.add(String(i))
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [rows])

  const rowsAnnee = useMemo(
    () => filtrerLignesParAnnee(rows, annee),
    [rows, annee],
  )

  const moisDistinctsAnnee = useMemo(
    () => compterMoisDistincts(rows, annee),
    [rows, annee],
  )

  const sortedRows = useMemo(() => {
    const list = [...rowsAnnee]
    list.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'matricule') {
        cmp = (a.matricule || '').localeCompare(b.matricule || '', 'fr', {
          numeric: true,
          sensitivity: 'base',
        })
      } else if (sortKey === 'nom') {
        cmp = (a.nom || '').localeCompare(b.nom || '', 'fr', {
          sensitivity: 'base',
        })
        if (cmp === 0) {
          cmp = (a.postnom || '').localeCompare(b.postnom || '', 'fr', {
            sensitivity: 'base',
          })
        }
        if (cmp === 0) {
          cmp = (a.prenom || '').localeCompare(b.prenom || '', 'fr', {
            sensitivity: 'base',
          })
        }
      } else if (sortKey === 'grade') {
        cmp = gradeCodeOnly(a.grade).localeCompare(gradeCodeOnly(b.grade), 'fr', {
          numeric: true,
          sensitivity: 'base',
        })
      } else {
        cmp = normalizeMoisCle(a.mois, a.datePaie).localeCompare(
          normalizeMoisCle(b.mois, b.datePaie),
          'fr',
        )
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [rowsAnnee, sortDir, sortKey])

  const columns = useMemo(
    () =>
      PAIE_MENSUELLE_B1_FIELDS.map((field) => ({
        key: field.key,
        header: field.header,
        className: MONEY_KEYS.has(field.key) ? 'col-money' : undefined,
        sortable:
          field.key === 'mois' ||
          field.key === 'matricule' ||
          field.key === 'nom' ||
          field.key === 'grade',
        render: (r: PaieMensuelleB1Item) =>
          cellValue(r, field.key, fonctions),
      })),
    [fonctions],
  )

  function handleSort(key: string) {
    if (
      key !== 'matricule' &&
      key !== 'nom' &&
      key !== 'mois' &&
      key !== 'grade'
    ) {
      return
    }
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  function handleCalculerPaie() {
    if (!annee || !mois || !datePaie) {
      window.alert('Veuillez renseigner l’année, le mois et la date.')
      return
    }
    if (!tauxEnCours) {
      window.alert(MESSAGE_TAUX_EN_COURS_MANQUANT)
      return
    }

    const moisLabel =
      MOIS_OPTIONS.find((m) => m.value === mois)?.label ?? mois
    const cle = moisClePaie(annee, mois)

    const confirmed = window.confirm(
      `Calculer la paie Barème 1 pour ${moisLabel} ${annee} (${cle}) ?\n` +
        `Taux « En cours » : ${formatTauxLabel(tauxEnCours)}\n` +
        `Seuls les agents validés et actifs seront traités.\n` +
        `Seules les lignes de ce mois seront remplacées ; les autres mois de l’année sont conservés (jusqu’à 12 paies).`,
    )
    if (!confirmed) return

    const result = calculerPaieMensuelleB1({
      moisCode: mois,
      moisLabel: `${moisLabel} ${annee}`,
      datePaie: syncDatePaie(datePaie, annee, mois),
      tauxMonnaieId: tauxEnCours.id,
    })

    window.alert(result.message)
  }

  function handleSupprimerPaie() {
    if (!annee || !mois) {
      window.alert('Veuillez sélectionner l’année et le mois.')
      return
    }

    const moisLabel =
      MOIS_OPTIONS.find((m) => m.value === mois)?.label ?? mois
    const cible = moisClePaie(annee, mois)
    const aSupprimer = rows.filter(
      (row) => normalizeMoisCle(row.mois, row.datePaie) === cible,
    )

    if (aSupprimer.length === 0) {
      window.alert(
        `Aucune ligne de paie trouvée pour ${moisLabel} ${annee} (${cible}).`,
      )
      return
    }

    const confirmed = window.confirm(
      `Supprimer la paie de ${moisLabel} ${annee} (${cible}) ?\n` +
        `${aSupprimer.length} ligne${aSupprimer.length > 1 ? 's' : ''} seront définitivement effacée${aSupprimer.length > 1 ? 's' : ''}.\n` +
        `Les autres mois restent inchangés.`,
    )
    if (!confirmed) return

    const store = loadPaieStore()
    const ids = new Set(aSupprimer.map((r) => r.id))
    savePaieStore({
      ...store,
      paieMensuelleB1: store.paieMensuelleB1.filter((r) => !ids.has(r.id)),
    })

    window.alert(
      `Paie de ${moisLabel} ${annee} supprimée (${aSupprimer.length} ligne${aSupprimer.length > 1 ? 's' : ''}). Les autres mois sont conservés.`,
    )
  }

  return (
    <div className="paie-mensuelle-b1-page">
      <section
        className="admin-list-panel"
        aria-labelledby="paie-mensuelle-b1-title"
      >
        <div className="admin-list-head">
          <div className="admin-list-title">
            <span className="admin-list-icon" aria-hidden>
              <FileSpreadsheet size={18} />
            </span>
            <div>
              <h2 id="paie-mensuelle-b1-title">Liste — PaieMensuelleB1</h2>
              <p>
                {rowsAnnee.length} enregistrement
                {rowsAnnee.length > 1 ? 's' : ''}
                {' · '}
                {moisDistinctsAnnee}/12 mois en {annee}
              </p>
            </div>
          </div>

          <div
            className="paie-mensuelle-b1-toolbar"
            role="group"
            aria-label="Paramètres de calcul"
          >
            <div className="paie-mensuelle-b1-toolbar-left">
              <label className="paie-mensuelle-b1-field">
                <span>Année</span>
                <select
                  value={annee}
                  onChange={(e) => {
                    const next = e.target.value
                    setAnnee(next)
                    setDatePaie((d) => syncDatePaie(d, next, mois))
                  }}
                  aria-label="Année"
                >
                  {yearOptions.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>

              <label className="paie-mensuelle-b1-field">
                <span>Mois</span>
                <select
                  value={mois}
                  onChange={(e) => {
                    const next = e.target.value
                    setMois(next)
                    setDatePaie((d) => syncDatePaie(d, annee, next))
                  }}
                  aria-label="Mois"
                >
                  {MOIS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label className="paie-mensuelle-b1-field">
                <span>Date</span>
                <input
                  type="date"
                  value={datePaie}
                  onChange={(e) => {
                    const next = e.target.value
                    setDatePaie(next)
                    if (next.length >= 7) {
                      setAnnee(next.slice(0, 4))
                      setMois(next.slice(5, 7))
                    }
                  }}
                  aria-label="Date de paie"
                />
              </label>

              <div
                className="paie-mensuelle-b1-field paie-mensuelle-b1-field-taux"
                ref={tauxComboRef}
              >
                <span>Choix de taux</span>
                <div
                  className={`paie-mensuelle-b1-taux-combo${tauxComboOpen ? ' is-open' : ''}`}
                >
                  <button
                    type="button"
                    className="paie-mensuelle-b1-taux-trigger"
                    aria-haspopup="listbox"
                    aria-expanded={tauxComboOpen}
                    aria-label="Choix de taux"
                    title={
                      tauxEnCours
                        ? 'Taux déclaré « En cours »'
                        : MESSAGE_TAUX_EN_COURS_MANQUANT
                    }
                    onClick={() => setTauxComboOpen((open) => !open)}
                  >
                    {tauxEnCours ? (
                      <span className="paie-mensuelle-b1-taux-cols" aria-hidden>
                        <span className="paie-mensuelle-b1-taux-col">
                          <em>Date</em>
                          <strong>{formatDateFr(tauxEnCours.dateTaux)}</strong>
                        </span>
                        <span className="paie-mensuelle-b1-taux-col">
                          <em>Montant CDF</em>
                          <strong>
                            {formatMontantCdf(tauxEnCours.montantCdf)}
                          </strong>
                        </span>
                        <span className="paie-mensuelle-b1-taux-col paie-mensuelle-b1-taux-obs">
                          <em>Observation</em>
                          <strong>
                            {tauxEnCours.observation?.trim() || '—'}
                          </strong>
                        </span>
                      </span>
                    ) : (
                      <span className="paie-mensuelle-b1-taux-empty">
                        Aucun taux « En cours »
                      </span>
                    )}
                    <ChevronDown size={16} aria-hidden />
                  </button>

                  {tauxComboOpen ? (
                    <div
                      className="paie-mensuelle-b1-taux-dropdown"
                      role="listbox"
                      aria-label="Liste des taux"
                    >
                      <div
                        className="paie-mensuelle-b1-taux-dropdown-head"
                        aria-hidden
                      >
                        <span>Date</span>
                        <span>Montant CDF</span>
                        <span>Observation</span>
                      </div>
                      {tauxOptions.length === 0 ? (
                        <p className="paie-mensuelle-b1-taux-dropdown-empty">
                          Aucun taux enregistré dans TauxMonnaie.
                        </p>
                      ) : (
                        <ul className="paie-mensuelle-b1-taux-dropdown-list">
                          {tauxOptions.map((taux) => {
                            const enCours = isTauxMonnaieEnCours(taux)
                            const selected = tauxEnCours?.id === taux.id
                            return (
                              <li key={taux.id}>
                                <button
                                  type="button"
                                  role="option"
                                  aria-selected={selected}
                                  className={`paie-mensuelle-b1-taux-option${selected ? ' is-selected' : ''}${enCours ? ' is-en-cours' : ''}`}
                                  onClick={() => {
                                    setTauxComboOpen(false)
                                    if (!enCours) {
                                      window.alert(
                                        'Seul le taux déclaré « En cours » est utilisé pour le calcul.\n\n' +
                                          'Pour utiliser une autre ligne, ouvrez Paramètres & Sécurité → Fichiers → TauxMonnaie ' +
                                          'et mettez « En cours » dans son OBSERVATION.',
                                      )
                                    }
                                  }}
                                >
                                  <span>{formatDateFr(taux.dateTaux)}</span>
                                  <span>
                                    {formatMontantCdf(taux.montantCdf)}
                                  </span>
                                  <span>
                                    {taux.observation?.trim() || '—'}
                                  </span>
                                </button>
                              </li>
                            )
                          })}
                        </ul>
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div
              className="paie-mensuelle-b2-scroll-btns"
              role="group"
              aria-label="Défilement horizontal du tableau"
            >
              <button
                type="button"
                className="paie-mensuelle-b2-scroll-btn"
                title="Précédent"
                aria-label="Précédent"
                onClick={() => scrollTableHorizontal('prev')}
              >
                <ChevronLeft size={15} aria-hidden />
                <span>Précédent</span>
              </button>
              <button
                type="button"
                className="paie-mensuelle-b2-scroll-btn"
                title="Suivant"
                aria-label="Suivant"
                onClick={() => scrollTableHorizontal('next')}
              >
                <span>Suivant</span>
                <ChevronRight size={15} aria-hidden />
              </button>
            </div>

            <button
              type="button"
              className="btn-primary admin-cta paie-mensuelle-b1-calc-btn"
              onClick={handleCalculerPaie}
              disabled={!tauxEnCours}
              title={
                tauxEnCours ? undefined : MESSAGE_TAUX_EN_COURS_MANQUANT
              }
            >
              <span className="admin-cta-icon" aria-hidden>
                <Calculator size={16} />
              </span>
              Calculer la Paie
            </button>
          </div>
        </div>

        {!tauxEnCours ? (
          <p className="paie-mensuelle-b1-taux-alerte" role="alert">
            {MESSAGE_TAUX_EN_COURS_MANQUANT}
          </p>
        ) : null}

        <div ref={tableAreaRef} className="paie-mensuelle-b1-table-area">
          <DataTable
            rows={sortedRows}
            emptyMessage="Aucune ligne de paie mensuelle Barème 1."
            onView={(row) => setFicheLigne(row)}
            viewTitle="Fiche de paie"
            viewAriaLabel="Afficher la fiche de paie de l’agent"
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            columns={columns}
          />
        </div>
        <div className="paie-mensuelle-b1-footer">
          <button
            type="button"
            className="btn-primary admin-cta admin-cta-danger paie-mensuelle-b1-delete-btn"
            onClick={handleSupprimerPaie}
          >
            <span className="admin-cta-icon" aria-hidden>
              <Trash2 size={16} />
            </span>
            Supprimer la Paie
          </button>
        </div>
      </section>

      <FichePaieB1Modal
        ligne={ficheLigne}
        onClose={() => setFicheLigne(null)}
      />
    </div>
  )
}
