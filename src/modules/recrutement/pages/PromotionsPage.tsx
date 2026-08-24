import { useState, type FormEvent } from 'react'
import { DataTable } from '../components/DataTable'
import { Field, FormModal } from '../components/FormModal'
import { PersonnelSelect } from '../components/PersonnelSelect'
import { SectionHeader } from '../components/SectionHeader'
import { useRecrutement } from '../RecrutementContext'
import type { Promotion } from '../types'
import { withoutMeta } from '../utils'

type FormState = Omit<Promotion, 'id' | 'createdAt'>

const EMPTY: FormState = {
  personnelId: '',
  datePromotion: '',
  ancienPoste: '',
  nouveauPoste: '',
  ancienGrade: '',
  nouveauGrade: '',
  motif: '',
  decidePar: '',
}

export function PromotionsPage() {
  const { store, add, update, remove, personnelLabel } = useRecrutement()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Promotion | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(row: Promotion) {
    setEditing(row)
    setForm(withoutMeta(row))
    setOpen(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing) update('promotions', editing.id, form)
    else add('promotions', form)
    setOpen(false)
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const noPersonnel = store.personnel.length === 0

  return (
    <>
      <SectionHeader
        title="Enregistrement des promotions"
        description="Suivi des promotions du personnel (étape II)."
        count={store.promotions.length}
        onAdd={openCreate}
        addLabel="Nouvelle promotion"
      >
        {noPersonnel && (
          <p className="inline-hint">
            Enregistrez d’abord du personnel (étape I) avant de saisir une
            promotion.
          </p>
        )}
        <DataTable
          rows={[...store.promotions].reverse()}
          emptyMessage="Aucune promotion enregistrée."
          onEdit={openEdit}
          onDelete={(row) => remove('promotions', row.id)}
          columns={[
            {
              key: 'personnel',
              header: 'Personnel',
              render: (r) => personnelLabel(r.personnelId),
            },
            { key: 'date', header: 'Date', render: (r) => r.datePromotion },
            {
              key: 'poste',
              header: 'Poste',
              render: (r) => `${r.ancienPoste || '—'} → ${r.nouveauPoste}`,
            },
            {
              key: 'grade',
              header: 'Grade',
              render: (r) =>
                `${r.ancienGrade || '—'} → ${r.nouveauGrade || '—'}`,
            },
            { key: 'decide', header: 'Décidé par', render: (r) => r.decidePar || '—' },
          ]}
        />
      </SectionHeader>

      <FormModal
        open={open}
        title={editing ? 'Modifier la promotion' : 'Nouvelle promotion'}
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
        <Field label="Date de promotion">
          <input
            type="date"
            required
            value={form.datePromotion}
            onChange={(e) => set('datePromotion', e.target.value)}
          />
        </Field>
        <Field label="Décidé par">
          <input value={form.decidePar} onChange={(e) => set('decidePar', e.target.value)} />
        </Field>
        <Field label="Ancien poste">
          <input value={form.ancienPoste} onChange={(e) => set('ancienPoste', e.target.value)} />
        </Field>
        <Field label="Nouveau poste">
          <input
            required
            value={form.nouveauPoste}
            onChange={(e) => set('nouveauPoste', e.target.value)}
          />
        </Field>
        <Field label="Ancien grade">
          <input value={form.ancienGrade} onChange={(e) => set('ancienGrade', e.target.value)} />
        </Field>
        <Field label="Nouveau grade">
          <input value={form.nouveauGrade} onChange={(e) => set('nouveauGrade', e.target.value)} />
        </Field>
        <Field label="Motif" full>
          <textarea
            rows={3}
            value={form.motif}
            onChange={(e) => set('motif', e.target.value)}
          />
        </Field>
      </FormModal>
    </>
  )
}
