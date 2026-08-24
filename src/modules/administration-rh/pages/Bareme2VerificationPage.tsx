import { CheckCheck, Scale, Unlock } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { DataTable, type SortDir } from '../../recrutement/components/DataTable'
import {
  loadParametresStore,
  saveParametresStore,
  PARAMETRES_STORE_CHANGED,
} from '../../parametres/storage'
import type { Bareme2Item } from '../../parametres/types'

function loadBaremes2(): Bareme2Item[] {
  return loadParametresStore().baremes2
}

function compareBaremeNumber(a: string, b: string) {
  const na = Number(String(a).replace(/\s/g, '').replace(',', '.'))
  const nb = Number(String(b).replace(/\s/g, '').replace(',', '.'))
  const aOk = !Number.isNaN(na) && String(a).trim() !== ''
  const bOk = !Number.isNaN(nb) && String(b).trim() !== ''
  if (aOk && bOk && na !== nb) return na - nb
  return String(a || '').localeCompare(String(b || ''), 'fr', {
    numeric: true,
    sensitivity: 'base',
  })
}

export function Bareme2VerificationPage() {
  const [rows, setRows] = useState<Bareme2Item[]>(() => loadBaremes2())
  const [sortKey, setSortKey] = useState<'grade' | 'base'>('grade')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  useEffect(() => {
    function refresh() {
      setRows(loadBaremes2())
    }
    window.addEventListener(PARAMETRES_STORE_CHANGED, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(PARAMETRES_STORE_CHANGED, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const validesCount = rows.filter((r) => r.valide).length

  const sortedRows = useMemo(() => {
    const list = [...rows]
    list.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'grade') {
        cmp = (a.grade || '').localeCompare(b.grade || '', 'fr', {
          numeric: true,
          sensitivity: 'base',
        })
        if (cmp === 0) cmp = compareBaremeNumber(a.base, b.base)
      } else {
        cmp = compareBaremeNumber(a.base, b.base)
        if (cmp === 0) {
          cmp = (a.grade || '').localeCompare(b.grade || '', 'fr', {
            numeric: true,
            sensitivity: 'base',
          })
        }
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [rows, sortDir, sortKey])

  function handleSort(key: string) {
    if (key !== 'grade' && key !== 'base') return
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  function validerBareme2() {
    if (rows.length === 0) return

    const dejaValides = rows.filter((r) => r.valide).length
    const aValider = rows.length - dejaValides

    const confirmed = window.confirm(
      aValider === 0
        ? `Les ${rows.length} ligne(s) du Barème 2 sont déjà validées.\nConfirmer la revalidation ?`
        : `Valider le Barème 2 ?\n` +
            `${aValider} ligne(s) seront cochées comme validées` +
            (dejaValides > 0 ? ` (${dejaValides} déjà validée(s)).` : '.'),
    )
    if (!confirmed) return

    const store = loadParametresStore()
    const nextBaremes2 = store.baremes2.map((row) => ({
      ...row,
      valide: true,
    }))
    saveParametresStore({
      ...store,
      baremes2: nextBaremes2,
    })
    setRows(nextBaremes2)
    window.alert(
      `Barème 2 validé : ${nextBaremes2.length} enregistrement(s) coché(s).`,
    )
  }

  function deverrouillerBareme2() {
    if (validesCount === 0) return

    const confirmed = window.confirm(
      `Déverrouiller le Barème 2 ?\n` +
        `${validesCount} ligne(s) validée(s) redeviendront modifiables ` +
        `(Fichiers → Barème 2, import).`,
    )
    if (!confirmed) return

    const store = loadParametresStore()
    const nextBaremes2 = store.baremes2.map((row) => ({
      ...row,
      valide: false,
    }))
    saveParametresStore({
      ...store,
      baremes2: nextBaremes2,
    })
    setRows(nextBaremes2)
    window.alert(
      `Barème 2 déverrouillé : ${validesCount} enregistrement(s) à nouveau modifiable(s).`,
    )
  }

  return (
    <div className="admin-rh-bareme2">
      <section
        className="admin-list-panel"
        aria-labelledby="admin-rh-bareme2-title"
      >
        <div className="admin-list-head">
          <div className="admin-list-title">
            <span className="admin-list-icon" aria-hidden>
              <Scale size={18} />
            </span>
            <div>
              <h2 id="admin-rh-bareme2-title">
                Liste — Barème 2{'\u00A0\u00A0\u00A0'}(en CDF)
              </h2>
              <p>
                {rows.length} enregistrement{rows.length > 1 ? 's' : ''}
                {rows.length > 0
                  ? ` · ${validesCount} validé${validesCount > 1 ? 's' : ''}`
                  : ''}
              </p>
            </div>
          </div>
          <div className="admin-rh-head-actions">
            <button
              type="button"
              className="btn-primary admin-rh-action-btn"
              onClick={validerBareme2}
              disabled={rows.length === 0}
              title="Cocher Validée pour toutes les lignes du Barème 2"
            >
              <CheckCheck
                size={16}
                className="admin-rh-action-icon admin-rh-action-icon-valider"
              />
              Valider Barème 2
            </button>
            <button
              type="button"
              className="btn-ghost admin-rh-action-btn"
              onClick={deverrouillerBareme2}
              disabled={validesCount === 0}
              title="Retirer la validation pour rendre les lignes à nouveau modifiables"
            >
              <Unlock
                size={16}
                className="admin-rh-action-icon admin-rh-action-icon-deverrouiller"
              />
              Déverrouiller Barème 2
            </button>
          </div>
        </div>

        <DataTable
          rows={sortedRows}
          emptyMessage="Aucune ligne de barème enregistrée."
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          columns={[
            {
              key: 'grade',
              header: 'Grade',
              sortable: true,
              render: (r) => <code className="id-code">{r.grade || '—'}</code>,
            },
            {
              key: 'base',
              header: 'Base',
              sortable: true,
              render: (r) => r.base || '—',
            },
            {
              key: 'logement',
              header: 'Logement',
              render: (r) => r.logement || '—',
            },
            {
              key: 'transport',
              header: 'Transport',
              render: (r) => r.transport || '—',
            },
            { key: 'brute', header: 'Brute', render: (r) => r.brute || '—' },
            { key: 'ipr3', header: 'IPR 3%', render: (r) => r.ipr3 || '—' },
            { key: 'cnss5', header: 'CNSS 5%', render: (r) => r.cnss5 || '—' },
            {
              key: 'valide',
              header: 'Validée',
              className: 'col-select',
              render: (r) => (
                <input
                  type="checkbox"
                  checked={Boolean(r.valide)}
                  disabled
                  readOnly
                  aria-label={r.valide ? 'Validée' : 'Non validée'}
                />
              ),
            },
          ]}
        />
      </section>
    </div>
  )
}
