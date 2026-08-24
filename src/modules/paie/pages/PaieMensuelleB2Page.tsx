import {
  Calculator,
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
import {
  fonctionLibelleOnly,
  gradeCodeOnly,
} from '../calculerPaieMensuelleB1'
import { calculerPaieMensuelleB2 } from '../calculerPaieMensuelleB2'
import { FichePaieB2Modal } from '../components/FichePaieB2Modal'
import { PAIE_MENSUELLE_B2_FIELDS } from '../paieMensuelleB2Constants'
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
import { parseMontantTaux } from '../tauxMonnaieEnCours'
import type { PaieMensuelleB2Item } from '../types'

const DATE_KEYS = new Set(['datePaie', 'dateEngagement'])

const MONEY_KEYS = new Set([
  'base',
  'logement',
  'transport',
  'totalBrut',
  'retenueCnss',
  'retenueIpr',
  'retenueInpp',
  'totalRetenue',
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

/** Affichage monétaire tableau : 1 234 567,89 */
function formatMontantTableau(value: string) {
  const trimmed = value?.trim()
  if (!trimmed) return '—'
  const n = parseMontantTaux(trimmed)
  if (!Number.isFinite(n)) return trimmed

  const negative = n < 0
  const [intPart, decPart] = Math.abs(n).toFixed(2).split('.')
  // Espace insécable comme séparateur de milliers (lisibilité FR)
  const grouped = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, '\u00a0')
  return `${negative ? '-' : ''}${grouped},${decPart}`
}

function cellValue(
  row: PaieMensuelleB2Item,
  key: (typeof PAIE_MENSUELLE_B2_FIELDS)[number]['key'],
  fonctions: { code: string; libelle: string }[] = [],
) {
  const raw = row[key]

  if (MONEY_KEYS.has(key)) {
    return formatMontantTableau(String(raw ?? ''))
  }

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
  return raw
}

export function PaieMensuelleB2Page() {
  const [rows, setRows] = useState<PaieMensuelleB2Item[]>(
    () => loadPaieStore().paieMensuelleB2,
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
  const [pourcentageSb, setPourcentageSb] = useState('')
  const [ficheLigne, setFicheLigne] = useState<PaieMensuelleB2Item | null>(null)
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
      setRows(loadPaieStore().paieMensuelleB2)
    }
    function refreshParams() {
      setFonctions(loadParametresStore().fonctions)
    }
    window.addEventListener(PAIE_STORE_CHANGED, refreshPaie)
    window.addEventListener(PARAMETRES_STORE_CHANGED, refreshParams)
    window.addEventListener('storage', refreshPaie)
    window.addEventListener('storage', refreshParams)
    return () => {
      window.removeEventListener(PAIE_STORE_CHANGED, refreshPaie)
      window.removeEventListener(PARAMETRES_STORE_CHANGED, refreshParams)
      window.removeEventListener('storage', refreshPaie)
      window.removeEventListener('storage', refreshParams)
    }
  }, [])

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
      PAIE_MENSUELLE_B2_FIELDS.map((field) => ({
        key: field.key,
        header: field.header,
        className:
          field.key === 'totalBrut'
            ? 'col-total-brut col-money'
            : MONEY_KEYS.has(field.key)
              ? 'col-money'
              : undefined,
        sortable:
          field.key === 'mois' ||
          field.key === 'matricule' ||
          field.key === 'nom' ||
          field.key === 'grade',
        render: (r: PaieMensuelleB2Item) =>
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

    const pct = Number(String(pourcentageSb).replace(',', '.'))
    if (!Number.isFinite(pct) || pct <= 0) {
      window.alert(
        'Veuillez saisir un Pourcentage SB valide (nombre strictement positif, ex. 100).',
      )
      return
    }

    const moisLabel =
      MOIS_OPTIONS.find((m) => m.value === mois)?.label ?? mois
    const cle = moisClePaie(annee, mois)

    const confirmed = window.confirm(
      `Calculer la paie Barème 2 pour ${moisLabel} ${annee} (${cle}) ?\n` +
        `Total Brut = (BASE + LOGEMENT + TRANSPORT) × ${pct} (Pourcentage SB).\n` +
        `Seuls les agents validés et actifs seront traités.\n` +
        `Seules les lignes PaieMensuelleB2 de ce mois seront remplacées ; les autres mois sont conservés (jusqu’à 12 paies).`,
    )
    if (!confirmed) return

    const result = calculerPaieMensuelleB2({
      moisCode: mois,
      moisLabel: `${moisLabel} ${annee}`,
      datePaie: syncDatePaie(datePaie, annee, mois),
      pourcentageSb: pct,
    })

    setRows(loadPaieStore().paieMensuelleB2)
    window.alert(result.message)

    // À chaque calcul : réinitialisation des champs de paramètres
    const nextMois = currentMonthValue()
    const nextAnnee = currentYearValue()
    setAnnee(nextAnnee)
    setMois(nextMois)
    setDatePaie(todayIsoDate())
    setPourcentageSb('')
  }

  function handleSupprimerPaie() {
    if (!annee || !mois) {
      window.alert('Veuillez sélectionner l’année et le mois.')
      return
    }

    const moisLabel =
      MOIS_OPTIONS.find((m) => m.value === mois)?.label ?? mois
    const cible = moisClePaie(annee, mois)

    const store = loadPaieStore()
    const aSupprimer = store.paieMensuelleB2.filter(
      (row) => normalizeMoisCle(row.mois, row.datePaie) === cible,
    )

    if (aSupprimer.length === 0) {
      window.alert(
        `Aucune ligne dans PaieMensuelleB2 pour ${moisLabel} ${annee} (${cible}).`,
      )
      return
    }

    const confirmed = window.confirm(
      `Supprimer uniquement les données PaieMensuelleB2 de ${moisLabel} ${annee} (${cible}) ?\n` +
        `${aSupprimer.length} ligne${aSupprimer.length > 1 ? 's' : ''} seront effacée${aSupprimer.length > 1 ? 's' : ''}.\n` +
        `Les autres mois et le fichier PaieMensuelleB1 ne seront pas modifiés.`,
    )
    if (!confirmed) return

    savePaieStore({
      ...store,
      paieMensuelleB1: store.paieMensuelleB1,
      paieMensuelleB2: store.paieMensuelleB2.filter(
        (r) => normalizeMoisCle(r.mois, r.datePaie) !== cible,
      ),
    })

    window.alert(
      `PaieMensuelleB2 — ${moisLabel} ${annee} (${cible}) : ${aSupprimer.length} ligne${aSupprimer.length > 1 ? 's' : ''} supprimée${aSupprimer.length > 1 ? 's' : ''}. Les autres mois sont conservés.`,
    )
  }

  return (
    <div className="paie-mensuelle-b2-page">
      <section
        className="admin-list-panel"
        aria-labelledby="paie-mensuelle-b2-title"
      >
        <div className="admin-list-head">
          <div className="admin-list-title">
            <span className="admin-list-icon" aria-hidden>
              <FileSpreadsheet size={18} />
            </span>
            <div>
              <h2 id="paie-mensuelle-b2-title">Liste — PaieMensuelleB2</h2>
              <p>
                {rowsAnnee.length} enregistrement
                {rowsAnnee.length > 1 ? 's' : ''}
                {' · '}
                {moisDistinctsAnnee}/12 mois en {annee}
                {' · '}Barème 2 en CDF
              </p>
            </div>
          </div>

          <div
            className="paie-mensuelle-b1-toolbar"
            role="group"
            aria-label="Paramètres de calcul Barème 2"
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

              <label className="paie-mensuelle-b1-field paie-mensuelle-b2-field-pct">
                <span>Pourcentage SB</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min={0}
                  max={100}
                  step="any"
                  value={pourcentageSb}
                  onChange={(e) => setPourcentageSb(e.target.value)}
                  aria-label="Pourcentage SB"
                  placeholder="0"
                />
              </label>
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
            >
              <span className="admin-cta-icon" aria-hidden>
                <Calculator size={16} />
              </span>
              Calculer la Paie
            </button>
          </div>
        </div>

        <div ref={tableAreaRef} className="paie-mensuelle-b2-table-area">
          <DataTable
            rows={sortedRows}
            emptyMessage="Aucune ligne de paie mensuelle Barème 2. Lancez « Calculer la Paie »."
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

      <FichePaieB2Modal
        ligne={ficheLigne}
        onClose={() => setFicheLigne(null)}
      />
    </div>
  )
}
