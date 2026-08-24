import { useState, type FormEvent } from 'react'
import { DataTable } from '../components/DataTable'
import { Field, FormModal } from '../components/FormModal'
import { PersonnelSelect } from '../components/PersonnelSelect'
import { SectionHeader } from '../components/SectionHeader'
import { useRecrutement } from '../RecrutementContext'
import type { BesoinFormation, PrioriteFormation, StatutFormation } from '../types'
import { withoutMeta } from '../utils'

type FormState = Omit<BesoinFormation, 'id' | 'createdAt'>

const EMPTY: FormState = {
  personnelId: '',
  dateDemande: '',
  domaine: '',
  description: '',
  priorite: 'moyenne',
  statut: 'identifie',
}

const PRIORITE_LABEL: Record<PrioriteFormation, string> = {
  basse: 'Basse',
  moyenne: 'Moyenne',
  haute: 'Haute',
}

const STATUT_LABEL: Record<StatutFormation, string> = {
  identifie: 'Identifié',
  planifie: 'Planifié',
  realise: 'Réalisé',
  annule: 'Annulé',
}

export function FormationsPage() {
  const { store, add, update, remove, personnelLabel } = useRecrutement()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<BesoinFormation | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(row: BesoinFormation) {
    setEditing(row)
    setForm(withoutMeta(row))
    setOpen(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing) update('formations', editing.id, form)
    else add('formations', form)
    setOpen(false)
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <SectionHeader
        title="Besoins en formation"
        description="Enregistrement des besoins de formation du personnel (étape II)."
        count={store.formations.length}
        onAdd={openCreate}
        addLabel="Nouveau besoin"
      >
        {store.personnel.length === 0 && (
          <p className="inline-hint">
            Enregistrez d’abord du personnel (étape I) avant de saisir un besoin
            de formation.
          </p>
        )}
        <DataTable
          rows={[...store.formations].reverse()}
          emptyMessage="Aucun besoin de formation enregistré."
          onEdit={openEdit}
          onDelete={(row) => remove('formations', row.id)}
          columns={[
            {
              key: 'personnel',
              header: 'Personnel',
              render: (r) => personnelLabel(r.personnelId),
            },
            { key: 'date', header: 'Date', render: (r) => r.dateDemande },
            { key: 'domaine', header: 'Domaine', render: (r) => r.domaine },
            {
              key: 'priorite',
              header: 'Priorité',
              render: (r) => (
                <span className={`badge badge-prio-${r.priorite}`}>
                  {PRIORITE_LABEL[r.priorite]}
                </span>
              ),
            },
            {
              key: 'statut',
              header: 'Statut',
              render: (r) => STATUT_LABEL[r.statut],
            },
          ]}
        />
      </SectionHeader>

      <FormModal
        open={open}
        title={editing ? 'Modifier le besoin' : 'Nouveau besoin de formation'}
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
        <Field label="Date de la demande">
          <input
            type="date"
            required
            value={form.dateDemande}
            onChange={(e) => set('dateDemande', e.target.value)}
          />
        </Field>
        <Field label="Domaine">
          <input
            required
            placeholder="Ex. Management, Excel, RH…"
            value={form.domaine}
            onChange={(e) => set('domaine', e.target.value)}
          />
        </Field>
        <Field label="Priorité">
          <select
            value={form.priorite}
            onChange={(e) => set('priorite', e.target.value as PrioriteFormation)}
          >
            <option value="basse">Basse</option>
            <option value="moyenne">Moyenne</option>
            <option value="haute">Haute</option>
          </select>
        </Field>
        <Field label="Statut">
          <select
            value={form.statut}
            onChange={(e) => set('statut', e.target.value as StatutFormation)}
          >
            <option value="identifie">Identifié</option>
            <option value="planifie">Planifié</option>
            <option value="realise">Réalisé</option>
            <option value="annule">Annulé</option>
          </select>
        </Field>
        <Field label="Description du besoin" full>
          <textarea
            required
            rows={3}
            value={form.description}
            onChange={(e) => set('description', e.target.value)}
          />
        </Field>
      </FormModal>
    </>
  )
}
