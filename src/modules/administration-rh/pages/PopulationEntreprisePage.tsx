import { MapPin, Printer, RefreshCw, Users } from 'lucide-react'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DataTable } from '../../recrutement/components/DataTable'
import {
  matchRefId,
  normalizeSexePersonnel,
  refLibelle,
} from '../../recrutement/personnelConstants'
import { useRecrutement } from '../../recrutement/RecrutementContext'
import { loadRecrutementStore } from '../../recrutement/storage'
import type { Personnel } from '../../recrutement/types'
import type { RefItem } from '../../parametres/types'
import { loadParametresStore } from '../../parametres/storage'

type SiteStatRow = {
  id: string
  siteTravail: string
  sexeFeminin: number
  sexeMasculin: number
  nombre: number
  pourcentage: number
}

type SiteCounts = {
  sexeFeminin: number
  sexeMasculin: number
  nombre: number
}

function emptyCounts(): SiteCounts {
  return { sexeFeminin: 0, sexeMasculin: 0, nombre: 0 }
}

/** Rattache chaque agent au site de travail (id / code / libellé). */
function resolveSiteKey(sites: RefItem[], siteTravailId: string): string {
  const raw = (siteTravailId || '').trim()
  if (!raw) return '__sans_site__'

  const matched = matchRefId(sites, raw)
  if (matched) return matched
  if (sites.some((s) => s.id === raw)) return raw

  const codePart = raw.split(/\s*[—–\-]\s*/)[0]?.trim()
  if (codePart && codePart !== raw) {
    const byCode = matchRefId(sites, codePart)
    if (byCode) return byCode
  }

  return raw
}

function siteLabel(sites: RefItem[], key: string): string {
  if (key === '__sans_site__') return 'Non renseigné'
  return (
    refLibelle(sites, key) ||
    sites.find((s) => s.id === key)?.libelle ||
    key
  )
}

/**
 * Comptage réel depuis le fichier Personnel :
 * Sexe Féminin, Sexe Masculin, Nombre du Personnel, Pourcentage par site.
 */
export function compterPopulationParSite(
  personnel: Personnel[],
  sites: RefItem[],
): { rows: SiteStatRow[]; totals: SiteCounts } {
  const counts = new Map<string, SiteCounts>()

  for (const p of personnel) {
    const key = resolveSiteKey(sites, p.siteTravailId)
    const feminin = normalizeSexePersonnel(p.sexe) === 'Féminin'
    const prev = counts.get(key) ?? emptyCounts()
    counts.set(key, {
      sexeFeminin: prev.sexeFeminin + (feminin ? 1 : 0),
      sexeMasculin: prev.sexeMasculin + (feminin ? 0 : 1),
      nombre: prev.nombre + 1,
    })
  }

  const totalPersonnel = personnel.length

  const toRow = (id: string, c: SiteCounts): SiteStatRow => ({
    id,
    siteTravail: siteLabel(sites, id),
    sexeFeminin: c.sexeFeminin,
    sexeMasculin: c.sexeMasculin,
    nombre: c.nombre,
    pourcentage: totalPersonnel > 0 ? (c.nombre / totalPersonnel) * 100 : 0,
  })

  const result: SiteStatRow[] = sites.map((site) =>
    toRow(site.id, counts.get(site.id) ?? emptyCounts()),
  )

  const sansSite = counts.get('__sans_site__')
  if (sansSite && sansSite.nombre > 0) {
    result.push(toRow('__sans_site__', sansSite))
  }

  for (const [siteId, c] of counts) {
    if (siteId === '__sans_site__') continue
    if (sites.some((s) => s.id === siteId)) continue
    result.push(toRow(siteId, c))
  }

  result.sort((a, b) => {
    // « Non renseigné » en bas du tableau, juste avant le TOTAL
    if (a.id === '__sans_site__') return 1
    if (b.id === '__sans_site__') return -1
    return a.siteTravail.localeCompare(b.siteTravail, 'fr', {
      sensitivity: 'base',
    })
  })

  const totals = emptyCounts()
  for (const row of result) {
    totals.sexeFeminin += row.sexeFeminin
    totals.sexeMasculin += row.sexeMasculin
    totals.nombre += row.nombre
  }

  return { rows: result, totals }
}

function formatPourcentage(value: number) {
  return `${value.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} %`
}

