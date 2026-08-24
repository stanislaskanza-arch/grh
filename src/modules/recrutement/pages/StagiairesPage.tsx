import { useState, type FormEvent } from 'react'
import { DataTable } from '../components/DataTable'
import { Field, FormModal } from '../components/FormModal'
import { SectionHeader } from '../components/SectionHeader'
import { useRecrutement } from '../RecrutementContext'
import type { Stagiaire, StatutActeur } from '../types'
import { withoutMeta } from '../utils'

type FormState = Omit<Stagiaire, 'id' | 'createdAt'>

const EMPTY: FormState = {
  numero: '',
  nom: '',
  prenom: '',
  sexe: 'M',
  telephone: '',
  email: '',
  ecole: '',
  filiere: '',
  niveau: '',
  service: '',
  tuteur: '',
  themeStage: '',
  dateDebut: '',
  dateFin: '',
  observations: '',
  statut: 'actif',
}

export function StagiairesPage() {
  const { store, add, update, remove } = useRecrutement()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Stagiaire | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(row: Stagiaire) {
    setEditing(row)
    setForm(withoutMeta(row))
    setOpen(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing) update('stagiaires', editing.id, form)
    else add('stagiaires', form)
    setOpen(false)
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <SectionHeader
        title="Enregistrement des stagiaires"
        description="Capture des données des stagiaires (étape I)."
        count={store.stagiaires.length}
        onAdd={openCreate}
        addLabel="Nouveau stagiaire"
      >
        <DataTable
          rows={[...store.stagiaires].reverse()}
          emptyMessage="Aucun stagiaire enregistré."
          onEdit={openEdit}
          onDelete={(row) => remove('stagiaires', row.id)}
          columns={[
            { key: 'numero', header: 'N°', render: (r) => r.numero },
            {
              key: 'nom',
              header: 'Nom complet',
              render: (r) => `${r.prenom} ${r.nom}`,
            },
            { key: 'ecole', header: 'École / univ.', render: (r) => r.ecole },
            { key: 'filiere', header: 'Filière', render: (r) => r.filiere },
            { key: 'service', header: 'Service', render: (r) => r.service },
            { key: 'tuteur', header: 'Tuteur', render: (r) => r.tuteur || '—' },
            {
              key: 'periode',
              header: 'Période',
              render: (r) =>
                r.dateDebut || r.dateFin
                  ? `${r.dateDebut || '…'} → ${r.dateFin || '…'}`
                  : '—',
            },
            {
              key: 'statut',
              header: 'Statut',
              render: (r) => <span className={`badge badge-${r.statut}`}>{r.statut}</span>,
            },
          ]}
        />
      </SectionHeader>

      <FormModal
        open={open}
        title={editing ? 'Modifier le stagiaire' : 'Nouveau stagiaire'}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      >
        <Field label="Numéro">
          <input required value={form.numero} onChange={(e) => set('numero', e.target.value)} />
        </Field>
        <Field label="Nom">
          <input required value={form.nom} onChange={(e) => set('nom', e.target.value)} />
        </Field>
        <Field label="Prénom">
          <input required value={form.prenom} onChange={(e) => set('prenom', e.target.value)} />
        </Field>
        <Field label="Sexe">
          <select value={form.sexe} onChange={(e) => set('sexe', e.target.value as 'M' | 'F')}>
            <option value="M">Masculin</option>
            <option value="F">Féminin</option>
          </select>
        </Field>
        <Field label="Téléphone">
          <input value={form.telephone} onChange={(e) => set('telephone', e.target.value)} />
        </Field>
        <Field label="E-mail">
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} />
        </Field>
        <Field label="École / université">
          <input required value={form.ecole} onChange={(e) => set('ecole', e.target.value)} />
        </Field>
        <Field label="Filière">
          <input value={form.filiere} onChange={(e) => set('filiere', e.target.value)} />
        </Field>
        <Field label="Niveau">
          <input value={form.niveau} onChange={(e) => set('niveau', e.target.value)} />
        </Field>
        <Field label="Service d’accueil">
          <input required value={form.service} onChange={(e) => set('service', e.target.value)} />
        </Field>
        <Field label="Tuteur">
          <input value={form.tuteur} onChange={(e) => set('tuteur', e.target.value)} />
        </Field>
        <Field label="Thème du stage">
          <input value={form.themeStage} onChange={(e) => set('themeStage', e.target.value)} />
        </Field>
        <Field label="Date de début">
          <input type="date" value={form.dateDebut} onChange={(e) => set('dateDebut', e.target.value)} />
        </Field>
        <Field label="Date de fin">
          <input type="date" value={form.dateFin} onChange={(e) => set('dateFin', e.target.value)} />
        </Field>
        <Field label="Statut">
          <select
            value={form.statut}
            onChange={(e) => set('statut', e.target.value as StatutActeur)}
          >
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
            <option value="termine">Terminé</option>
          </select>
        </Field>
        <Field label="Observations" full>
          <textarea
            rows={3}
            value={form.observations}
            onChange={(e) => set('observations', e.target.value)}
          />
        </Field>
      </FormModal>
    </>
  )
}
