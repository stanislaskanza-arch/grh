import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import {
  Award,
  Briefcase,
  CalendarRange,
  Coins,
  GraduationCap,
  MapPin,
  Plus,
  Scale,
  Tags,
  Landmark,
  BadgeCheck,
  BookOpen,
  FileText,
  Banknote,
  Gift,
} from 'lucide-react'
import { DataTable } from '../../recrutement/components/DataTable'
import { Field, FormModal } from '../../recrutement/components/FormModal'
import { FichierCrudShell } from '../components/FichierCrudShell'
import { useParametres } from '../ParametresContext'
import { createId } from '../storage'
import type {
  Bareme1Item,
  Bareme2Item,
  MonnaieItem,
  PeriodeItem,
  RefItem,
  RefStatut,
  TauxMonnaieItem,
} from '../types'
import { withoutMeta } from '../utils'
import {
  isTauxMonnaieEnCours,
  TAUX_EN_COURS_LABEL,
} from '../../paie/tauxMonnaieEnCours'

type RefKey =
  | 'categoriesUtilisateurs'
  | 'grades'
  | 'fonctions'
  | 'niveauxEtudes'
  | 'sitesAffectation'
  | 'directions'
  | 'statutsPersonnel'
  | 'comptesComptables'
  | 'typesContrats'
  | 'primes'

const EMPTY_REF: Omit<RefItem, 'id' | 'createdAt'> = {
  code: '',
  libelle: '',
  description: '',
  statut: 'actif',
}

const REF_ICONS: Record<RefKey, { List: LucideIcon; Add: LucideIcon }> = {
  categoriesUtilisateurs: { List: Tags, Add: Plus },
  grades: { List: Award, Add: Plus },
  fonctions: { List: Briefcase, Add: Plus },
  niveauxEtudes: { List: GraduationCap, Add: Plus },
  sitesAffectation: { List: MapPin, Add: Plus },
  directions: { List: Landmark, Add: Plus },
  statutsPersonnel: { List: BadgeCheck, Add: Plus },
  comptesComptables: { List: BookOpen, Add: Plus },
  typesContrats: { List: FileText, Add: Plus },
  primes: { List: Gift, Add: Plus },
}

export function RefFichierPage({
  title,
  description,
  collection,
  addLabel,
  codeHeader = 'Code',
  libelleHeader = 'Libellé',
}: {
  title: string
  description: string
  collection: RefKey
  addLabel: string
  codeHeader?: string
  libelleHeader?: string
}) {
  const { store, add, update, remove } = useParametres()
  const rows = store[collection]
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<RefItem | null>(null)
  const [form, setForm] = useState(EMPTY_REF)
  const icons = REF_ICONS[collection]

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_REF)
    setOpen(true)
  }

  function openEdit(row: RefItem) {
    setEditing(row)
    setForm(withoutMeta(row))
    setOpen(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing) update(collection, editing.id, form)
    else add(collection, form)
    setOpen(false)
  }

  return (
    <>
      <FichierCrudShell
        title={title}
        description={description}
        listTitle={`Liste — ${title}`}
        count={rows.length}
        onAdd={openCreate}
        addLabel={addLabel}
        AddIcon={icons.Add}
        ListIcon={icons.List}
      >
        <DataTable
          rows={[...rows].reverse()}
          emptyMessage="Aucun enregistrement. Cliquez sur Nouveau pour commencer."
          onEdit={openEdit}
          onDelete={(row) => remove(collection, row.id)}
          columns={[
            {
              key: 'code',
              header: codeHeader,
              render: (r) => <code className="id-code">{r.code}</code>,
            },
            {
              key: 'libelle',
              header: libelleHeader,
              render: (r) => <strong>{r.libelle}</strong>,
            },
            { key: 'description', header: 'Description', render: (r) => r.description || '—' },
            {
              key: 'statut',
              header: 'Statut',
              render: (r) => <span className={`badge badge-${r.statut}`}>{r.statut}</span>,
            },
          ]}
        />
      </FichierCrudShell>

      <FormModal
        open={open}
        title={editing ? `Modifier — ${title}` : `Nouveau — ${title}`}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      >
        <Field label={codeHeader}>
          <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </Field>
        <Field label={libelleHeader}>
          <input
            required
            value={form.libelle}
            onChange={(e) => setForm({ ...form, libelle: e.target.value })}
          />
        </Field>
        <Field label="Description" full>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Statut">
          <select
            value={form.statut}
            onChange={(e) => setForm({ ...form, statut: e.target.value as RefStatut })}
          >
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
        </Field>
      </FormModal>
    </>
  )
}