export function PopulationEntreprisePage() {
  const { reload } = useRecrutement()
  const [refs, setRefs] = useState(() => loadParametresStore())
  const [rows, setRows] = useState<SiteStatRow[]>([])
  const [totals, setTotals] = useState<SiteCounts>(() => emptyCounts())
  const [majBusy, setMajBusy] = useState(false)
  const [majMessage, setMajMessage] = useState('')
  const [statChargee, setStatChargee] = useState(false)

  /**
   * MAJ Statistique :
   * 1) lit le fichier Personnel (+ sites)
   * 2) calcule F / M / effectif / % par site
   * 3) alimente le tableau statistique
   */
  const actualiserStatistique = useCallback(() => {
    setMajBusy(true)
    try {
      const nextRefs = loadParametresStore()
      const nextPersonnel = loadRecrutementStore().personnel
      const { rows: nextRows, totals: nextTotals } = compterPopulationParSite(
        nextPersonnel,
        nextRefs.sitesAffectation,
      )

      setRefs(nextRefs)
      setRows(nextRows)
      setTotals(nextTotals)
      setStatChargee(true)
      reload()

      setMajMessage(
        `Statistique actualisée depuis le fichier Personnel — ` +
          `${nextTotals.nombre} agent(s) : ` +
          `${nextTotals.sexeFeminin} féminin(s), ` +
          `${nextTotals.sexeMasculin} masculin(s).`,
      )
    } finally {
      setMajBusy(false)
    }
  }, [reload])

  useEffect(() => {
    if (!majMessage) return
    const t = window.setTimeout(() => setMajMessage(''), 6000)
    return () => window.clearTimeout(t)
  }, [majMessage])

  const entreprise = useMemo(
    () =>
      refs.entreprises.find((e) => e.statut === 'active') ??
      refs.entreprises[0],
    [refs.entreprises],
  )

  const printLogo =
    entreprise?.nouveauLogo?.dataUrl || entreprise?.logo?.dataUrl || ''

  const totalPersonnel = totals.nombre

  const maxNombre = useMemo(
    () => Math.max(1, ...rows.map((r) => r.nombre), 1),
    [rows],
  )

  const chartTicks = useMemo(() => {
    const top = maxNombre
    const step = top <= 4 ? 1 : Math.ceil(top / 4)
    const ticks: number[] = []
    for (let v = 0; v <= top; v += step) ticks.push(v)
    if (ticks[ticks.length - 1] !== top) ticks.push(top)
    return ticks
  }, [maxNombre])

  function printStatistique() {
    window.print()
  }

  const tableRows = statChargee ? rows : []

  return (
    <div className="admin-rh-population-entreprise">
      <header className="page-header admin-rh-pop-header">
        <div>
          <p className="eyebrow">Statistiques</p>
          <h2>De la population de l&apos;entreprise</h2>
          <p className="page-lead">
            Cliquez sur <strong>MAJ Statistique</strong> pour lire le fichier
            Personnel et afficher les effectifs réels (Sexe Féminin, Sexe
            Masculin, Nombre du Personnel, Pourcentage) par site de travail.
          </p>
        </div>
        <div className="admin-rh-pop-header-actions no-print">
          <button
            type="button"
            className="btn-primary admin-rh-pop-maj-btn"
            onClick={actualiserStatistique}
            disabled={majBusy}
            title="Lire le fichier Personnel et recalculer la statistique"
          >
            <RefreshCw
              size={16}
              aria-hidden
              className={majBusy ? 'is-spinning' : undefined}
            />
            MAJ Statistique
          </button>
          <button
            type="button"
            className="btn-print admin-rh-pop-print-btn"
            onClick={printStatistique}
            disabled={!statChargee || totals.nombre === 0}
          >
            <Printer size={16} aria-hidden />
            Imprimer ce statistique
          </button>
        </div>
      </header>

      {majMessage ? (
        <p className="admin-rh-pop-maj-feedback no-print" role="status">
          {majMessage}
        </p>
      ) : null}

      <header className="admin-rh-pop-print-header print-only">
        <div className="admin-rh-pop-print-logo-wrap">
          {printLogo ? (
            <img
              className="admin-rh-pop-print-logo"
              src={printLogo}
              alt={entreprise?.sigle || 'Logo entreprise'}
            />
          ) : (
            <div className="admin-rh-pop-print-logo-fallback" aria-hidden>
              {entreprise?.sigle || 'ARMP'}
            </div>
          )}
        </div>
        <h1 className="admin-rh-pop-print-doc-title">
          Statistique du Personnel par Site de Travail
        </h1>
      </header>

      <section
        className="admin-rh-stats admin-rh-pop-stats no-print"
        aria-label="Effectif total"
      >
        <div className="admin-rh-stat is-active">
          <span className="admin-rh-stat-icon" aria-hidden>
            <Users size={20} />
          </span>
          <span className="admin-rh-stat-body">
            <span className="admin-rh-stat-label">Total personnel</span>
            <strong className="admin-rh-stat-value">
              {statChargee ? totalPersonnel : '—'}
            </strong>
          </span>
        </div>
        <div className="admin-rh-stat">
          <span className="admin-rh-stat-icon" aria-hidden>
            <MapPin size={20} />
          </span>
          <span className="admin-rh-stat-body">
            <span className="admin-rh-stat-label">Sites de travail</span>
            <strong className="admin-rh-stat-value">
              {refs.sitesAffectation.length}
            </strong>
          </span>
        </div>
      </section>

      <div className="admin-rh-pop-table-area">
        <DataTable
          rows={tableRows}
          emptyMessage={
            statChargee
              ? 'Aucun personnel trouvé dans le fichier Personnel.'
              : 'Cliquez sur « MAJ Statistique » pour lire le fichier Personnel et afficher les effectifs.'
          }
          footerLabel="TOTAL"
          footerCells={
            statChargee
              ? {
                  sexeFeminin: totals.sexeFeminin,
                  sexeMasculin: totals.sexeMasculin,
                  nombre: totals.nombre,
                  pourcentage: formatPourcentage(
                    totalPersonnel > 0 ? 100 : 0,
                  ),
                }
              : undefined
          }
          columns={[
            {
              key: 'siteTravail',
              header: 'Site de Travail',
              className: 'col-libelle',
              render: (r) => r.siteTravail || '—',
            },
            {
              key: 'sexeFeminin',
              header: 'Sexe Féminin',
              className: 'col-money',
              render: (r) => r.sexeFeminin,
            },
            {
              key: 'sexeMasculin',
              header: 'Sexe Masculin',
              className: 'col-money',
              render: (r) => r.sexeMasculin,
            },
            {
              key: 'nombre',
              header: 'Nombre du Personnel',
              className: 'col-money',
              render: (r) => r.nombre,
            },
            {
              key: 'pourcentage',
              header: 'Pourcentage',
              className: 'col-money',
              render: (r) => formatPourcentage(r.pourcentage),
            },
          ]}
        />
      </div>

      {statChargee && rows.length > 0 ? (
        <section
          className="admin-rh-pop-chart"
          aria-label="Histogramme de la population par site de travail"
        >
          <div className="admin-rh-pop-chart-head">
            <h3 className="admin-rh-pop-chart-title">
              Histogramme — effectif par site
            </h3>
            <p className="admin-rh-pop-chart-subtitle">
              Répartition visuelle du personnel selon le site de travail
            </p>
          </div>

          <div className="admin-rh-pop-chart-body">
            <div className="admin-rh-pop-chart-y" aria-hidden>
              {[...chartTicks].reverse().map((tick) => (
                <span key={tick} className="admin-rh-pop-chart-tick">
                  {tick}
                </span>
              ))}
            </div>

            <div className="admin-rh-pop-chart-plot">
              <div className="admin-rh-pop-chart-grid" aria-hidden>
                {chartTicks.map((tick) => (
                  <div
                    key={tick}
                    className="admin-rh-pop-chart-grid-line"
                    style={{ bottom: `${(tick / maxNombre) * 100}%` }}
                  />
                ))}
              </div>

              <ul className="admin-rh-pop-chart-bars">
                {rows.map((row, index) => {
                  const heightPct =
                    maxNombre > 0 ? (row.nombre / maxNombre) * 100 : 0
                  return (
                    <li
                      key={row.id}
                      className="admin-rh-pop-chart-col"
                      style={{ animationDelay: `${index * 45}ms` }}
                      title={`${row.siteTravail} — ${row.nombre} (${formatPourcentage(row.pourcentage)}) · F ${row.sexeFeminin} / M ${row.sexeMasculin}`}
                    >
                      <div className="admin-rh-pop-chart-bar-track">
                        <span
                          className="admin-rh-pop-chart-value"
                          style={{ bottom: `calc(${heightPct}% + 0.35rem)` }}
                        >
                          {row.nombre}
                        </span>
                        <div
                          className="admin-rh-pop-chart-bar"
                          style={{
                            height: `${heightPct}%`,
                            ['--bar-delay' as string]: `${index * 45}ms`,
                          }}
                        />
                      </div>
                      <span className="admin-rh-pop-chart-label">
                        {row.siteTravail}
                      </span>
                    </li>
                  )
                })}
              </ul>
            </div>
          </div>
        </section>
      ) : null}
    </div>
  )
}
