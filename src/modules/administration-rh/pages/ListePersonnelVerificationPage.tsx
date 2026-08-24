import {
  CheckCheck,
  Cross,
  LogOut,
  PauseCircle,
  Unlock,
  UserCheck,
  UserCog,
  UserX,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { DataTable, type SortDir } from '../../recrutement/components/DataTable'
import { refLibelle } from '../../recrutement/personnelConstants'
import { useRecrutement } from '../../recrutement/RecrutementContext'
import { saveRecrutementStore } from '../../recrutement/storage'
import { loadParametresStore } from '../../parametres/storage'
import type { Personnel } from '../../recrutement/types'

type SortKey = 'matricule' | 'nom' | 'grade' | 'statut'
type FilterKey = 'tous' | 'actif' | 'non-actif'

const STATUS_ACTIONS = [
  'Actif',
  'Sortie des effectifs',
  'Suspendu',
  'Retraité',
  'Décédé',
] as const

function formatDateFr(value: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('fr-FR')
}

function statutLibelle(
  refs: ReturnType<typeof loadParametresStore>,
  statutId: string,
) {
  return refs.statutsPersonnel.find((s) => s.id === statutId)?.libelle ?? ''
}

function findStatutId(
  refs: ReturnType<typeof loadParametresStore>,
  libelle: string,
) {
  return (
    refs.statutsPersonnel.find(
      (s) => s.libelle.trim().toLowerCase() === libelle.toLowerCase(),
    )?.id ?? ''
  )
}

function isActif(libelle: string) {
  return !libelle || libelle.toLowerCase() === 'actif'
}

function statutBadgeClass(libelle: string) {
  const key = libelle
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
  if (key === 'actif') return 'badge badge-perso-actif'
  if (key.includes('sortie')) return 'badge badge-perso-sortie-des-effectifs'
  if (key.includes('suspendu')) return 'badge badge-perso-suspendu'
  if (key.includes('retraite')) return 'badge badge-perso-retraite'
  if (key.includes('decede')) return 'badge badge-perso-decede'
  return 'badge badge-role'
}

function compareMatricule(a: string, b: string) {
  const left = a.trim()
  const right = b.trim()
  const re = /^(.*?)(\d+)$/
  const ma = left.match(re)
  const mb = right.match(re)
  if (ma && mb && ma[1] === mb[1]) {
    const na = Number(ma[2])
    const nb = Number(mb[2])
    if (!Number.isNaN(na) && !Number.isNaN(nb) && na !== nb) return na - nb
  }
  return left.localeCompare(right, 'fr', { numeric: true, sensitivity: 'base' })
}

function compareNom(a: Personnel, b: Personnel) {
  const byNom = a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' })
  if (byNom !== 0) return byNom
  const byPostnom = (a.postnom || '').localeCompare(b.postnom || '', 'fr', {
    sensitivity: 'base',
  })
  if (byPostnom !== 0) return byPostnom
  return (a.prenom || '').localeCompare(b.prenom || '', 'fr', {
    sensitivity: 'base',
  })
}

export function ListePersonnelVerificationPage() {
  const { store, reload } = useRecrutement()
  const refs = useMemo(() => loadParametresStore(), [store.personnel])
  const [filter, setFilter] = useState<FilterKey>('tous')
  const [sortKey, setSortKey] = useState<SortKey>('matricule')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [selected, setSelected] = useState<Set<string>>(() => new Set())

  const stats = useMemo(() => {
    let actifs = 0
    let nonActifs = 0
    for (const p of store.personnel) {
      if (isActif(statutLibelle(refs, p.statutId))) actifs += 1
      else nonActifs += 1
    }
    return {
      total: store.personnel.length,
      actifs,
      nonActifs,
    }
  }, [refs, store.personnel])

  const filtered = useMemo(() => {
    if (filter === 'tous') return store.personnel
    return store.personnel.filter((p) => {
      const actif = isActif(statutLibelle(refs, p.statutId))
      return filter === 'actif' ? actif : !actif
    })
  }, [filter, refs, store.personnel])

  const rows = useMemo(() => {
    const list = [...filtered]
    list.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'matricule') {
        cmp = compareMatricule(a.matricule || '', b.matricule || '')
      } else if (sortKey === 'nom') {
        cmp = compareNom(a, b)
      } else if (sortKey === 'grade') {
        cmp = refLibelle(refs.grades, a.gradeId).localeCompare(
          refLibelle(refs.grades, b.gradeId),
          'fr',
          { sensitivity: 'base' },
        )
        if (cmp === 0) cmp = compareMatricule(a.matricule || '', b.matricule || '')
      } else {
        cmp = statutLibelle(refs, a.statutId).localeCompare(
          statutLibelle(refs, b.statutId),
          'fr',
          { sensitivity: 'base' },
        )
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [filtered, refs, sortDir, sortKey])

  const allVisibleSelected =
    rows.length > 0 && rows.every((r) => selected.has(r.id))
  const someVisibleSelected = rows.some((r) => selected.has(r.id))
  const selectedCount = selected.size

  useEffect(() => {
    setSelected((prev) => {
      const valid = new Set(store.personnel.map((p) => p.id))
      const next = new Set([...prev].filter((id) => valid.has(id)))
      return next.size === prev.size ? prev : next
    })
  }, [store.personnel])

  function handleSort(key: string) {
    if (
      key !== 'matricule' &&
      key !== 'nom' &&
      key !== 'grade' &&
      key !== 'statut'
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

  function toggleRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function toggleAllVisible() {
    setSelected((prev) => {
      const next = new Set(prev)
      if (allVisibleSelected) {
        for (const row of rows) next.delete(row.id)
      } else {
        for (const row of rows) next.add(row.id)
      }
      return next
    })
  }

  function applyPatchToIds(
    ids: string[],
    patch: Partial<Pick<Personnel, 'statutId' | 'valide'>>,
  ) {
    if (ids.length === 0) return
    if (patch.statutId === undefined && patch.valide === undefined) return
    const idSet = new Set(ids)
    const stamp = new Date().toISOString()
    saveRecrutementStore({
      ...store,
      personnel: store.personnel.map((p) =>
        idSet.has(p.id) ? { ...p, ...patch, updatedAt: stamp } : p,
      ),
    })
    reload()
    setSelected(new Set())
  }

  function applyStatutToIds(ids: string[], libelle: string) {
    const statutId = findStatutId(refs, libelle)
    if (!statutId) return
    applyPatchToIds(ids, { statutId })
  }

  function validerPersonnel() {
    const ids =
      selectedCount > 0
        ? [...selected]
        : store.personnel.map((p) => p.id)
    if (ids.length === 0) return
    const cible =
      selectedCount > 0
        ? `la sélection (${ids.length})`
        : `tout le personnel (${ids.length})`
    if (
      !window.confirm(
        `Valider ${cible}, rendre actif et marquer éligible à la paie ?`,
      )
    ) {
      return
    }
    const statutId = findStatutId(refs, 'Actif')
    if (!statutId) return
    applyPatchToIds(ids, { statutId, valide: true })
  }

  function deverrouillerPersonnel() {
    const candidats =
      selectedCount > 0
        ? store.personnel.filter((p) => selected.has(p.id) && p.valide)
        : store.personnel.filter((p) => p.valide)
    if (candidats.length === 0) {
      window.alert(
        selectedCount > 0
          ? 'Aucun agent validé dans la sélection.'
          : 'Aucun agent validé à déverrouiller.',
      )
      return
    }
    const cible =
      selectedCount > 0
        ? `la sélection (${candidats.length} validé${candidats.length > 1 ? 's' : ''})`
        : `tout le personnel validé (${candidats.length})`
    if (
      !window.confirm(
        `Déverrouiller ${cible} ?\n` +
          `Les fiches concernées redeviendront modifiables (Capture Info, import).`,
      )
    ) {
      return
    }
    applyPatchToIds(
      candidats.map((p) => p.id),
      { valide: false },
    )
  }

  function rendreActifSelection() {
    if (selectedCount === 0) return
    applyStatutToIds([...selected], 'Actif')
  }

  function appliquerStatutSelection(libelle: (typeof STATUS_ACTIONS)[number]) {
    if (selectedCount === 0) return
    applyStatutToIds([...selected], libelle)
  }

  return (
    <div className="admin-rh-liste-personnel">
      <section className="admin-rh-stats" aria-label="Statistiques du personnel">
        <button
          type="button"
          className={`admin-rh-stat ${filter === 'tous' ? 'is-active' : ''}`}
          onClick={() => setFilter('tous')}
        >
          <span className="admin-rh-stat-icon" aria-hidden>
            <Users size={20} />
          </span>
          <span className="admin-rh-stat-body">
            <span className="admin-rh-stat-label">Total</span>
            <strong className="admin-rh-stat-value">{stats.total}</strong>
          </span>
        </button>
        <button
          type="button"
          className={`admin-rh-stat admin-rh-stat-actif ${filter === 'actif' ? 'is-active' : ''}`}
          onClick={() => setFilter('actif')}
        >
          <span className="admin-rh-stat-icon" aria-hidden>
            <UserCheck size={20} />
          </span>
          <span className="admin-rh-stat-body">
            <span className="admin-rh-stat-label">Actif</span>
            <strong className="admin-rh-stat-value">{stats.actifs}</strong>
          </span>
        </button>
        <button
          type="button"
          className={`admin-rh-stat admin-rh-stat-inactif ${filter === 'non-actif' ? 'is-active' : ''}`}
          onClick={() => setFilter('non-actif')}
        >
          <span className="admin-rh-stat-icon" aria-hidden>
            <UserX size={20} />
          </span>
          <span className="admin-rh-stat-body">
            <span className="admin-rh-stat-label">Non actif</span>
            <strong className="admin-rh-stat-value">{stats.nonActifs}</strong>
          </span>
        </button>

        <div className="admin-rh-bulk-actions" aria-label="Actions sur la sélection">
          <button
            type="button"
            className="btn-primary admin-rh-action-btn"
            onClick={validerPersonnel}
            disabled={store.personnel.length === 0}
          >
            <CheckCheck size={16} className="admin-rh-action-icon admin-rh-action-icon-valider" />
            Valider tout le personnel
          </button>
          <button
            type="button"
            className="btn-ghost admin-rh-action-btn"
            onClick={deverrouillerPersonnel}
            disabled={!store.personnel.some((p) => p.valide)}
            title="Retirer la validation pour rendre les fiches à nouveau modifiables"
          >
            <Unlock size={16} className="admin-rh-action-icon admin-rh-action-icon-deverrouiller" />
            Déverrouiller
          </button>
          <div className="admin-rh-bulk-actions-end">
            <button
              type="button"
              className="btn-ghost admin-rh-action-btn"
              onClick={rendreActifSelection}
              disabled={selectedCount === 0}
            >
              <UserCheck size={16} className="admin-rh-action-icon admin-rh-action-icon-actif" />
              Rendre actif
            </button>
            <button
              type="button"
              className="btn-ghost admin-rh-action-btn"
              onClick={() => appliquerStatutSelection('Sortie des effectifs')}
              disabled={selectedCount === 0}
            >
              <LogOut size={16} className="admin-rh-action-icon admin-rh-action-icon-sortie" />
              Sortie des effectifs
            </button>
            <button
              type="button"
              className="btn-ghost admin-rh-action-btn"
              onClick={() => appliquerStatutSelection('Suspendu')}
              disabled={selectedCount === 0}
            >
              <PauseCircle size={16} className="admin-rh-action-icon admin-rh-action-icon-suspendu" />
              Suspendu
            </button>
            <button
              type="button"
              className="btn-ghost admin-rh-action-btn"
              onClick={() => appliquerStatutSelection('Retraité')}
              disabled={selectedCount === 0}
            >
              <UserCog size={16} className="admin-rh-action-icon admin-rh-action-icon-retraite" />
              Retraité
            </button>
            <button
              type="button"
              className="btn-ghost admin-rh-action-btn"
              onClick={() => appliquerStatutSelection('Décédé')}
              disabled={selectedCount === 0}
            >
              <Cross size={16} className="admin-rh-action-icon admin-rh-action-icon-decede" />
              Décédé
            </button>
            {selectedCount > 0 && (
              <span className="admin-rh-selection-hint">
                {selectedCount} sélectionné{selectedCount > 1 ? 's' : ''}
              </span>
            )}
          </div>
        </div>
      </section>

      <section
        className="admin-list-panel"
        aria-labelledby="admin-rh-liste-personnel-title"
      >
        <div className="admin-list-head">
          <div className="admin-list-title">
            <span className="admin-list-icon" aria-hidden>
              <Users size={18} />
            </span>
            <div>
              <h2 id="admin-rh-liste-personnel-title">Liste du Personnel</h2>
              <p>
                {rows.length} enregistrement{rows.length > 1 ? 's' : ''}
                {filter === 'actif'
                  ? ' actifs'
                  : filter === 'non-actif'
                    ? ' non actifs'
                    : ''}
              </p>
            </div>
          </div>
        </div>

        <DataTable
          rows={rows}
          emptyMessage="Aucun personnel à afficher pour ce filtre."
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          columns={[
            {
              key: 'select',
              className: 'col-select',
              header: (
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  ref={(el) => {
                    if (el) {
                      el.indeterminate =
                        someVisibleSelected && !allVisibleSelected
                    }
                  }}
                  onChange={toggleAllVisible}
                  aria-label="Tout sélectionner"
                />
              ),
              render: (r) => (
                <input
                  type="checkbox"
                  checked={selected.has(r.id)}
                  onChange={() => toggleRow(r.id)}
                  aria-label={`Sélectionner ${r.matricule || r.nom || r.id}`}
                />
              ),
            },
            {
              key: 'matricule',
              header: 'Matricule',
              sortable: true,
              render: (r) => (
                <code className="id-code">{r.matricule || '—'}</code>
              ),
            },
            {
              key: 'nom',
              header: 'Nom',
              sortable: true,
              render: (r) => r.nom || '—',
            },
            {
              key: 'postnom',
              header: 'Postnom',
              render: (r) => r.postnom || '—',
            },
            {
              key: 'prenom',
              header: 'Prénom',
              render: (r) => r.prenom || '—',
            },
            {
              key: 'sexe',
              header: 'Sexe',
              render: (r) => r.sexe || '—',
            },
            {
              key: 'grade',
              header: 'Grade',
              sortable: true,
              render: (r) => refLibelle(refs.grades, r.gradeId) || '—',
            },
            {
              key: 'fonction',
              header: 'Fonction AG',
              render: (r) => refLibelle(refs.fonctions, r.fonctionId) || '—',
            },
            {
              key: 'direction',
              header: 'Direction',
              render: (r) => refLibelle(refs.directions, r.directionId) || '—',
            },
            {
              key: 'site',
              header: 'Site de travail',
              render: (r) =>
                refLibelle(refs.sitesAffectation, r.siteTravailId) || '—',
            },
            {
              key: 'dateEngagement',
              header: 'Date engagement',
              render: (r) => formatDateFr(r.dateEngagement),
            },
            {
              key: 'statut',
              header: 'Statut',
              sortable: true,
              render: (r) => {
                const label = statutLibelle(refs, r.statutId) || '—'
                return (
                  <span className={statutBadgeClass(label)}>{label}</span>
                )
              },
            },
            {
              key: 'valide',
              header: 'Validé',
              className: 'col-select',
              render: (r) => (
                <input
                  type="checkbox"
                  checked={Boolean(r.valide)}
                  disabled
                  readOnly
                  aria-label={r.valide ? 'Validé' : 'Non validé'}
                />
              ),
            },
          ]}
        />
      </section>
    </div>
  )
}
