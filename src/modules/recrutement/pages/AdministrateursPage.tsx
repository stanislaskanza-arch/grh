import { BookmarkCheck, Printer, Trash2, UserPlus, Users } from 'lucide-react'
import { useEffect, useState, type FormEvent } from 'react'
import { useAuth } from '../../../auth/AuthContext'
import {
  BANQUES,
  COMMUNES_KINSHASA,
  createEmptyAdministrateur,
  generateIdentifiant,
  NATIONALITES,
  NIVEAUX_ETUDE,
  ORGANISMES,
  QUALITES_MANDATAIRE,
  STATUTS_ADMIN,
  TYPES_ACTE,
  VILLES_PROVINCES,
  WIZARD_STEPS,
  type AdminFormState,
} from '../administrateurConstants'
import {
  clearAdministrateurDraft,
  loadAdministrateurDraft,
  saveAdministrateurDraft,
  type AdministrateurDraft,
} from '../administrateurDraft'
import { DataTable } from '../components/DataTable'
import { AdministrateurFicheModal } from '../components/AdministrateurFicheModal'
import { Field, FileField, RadioGroup, SwitchField } from '../components/FormFields'
import { PhotoField } from '../components/PhotoField'
import { WizardModal } from '../components/WizardModal'
import { useRecrutement } from '../RecrutementContext'
import { createId } from '../storage'
import type { Administrateur, AutreMandat } from '../types'

function toFormState(row: Administrateur): AdminFormState {
  const copy = { ...row } as Partial<Administrateur>
  delete copy.id
  delete copy.createdAt
  return copy as AdminFormState
}

