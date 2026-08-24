import { useState, type FormEvent } from 'react'
import { UserPlus, Users } from 'lucide-react'
import { DataTable } from '../../recrutement/components/DataTable'
import { Field, FormModal } from '../../recrutement/components/FormModal'
import { FichierCrudShell } from '../components/FichierCrudShell'
import { useParametres } from '../ParametresContext'
import { USER_ROLES, type AppUser, type UserRole, type UserStatut } from '../types'
import { withoutMeta } from '../utils'

type FormState = Omit<AppUser, 'id' | 'createdAt'>

const EMPTY: FormState = {
  nom: '',
  prenom: '',
  email: '',
  role: 'RH',
  categorieUtilisateurId: '',
  entrepriseId: '',
  telephone: '',
  statut: 'actif',
  password: '',
}

export function UtilisateursPage() {
  const { store, add, update, remove, entrepriseLabel, categorieLabel } = useParametres()
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AppUser | null>(null)
  const [form, setForm] = useState<FormState>(EMPTY)

  const entreprisesActives = store.entreprises.filter((e) => e.statut === 'active')
  const entreprisesOptions =
    entreprisesActives.length > 0 ? entreprisesActives : store.entreprises
  const categories = store.categoriesUtilisateurs.filter((c) => c.statut === 'actif')

  function openCreate() {
    setEditing(null)
    setForm({
      ...EMPTY,
      entrepriseId: entreprisesOptions[0]?.id ?? '',
      categorieUtilisateurId: categories[0]?.id ?? '',
    })
    setOpen(true)
  }

  function openEdit(row: AppUser) {
    setEditing(row)
    setForm(withoutMeta(row))
    setOpen(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const emailNorm = form.email.trim().toLowerCase()
    const duplicate = store.utilisateurs.some(
      (u) => u.email.trim().toLowerCase() === emailNorm && u.id !== editing?.id,
    )
    if (duplicate) {
      window.alert('Un utilisateur avec cet e-mail existe déjà.')
      return
    }
    if (!form.entrepriseId) {
      window.alert('Sélectionnez une entreprise.')
      return
    }
    if (!editing && !form.password.trim()) {
      window.alert('Le mot de passe est obligatoire pour un nouvel utilisateur.')
      return
    }

    const payload: FormState = {
      ...form,
      email: emailNorm,
      password: form.password.trim() || editing?.password || '',
    }

    if (editing) update('utilisateurs', editing.id, payload)
    else add('utilisateurs', payload)
    setOpen(false)
  }

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <FichierCrudShell
        title="Utilisateurs"
        description="Comptes d’accès, rôles et rattachement aux entreprises."
        listTitle="Liste des utilisateurs"
        count={store.utilisateurs.length}
        onAdd={openCreate}
        addLabel="Nouvel utilisateur"
        AddIcon={UserPlus}
        ListIcon={Users}
      >
        <DataTable
          rows={[...store.utilisateurs].reverse()}
          emptyMessage="Aucun utilisateur enregistré. Cliquez sur « Nouvel utilisateur »."
          onEdit={openEdit}
          onDelete={(row) => {
            if (row.email === 'admin@grh.local') {
              window.alert('Le compte administrateur principal ne peut pas être supprimé.')
              return
            }
            remove('utilisateurs', row.id)
          }}
          columns={[
            {
              key: 'nom',
              header: 'Nom complet',
              render: (r) => (
                <strong>
                  {r.prenom} {r.nom}
                </strong>
              ),
            },
            { key: 'email', header: 'E-mail', render: (r) => r.email },
            {
              key: 'role',
              header: 'Rôle',
              render: (r) => <span className="badge badge-role">{r.role}</span>,
            },
            {
              key: 'categorie',
              header: 'Catégorie',
              render: (r) => categorieLabel(r.categorieUtilisateurId),
            },
            {
              key: 'entreprise',
              header: 'Entreprise',
              render: (r) => entrepriseLabel(r.entrepriseId),
            },
            {
              key: 'statut',
              header: 'Statut',
              render: (r) => (
                <span className={`badge badge-${r.statut}`}>{r.statut}</span>
              ),
            },
          ]}
        />
      </FichierCrudShell>

      <FormModal
        open={open}
        title={editing ? 'Modifier l’utilisateur' : 'Nouvel utilisateur'}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        submitLabel={editing ? 'Enregistrer' : 'Créer le compte'}
      >
        <Field label="Nom">
          <input required value={form.nom} onChange={(e) => set('nom', e.target.value)} />
        </Field>
        <Field label="Prénom">
          <input required value={form.prenom} onChange={(e) => set('prenom', e.target.value)} />
        </Field>
        <Field label="E-mail">
          <input
            required
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
        </Field>
        <Field label="Téléphone">
          <input value={form.telephone} onChange={(e) => set('telephone', e.target.value)} />
        </Field>
        <Field label="Rôle">
          <select
            required
            value={form.role}
            onChange={(e) => set('role', e.target.value as UserRole)}
          >
            {USER_ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Catégorie utilisateurs">
          <select
            value={form.categorieUtilisateurId}
            onChange={(e) => set('categorieUtilisateurId', e.target.value)}
          >
            <option value="">— Sélectionner —</option>
            {(categories.length ? categories : store.categoriesUtilisateurs).map((c) => (
              <option key={c.id} value={c.id}>
                {c.libelle}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Entreprise">
          <select
            required
            value={form.entrepriseId}
            onChange={(e) => set('entrepriseId', e.target.value)}
          >
            <option value="">— Sélectionner —</option>
            {entreprisesOptions.map((e) => (
              <option key={e.id} value={e.id}>
                {e.sigle ? `${e.sigle} — ${e.raisonSociale}` : e.raisonSociale}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Statut">
          <select
            value={form.statut}
            onChange={(e) => set('statut', e.target.value as UserStatut)}
          >
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
        </Field>
        <Field
          label={editing ? 'Mot de passe (laisser vide pour conserver)' : 'Mot de passe'}
        >
          <input
            type="password"
            required={!editing}
            autoComplete="new-password"
            value={form.password}
            onChange={(e) => set('password', e.target.value)}
            placeholder={editing ? '••••••••' : ''}
          />
        </Field>
      </FormModal>
    </>
  )
}
