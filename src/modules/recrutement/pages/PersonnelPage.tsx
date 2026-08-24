import { BookmarkCheck, ChevronLeft, ChevronRight, Printer, Trash2, UserPlus, Users } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import {
  createEmptyPersonnel,
  generateMatricule,
  NATIONALITES,
  PERSONNEL_WIZARD_STEPS,
  personnelStatutLibelle,
  refCode,
  refLibelle,
  refLibelleSeul,
  type PersonnelFormState,
} from '../personnelConstants'
import {
  clearPersonnelDraft,
  loadPersonnelDraft,
  savePersonnelDraft,
  type PersonnelDraft,
} from '../personnelDraft'
import { DataTable, type SortDir } from '../components/DataTable'
import { Field, RadioGroup } from '../components/FormFields'
import { PhotoField } from '../components/PhotoField'
import { PersonnelFicheModal } from '../components/PersonnelFicheModal'
import { WizardModal } from '../components/WizardModal'
import { useRecrutement } from '../RecrutementContext'
import { loadParametresStore } from '../../parametres/storage'
import type { Personnel, SexePersonnel } from '../types'

function toFormState(row: Personnel): PersonnelFormState {
  const { id: _id, createdAt: _createdAt, ...rest } = row
  return { ...createEmptyPersonnel(), ...rest }
}

function activeRefs<T extends { statut: string }>(items: T[]) {
  const active = items.filter((i) => i.statut === 'actif' || i.statut === 'active')
  return active.length ? active : items
}

function formatDateFr(value: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('fr-FR')
}

function optionLabel(item: { code?: string; libelle: string }) {
  return item.code ? `${item.code} — ${item.libelle}` : item.libelle
}

type PersonnelSortKey = 'matricule' | 'nom' | 'grade'

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

function compareText(a: string, b: string) {
  return a.localeCompare(b, 'fr', { numeric: true, sensitivity: 'base' })
}

