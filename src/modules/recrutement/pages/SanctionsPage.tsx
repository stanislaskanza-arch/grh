import { useState, type FormEvent } from 'react'
import { DataTable } from '../components/DataTable'
import { Field, FormModal } from '../components/FormModal'
import { PersonnelSelect } from '../components/PersonnelSelect'
import { SectionHeader } from '../components/SectionHeader'
import { useRecrutement } from '../RecrutementContext'
import type { Sanction, TypeSanction } from '../types'
import { withoutMeta } from '../utils'

type FormState = Omit<Sanction, 'id' | 'createdAt'>

const EMPTY: FormState = {
  personnelId: '',
  dateSanction: '',
  type: 'Avertissement',
  motif: '',
  duree: '',
  decidePar: '',
  observations: '',
}

export function SanctionsPage() {
  const { store, add, update, remove, personnelLabel } = useRecrutement()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Sanction | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(row: Sanction) {
    setEditing(row)
    setForm(withoutMeta(row))
    setOpen(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing) update('sanctions', editing.id, form)
    else add('sanctions', form)
    setOpen(false)
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <SectionHeader
        title="Enregistrement des sanctions"
        description="Suivi disciplinaire du personnel (étape II)."
        count={store.sanctions.length}
        onAdd={openCreate}
        addLabel="Nouvelle sanction"
      >
        {store.personnel.length === 0 && (
          <p className="inline-hint">
            Enregistrez d’abord du personnel (étape I) avant de saisir une
            sanction.
          </p>
        )}
        <DataTable
          rows={[...store.sanctions].reverse()}
          emptyMessage="Aucune sanction enregistrée."
          onEdit={openEdit}
          onDelete={(row) => remove('sanctions', row.id)}
          columns={[
            {
              key: 'personnel',
              header: 'Personnel',
              render: (r) => personnelLabel(r.personnelId),
            },
            { key: 'date', header: 'Date', render: (r) => r.dateSanction },
            { key: 'type', header: 'Type', render: (r) => r.type },
            { key: 'motif', header: 'Motif', render: (r) => r.motif },
            { key: 'duree', header: 'Durée', render: (r) => r.duree || '—' },
            { key: 'decide', header: 'Décidé par', render: (r) => r.decidePar || '—' },
          ]}
        />
      </SectionHeader>

      <FormModal
        open={open}
        title={editing ? 'Modifier la sanction' : 'Nouvelle sanction'}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      >
        <Field label="Personnel" full>
          <PersonnelSelect
            required
            value={form.personnelId}
            onChange={(id) => set('personnelId', id)}
          />
        </Field>
        <Field label="Date">
          <input
            type="date"
            required
            value={form.dateSanction}
            onChange={(e) => set('dateSanction', e.target.value)}
          />
        </Field>
        <Field label="Type de sanction">
          <select
            value={form.type}
            onChange={(e) => set('type', e.target.value as TypeSanction)}
          >
            <option value="Avertissement">Avertissement</option>
            <option value="Blâme">Blâme</option>
            <option value="Mise à pied">Mise à pied</option>
            <option value="Rétrogradation">Rétrogradation</option>
            <option value="Autre">Autre</option>
          </select>
        </Field>
        <Field label="Durée">
          <input
            placeholder="Ex. 3 jours"
            value={form.duree}
            onChange={(e) => set('duree', e.target.value)}
          />
        </Field>
        <Field label="Décidé par">
          <input value={form.decidePar} onChange={(e) => set('decidePar', e.target.value)} />
        </Field>
        <Field label="Motif" full>
          <textarea
            required
            rows={3}
            value={form.motif}
            onChange={(e) => set('motif', e.target.value)}
          />
        </Field>
        <Field label="Observations" full>
          <textarea
            rows={2}
            value={form.observations}
            onChange={(e) => set('observations', e.target.value)}
          />
        </Field>
      </FormModal>
    </>
  )
}