export function AdministrateursPage() {
  const { user } = useAuth()
  const { store, add, update, remove } = useRecrutement()
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [editing, setEditing] = useState<Administrateur | null>(null)
  const [form, setForm] = useState<AdminFormState>(() =>
    createEmptyAdministrateur('ADM-0000-0000', user?.email ?? 'système'),
  )
  const [draft, setDraft] = useState<AdministrateurDraft | null>(() => loadAdministrateurDraft())
  const [draftFlash, setDraftFlash] = useState<string | null>(null)
  const [ficheAdmin, setFicheAdmin] = useState<Administrateur | null>(null)

  useEffect(() => {
    if (!draftFlash) return
    const t = window.setTimeout(() => setDraftFlash(null), 2800)
    return () => window.clearTimeout(t)
  }, [draftFlash])

  function openCreate(fromScratch = false) {
    if (!fromScratch) {
      const existing = loadAdministrateurDraft()
      if (existing && !existing.editingId) {
        setEditing(null)
        setForm(existing.form)
        setStep(existing.step)
        setDraft(existing)
        setOpen(true)
        return
      }
    }
    clearAdministrateurDraft()
    setDraft(null)
    setEditing(null)
    setStep(1)
    setForm(
      createEmptyAdministrateur(
        generateIdentifiant(store.administrateurs),
        user?.email ?? 'système',
      ),
    )
    setOpen(true)
  }

  function resumeDraft() {
    const existing = loadAdministrateurDraft()
    if (!existing) return
    if (existing.editingId) {
      const row = store.administrateurs.find((a) => a.id === existing.editingId) ?? null
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
    if (!window.confirm('Supprimer le brouillon sauvegardé ?')) return
    clearAdministrateurDraft()
    setDraft(null)
  }

  function handlePrintList() {
    window.print()
  }

  function openEdit(row: Administrateur) {
    const existing = loadAdministrateurDraft()
    if (existing?.editingId === row.id) {
      setEditing(row)
      setForm(existing.form)
      setStep(existing.step)
      setDraft(existing)
      setOpen(true)
      return
    }
    setEditing(row)
    setStep(1)
    setForm(toFormState(row))
    setOpen(true)
  }

  function handleSaveDraft() {
    const saved = saveAdministrateurDraft({
      form,
      step,
      editingId: editing?.id ?? null,
    })
    setDraft(saved)
    setDraftFlash(saved.savedAt)
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    const now = new Date().toISOString()
    if (editing) {
      update('administrateurs', editing.id, {
        ...form,
        updatedAt: now,
        creePar: editing.creePar,
      })
    } else {
      add('administrateurs', {
        ...form,
        updatedAt: now,
        creePar: user?.email ?? 'système',
      })
    }
    clearAdministrateurDraft()
    setDraft(null)
    setDraftFlash(null)
    setOpen(false)
  }

  function set<K extends keyof AdminFormState>(key: K, value: AdminFormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function addMandat() {
    const mandat: AutreMandat = {
      id: createId(),
      organisation: '',
      fonction: '',
    }
    set('autresMandats', [...form.autresMandats, mandat])
  }

  function updateMandat(id: string, patch: Partial<AutreMandat>) {
    set(
      'autresMandats',
      form.autresMandats.map((m) => (m.id === id ? { ...m, ...patch } : m)),
    )
  }

  function removeMandat(id: string) {
    set(
      'autresMandats',
      form.autresMandats.filter((m) => m.id !== id),
    )
  }

  const rows = [...store.administrateurs].reverse()
  const draftLabel = draft
    ? `${draft.form.prenom || draft.form.nom || draft.form.identifiant || 'Brouillon'} — étape ${draft.step}/${WIZARD_STEPS.length}`
    : ''

  return (
    <div className="admin-page admins-page">
      <header className="page-header admin-page-header">
        <div>
          <p className="eyebrow">Capture Info</p>
          <h1>Enregistrement des Administrateurs</h1>
          <p className="lede">
            Créez une fiche complète en 5 étapes, puis consultez et gérez la
            liste des administrateurs enregistrés. Vous pouvez sauvegarder un
            brouillon et reprendre plus tard.
          </p>
        </div>
        <div className="admin-header-actions">
          <button type="button" className="btn-primary admin-cta" onClick={() => openCreate(true)}>
            <span className="admin-cta-icon" aria-hidden>
              <UserPlus size={18} />
            </span>
            Nouvel administrateur
          </button>
        </div>
      </header>

      {draft && (
        <aside className="draft-banner" aria-live="polite">
          <div className="draft-banner-main">
            <span className="draft-banner-icon" aria-hidden>
              <BookmarkCheck size={18} />
            </span>
            <div>
              <strong>Brouillon disponible</strong>
              <p>
                {draftLabel}. Dernière sauvegarde :{' '}
                {new Date(draft.savedAt).toLocaleString('fr-FR')}.
              </p>
            </div>
          </div>
          <div className="draft-banner-actions">
            <button type="button" className="btn-primary" onClick={resumeDraft}>
              Reprendre à l’étape {draft.step}
            </button>
            <button type="button" className="btn-ghost" onClick={discardDraft}>
              <Trash2 size={15} />
              Supprimer
            </button>
          </div>
        </aside>
      )}

      <section className="admin-list-panel print-admins-list" aria-labelledby="liste-admins-title">
        <div className="admin-list-head">
          <div className="admin-list-title">
            <span className="admin-list-icon" aria-hidden>
              <Users size={18} />
            </span>
            <div>
              <h2 id="liste-admins-title">Liste des administrateurs</h2>
              <p>
                {rows.length === 0
                  ? 'Aucun enregistrement pour le moment'
                  : `${rows.length} administrateur${rows.length > 1 ? 's' : ''} enregistré${rows.length > 1 ? 's' : ''}`}
              </p>
              <p className="print-only-meta">
                Imprimé le {new Date().toLocaleString('fr-FR')}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="btn-print"
            onClick={handlePrintList}
            disabled={rows.length === 0}
            title="Imprimer la liste des administrateurs"
          >
            <Printer size={16} />
            Imprimer
          </button>
        </div>

        <DataTable
          rows={rows}
          emptyMessage="Aucun administrateur enregistré. Cliquez sur « Nouvel administrateur » pour créer la première fiche."
          onEdit={openEdit}
          onDelete={(row) => remove('administrateurs', row.id)}
          onPrint={(row) => setFicheAdmin(row)}
          columns={[
            {
              key: 'photo',
              header: 'Photo',
              render: (r) =>
                r.photoIdentite?.dataUrl ? (
                  <img
                    src={r.photoIdentite.dataUrl}
                    alt=""
                    className="admin-avatar"
                  />
                ) : (
                  <span className="admin-avatar admin-avatar-fallback">
                    {(r.prenom?.[0] || r.nom?.[0] || 'A').toUpperCase()}
                  </span>
                ),
            },
            {
              key: 'identifiant',
              header: 'Identifiant',
              render: (r) => <code className="id-code">{r.identifiant}</code>,
            },
            {
              key: 'nom',
              header: 'Nom complet',
              render: (r) => (
                <strong>
                  {`${r.prenom} ${r.postnom} ${r.nom}`.replace(/\s+/g, ' ').trim()}
                </strong>
              ),
            },
            { key: 'qualite', header: 'Qualité', render: (r) => r.qualiteMandataire },
            { key: 'organisme', header: 'Organisme', render: (r) => r.organisme || '—' },
            { key: 'telephone', header: 'Téléphone', render: (r) => r.telephonePrincipal },
            {
              key: 'statut',
              header: 'Statut',
              render: (r) => (
                <span
                  className={`badge badge-admin-${r.statutActuel.replace(/\s+/g, '-').toLowerCase()}`}
                >
                  {r.statutActuel}
                </span>
              ),
            },
          ]}
        />
      </section>

      <WizardModal
        open={open}
        title={editing ? 'Modifier l’administrateur' : 'Nouvel administrateur'}
        subtitle={editing ? 'Mise à jour de la fiche' : 'Création d’une nouvelle fiche'}
        step={step}
        steps={WIZARD_STEPS}
        onStepChange={setStep}
        onClose={() => setOpen(false)}
        onSubmit={handleSubmit}
        onSaveDraft={handleSaveDraft}
        draftSavedAt={draftFlash}
        panelClassName="wizard-panel-admin"
      >
        <section
          className={`wizard-slide ${step === 1 ? 'is-active' : ''}`}
          aria-hidden={step !== 1}
          data-step="1"
        >
          <div className="form-grid">
          <div className="identity-spotlight field-full">
            <PhotoField
              label="Photo d’identité"
              value={form.photoIdentite}
              onChange={(f) => set('photoIdentite', f)}
              hint="Portrait clair, fond uni de préférence"
              full
            />
            <Field label="Identifiant Administrateur" hint="Généré automatiquement">
              <input readOnly value={form.identifiant} className="input-readonly id-highlight" />
            </Field>
          </div>
          <Field label="Nom">
            <input required={step === 1} value={form.nom} onChange={(e) => set('nom', e.target.value)} />
          </Field>
          <Field label="Postnom">
            <input value={form.postnom} onChange={(e) => set('postnom', e.target.value)} />
          </Field>
          <Field label="Prénom">
            <input required={step === 1} value={form.prenom} onChange={(e) => set('prenom', e.target.value)} />
          </Field>
          <RadioGroup
            label="Genre"
            name="genre"
            value={form.genre}
            onChange={(v) => set('genre', v as AdminFormState['genre'])}
            options={[
              { value: 'Masculin', label: 'Masculin' },
              { value: 'Féminin', label: 'Féminin' },
            ]}
          />
          <Field label="Date de naissance">
            <input type="date" value={form.dateNaissance} onChange={(e) => set('dateNaissance', e.target.value)} />
          </Field>
          <Field label="Lieu de naissance">
            <input value={form.lieuNaissance} onChange={(e) => set('lieuNaissance', e.target.value)} />
          </Field>
          <Field label="Nationalité">
            <select value={form.nationalite} onChange={(e) => set('nationalite', e.target.value)}>
              {NATIONALITES.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </Field>
          <Field label="Numéro d’identité nationale (NIPI)">
            <input value={form.nipi} onChange={(e) => set('nipi', e.target.value)} />
          </Field>
          </div>
        </section>

        <section
          className={`wizard-slide ${step === 2 ? 'is-active' : ''}`}
          aria-hidden={step !== 2}
          data-step="2"
        >
          <div className="form-grid">
          <p className="form-section-title field-full">Adresse physique</p>
          <Field label="Avenue et numéro" full>
            <input value={form.avenueNumero} onChange={(e) => set('avenueNumero', e.target.value)} />
          </Field>
          <Field label="Commune">
            <select value={form.commune} onChange={(e) => set('commune', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {COMMUNES_KINSHASA.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </Field>
          <Field label="Ville / Province">
            <select value={form.villeProvince} onChange={(e) => set('villeProvince', e.target.value)}>
              {VILLES_PROVINCES.map((v) => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </Field>
          <p className="form-section-title field-full">Contacts</p>
          <Field label="Téléphone principal" hint="Avec indicatif (ex. +243)">
            <input type="tel" value={form.telephonePrincipal} onChange={(e) => set('telephonePrincipal', e.target.value)} />
          </Field>
          <Field label="Téléphone secondaire">
            <input type="tel" value={form.telephoneSecondaire} onChange={(e) => set('telephoneSecondaire', e.target.value)} />
          </Field>
          <Field label="E-mail officiel">
            <input type="email" value={form.emailOfficiel} onChange={(e) => set('emailOfficiel', e.target.value)} />
          </Field>
          <Field label="E-mail personnel">
            <input type="email" value={form.emailPersonnel} onChange={(e) => set('emailPersonnel', e.target.value)} />
          </Field>
          </div>
        </section>

        <section
          className={`wizard-slide ${step === 3 ? 'is-active' : ''}`}
          aria-hidden={step !== 3}
          data-step="3"
        >
          <div className="form-grid">
          <Field label="Entreprise publique / Organisme">
            <select
              required={step === 3}
              value={form.organisme}
              onChange={(e) => set('organisme', e.target.value)}
            >
              <option value="">— Sélectionner —</option>
              {ORGANISMES.map((o) => (
                <option key={o} value={o}>{o}</option>
              ))}
            </select>
          </Field>
          <Field label="Qualité du mandataire">
            <select value={form.qualiteMandataire} onChange={(e) => set('qualiteMandataire', e.target.value)}>
              {QUALITES_MANDATAIRE.map((q) => (
                <option key={q} value={q}>{q}</option>
              ))}
            </select>
          </Field>
          <Field label="Rôle spécifique" hint="Ex. Président du Conseil d’Administration" full>
            <input value={form.roleSpecifique} onChange={(e) => set('roleSpecifique', e.target.value)} />
          </Field>
          <Field label="Type d’acte de nomination">
            <select value={form.typeActeNomination} onChange={(e) => set('typeActeNomination', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {TYPES_ACTE.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </Field>
          <Field label="Numéro de l’acte">
            <input value={form.numeroActe} onChange={(e) => set('numeroActe', e.target.value)} />
          </Field>
          <Field label="Date de signature de l’acte">
            <input type="date" value={form.dateSignatureActe} onChange={(e) => set('dateSignatureActe', e.target.value)} />
          </Field>
          <Field label="Date de prise de fonction">
            <input type="date" value={form.datePriseFonction} onChange={(e) => set('datePriseFonction', e.target.value)} />
          </Field>
          <FileField
            label="Copie scannée de l’acte"
            accept="application/pdf,.pdf"
            value={form.copieActe}
            onChange={(f) => set('copieActe', f)}
            full
            hint="PDF recommandé"
          />
          <Field label="Statut actuel">
            <select
              value={form.statutActuel}
              onChange={(e) => set('statutActuel', e.target.value as AdminFormState['statutActuel'])}
            >
              {STATUTS_ADMIN.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </Field>
          <Field label="Date de début du mandat">
            <input type="date" value={form.dateDebutMandat} onChange={(e) => set('dateDebutMandat', e.target.value)} />
          </Field>
          <Field label="Date de fin prévue">
            <input type="date" value={form.dateFinPrevue} onChange={(e) => set('dateFinPrevue', e.target.value)} />
          </Field>
          <SwitchField
            label="Mandat renouvelable"
            checked={form.mandatRenouvelable}
            onChange={(v) => set('mandatRenouvelable', v)}
          />
          </div>
        </section>

        <section
          className={`wizard-slide ${step === 4 ? 'is-active' : ''}`}
          aria-hidden={step !== 4}
          data-step="4"
        >
          <div className="form-grid">
          <p className="form-section-title field-full">Qualifications</p>
          <Field label="Niveau d’étude maximum">
            <select value={form.niveauEtude} onChange={(e) => set('niveauEtude', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {NIVEAUX_ETUDE.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>
          </Field>
          <Field label="Domaine d’expertise">
            <input value={form.domaineExpertise} onChange={(e) => set('domaineExpertise', e.target.value)} />
          </Field>
          <FileField
            label="Curriculum Vitae (CV)"
            accept="application/pdf,.pdf"
            value={form.cv}
            onChange={(f) => set('cv', f)}
            full
          />

          <div className="field-full dynamic-block">
            <div className="dynamic-block-head">
              <div>
                <strong>Autres mandats en cours</strong>
                <p>Ajoutez Organisation + Fonction pour chaque mandat.</p>
              </div>
              <button type="button" className="btn-ghost" onClick={addMandat}>
                + Ajouter
              </button>
            </div>
            {form.autresMandats.length === 0 && (
              <p className="empty-state">Aucun autre mandat ajouté.</p>
            )}
            {form.autresMandats.map((m) => (
              <div key={m.id} className="dynamic-row">
                <input
                  placeholder="Organisation"
                  value={m.organisation}
                  onChange={(e) => updateMandat(m.id, { organisation: e.target.value })}
                />
                <input
                  placeholder="Fonction"
                  value={m.fonction}
                  onChange={(e) => updateMandat(m.id, { fonction: e.target.value })}
                />
                <button type="button" className="btn-link danger" onClick={() => removeMandat(m.id)}>
                  Retirer
                </button>
              </div>
            ))}
          </div>

          <p className="form-section-title field-full">Dossier de conformité</p>
          <SwitchField
            label="Casier judiciaire fourni ?"
            checked={form.casierJudiciaireFourni}
            onChange={(v) => set('casierJudiciaireFourni', v)}
            full
          />
          {form.casierJudiciaireFourni && (
            <>
              <Field label="Date d’émission">
                <input type="date" value={form.casierDateEmission} onChange={(e) => set('casierDateEmission', e.target.value)} />
              </Field>
              <Field label="Référence">
                <input value={form.casierReference} onChange={(e) => set('casierReference', e.target.value)} />
              </Field>
            </>
          )}

          <SwitchField
            label="Attestation de bonne conduite, vie et mœurs fournie ?"
            checked={form.attestationBonneConduiteFournie}
            onChange={(v) => set('attestationBonneConduiteFournie', v)}
            full
          />
          {form.attestationBonneConduiteFournie && (
            <Field label="Date d’émission">
              <input type="date" value={form.attestationDateEmission} onChange={(e) => set('attestationDateEmission', e.target.value)} />
            </Field>
          )}

          <SwitchField
            label="Déclaration de patrimoine effectuée ?"
            checked={form.declarationPatrimoineEffectuee}
            onChange={(v) => set('declarationPatrimoineEffectuee', v)}
            full
          />
          {form.declarationPatrimoineEffectuee && (
            <>
              <Field label="Date de dépôt à la Cour Constitutionnelle">
                <input type="date" value={form.patrimoineDateDepot} onChange={(e) => set('patrimoineDateDepot', e.target.value)} />
              </Field>
              <Field label="N° d’accusé de réception">
                <input value={form.patrimoineNumeroAccuse} onChange={(e) => set('patrimoineNumeroAccuse', e.target.value)} />
              </Field>
            </>
          )}

          <SwitchField
            label="Certificat d’aptitude physique fourni ?"
            checked={form.certificatAptitudeFourni}
            onChange={(v) => set('certificatAptitudeFourni', v)}
            full
          />
          </div>
        </section>

        <section
          className={`wizard-slide ${step === 5 ? 'is-active' : ''}`}
          aria-hidden={step !== 5}
          data-step="5"
        >
          <div className="form-grid">
          <SwitchField
            label="Éligibilité aux jetons de présence"
            checked={form.eligibleJetonsPresence}
            onChange={(v) => set('eligibleJetonsPresence', v)}
            full
          />
          <Field label="Nom de la Banque">
            <select value={form.nomBanque} onChange={(e) => set('nomBanque', e.target.value)}>
              <option value="">— Sélectionner —</option>
              {BANQUES.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </Field>
          <Field label="Code Banque">
            <input value={form.codeBanque} onChange={(e) => set('codeBanque', e.target.value)} />
          </Field>
          <Field label="Numéro de compte">
            <input value={form.numeroCompte} onChange={(e) => set('numeroCompte', e.target.value)} />
          </Field>
          <Field label="Intitulé du compte">
            <input value={form.intituleCompte} onChange={(e) => set('intituleCompte', e.target.value)} />
          </Field>
          <Field label="RIB / Clé">
            <input value={form.ribCle} onChange={(e) => set('ribCle', e.target.value)} />
          </Field>

          <p className="form-section-title field-full">Métadonnées système</p>
          <Field label="Date de création de la fiche" hint="Automatique">
            <input
              readOnly
              className="input-readonly"
              value={
                editing
                  ? new Date(editing.createdAt).toLocaleString('fr-FR')
                  : 'Générée à l’enregistrement'
              }
            />
          </Field>
          <Field label="Dernière mise à jour" hint="Automatique">
            <input
              readOnly
              className="input-readonly"
              value={
                editing
                  ? new Date(form.updatedAt).toLocaleString('fr-FR')
                  : 'Générée à l’enregistrement'
              }
            />
          </Field>
          <Field label="Créé par" hint="Agent connecté">
            <input readOnly className="input-readonly" value={form.creePar} />
          </Field>
          <Field label="Niveau de confidentialité" hint="Valeur par défaut">
            <input readOnly className="input-readonly" value={form.niveauConfidentialite} />
          </Field>
          </div>
        </section>
      </WizardModal>

      <AdministrateurFicheModal
        admin={ficheAdmin}
        onClose={() => setFicheAdmin(null)}
      />
    </div>
  )
}
