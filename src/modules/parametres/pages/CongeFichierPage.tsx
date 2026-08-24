import { useMemo, useState, type FormEvent } from 'react'
import { CalendarRange, Plus } from 'lucide-react'
import { DataTable, type SortDir } from '../../recrutement/components/DataTable'
import { Field, FormModal } from '../../recrutement/components/FormModal'
import { FichierCrudShell } from '../components/FichierCrudShell'
import { CONGE_FIELDS } from '../congeConstants'
import { useParametres } from '../ParametresContext'
import type { CongeItem } from '../types'

const EMPTY_CONGE: Omit<CongeItem, 'id' | 'createdAt' | 'updatedAt'> = {
  mois: '',
  datePaie: '',
  matricule: '',
  nom: '',
  postnom: '',
  prenom: '',
  numeroCnss: '',
  dateEngagement: '',
  grade: '',
  fonction: '',
  base: '',
  logement: '',
  jourConge: '',
  totalBrut: '',
  retenueCnss: '',
  retenueIpr: '',
  taux: '',
  netAPayer: '',
  organisation: '',
  annee: '',
  siteTravail: '',
  direction: '',
}

function formatDateFr(value: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('fr-FR')
}

export function CongeFichierPage() {
  const { store, add, update, remove } = useParametres()
  const rows = store.conges
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<CongeItem | null>(null)
  const [form, setForm] = useState(EMPTY_CONGE)
  const [sortKey, setSortKey] = useState<'matricule' | 'nom' | 'mois'>('matricule')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const sortedRows = useMemo(() => {
    const list = [...rows]
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
        cmp = (a.mois || '').localeCompare(b.mois || '', 'fr', {
          numeric: true,
          sensitivity: 'base',
        })
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [rows, sortDir, sortKey])

  function handleSort(key: string) {
    if (key !== 'matricule' && key !== 'nom' && key !== 'mois') return
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_CONGE)
    setOpen(true)
  }

  function openEdit(row: CongeItem) {
    setEditing(row)
    const { id: _id, createdAt: _c, updatedAt: _u, ...rest } = row
    setForm(rest)
    setOpen(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const stamp = new Date().toISOString()
    if (editing) {
      update('conges', editing.id, { ...form, updatedAt: stamp })
    } else {
      add('conges', { ...form, updatedAt: stamp })
    }
    setOpen(false)
  }

  function set<K extends keyof typeof EMPTY_CONGE>(
    key: K,
    value: (typeof EMPTY_CONGE)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <FichierCrudShell
        className="conge-fichier-page"
        title="Congé"
        description="Fichier CONGE : paie et jours de congé du personnel."
        listTitle="Liste — CONGE"
        count={rows.length}
        onAdd={openCreate}
        addLabel="Nouvelle ligne CONGE"
        AddIcon={Plus}
        ListIcon={CalendarRange}
      >
        <DataTable
          rows={sortedRows}
          emptyMessage="Aucune ligne CONGE enregistrée."
          onEdit={openEdit}
          onDelete={(row) => remove('conges', row.id)}
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          columns={CONGE_FIELDS.map((field) => ({
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
                ? 'col-total-brut-prorata'
                : undefined,
            sortable:
              field.key === 'mois' ||
              field.key === 'matricule' ||
              field.key === 'nom',
            render: (r: CongeItem) => {
              const raw = r[field.key]
              if (!raw) return '—'
              if (
                field.key === 'datePaie' ||
                field.key === 'dateEngagement'
              ) {
                return formatDateFr(raw)
              }
              if (field.key === 'matricule') {
                return <code className="id-code">{raw}</code>
              }
              return raw
            },
          }))}
        />
      </FichierCrudShell>

      <FormModal
        open={open}
        title={editing ? 'Modifier — CONGE' : 'Nouvelle ligne — CONGE'}
        subtitle="Fichier CONGE — structure complète"
        panelClassName="form-dock-panel-entreprise"
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      >
        {CONGE_FIELDS.map((field) => (
          <Field key={field.key} label={field.header}>
            {field.key === 'datePaie' || field.key === 'dateEngagement' ? (
              <input
                type="date"
                required={Boolean(field.required)}
                value={form[field.key]}
                onChange={(e) => set(field.key, e.target.value)}
              />
            ) : (
              <input
                required={Boolean(field.required)}
                value={form[field.key]}
                onChange={(e) => set(field.key, e.target.value)}
              />
            )}
          </Field>
        ))}
      </FormModal>
    </>
  )
}
