import { useState, type FormEvent } from 'react'
import { Building2, Plus } from 'lucide-react'
import { DataTable } from '../../recrutement/components/DataTable'
import { Field, FormModal } from '../../recrutement/components/FormModal'
import { FileField } from '../../recrutement/components/FormFields'
import { FichierCrudShell } from '../components/FichierCrudShell'
import { useParametres } from '../ParametresContext'
import type { Entreprise, EntrepriseLogo, EntrepriseStatut } from '../types'
import { withoutMeta } from '../utils'

type FormState = Omit<Entreprise, 'id' | 'createdAt'>

const EMPTY: FormState = {
  sigle: '',
  raisonSociale: '',
  responsable1: '',
  responsable2: '',
  responsable3: '',
  ligneEntete1: '',
  ligneEntete2: '',
  ligneEntete3: '',
  ligneEntete4: '',
  ligneEntete5: '',
  logo: null,
  nouveauLogo: null,
  numeroRccm: '',
  numeroIdNat: '',
  adresse: '',
  ville: 'Kinshasa',
  pays: 'République Démocratique du Congo',
  telephone: '',
  email: '',
  secteur: 'Administration publique',
  statut: 'active',
}

export function EntreprisesPage() {
  const { store, add, update, remove } = useParametres()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Entreprise | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY)
    setOpen(true)
  }

  function openEdit(row: Entreprise) {
    setEditing(row)
    setForm({
      ...withoutMeta(row),
      logo: row.logo ?? null,
      nouveauLogo: row.nouveauLogo ?? null,
    })
    setOpen(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing) update('entreprises', editing.id, form)
    else add('entreprises', form)
    setOpen(false)
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <FichierCrudShell
        title="Entreprise"
        description="Fichier ENTREPRISE : organisation, responsables, lignes d’en-tête, logo et NouveauLogo."
        listTitle="Liste des entreprises"
        count={store.entreprises.length}
        onAdd={openCreate}
        addLabel="Nouvelle entreprise"
        AddIcon={Plus}
        ListIcon={Building2}
      >
        <DataTable
          rows={[...store.entreprises].reverse()}
          emptyMessage="Aucune entreprise enregistrée. Cliquez sur « Nouvelle entreprise »."
          onEdit={openEdit}
          onDelete={(row) => remove('entreprises', row.id)}
          columns={[
            {
              key: 'logo',
              header: 'Logo',
              render: (r) =>
                r.logo?.dataUrl ? (
                  <img
                    className="entreprise-list-logo"
                    src={r.logo.dataUrl}
                    alt=""
                  />
                ) : (
                  '—'
                ),
            },
            {
              key: 'nouveauLogo',
              header: 'NouveauLogo',
              render: (r) =>
                r.nouveauLogo?.dataUrl ? (
                  <img
                    className="entreprise-list-logo"
                    src={r.nouveauLogo.dataUrl}
                    alt=""
                  />
                ) : (
                  '—'
                ),
            },
            {
              key: 'sigle',
              header: 'Sigle',
              render: (r) => <code className="id-code">{r.sigle || '—'}</code>,
            },
            {
              key: 'raison',
              header: 'Nom de l’organisation',
              render: (r) => <strong>{r.raisonSociale}</strong>,
            },
            {
              key: 'responsable1',
              header: 'Responsable 1',
              render: (r) => r.responsable1 || '—',
            },
            {
              key: 'responsable2',
              header: 'Responsable 2',
              render: (r) => r.responsable2 || '—',
            },
            {
              key: 'responsable3',
              header: 'Responsable 3',
              render: (r) => r.responsable3 || '—',
            },
            {
              key: 'entete1',
              header: 'Ligne entête 1',
              render: (r) => r.ligneEntete1 || '—',
            },
            {
              key: 'entete2',
              header: 'Ligne entête 2',
              render: (r) => r.ligneEntete2 || '—',
            },
            {
              key: 'entete3',
              header: 'Ligne entête 3',
              render: (r) => r.ligneEntete3 || '—',
            },
            {
              key: 'entete4',
              header: 'Ligne entête 4',
              render: (r) => r.ligneEntete4 || '—',
            },
            {
              key: 'entete5',
              header: 'Ligne entête 5',
              render: (r) => r.ligneEntete5 || '—',
            },
            {
              key: 'statut',
              header: 'Statut',
              render: (r) => (
                <span className={`badge badge-ent-${r.statut}`}>{r.statut}</span>
              ),
            },
          ]}
        />
      </FichierCrudShell>

      <FormModal
        open={open}
        title={editing ? 'Modifier l’entreprise' : 'Nouvelle entreprise'}
        subtitle="Fichier ENTREPRISE — enregistrement"
        panelClassName="form-dock-panel-entreprise"
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        submitLabel={editing ? 'Enregistrer' : 'Créer l’entreprise'}
      >
        <FileField
          label="Logo"
          accept="image/*"
          value={form.logo}
          onChange={(file) => set('logo', file as EntrepriseLogo | null)}
        />
        <FileField
          label="NouveauLogo"
          accept="image/*"
          value={form.nouveauLogo}
          onChange={(file) => set('nouveauLogo', file as EntrepriseLogo | null)}
        />
        <Field label="Sigle">
          <input
            required
            value={form.sigle}
            onChange={(e) => set('sigle', e.target.value)}
          />
        </Field>
        <Field label="Nom de l’organisation" full>
          <input
            required
            value={form.raisonSociale}
            onChange={(e) => set('raisonSociale', e.target.value)}
          />
        </Field>
        <Field label="Responsable 1">
          <input
            value={form.responsable1}
            onChange={(e) => set('responsable1', e.target.value)}
          />
        </Field>
        <Field label="Responsable 2">
          <input
            value={form.responsable2}
            onChange={(e) => set('responsable2', e.target.value)}
          />
        </Field>
        <Field label="Responsable 3">
          <input
            value={form.responsable3}
            onChange={(e) => set('responsable3', e.target.value)}
          />
        </Field>
        <Field label="Ligne entête 1" full>
          <input
            value={form.ligneEntete1}
            onChange={(e) => set('ligneEntete1', e.target.value)}
          />
        </Field>
        <Field label="Ligne entête 2" full>
          <input
            value={form.ligneEntete2}
            onChange={(e) => set('ligneEntete2', e.target.value)}
          />
        </Field>
        <Field label="Ligne entête 3" full>
          <input
            value={form.ligneEntete3}
            onChange={(e) => set('ligneEntete3', e.target.value)}
          />
        </Field>
        <Field label="Ligne entête 4" full>
          <input
            value={form.ligneEntete4}
            onChange={(e) => set('ligneEntete4', e.target.value)}
          />
        </Field>
        <Field label="Ligne entête 5" full>
          <input
            value={form.ligneEntete5}
            onChange={(e) => set('ligneEntete5', e.target.value)}
          />
        </Field>
        <Field label="Statut">
          <select
            value={form.statut}
            onChange={(e) => set('statut', e.target.value as EntrepriseStatut)}
          >
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>
        </Field>
      </FormModal>
    </>
  )
}
