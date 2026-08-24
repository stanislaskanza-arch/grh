import { useState, type FormEvent } from 'react'
import { DataTable } from '../components/DataTable'
import { Field, FormModal } from '../components/FormModal'
import { PersonnelSelect } from '../components/PersonnelSelect'
import { SectionHeader } from '../components/SectionHeader'
import { useRecrutement } from '../RecrutementContext'
import type { Evaluation } from '../types'
import { withoutMeta } from '../utils'

type FormState = Omit<Evaluation, 'id' | 'createdAt'>

const EMPTY: FormState = {
  personnelId: '',
  periode: '',
  dateEvaluation: '',
  note: 10,
  pointsForts: '',
  axesAmelioration: '',
  objectifs: '',
  evaluateur: '',
}

export function EvaluationsPage() {
  const { store, add, update, remove, personnelLabel } = useRecrutement()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Evaluation | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(row: Evaluation) {
    setEditing(row)
    setForm(withoutMeta(row))
    setOpen(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing) update('evaluations', editing.id, form)
    else add('evaluations', form)
    setOpen(false)
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <SectionHeader
        title="Évaluation continue du personnel"
        description="Suivi des évaluations périodiques (étape II)."
        count={store.evaluations.length}
        onAdd={openCreate}
        addLabel="Nouvelle évaluation"
      >
        {store.personnel.length === 0 && (
          <p className="inline-hint">
            Enregistrez d’abord du personnel (étape I) avant de saisir une
            évaluation.
          </p>
        )}
        <DataTable
          rows={[...store.evaluations].reverse()}
          emptyMessage="Aucune évaluation enregistrée."
          onEdit={openEdit}
          onDelete={(row) => remove('evaluations', row.id)}
          columns={[
            {
              key: 'personnel',
              header: 'Personnel',
              render: (r) => personnelLabel(r.personnelId),
            },
            { key: 'periode', header: 'Période', render: (r) => r.periode },
            { key: 'date', header: 'Date', render: (r) => r.dateEvaluation },
            {
              key: 'note',
              header: 'Note /20',
              render: (r) => (
                <strong className={r.note >= 12 ? 'note-ok' : 'note-low'}>
                  {r.note}
                </strong>
              ),
            },
            { key: 'evaluateur', header: 'Évaluateur', render: (r) => r.evaluateur || '—' },
          ]}
        />
      </SectionHeader>

      <FormModal
        open={open}
        title={editing ? 'Modifier l’évaluation' : 'Nouvelle évaluation'}
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
        <Field label="Période">
          <input
            required
            placeholder="Ex. T1 2026 / Année 2026"
            value={form.periode}
            onChange={(e) => set('periode', e.target.value)}
          />
        </Field>
        <Field label="Date d’évaluation">
          <input
            type="date"
            required
            value={form.dateEvaluation}
            onChange={(e) => set('dateEvaluation', e.target.value)}
          />
        </Field>
        <Field label="Note (/20)">
          <input
            type="number"
            min={0}
            max={20}
            step={0.5}
            required
            value={form.note}
            onChange={(e) => set('note', Number(e.target.value))}
          />
        </Field>
        <Field label="Évaluateur">
          <input
            value={form.evaluateur}
            onChange={(e) => set('evaluateur', e.target.value)}
          />
        </Field>
        <Field label="Points forts" full>
          <textarea
            rows={2}
            value={form.pointsForts}
            onChange={(e) => set('pointsForts', e.target.value)}
          />
        </Field>
        <Field label="Axes d’amélioration" full>
          <textarea
            rows={2}
            value={form.axesAmelioration}
            onChange={(e) => set('axesAmelioration', e.target.value)}
          />
        </Field>
        <Field label="Objectifs" full>
          <textarea
            rows={2}
            value={form.objectifs}
            onChange={(e) => set('objectifs', e.target.value)}
          />
        </Field>
      </FormModal>
    </>
  )
}