const EMPTY_BAREME1: Omit<Bareme1Item, 'id' | 'createdAt'> = {
  grade: '',
  libelleGrade: '',
  base: '',
  logement: '',
  transport: '',
  jourDuMois: '',
  joursDeConge: '',
  retenueCnss: '0.05',
  retenueIpr: '0.21',
  retenueInpp: '',
  valide: false,
}

function compareBaremeNumber(a: string, b: string) {
  const na = Number(String(a).replace(/\s/g, '').replace(',', '.'))
  const nb = Number(String(b).replace(/\s/g, '').replace(',', '.'))
  const aOk = !Number.isNaN(na) && String(a).trim() !== ''
  const bOk = !Number.isNaN(nb) && String(b).trim() !== ''
  if (aOk && bOk && na !== nb) return na - nb
  return String(a || '').localeCompare(String(b || ''), 'fr', {
    numeric: true,
    sensitivity: 'base',
  })
}

export function Bareme1FichierPage() {
  const { store, add, update, remove } = useParametres()
  const rows = store.baremes1
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Bareme1Item | null>(null)
  const [form, setForm] = useState(EMPTY_BAREME1)
  const [sortKey, setSortKey] = useState<'grade' | 'base'>('grade')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sortedRows = useMemo(() => {
    const list = [...rows]
    list.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'grade') {
        cmp = (a.grade || '').localeCompare(b.grade || '', 'fr', {
          numeric: true,
          sensitivity: 'base',
        })
        if (cmp === 0) {
          cmp = compareBaremeNumber(a.base, b.base)
        }
      } else {
        cmp = compareBaremeNumber(a.base, b.base)
        if (cmp === 0) {
          cmp = (a.grade || '').localeCompare(b.grade || '', 'fr', {
            numeric: true,
            sensitivity: 'base',
          })
        }
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [rows, sortDir, sortKey])

  function handleSort(key: string) {
    if (key !== 'grade' && key !== 'base') return
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_BAREME1)
    setOpen(true)
  }

  function openEdit(row: Bareme1Item) {
    if (row.valide) {
      window.alert(
        'Cette ligne du Barème 1 est validée et ne peut plus être modifiée.',
      )
      return
    }
    setEditing(row)
    setForm(withoutMeta(row))
    setOpen(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing?.valide) {
      window.alert(
        'Cette ligne du Barème 1 est validée et ne peut plus être modifiée.',
      )
      return
    }
    if (editing) update('baremes1', editing.id, { ...form, valide: false })
    else add('baremes1', { ...form, valide: false })
    setOpen(false)
  }

  function set<K extends keyof typeof EMPTY_BAREME1>(
    key: K,
    value: (typeof EMPTY_BAREME1)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <FichierCrudShell
        className="bareme1-fichier-page"
        title="Barème 1"
        description="Grille de paie par grade : base, indemnités et retenues."
        listTitle={'Liste — Barème 1\u00A0\u00A0\u00A0(en USD)'}
        count={rows.length}
        onAdd={openCreate}
        addLabel="Nouvelle ligne Barème 1"
        AddIcon={Plus}
        ListIcon={Scale}
      >
        <DataTable
          rows={sortedRows}
          emptyMessage="Aucune ligne de barème enregistrée."
          onEdit={openEdit}
          onDelete={(row) => remove('baremes1', row.id)}
          isRowLocked={(row) => Boolean(row.valide)}
          rowLockedTitle="Barème 1 validé — non modifiable"
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          columns={[
            {
              key: 'grade',
              header: 'Grade',
              sortable: true,
              render: (r) => <code className="id-code">{r.grade || '—'}</code>,
            },
            {
              key: 'libelleGrade',
              header: 'Libellé grade',
              render: (r) => r.libelleGrade || '—',
            },
            {
              key: 'base',
              header: 'Base',
              sortable: true,
              render: (r) => r.base || '—',
            },
            { key: 'logement', header: 'Logement', render: (r) => r.logement || '—' },
            { key: 'transport', header: 'Transport', render: (r) => r.transport || '—' },
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
      </FichierCrudShell>

      <FormModal
        open={open}
        title={editing ? 'Modifier — Barème 1' : 'Nouvelle ligne — Barème 1'}
        subtitle="Fichier BAREME1 — grille par grade"
        panelClassName="form-dock-panel-entreprise"
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      >
        <Field label="Grade">
          <input
            required
            value={form.grade}
            onChange={(e) => set('grade', e.target.value)}
            placeholder="Ex. C3"
          />
        </Field>
        <Field label="Libellé grade">
          <input
            required
            value={form.libelleGrade}
            onChange={(e) => set('libelleGrade', e.target.value)}
            placeholder="Ex. Chef de Bureau"
          />
        </Field>
        <Field label="Base">
          <input value={form.base} onChange={(e) => set('base', e.target.value)} />
        </Field>
        <Field label="Logement">
          <input
            value={form.logement}
            onChange={(e) => set('logement', e.target.value)}
          />
        </Field>
        <Field label="Transport">
          <input
            value={form.transport}
            onChange={(e) => set('transport', e.target.value)}
          />
        </Field>
        <Field label="Jours du mois">
          <input
            value={form.jourDuMois}
            onChange={(e) => set('jourDuMois', e.target.value)}
          />
        </Field>
        <Field label="Jours de congé">
          <input
            value={form.joursDeConge}
            onChange={(e) => set('joursDeConge', e.target.value)}
          />
        </Field>
        <Field label="Retenue CNSS">
          <input
            value={form.retenueCnss}
            onChange={(e) => set('retenueCnss', e.target.value)}
          />
        </Field>
        <Field label="Retenue IPR">
          <input
            value={form.retenueIpr}
            onChange={(e) => set('retenueIpr', e.target.value)}
          />
        </Field>
        <Field label="Retenue INPP">
          <input
            value={form.retenueInpp}
            onChange={(e) => set('retenueInpp', e.target.value)}
          />
        </Field>
      </FormModal>
    </>
  )
}

const EMPTY_BAREME2: Omit<Bareme2Item, 'id' | 'createdAt'> = {
  grade: '',
  base: '',
  logement: '',
  transport: '',
  brute: '',
  ipr3: '',
  cnss5: '',
  valide: false,
}

export function Bareme2FichierPage() {
  const { store, add, update, remove } = useParametres()
  const rows = store.baremes2
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Bareme2Item | null>(null)
  const [form, setForm] = useState(EMPTY_BAREME2)
  const [sortKey, setSortKey] = useState<'grade' | 'base'>('grade')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')

  const sortedRows = useMemo(() => {
    const list = [...rows]
    list.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'grade') {
        cmp = (a.grade || '').localeCompare(b.grade || '', 'fr', {
          numeric: true,
          sensitivity: 'base',
        })
        if (cmp === 0) {
          cmp = compareBaremeNumber(a.base, b.base)
        }
      } else {
        cmp = compareBaremeNumber(a.base, b.base)
        if (cmp === 0) {
          cmp = (a.grade || '').localeCompare(b.grade || '', 'fr', {
            numeric: true,
            sensitivity: 'base',
          })
        }
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return list
  }, [rows, sortDir, sortKey])

  function handleSort(key: string) {
    if (key !== 'grade' && key !== 'base') return
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_BAREME2)
    setOpen(true)
  }

  function openEdit(row: Bareme2Item) {
    if (row.valide) {
      window.alert(
        'Cette ligne du Barème 2 est validée et ne peut plus être modifiée.',
      )
      return
    }
    setEditing(row)
    setForm(withoutMeta(row))
    setOpen(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing?.valide) {
      window.alert(
        'Cette ligne du Barème 2 est validée et ne peut plus être modifiée.',
      )
      return
    }
    if (editing) update('baremes2', editing.id, { ...form, valide: false })
    else add('baremes2', { ...form, valide: false })
    setOpen(false)
  }

  function set<K extends keyof typeof EMPTY_BAREME2>(
    key: K,
    value: (typeof EMPTY_BAREME2)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <FichierCrudShell
        className="bareme2-fichier-page"
        title="Barème 2"
        description="Grille de paie par grade : base, indemnités, brute, IPR 3% et CNSS 5%."
        listTitle={'Liste — Barème 2\u00A0\u00A0\u00A0(en CDF )'}
        count={rows.length}
        onAdd={openCreate}
        addLabel="Nouvelle ligne Barème 2"
        AddIcon={Plus}
        ListIcon={Scale}
      >
        <DataTable
          rows={sortedRows}
          emptyMessage="Aucune ligne de barème enregistrée."
          onEdit={openEdit}
          onDelete={(row) => remove('baremes2', row.id)}
          isRowLocked={(row) => Boolean(row.valide)}
          rowLockedTitle="Barème 2 validé — non modifiable"
          sortKey={sortKey}
          sortDir={sortDir}
          onSort={handleSort}
          columns={[
            {
              key: 'grade',
              header: 'Grade',
              sortable: true,
              render: (r) => <code className="id-code">{r.grade || '—'}</code>,
            },
            {
              key: 'base',
              header: 'Base',
              sortable: true,
              render: (r) => r.base || '—',
            },
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
            { key: 'brute', header: 'Brute', render: (r) => r.brute || '—' },
            { key: 'ipr3', header: 'IPR 3%', render: (r) => r.ipr3 || '—' },
            { key: 'cnss5', header: 'CNSS 5%', render: (r) => r.cnss5 || '—' },
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
      </FichierCrudShell>

      <FormModal
        open={open}
        title={editing ? 'Modifier — Barème 2' : 'Nouvelle ligne — Barème 2'}
        subtitle="Fichier BAREME2 — grille par grade"
        panelClassName="form-dock-panel-entreprise"
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      >
        <Field label="Grade">
          <input
            required
            value={form.grade}
            onChange={(e) => set('grade', e.target.value)}
            placeholder="Ex. C3"
          />
        </Field>
        <Field label="Base">
          <input value={form.base} onChange={(e) => set('base', e.target.value)} />
        </Field>
        <Field label="Logement">
          <input
            value={form.logement}
            onChange={(e) => set('logement', e.target.value)}
          />
        </Field>
        <Field label="Transport">
          <input
            value={form.transport}
            onChange={(e) => set('transport', e.target.value)}
          />
        </Field>
        <Field label="Brute">
          <input value={form.brute} onChange={(e) => set('brute', e.target.value)} />
        </Field>
        <Field label="IPR 3%">
          <input value={form.ipr3} onChange={(e) => set('ipr3', e.target.value)} />
        </Field>
        <Field label="CNSS 5%">
          <input value={form.cnss5} onChange={(e) => set('cnss5', e.target.value)} />
        </Field>
      </FormModal>
    </>
  )
}

const EMPTY_PERIODE: Omit<PeriodeItem, 'id' | 'createdAt'> = {
  code: '',
  libelle: '',
  dateDebut: '',
  dateFin: '',
  description: '',
  statut: 'actif',
}

export function PeriodeFichierPage() {
  const { store, add, update, remove } = useParametres()
  const rows = store.periodes
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<PeriodeItem | null>(null)
  const [form, setForm] = useState(EMPTY_PERIODE)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_PERIODE)
    setOpen(true)
  }

  function openEdit(row: PeriodeItem) {
    setEditing(row)
    setForm(withoutMeta(row))
    setOpen(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing) update('periodes', editing.id, form)
    else add('periodes', form)
    setOpen(false)
  }

  return (
    <>
      <FichierCrudShell
        title="Période"
        description="Périodes et exercices de gestion."
        listTitle="Liste — Périodes"
        count={rows.length}
        onAdd={openCreate}
        addLabel="Nouvelle période"
        AddIcon={Plus}
        ListIcon={CalendarRange}
      >
        <DataTable
          rows={[...rows].reverse()}
          emptyMessage="Aucune période enregistrée."
          onEdit={openEdit}
          onDelete={(row) => remove('periodes', row.id)}
          columns={[
            { key: 'code', header: 'Code', render: (r) => <code className="id-code">{r.code}</code> },
            { key: 'libelle', header: 'Libellé', render: (r) => <strong>{r.libelle}</strong> },
            {
              key: 'dates',
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
      </FichierCrudShell>

      <FormModal
        open={open}
        title={editing ? 'Modifier la période' : 'Nouvelle période'}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      >
        <Field label="Code">
          <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </Field>
        <Field label="Libellé">
          <input
            required
            value={form.libelle}
            onChange={(e) => setForm({ ...form, libelle: e.target.value })}
          />
        </Field>
        <Field label="Date début">
          <input
            type="date"
            value={form.dateDebut}
            onChange={(e) => setForm({ ...form, dateDebut: e.target.value })}
          />
        </Field>
        <Field label="Date fin">
          <input
            type="date"
            value={form.dateFin}
            onChange={(e) => setForm({ ...form, dateFin: e.target.value })}
          />
        </Field>
        <Field label="Description" full>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Statut">
          <select
            value={form.statut}
            onChange={(e) => setForm({ ...form, statut: e.target.value as RefStatut })}
          >
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
        </Field>
      </FormModal>
    </>
  )
}

const EMPTY_MONNAIE: Omit<MonnaieItem, 'id' | 'createdAt'> = {
  code: '',
  libelle: '',
  symbole: '',
  description: '',
  statut: 'actif',
}

export function MonnaieFichierPage() {
  const { store, add, update, remove } = useParametres()
  const rows = store.monnaies
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<MonnaieItem | null>(null)
  const [form, setForm] = useState(EMPTY_MONNAIE)

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_MONNAIE)
    setOpen(true)
  }

  function openEdit(row: MonnaieItem) {
    setEditing(row)
    setForm(withoutMeta(row))
    setOpen(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing) update('monnaies', editing.id, form)
    else add('monnaies', form)
    setOpen(false)
  }

  return (
    <>
      <FichierCrudShell
        title="Monnaie"
        description="Devises utilisées dans l’application."
        listTitle="Liste — Monnaies"
        count={rows.length}
        onAdd={openCreate}
        addLabel="Nouvelle monnaie"
        AddIcon={Plus}
        ListIcon={Coins}
      >
        <DataTable
          rows={[...rows].reverse()}
          emptyMessage="Aucune monnaie enregistrée."
          onEdit={openEdit}
          onDelete={(row) => remove('monnaies', row.id)}
          columns={[
            { key: 'code', header: 'Code', render: (r) => <code className="id-code">{r.code}</code> },
            { key: 'libelle', header: 'Libellé', render: (r) => <strong>{r.libelle}</strong> },
            { key: 'symbole', header: 'Symbole', render: (r) => r.symbole || '—' },
            {
              key: 'statut',
              header: 'Statut',
              render: (r) => <span className={`badge badge-${r.statut}`}>{r.statut}</span>,
            },
          ]}
        />
      </FichierCrudShell>

      <FormModal
        open={open}
        title={editing ? 'Modifier la monnaie' : 'Nouvelle monnaie'}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      >
        <Field label="Code">
          <input required value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
        </Field>
        <Field label="Libellé">
          <input
            required
            value={form.libelle}
            onChange={(e) => setForm({ ...form, libelle: e.target.value })}
          />
        </Field>
        <Field label="Symbole">
          <input
            required
            value={form.symbole}
            onChange={(e) => setForm({ ...form, symbole: e.target.value })}
          />
        </Field>
        <Field label="Description" full>
          <input
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
        </Field>
        <Field label="Statut">
          <select
            value={form.statut}
            onChange={(e) => setForm({ ...form, statut: e.target.value as RefStatut })}
          >
            <option value="actif">Actif</option>
            <option value="inactif">Inactif</option>
          </select>
        </Field>
      </FormModal>
    </>
  )
}

const EMPTY_TAUX_MONNAIE: Omit<TauxMonnaieItem, 'id' | 'createdAt'> = {
  dateTaux: '',
  monnaieUsd: '1',
  montantCdf: '',
  montantEuro: '',
  observation: '',
}

function formatTauxDateFr(value: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('fr-FR')
}

export function TauxMonnaieFichierPage() {
  const { store, add, update, remove, setCollection } = useParametres()
  const rows = store.tauxMonnaies
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<TauxMonnaieItem | null>(null)
  const [form, setForm] = useState(EMPTY_TAUX_MONNAIE)

  const sortedRows = useMemo(() => {
    return [...rows].sort((a, b) =>
      (b.dateTaux || '').localeCompare(a.dateTaux || '', 'fr'),
    )
  }, [rows])

  function openCreate() {
    setEditing(null)
    setForm(EMPTY_TAUX_MONNAIE)
    setOpen(true)
  }

  function openEdit(row: TauxMonnaieItem) {
    setEditing(row)
    setForm(withoutMeta(row))
    setOpen(true)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const declareEnCours = isTauxMonnaieEnCours(form)

    if (declareEnCours) {
      const nextRows = rows.map((row) => {
        if (editing && row.id === editing.id) {
          return { ...row, ...form, id: row.id }
        }
        if (isTauxMonnaieEnCours(row)) {
          return { ...row, observation: '' }
        }
        return row
      })
      if (!editing) {
        nextRows.push({
          ...form,
          id: createId(),
          createdAt: new Date().toISOString(),
        })
      }
      setCollection('tauxMonnaies', nextRows)
    } else if (editing) {
      update('tauxMonnaies', editing.id, form)
    } else {
      add('tauxMonnaies', form)
    }
    setOpen(false)
  }

  function set<K extends keyof typeof EMPTY_TAUX_MONNAIE>(
    key: K,
    value: (typeof EMPTY_TAUX_MONNAIE)[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  return (
    <>
      <FichierCrudShell
        title="Taux Monnaie"
        description={
          'Fichier des taux de change (USD / CDF / EURO) qui alimente le « Choix de taux » en préparation de paie. ' +
          `Un seul taux doit être déclaré « En cours » (OBSERVATION = « ${TAUX_EN_COURS_LABEL} »).`
        }
        listTitle="Liste — Taux Monnaie"
        count={rows.length}
        onAdd={openCreate}
        addLabel="Nouveau taux"
        AddIcon={Plus}
        ListIcon={Banknote}
      >
        <DataTable
          rows={sortedRows}
          emptyMessage="Aucun taux de monnaie enregistré."
          onEdit={openEdit}
          onDelete={(row) => remove('tauxMonnaies', row.id)}
          columns={[
            {
              key: 'dateTaux',
              header: 'DTETAUX',
              render: (r) => formatTauxDateFr(r.dateTaux),
            },
            {
              key: 'monnaieUsd',
              header: 'MONNAIE USD',
              render: (r) => r.monnaieUsd || '—',
            },
            {
              key: 'montantCdf',
              header: 'MONTANT CDF',
              render: (r) => r.montantCdf || '—',
            },
            {
              key: 'montantEuro',
              header: 'MONTANT EURO',
              render: (r) => r.montantEuro || '—',
            },
            {
              key: 'observation',
              header: 'OBSERVATION',
              render: (r) =>
                isTauxMonnaieEnCours(r) ? (
                  <span className="taux-en-cours-badge">{r.observation}</span>
                ) : (
                  r.observation || '—'
                ),
            },
          ]}
        />
      </FichierCrudShell>

      <FormModal
        open={open}
        title={editing ? 'Modifier — Taux Monnaie' : 'Nouveau — Taux Monnaie'}
        subtitle="Fichier Taux Monnaie — taux de change (Choix de taux)"
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
      >
        <Field label="DTETAUX">
          <input
            required
            type="date"
            value={form.dateTaux}
            onChange={(e) => set('dateTaux', e.target.value)}
          />
        </Field>
        <Field label="MONNAIE USD">
          <input
            required
            value={form.monnaieUsd}
            onChange={(e) => set('monnaieUsd', e.target.value)}
            placeholder="1"
          />
        </Field>
        <Field label="MONTANT CDF">
          <input
            required
            value={form.montantCdf}
            onChange={(e) => set('montantCdf', e.target.value)}
            placeholder="Ex. 2800.00"
          />
        </Field>
        <Field label="MONTANT EURO">
          <input
            value={form.montantEuro}
            onChange={(e) => set('montantEuro', e.target.value)}
            placeholder="Ex. 0.00"
          />
        </Field>
        <Field label="OBSERVATION" full>
          <input
            value={form.observation}
            onChange={(e) => set('observation', e.target.value)}
            placeholder={`Ex. ${TAUX_EN_COURS_LABEL}`}
          />
          <span className="field-help">
            Saisir « {TAUX_EN_COURS_LABEL} » pour le taux applicable à la paie
            (un seul à la fois).
          </span>
        </Field>
      </FormModal>
    </>
  )
}

export function PlaceholderToolPage({
  title,
  text,
}: {
  title: string
  text: string
}) {
  return (
    <header className="page-header">
      <div>
        <p className="eyebrow">Paramètres & Sécurité</p>
        <h1>{title}</h1>
        <p className="lede">{text}</p>
      </div>
    </header>
  )
}

/** Conservé pour compat éventuelle — préférer FichierCrudShell. */
export function FichierPageShell({
  title,
  description,
  children,
}: {
  title: string
  description: string
  children: ReactNode
}) {
  return (
    <>
      <header className="page-header param-fichier-header">
        <div>
          <p className="eyebrow">Fichiers</p>
          <h1>{title}</h1>
          <p className="lede">{description}</p>
        </div>
      </header>
      {children}
    </>
  )
}
