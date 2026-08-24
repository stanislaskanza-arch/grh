import { ChevronLeft, ChevronRight, FileSpreadsheet, Printer } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DataTable, type SortDir } from '../../recrutement/components/DataTable'
import {
  fonctionLibelleOnly,
  gradeCodeOnly,
} from '../../paie/calculerPaieMensuelleB1'
import { PAIE_MENSUELLE_B2_FIELDS } from '../../paie/paieMensuelleB2Constants'
import {
  formatMoisPaie,
  normalizeMoisCle,
} from '../../paie/paieMois'
import {
  loadPaieStore,
  PAIE_STORE_CHANGED,
} from '../../paie/storage'
import { parseMontantTaux } from '../../paie/tauxMonnaieEnCours'
import type { PaieMensuelleB2Item } from '../../paie/types'
import {
  loadParametresStore,
  PARAMETRES_STORE_CHANGED,
} from '../../parametres/storage'
import type { Entreprise } from '../../parametres/types'

/** Grades affichés dans le tableau statistique (libellé UI). */
const GRADES_STATS = [
  'Dir',
  'CD',
  'C4',
  'C3',
  'C2',
  'C1',
  'M4',
  'M3',
  'E6',
] as const

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

function formatDateFr(value: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('fr-FR')
}

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

function formatSommeCdf(value: number) {
  return `${value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} CDF`
}

