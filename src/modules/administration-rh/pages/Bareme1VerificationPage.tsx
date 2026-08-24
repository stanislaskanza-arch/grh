import { CheckCheck, Scale, Unlock } from 'lucide-react'
import { useEffect, useState } from 'react'
import { DataTable } from '../../recrutement/components/DataTable'
import {
  loadParametresStore,
  saveParametresStore,
  PARAMETRES_STORE_CHANGED,
} from '../../parametres/storage'
import type { Bareme1Item } from '../../parametres/types'

function loadBaremes1(): Bareme1Item[] {
  return loadParametresStore().baremes1
}

export function Bareme1VerificationPage() {
  const [rows, setRows] = useState<Bareme1Item[]>(() => loadBaremes1())

  useEffect(() => {
    function refresh() {
      setRows(loadBaremes1())
    }
    window.addEventListener(PARAMETRES_STORE_CHANGED, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(PARAMETRES_STORE_CHANGED, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const validesCount = rows.filter((r) => r.valide).length

  function validerBareme1() {
    if (rows.length === 0) return

    const dejaValides = rows.filter((r) => r.valide).length
    const aValider = rows.length - dejaValides

    const confirmed = window.confirm(
      aValider === 0
        ? `Les ${rows.length} ligne(s) du Barème 1 sont déjà validées.\nConfirmer la revalidation ?`
        : `Valider le Barème 1 ?\n` +
            `${aValider} ligne(s) seront cochées comme validées` +
            (dejaValides > 0 ? ` (${dejaValides} déjà validée(s)).` : '.'),
    )
    if (!confirmed) return

    const store = loadParametresStore()
    const nextBaremes1 = store.baremes1.map((row) => ({
      ...row,
      valide: true,
    }))
    saveParametresStore({
      ...store,
      baremes1: nextBaremes1,
    })
    setRows(nextBaremes1)
    window.alert(
      `Barème 1 validé : ${nextBaremes1.length} enregistrement(s) coché(s).`,
    )
  }

  function deverrouillerBareme1() {
    if (validesCount === 0) return

    const confirmed = window.confirm(
      `Déverrouiller le Barème 1 ?\n` +
        `${validesCount} ligne(s) validée(s) redeviendront modifiables ` +
        `(Fichiers → Barème 1, import).`,
    )
    if (!confirmed) return

    const store = loadParametresStore()
    const nextBaremes1 = store.baremes1.map((row) => ({
      ...row,
      valide: false,
    }))
    saveParametresStore({
      ...store,
      baremes1: nextBaremes1,
    })
    setRows(nextBaremes1)
    window.alert(
      `Barème 1 déverrouillé : ${validesCount} enregistrement(s) à nouveau modifiable(s).`,
    )
  }

  return (
    <div className="admin-rh-bareme1">
      <section
        className="admin-list-panel"
        aria-labelledby="admin-rh-bareme1-title"
      >
        <div className="admin-list-head">
          <div className="admin-list-title">
            <span className="admin-list-icon" aria-hidden>
              <Scale size={18} />
            </span>
            <div>
              <h2 id="admin-rh-bareme1-title">
                Liste — Barème 1{'\u00A0\u00A0\u00A0'}(en USD)
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
              onClick={validerBareme1}
              disabled={rows.length === 0}
              title="Cocher Validée pour toutes les lignes du Barème 1"
            >
              <CheckCheck
                size={16}
                className="admin-rh-action-icon admin-rh-action-icon-valider"
              />
              Valider Barème 1
            </button>
            <button
              type="button"
              className="btn-ghost admin-rh-action-btn"
              onClick={deverrouillerBareme1}
              disabled={validesCount === 0}
              title="Retirer la validation pour rendre les lignes à nouveau modifiables"
            >
              <Unlock
                size={16}
                className="admin-rh-action-icon admin-rh-action-icon-deverrouiller"
              />
              Déverrouiller Barème 1
            </button>
          </div>
        </div>

        <DataTable
          rows={[...rows]}
          emptyMessage="Aucune ligne de barème enregistrée."
          columns={[
            {
              key: 'grade',
              header: 'Grade',
              render: (r) => <code className="id-code">{r.grade || '—'}</code>,
            },
            {
              key: 'libelleGrade',
              header: 'Libellé grade',
              render: (r) => <strong>{r.libelleGrade || '—'}</strong>,
            },
            { key: 'base', header: 'Base', render: (r) => r.base || '—' },
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
            {
              key: 'jourDuMois',
              header: 'Jours du mois',
              render: (r) => r.jourDuMois || '—',
            },
            {
              key: 'joursDeConge',
              header: 'Jours de congé',
              render: (r) => r.joursDeConge || '—',
            },
            {
              key: 'retenueCnss',
              header: 'Retenue CNSS',
              render: (r) => r.retenueCnss || '—',
            },
            {
              key: 'retenueIpr',
              header: 'Retenue IPR',
              render: (r) => r.retenueIpr || '—',
            },
            {
              key: 'retenueInpp',
              header: 'Retenue INPP',
              render: (r) => r.retenueInpp || '—',
            },
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