export function PersonnelPage() {
  const { store, add, update, remove } = useRecrutement()
  const refs = useMemo(() => loadParametresStore(), [store.personnel.length])
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [editing, setEditing] = useState<Personnel | null>(null)
  const [form, setForm] = useState<PersonnelFormState>(() => createEmptyPersonnel())
  const [draft, setDraft] = useState<PersonnelDraft | null>(() => loadPersonnelDraft())
  const [draftFlash, setDraftFlash] = useState<string | null>(null)
  const [fichePersonnel, setFichePersonnel] = useState<Personnel | null>(null)
  const [sortKey, setSortKey] = useState<PersonnelSortKey>('matricule')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [printOrientation, setPrintOrientation] = useState<
    'portrait' | 'landscape'
  >('landscape')
  const [printZoom, setPrintZoom] = useState(80)
  const tableAreaRef = useRef<HTMLDivElement>(null)
  const printStyleRef = useRef<HTMLStyleElement | null>(null)

  function scrollTableHorizontal(direction: 'prev' | 'next') {
    const wrap = tableAreaRef.current?.querySelector(
      '.table-wrap',
    ) as HTMLElement | null
    if (!wrap) return
    const step = Math.max(240, Math.floor(wrap.clientWidth * 0.65))
    wrap.scrollBy({
      left: direction === 'prev' ? -step : step,
      behavior: 'smooth',
    })
  }

  function clearPrintStyle() {
    printStyleRef.current?.remove()
    printStyleRef.current = null
    document.getElementById('personnel-list-print-style')?.remove()
  }

  function printList() {
    clearPrintStyle()
    const zoom = Math.min(200, Math.max(40, Number(printZoom) || 100))
    const style = document.createElement('style')
    style.id = 'personnel-list-print-style'
    style.textContent = `
      @media print {
        @page {
          size: A4 ${printOrientation};
          margin: 0.6cm;
        }
        .print-personnel-list {
          zoom: ${zoom}%;
        }
        .print-personnel-list .data-table {
          min-width: 0 !important;
          font-size: ${zoom >= 90 ? '0.72rem' : '0.65rem'};
        }
      }
    `
    document.head.appendChild(style)
    printStyleRef.current = style

    const cleanup = () => {
      clearPrintStyle()
      window.removeEventListener('afterprint', cleanup)
    }
    window.addEventListener('afterprint', cleanup)
    window.print()
  }

  useEffect(() => {
    return () => clearPrintStyle()
  }, [])

  const sortedPersonnel = useMemo(() => {
    const rows = [...store.personnel]
    rows.sort((a, b) => {
      let cmp = 0
      if (sortKey === 'matricule') {
        cmp = compareMatricule(a.matricule || '', b.matricule || '')
      } else if (sortKey === 'nom') {
        cmp = compareNom(a, b)
      } else {
        cmp = compareText(
          refCode(refs.grades, a.gradeId),
          refCode(refs.grades, b.gradeId),
        )
        if (cmp === 0) cmp = compareMatricule(a.matricule || '', b.matricule || '')
      }
      return sortDir === 'asc' ? cmp : -cmp
    })
    return rows
  }, [refs.grades, sortDir, sortKey, store.personnel])

  function handleSort(key: string) {
    if (key !== 'matricule' && key !== 'nom' && key !== 'grade') return
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
      return
    }
    setSortKey(key)
    setSortDir('asc')
  }

  const grades = activeRefs(refs.grades)
  const fonctions = activeRefs(refs.fonctions)
  const niveaux = activeRefs(refs.niveauxEtudes)
  const sites = activeRefs(refs.sitesAffectation)
  const directions = activeRefs(refs.directions)
  const statuts = activeRefs(refs.statutsPersonnel)
  const comptes = activeRefs(refs.comptesComptables)
  const typesContrats = activeRefs(refs.typesContrats)
  const periodes = activeRefs(refs.periodes)
  const entreprises = refs.entreprises.filter((e) => e.statut === 'active').length
    ? refs.entreprises.filter((e) => e.statut === 'active')
    : refs.entreprises

  useEffect(() => {
    if (!draftFlash) return
    const t = window.setTimeout(() => setDraftFlash(null), 2800)
    return () => window.clearTimeout(t)
  }, [draftFlash])

  function set<K extends keyof PersonnelFormState>(key: K, value: PersonnelFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function openCreate(fromScratch = false) {
    if (!fromScratch) {
      const existing = loadPersonnelDraft()
      if (existing && !existing.editingId) {
        setEditing(null)
        setForm(existing.form)
        setStep(existing.step)
        setDraft(existing)
        setOpen(true)
        return
      }
    }
    clearPersonnelDraft()
    setDraft(null)
    setEditing(null)
    setStep(1)
    const empty = createEmptyPersonnel(generateMatricule(store.personnel))
    empty.entrepriseId = entreprises[0]?.id ?? ''
    empty.statutId = statuts[0]?.id ?? ''
    setForm(empty)
    setOpen(true)
  }

  function resumeDraft() {
    const existing = loadPersonnelDraft()
    if (!existing) return
    if (existing.editingId) {
      const row = store.personnel.find((p) => p.id === existing.editingId) ?? null
      if (row?.valide) {
        window.alert(
          'Cet enregistrement personnel est validé et ne peut plus être modifié. Le brouillon a été ignoré.',
        )
        clearPersonnelDraft()
        setDraft(null)
        return
      }
      setEditing(row)
    } else {
      setEditing(null)
    }
    setForm(existing.form)
    setStep(existing.step)
    setDraft(existing)
    setOpen(true)
  }

  function discardDraft() {
    clearPersonnelDraft()
    setDraft(null)
  }

  function openEdit(row: Personnel) {
    if (row.valide) {
      window.alert(
        'Cet enregistrement personnel est validé et ne peut plus être modifié.',
      )
      return
    }
    clearPersonnelDraft()
    setDraft(null)
    setEditing(row)
    setForm(toFormState(row))
    setStep(1)
    setOpen(true)
  }

  function saveDraft() {
    const saved = savePersonnelDraft({
      form,
      step,
      editingId: editing?.id ?? null,
    })
    setDraft(saved)
    setDraftFlash('Brouillon enregistré')
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (editing?.valide) {
      window.alert(
        'Cet enregistrement personnel est validé et ne peut plus être modifié.',
      )
      return
    }
    if (!form.nom.trim() || !form.prenom.trim()) {
      window.alert('Le nom et le prénom sont obligatoires.')
      setStep(1)
      return
    }
    const now = new Date().toISOString()
    const payload = { ...form, updatedAt: now }
    if (editing) update('personnel', editing.id, payload)
    else add('personnel', payload)
    clearPersonnelDraft()
    setDraft(null)
    setOpen(false)
  }

  return (
    <div className="admin-page personnel-page">
      <header className="page-header admin-page-header">
        <div>
          <p className="eyebrow">Capture Info</p>
          <h1>Enregistrement du personnel</h1>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="btn-primary admin-cta" onClick={() => openCreate(true)}>
            <span className="admin-cta-icon" aria-hidden>
              <UserPlus size={18} />
            </span>
            Nouveau personnel
          </button>
        </div>
      </header>

      {draft && (
        <div className="draft-banner" role="status">
          <div>
            <strong>Brouillon disponible</strong>
            <p>
              Dernière sauvegarde le{' '}
              {new Date(draft.savedAt).toLocaleString('fr-FR')}
              {draft.editingId ? ' (modification en cours)' : ''}.
            </p>
          </div>
          <div className="draft-banner-actions">
            <button type="button" className="btn-primary" onClick={resumeDraft}>
              Reprendre
            </button>
            <button type="button" className="btn-ghost" onClick={discardDraft}>
              <Trash2 size={16} />
              Supprimer
            </button>
          </div>
        </div>
      )}

      {draftFlash && (
        <p className="draft-flash" role="status">
          <BookmarkCheck size={16} />
          {draftFlash}
        </p>
      )}

      <section
        className="admin-list-panel print-personnel-list"
        aria-labelledby="liste-personnel-title"
      >
        <div className="admin-list-head personnel-list-head">
          <div className="admin-list-title">
            <span className="admin-list-icon" aria-hidden>
              <Users size={18} />
            </span>
            <div>
              <h2 id="liste-personnel-title">Liste du personnel</h2>
              <p>
                {store.personnel.length} enregistrement
                {store.personnel.length > 1 ? 's' : ''}
              </p>
            </div>
          </div>

          <div
            className="paie-mensuelle-b2-scroll-btns personnel-list-scroll-btns no-print"
            role="group"
            aria-label="Défilement horizontal du tableau"
          >
            <button
              type="button"
              className="paie-mensuelle-b2-scroll-btn"
              title="Précédent"
              aria-label="Précédent"
              onClick={() => scrollTableHorizontal('prev')}
            >
              <ChevronLeft size={15} aria-hidden />
              <span>Précédent</span>
            </button>
            <button
              type="button"
              className="paie-mensuelle-b2-scroll-btn"
              title="Suivant"
              aria-label="Suivant"
              onClick={() => scrollTableHorizontal('next')}
            >
              <span>Suivant</span>
              <ChevronRight size={15} aria-hidden />
            </button>
          </div>

          <div
            className="personnel-list-print-toolbar no-print"
            role="group"
            aria-label="Mise en page et impression"
          >
            <fieldset className="feuille-print-orientation">
              <legend>Mise en page</legend>
              <div className="feuille-print-orientation-options">
                <label className="feuille-print-orientation-option">
                  <input
                    type="radio"
                    name="personnel-print-orientation"
                    value="portrait"
                    checked={printOrientation === 'portrait'}
                    onChange={() => setPrintOrientation('portrait')}
                  />
                  Portrait
                </label>
                <label className="feuille-print-orientation-option">
                  <input
                    type="radio"
                    name="personnel-print-orientation"
                    value="landscape"
                    checked={printOrientation === 'landscape'}
                    onChange={() => setPrintOrientation('landscape')}
                  />
                  Paysage
                </label>
              </div>
            </fieldset>

            <label className="paie-mensuelle-b1-field feuille-print-zoom">
              <span>Zoom impression</span>
              <select
                value={printZoom}
                onChange={(e) => setPrintZoom(Number(e.target.value))}
                aria-label="Zoom d’impression"
              >
                {[50, 60, 70, 75, 80, 85, 90, 95, 100, 110, 120].map((z) => (
                  <option key={z} value={z}>
                    {z} %
                  </option>
                ))}
              </select>
            </label>

            <button type="button" className="btn-print" onClick={printList}>
              <Printer size={16} />
              Imprimer la liste
            </button>
          </div>
        </div>

        <div ref={tableAreaRef} className="personnel-list-table-area">
          <DataTable
            rows={sortedPersonnel}
            emptyMessage="Aucun personnel enregistré. Cliquez sur « Nouveau personnel »."
            onEdit={openEdit}
            onDelete={(row) => remove('personnel', row.id)}
            isRowLocked={(row) => Boolean(row.valide)}
            rowLockedTitle="Personnel validé — non modifiable"
            onPrint={(row) => setFichePersonnel(row)}
            sortKey={sortKey}
            sortDir={sortDir}
            onSort={handleSort}
            columns={[
            {
              key: 'photo',
              header: 'Photo',
              className: 'no-print',
              render: (r) =>
                r.photo?.dataUrl ? (
                  <img
                    className="personnel-list-photo"
                    src={r.photo.dataUrl}
                    alt=""
                  />
                ) : (
                  '—'
                ),
            },
            {
              key: 'matricule',
              header: 'Matricule',
              sortable: true,
              render: (r) => <code className="id-code">{r.matricule || '—'}</code>,
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
              key: 'dateNaissance',
              header: 'Date de naissance',
              render: (r) => formatDateFr(r.dateNaissance),
            },
            {
              key: 'nationalite',
              header: 'Nationalité',
              render: (r) => r.nationalite || '—',
            },
            {
              key: 'dateEngagement',
              header: 'Date engagement',
              render: (r) => formatDateFr(r.dateEngagement),
            },
            {
              key: 'grade',
              header: 'Grade',
              sortable: true,
              render: (r) => {
                const code = refCode(refs.grades, r.gradeId)
                return code ? <code className="id-code">{code}</code> : '—'
              },
            },
            {
              key: 'fonction',
              header: 'Fonction AG',
              render: (r) => refLibelleSeul(refs.fonctions, r.fonctionId) || '—',
            },
            {
              key: 'niveauEtudes',
              header: 'Niveau d’études',
              render: (r) => refLibelle(refs.niveauxEtudes, r.niveauEtudesId) || '—',
            },
            {
              key: 'entreprise',
              header: 'Entreprise',
              render: (r) => {
                const e = refs.entreprises.find((x) => x.id === r.entrepriseId)
                if (!e) return '—'
                return e.sigle ? `${e.sigle} — ${e.raisonSociale}` : e.raisonSociale
              },
            },
            {
              key: 'site',
              header: 'Site de travail',
              render: (r) => refLibelle(refs.sitesAffectation, r.siteTravailId) || '—',
            },
            {
              key: 'periode',
              header: 'Période',
              render: (r) => refLibelle(refs.periodes, r.periodeId) || '—',
            },
            {
              key: 'direction',
              header: 'Direction',
              render: (r) => refLibelle(refs.directions, r.directionId) || '—',
            },
            {
              key: 'statut',
              header: 'Statut',
              render: (r) => {
                const label =
                  personnelStatutLibelle(refs.statutsPersonnel, r.statutId) ||
                  '—'
                return <span className="badge badge-role">{label}</span>
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
                  aria-label={
                    r.valide
                      ? 'Personnel validé pour la paie'
                      : 'Personnel non validé'
                  }
                />
              ),
            },
            {
              key: 'typeContrat',
              header: 'Type de contrat',
              render: (r) => refLibelle(refs.typesContrats, r.typeContratId) || '—',
            },
            {
              key: 'compteComptable',
              header: 'Compte comptable',
              render: (r) =>
                refLibelle(refs.comptesComptables, r.compteComptableId) || '—',
            },
            {
              key: 'telephone',
              header: 'Téléphone',
              render: (r) => r.telephone || '—',
            },
            {
              key: 'email',
              header: 'Email',
              render: (r) => r.email || '—',
            },
            {
              key: 'compte1',
              header: 'N° compte bancaire 1',
              render: (r) => r.numeroCompteBancaire1 || '—',
            },
            {
              key: 'compte2',
              header: 'N° compte bancaire 2',
              render: (r) => r.numeroCompteBancaire2 || '—',
            },
            {
              key: 'cnss',
              header: 'Immatriculation CNSS',
              render: (r) => r.numeroCnss || '—',
            },
          ]}
        />
        </div>
      </section>

      <WizardModal
        open={open}
        title={editing ? 'Modifier le personnel' : 'Nouveau personnel'}
        steps={PERSONNEL_WIZARD_STEPS}
        step={step}
        onStepChange={setStep}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        onSaveDraft={saveDraft}
        panelClassName="wizard-panel-personnel"
      >
        <div className={`wizard-slide ${step === 1 ? 'is-active' : ''}`}>
          <div className="form-grid">
            <p className="wizard-step-hint">
              Étape 1/3 — Identité civile et photo de l’agent.
            </p>
            <PhotoField
              label="Photo de l’agent"
              value={form.photo}
              onChange={(file) => set('photo', file)}
              full
            />
            <Field label="Matricule" hint="Généré automatiquement — modifiable">
              <input
                required={step === 1}
                value={form.matricule}
                onChange={(e) => set('matricule', e.target.value)}
              />
            </Field>
            <Field label="Nom">
              <input
                required={step === 1}
                value={form.nom}
                onChange={(e) => set('nom', e.target.value)}
              />
            </Field>
            <Field label="Postnom">
              <input value={form.postnom} onChange={(e) => set('postnom', e.target.value)} />
            </Field>
            <Field label="Prénom">
              <input
                required={step === 1}
                value={form.prenom}
                onChange={(e) => set('prenom', e.target.value)}
              />
            </Field>
            <RadioGroup
              label="Sexe"
              name="sexe"
              value={form.sexe}
              onChange={(v) => set('sexe', v as SexePersonnel)}
              options={[
                { value: 'Masculin', label: 'Masculin' },
                { value: 'Féminin', label: 'Féminin' },
              ]}
            />
            <Field label="Date de naissance">
              <input
                type="date"
                value={form.dateNaissance}
                onChange={(e) => set('dateNaissance', e.target.value)}
              />
            </Field>
            <Field label="Nationalité">
              <select
                value={form.nationalite}
                onChange={(e) => set('nationalite', e.target.value)}
              >
                {NATIONALITES.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className={`wizard-slide ${step === 2 ? 'is-active' : ''}`}>
          <div className="form-grid">
            <p className="wizard-step-hint">
              Étape 2/3 — Affectation et rattachement aux fichiers pères.
            </p>
            <Field label="Date d’engagement">
              <input
                type="date"
                value={form.dateEngagement}
                onChange={(e) => set('dateEngagement', e.target.value)}
              />
            </Field>
            <Field label="Grade">
              <select
                required={step === 2}
                value={form.gradeId}
                onChange={(e) => set('gradeId', e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {grades.map((g) => (
                  <option key={g.id} value={g.id}>
                    {optionLabel(g)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Fonction AG">
              <select
                required={step === 2}
                value={form.fonctionId}
                onChange={(e) => set('fonctionId', e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {fonctions.map((f) => (
                  <option key={f.id} value={f.id}>
                    {optionLabel(f)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Niveau d’études">
              <select
                value={form.niveauEtudesId}
                onChange={(e) => set('niveauEtudesId', e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {niveaux.map((n) => (
                  <option key={n.id} value={n.id}>
                    {optionLabel(n)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Entreprise">
              <select
                required={step === 2}
                value={form.entrepriseId}
                onChange={(e) => set('entrepriseId', e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {entreprises.map((e) => (
                  <option key={e.id} value={e.id}>
                    {e.sigle ? `${e.sigle} — ${e.raisonSociale}` : e.raisonSociale}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Site de travail">
              <select
                value={form.siteTravailId}
                onChange={(e) => set('siteTravailId', e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {sites.map((s) => (
                  <option key={s.id} value={s.id}>
                    {optionLabel(s)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Période">
              <select
                value={form.periodeId}
                onChange={(e) => set('periodeId', e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {periodes.map((p) => (
                  <option key={p.id} value={p.id}>
                    {optionLabel(p)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Direction">
              <select
                value={form.directionId}
                onChange={(e) => set('directionId', e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {directions.map((d) => (
                  <option key={d.id} value={d.id}>
                    {optionLabel(d)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Statut">
              <select
                required={step === 2}
                value={form.statutId}
                onChange={(e) => set('statutId', e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {statuts.map((s) => (
                  <option key={s.id} value={s.id}>
                    {optionLabel(s)}
                  </option>
                ))}
              </select>
            </Field>
            <Field
              label="Validé (paie)"
              hint="Coché uniquement après validation dans Administration RH. Seul le personnel validé et actif participe à la paie."
            >
              <label className="checkbox-line">
                <input
                  type="checkbox"
                  checked={Boolean(form.valide)}
                  disabled
                  readOnly
                />
                <span>{form.valide ? 'Validé' : 'Non validé'}</span>
              </label>
            </Field>
            <Field label="Type de contrat">
              <select
                value={form.typeContratId}
                onChange={(e) => set('typeContratId', e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {typesContrats.map((t) => (
                  <option key={t.id} value={t.id}>
                    {optionLabel(t)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Compte comptable">
              <select
                value={form.compteComptableId}
                onChange={(e) => set('compteComptableId', e.target.value)}
              >
                <option value="">— Sélectionner —</option>
                {comptes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {optionLabel(c)}
                  </option>
                ))}
              </select>
            </Field>
          </div>
        </div>

        <div className={`wizard-slide ${step === 3 ? 'is-active' : ''}`}>
          <div className="form-grid">
            <p className="wizard-step-hint">
              Étape 3/3 — Coordonnées de contact, comptes bancaires et
              immatriculation CNSS.
            </p>
            <Field label="Téléphone">
              <input
                value={form.telephone}
                onChange={(e) => set('telephone', e.target.value)}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(e) => set('email', e.target.value)}
              />
            </Field>
            <Field label="N° compte bancaire 1">
              <input
                value={form.numeroCompteBancaire1}
                onChange={(e) => set('numeroCompteBancaire1', e.target.value)}
              />
            </Field>
            <Field label="N° compte bancaire 2">
              <input
                value={form.numeroCompteBancaire2}
                onChange={(e) => set('numeroCompteBancaire2', e.target.value)}
              />
            </Field>
            <Field label="Immatriculation CNSS">
              <input
                value={form.numeroCnss}
                onChange={(e) => set('numeroCnss', e.target.value)}
              />
            </Field>
          </div>
        </div>
      </WizardModal>

      <PersonnelFicheModal
        personnel={fichePersonnel}
        refs={refs}
        onClose={() => setFichePersonnel(null)}
      />
    </div>
  )
}