function formatSommeNombre(value: number) {
  return value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

/** Normalise le code grade pour le matching (Dir ↔ DIR). */
function gradeCodeNorm(value: string): string {
  return gradeCodeOnly(value).trim().toUpperCase()
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

function loadEntrepriseActive(): Entreprise | null {
  const list = loadParametresStore().entreprises
  return (
    list.find((e) => e.statut === 'active') ?? list[0] ?? null
  )
}

export function FeuillePaieMensuellePage() {
  const [rows, setRows] = useState<PaieMensuelleB2Item[]>(
    () => loadPaieStore().paieMensuelleB2,
  )
  const [fonctions, setFonctions] = useState(
    () => loadParametresStore().fonctions,
  )
  const [entreprise, setEntreprise] = useState<Entreprise | null>(() =>
    loadEntrepriseActive(),
  )
  const [moisCle, setMoisCle] = useState('')
  const [sortKey, setSortKey] = useState<'matricule' | 'nom' | 'mois' | 'grade'>(
    'matricule',
  )
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [printOrientation, setPrintOrientation] = useState<
    'portrait' | 'landscape'
  >('landscape')
  const [printZoom, setPrintZoom] = useState(80)
  const tableAreaRef = useRef<HTMLDivElement>(null)
  const printStyleRef = useRef<HTMLStyleElement | null>(null)

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

  function clearPrintStyle() {
    printStyleRef.current?.remove()
    printStyleRef.current = null
    document.getElementById('feuille-paie-print-style')?.remove()
  }

  function printFeuille() {
    clearPrintStyle()
    const zoom = Math.min(200, Math.max(40, Number(printZoom) || 100))
    const style = document.createElement('style')
    style.id = 'feuille-paie-print-style'
    style.textContent = `
      @media print {
        @page {
          size: A4 ${printOrientation};
          margin: 0.6cm;
        }
        .print-feuille-paie-mensuelle {
          zoom: ${zoom}%;
        }
        .print-feuille-paie-mensuelle .admin-list-panel .data-table {
          min-width: 0 !important;
          font-size: ${zoom >= 90 ? '0.72rem' : '0.65rem'};
        }
      }
    `
    document.head.appendChild(style)
    printStyleRef.current = style

    const cleanup = () => {
      clearPrintStyle()
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
    window.print()
  }

  useEffect(() => {
    return () => clearPrintStyle()
  }, [])

  useEffect(() => {
    function refreshPaie() {
      setRows(loadPaieStore().paieMensuelleB2)
    }
    function refreshParams() {
      const store = loadParametresStore()
      setFonctions(store.fonctions)
      setEntreprise(
        store.entreprises.find((e) => e.statut === 'active') ??
          store.entreprises[0] ??
          null,
      )
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

  const moisOptions = useMemo(() => {
    const set = new Set<string>()
    for (const row of rows) {
      const cle = normalizeMoisCle(row.mois, row.datePaie)
      if (/^\d{4}-\d{2}$/.test(cle)) set.add(cle)
    }
    return [...set].sort((a, b) => b.localeCompare(a))
  }, [rows])

  useEffect(() => {
    if (moisOptions.length === 0) {
      setMoisCle('')
      return
    }
    setMoisCle((prev) =>
      prev && moisOptions.includes(prev) ? prev : moisOptions[0],
    )
  }, [moisOptions])

  const lignesMois = useMemo(() => {
    if (!moisCle) return []
    return rows.filter(
      (row) => normalizeMoisCle(row.mois, row.datePaie) === moisCle,
    )
  }, [moisCle, rows])

  const gradeStats = useMemo(() => {
    const counts: Record<string, number> = {}
    for (const code of GRADES_STATS) {
      counts[code] = 0
    }
    for (const row of lignesMois) {
      const code = gradeCodeNorm(row.grade)
      const match = GRADES_STATS.find((g) => g.toUpperCase() === code)
      if (match) counts[match] += 1
    }
    return counts
  }, [lignesMois])

  const totauxMontants = useMemo(() => {
    let base = 0
    let logement = 0
    let transport = 0
    let totalBrut = 0
    let retenueCnss = 0
    let retenueIpr = 0
    let totalRetenue = 0
    let netAPayer = 0
    for (const row of lignesMois) {
      base += parseMontantTaux(row.base) || 0
      logement += parseMontantTaux(row.logement) || 0
      transport += parseMontantTaux(row.transport) || 0
      totalBrut += parseMontantTaux(row.totalBrut) || 0
      retenueCnss += parseMontantTaux(row.retenueCnss) || 0
      retenueIpr += parseMontantTaux(row.retenueIpr) || 0
      totalRetenue += parseMontantTaux(row.totalRetenue) || 0
      netAPayer += parseMontantTaux(row.netAPayer) || 0
    }
    return {
      base,
      logement,
      transport,
      totalBrut,
      retenueCnss,
      retenueIpr,
      totalRetenue,
      netAPayer,
    }
  }, [lignesMois])

  const footerCells = useMemo(
    () => ({
      base: <strong>{formatSommeNombre(totauxMontants.base)}</strong>,
      logement: <strong>{formatSommeNombre(totauxMontants.logement)}</strong>,
      transport: <strong>{formatSommeNombre(totauxMontants.transport)}</strong>,
      totalBrut: <strong>{formatSommeNombre(totauxMontants.totalBrut)}</strong>,
      retenueCnss: (
        <strong>{formatSommeNombre(totauxMontants.retenueCnss)}</strong>
      ),
      retenueIpr: <strong>{formatSommeNombre(totauxMontants.retenueIpr)}</strong>,
      totalRetenue: (
        <strong>{formatSommeNombre(totauxMontants.totalRetenue)}</strong>
      ),
      netAPayer: <strong>{formatSommeNombre(totauxMontants.netAPayer)}</strong>,
    }),
    [totauxMontants],
  )

  const sortedRows = useMemo(() => {
    const list = [...lignesMois]
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
  }, [lignesMois, sortDir, sortKey])

  const columns = useMemo(
    () =>
      PAIE_MENSUELLE_B2_FIELDS.filter(
        (field) =>
          field.key !== 'retenueInpp' &&
          field.key !== 'immatriculationCnss' &&
          field.key !== 'mois' &&
          field.key !== 'datePaie',
      ).map(
        (field) => ({
          key: field.key,
          header: field.header,
          className: MONEY_KEYS.has(field.key) ? 'col-money' : undefined,
          sortable:
            field.key === 'mois' ||
            field.key === 'matricule' ||
            field.key === 'nom' ||
            field.key === 'grade',
          render: (r: PaieMensuelleB2Item) =>
            cellValue(r, field.key, fonctions),
        }),
      ),
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

  const moisLabel = moisCle ? formatMoisPaie(moisCle) : '—'
  const printLogo =
    entreprise?.nouveauLogo?.dataUrl || entreprise?.logo?.dataUrl || ''

  return (
    <div className="admin-rh-feuille-paie print-feuille-paie-mensuelle">
      <section
        className="admin-rh-feuille-stats-panel no-print"
        aria-labelledby="feuille-paie-stats-title"
      >
        <h2 id="feuille-paie-stats-title" className="admin-rh-feuille-stats-title">
          Effectifs par grade — {moisLabel}
        </h2>
        <div className="admin-rh-feuille-stats-wrap">
          <table className="data-table admin-rh-feuille-stats-table">
            <thead>
              <tr>
                {GRADES_STATS.map((code) => (
                  <th key={code} scope="col">
                    {code}
                  </th>
                ))}
                <th scope="col">Total</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                {GRADES_STATS.map((code) => (
                  <td key={code}>{gradeStats[code]}</td>
                ))}
                <td>
                  <strong>{lignesMois.length}</strong>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section
        className="admin-rh-feuille-montants-panel no-print"
        aria-label="Totaux de la feuille de paie"
      >
        <div className="admin-rh-feuille-montants">
          <div className="admin-rh-feuille-montant">
            <span className="admin-rh-feuille-montant-label">TOTAL BRUT</span>
            <strong className="admin-rh-feuille-montant-value">
              {formatSommeCdf(totauxMontants.totalBrut)}
            </strong>
          </div>
          <div className="admin-rh-feuille-montant">
            <span className="admin-rh-feuille-montant-label">RETENUE CNSS</span>
            <strong className="admin-rh-feuille-montant-value">
              {formatSommeCdf(totauxMontants.retenueCnss)}
            </strong>
          </div>
          <div className="admin-rh-feuille-montant">
            <span className="admin-rh-feuille-montant-label">RETENUE IPR</span>
            <strong className="admin-rh-feuille-montant-value">
              {formatSommeCdf(totauxMontants.retenueIpr)}
            </strong>
          </div>
        </div>
      </section>

      <section
        className="admin-list-panel print-feuille-paie-list"
        aria-labelledby="feuille-paie-list-title"
      >
        <header className="feuille-paie-print-header print-only">
          <div className="feuille-paie-print-brand">
            <div className="feuille-paie-print-logo-wrap">
              {printLogo ? (
                <img
                  className="feuille-paie-print-logo"
                  src={printLogo}
                  alt={entreprise?.sigle || 'Logo entreprise'}
                />
              ) : (
                <div className="feuille-paie-print-logo-fallback" aria-hidden>
                  {entreprise?.sigle || 'ARMP'}
                </div>
              )}
            </div>
            <p className="feuille-paie-print-direction">DIRECTION GENERALE</p>
          </div>
          <div className="feuille-paie-print-heading">
            <h1 className="feuille-paie-print-title">
              ETAT DE PAIE N°............ DU PERSONNEL DE L&apos;ARMP DE LA
              DIRECTION GENERALE ET DES DIRECTIONS PROVINCIALES PILOTES
            </h1>
            <p className="feuille-paie-print-meta">{moisLabel}</p>
          </div>
        </header>

        <div className="admin-list-head admin-rh-feuille-list-head no-print">
          <div className="admin-list-title">
            <span className="admin-list-icon" aria-hidden>
              <FileSpreadsheet size={18} />
            </span>
            <div>
              <h2 id="feuille-paie-list-title">Liste — Feuille de Paie</h2>
              <p>
                {lignesMois.length} enregistrement
                {lignesMois.length > 1 ? 's' : ''}
                {moisCle ? ` · ${moisLabel}` : ''}
                {' · '}PaieMensuelleB2
              </p>
            </div>
          </div>

          <div
            className="paie-mensuelle-b2-scroll-btns admin-rh-feuille-scroll-btns no-print"
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

          <div
            className="admin-rh-feuille-toolbar no-print"
            role="group"
            aria-label="Mois et impression"
          >
            <label className="paie-mensuelle-b1-field">
              <span>Mois</span>
              <select
                value={moisCle}
                onChange={(e) => setMoisCle(e.target.value)}
                aria-label="Mois"
                disabled={moisOptions.length === 0}
              >
                {moisOptions.length === 0 ? (
                  <option value="">Aucun mois disponible</option>
                ) : (
                  moisOptions.map((cle) => (
                    <option key={cle} value={cle}>
                      {formatMoisPaie(cle)}
                    </option>
                  ))
                )}
              </select>
            </label>

            <fieldset className="feuille-print-orientation">
              <legend>Mise en page</legend>
              <div className="feuille-print-orientation-options">
                <label className="feuille-print-orientation-option">
                  <input
                    type="radio"
                    name="feuille-print-orientation"
                    value="portrait"
                    checked={printOrientation === 'portrait'}
                    onChange={() => setPrintOrientation('portrait')}
                  />
                  Portrait
                </label>
                <label className="feuille-print-orientation-option">
                  <input
                    type="radio"
                    name="feuille-print-orientation"
                    value="landscape"
                    checked={printOrientation === 'landscape'}
                    onChange={() => setPrintOrientation('landscape')}
                  />
                  Paysage
                </label>
              </div>
            </fieldset>

            <label className="paie-mensuelle-b1-field feuille-print-zoom">
              <span>Zoom impression</span>
              <select
                value={printZoom}
                onChange={(e) => setPrintZoom(Number(e.target.value))}
                aria-label="Zoom d’impression"
              >
                {[50, 60, 70, 75, 80, 85, 90, 95, 100, 110, 120].map((z) => (
                  <option key={z} value={z}>
                    {z} %
                  </option>
                ))}
              </select>
            </label>

            <button
              type="button"
              className="btn-print"
              onClick={printFeuille}
              disabled={lignesMois.length === 0}
            >
              <Printer size={16} aria-hidden />
              Imprimer Feuille de Paie
            </button>
          </div>
        </div>

        <div ref={tableAreaRef} className="admin-rh-feuille-table-area">
          <DataTable
            rows={sortedRows}
            emptyMessage={
              moisOptions.length === 0
                ? 'Aucune paie mensuelle Barème 2 enregistrée. Calculez d’abord PaieMensuelleB2.'
                : `Aucune ligne pour ${moisLabel}.`
            }
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            columns={columns}
            footerLabel="TOTAL"
            footerLabelColSpan={7}
            footerCells={footerCells}
          />
        </div>
      </section>
    </div>
  )
}
