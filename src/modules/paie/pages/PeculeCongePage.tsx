import { Calculator, Printer, Umbrella } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { DataTable, type SortDir } from '../../recrutement/components/DataTable'
import { CONGE_FIELDS } from '../../parametres/congeConstants'
import {
  loadParametresStore,
  PARAMETRES_STORE_CHANGED,
} from '../../parametres/storage'
import type { CongeItem } from '../../parametres/types'
import { calculerConge } from '../calculerConge'
import {
  currentMonthValue,
  currentYearValue,
  formatMoisPaie,
  moisClePaie,
  normalizeMoisCle,
  syncDatePaie,
} from '../paieMois'
import { parseMontantTaux } from '../tauxMonnaieEnCours'

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

const DATE_KEYS = new Set(['datePaie', 'dateEngagement'])

const MONEY_KEYS = new Set([
  'base',
  'logement',
  'totalBrut',
  'retenueCnss',
  'retenueIpr',
  'netAPayer',
])

function todayIsoDate() {
  return new Date().toISOString().slice(0, 10)
}

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

function cellValue(row: CongeItem, key: (typeof CONGE_FIELDS)[number]['key']) {
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
  return raw
}

export function PeculeCongePage() {
  const [rows, setRows] = useState<CongeItem[]>(
    () => loadParametresStore().conges,
  )
  const [mois, setMois] = useState(currentMonthValue)
  const [datePaie, setDatePaie] = useState(todayIsoDate)
  const [sortKey, setSortKey] = useState<'matricule' | 'nom' | 'mois'>('matricule')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const annee = datePaie.slice(0, 4) || currentYearValue()
  const moisCle = moisClePaie(annee, mois)

  useEffect(() => {
    function refresh() {
      setRows(loadParametresStore().conges)
    }
    window.addEventListener(PARAMETRES_STORE_CHANGED, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(PARAMETRES_STORE_CHANGED, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const lignesMois = useMemo(() => {
    return rows.filter((row) => {
      const cle = normalizeMoisCle(row.mois, row.datePaie)
      if (cle === moisCle) return true
      // Compat : mois stocké en « 08 » + année de la date / champ année
      const monthPart = /^\d{4}-(\d{2})$/.exec(cle)?.[1] ?? cle
      const yearPart =
        /^\d{4}/.exec(cle)?.[0] ||
        row.annee?.trim() ||
        row.datePaie?.slice(0, 4) ||
        ''
      return monthPart === mois && yearPart === annee
    })
  }, [annee, mois, moisCle, rows])

  const stats = useMemo(() => {
    let totalBrut = 0
    let retenueCnss = 0
    let retenueIpr = 0
    let netAPayer = 0
    const beneficiaires = new Set<string>()
    for (const row of lignesMois) {
      const mat = (row.matricule || '').trim()
      if (mat) beneficiaires.add(mat)
      else beneficiaires.add(row.id)
      totalBrut += parseMontantTaux(row.totalBrut) || 0
      retenueCnss += parseMontantTaux(row.retenueCnss) || 0
      retenueIpr += parseMontantTaux(row.retenueIpr) || 0
      netAPayer += parseMontantTaux(row.netAPayer) || 0
    }
    return {
      beneficiaires: beneficiaires.size,
      totalBrut,
      retenueCnss,
      retenueIpr,
      netAPayer,
    }
  }, [lignesMois])

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
      CONGE_FIELDS.map((field) => ({
        key: field.key,
        header:
          field.key === 'totalBrut' ? (
            <span className="conge-total-brut-header">
              <span>TOTAL BRUT</span>
              <span>AU PRORATA DE Nbre</span>
              <span>DE JR. DE CONGE</span>
            </span>
          ) : (
            field.header
          ),
        className:
          field.key === 'totalBrut'
            ? 'col-money col-total-brut-prorata'
            : MONEY_KEYS.has(field.key)
              ? 'col-money'
              : undefined,
        sortable:
          field.key === 'mois' ||
          field.key === 'matricule' ||
          field.key === 'nom',
        render: (r: CongeItem) => cellValue(r, field.key),
      })),
    [],
  )

  function handleSort(key: string) {
    if (key !== 'matricule' && key !== 'nom' && key !== 'mois') return
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  const moisLabel =
    MOIS_OPTIONS.find((m) => m.value === mois)?.label ?? formatMoisPaie(moisCle)

  function printListe() {
    window.print()
  }

  function handleCalculerConge() {
    if (!mois || !datePaie) {
      window.alert('Veuillez renseigner le mois et la date.')
      return
    }

    const confirmed = window.confirm(
      `Calculer le pécule de congé pour ${moisLabel} ${annee} ?\n` +
        `Seuls les agents validés et actifs seront traités.\n` +
        `Les lignes CONGE du même mois seront remplacées.`,
    )
    if (!confirmed) return

    const result = calculerConge({
      moisCode: mois,
      moisLabel: `${moisLabel} ${annee}`,
      datePaie: syncDatePaie(datePaie, annee, mois),
    })

    setRows(loadParametresStore().conges)
    window.alert(result.message)
  }

  return (
    <div className="pecule-conge-page print-pecule-conge-list">
      <section
        className="admin-rh-feuille-montants-panel pecule-conge-stats"
        aria-label="Statistiques du pécule de congé"
      >
        <div className="admin-rh-feuille-montants pecule-conge-stats-grid">
          <div className="admin-rh-feuille-montant">
            <span className="admin-rh-feuille-montant-label">
              Nombre de bénéficiaires
            </span>
            <strong className="admin-rh-feuille-montant-value">
              {stats.beneficiaires}
            </strong>
          </div>
          <div className="admin-rh-feuille-montant">
            <span className="admin-rh-feuille-montant-label">
              Montant Total Brut
            </span>
            <strong className="admin-rh-feuille-montant-value">
              {formatSommeCdf(stats.totalBrut)}
            </strong>
          </div>
          <div className="admin-rh-feuille-montant">
            <span className="admin-rh-feuille-montant-label">
              Montant Total Retenue CNSS
            </span>
            <strong className="admin-rh-feuille-montant-value">
              {formatSommeCdf(stats.retenueCnss)}
            </strong>
          </div>
          <div className="admin-rh-feuille-montant">
            <span className="admin-rh-feuille-montant-label">
              Montant Total Retenue IPR
            </span>
            <strong className="admin-rh-feuille-montant-value">
              {formatSommeCdf(stats.retenueIpr)}
            </strong>
          </div>
          <div className="admin-rh-feuille-montant">
            <span className="admin-rh-feuille-montant-label">
              Montant Total Net à Payer
            </span>
            <strong className="admin-rh-feuille-montant-value">
              {formatSommeCdf(stats.netAPayer)}
            </strong>
          </div>
        </div>
      </section>

      <section
        className="admin-list-panel"
        aria-labelledby="pecule-conge-list-title"
      >
        <div className="admin-list-head pecule-conge-list-head">
          <div className="admin-list-title">
            <span className="admin-list-icon" aria-hidden>
              <Umbrella size={18} />
            </span>
            <div>
              <h2 id="pecule-conge-list-title">Liste — Congés</h2>
              <p>
                {lignesMois.length} enregistrement
                {lignesMois.length > 1 ? 's' : ''}
                {` · ${moisLabel} ${annee}`}
                {' · '}Fichier CONGE
              </p>
            </div>
          </div>

          <div
            className="pecule-conge-filters"
            role="group"
            aria-label="Filtres mois et date"
          >
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
                    setMois(next.slice(5, 7))
                  }
                }}
                aria-label="Date"
              />
            </label>

            <button
              type="button"
              className="btn-primary pecule-conge-calc-btn"
              onClick={handleCalculerConge}
            >
              <Calculator size={16} aria-hidden />
              Calculer Congé
            </button>

            <button
              type="button"
              className="btn-print pecule-conge-print-btn"
              onClick={printListe}
              disabled={lignesMois.length === 0}
            >
              <Printer size={16} aria-hidden />
              Imprimer Liste de Congé
            </button>
          </div>
        </div>

        <div className="pecule-conge-table-area">
          <DataTable
            rows={sortedRows}
            emptyMessage={
              rows.length === 0
                ? 'Aucune ligne CONGE. Ajoutez des données dans Paramètres → Fichiers → Congé.'
                : `Aucune ligne pour ${moisLabel} ${annee}.`
            }
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            columns={columns}
          />
        </div>
      </section>
    </div>
  )
}
