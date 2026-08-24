import { useEffect } from 'react'
import { Printer, X } from 'lucide-react'
import type { Administrateur } from '../types'

type Props = {
  admin: Administrateur | null
  onClose: () => void
}

function fullName(a: Administrateur) {
  return `${a.prenom} ${a.postnom} ${a.nom}`.replace(/\s+/g, ' ').trim()
}

function formatDate(value: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('fr-FR')
}

function ouiNon(value: boolean) {
  return value ? 'Oui' : 'Non'
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="fiche-info">
      <dt>{label}</dt>
      <dd>{value?.trim() ? value : '—'}</dd>
    </div>
  )
}

export function AdministrateurFicheModal({ admin, onClose }: Props) {
  useEffect(() => {
    if (!admin) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [admin, onClose])

  useEffect(() => {
    if (!admin) return
    const clear = () => document.body.classList.remove('printing-admin-fiche')
    window.addEventListener('afterprint', clear)
    return () => {
      window.removeEventListener('afterprint', clear)
      clear()
    }
  }, [admin])

  if (!admin) return null

  const initials = (admin.prenom?.[0] || admin.nom?.[0] || 'A').toUpperCase()
  const printedAt = new Date().toLocaleString('fr-FR')

  function handlePrint() {
    document.body.classList.add('printing-admin-fiche')
    window.print()
  }

  return (
    <div className="modal-backdrop fiche-backdrop" role="presentation" onClick={onClose}>
      <div
        className="fiche-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fiche-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fiche-toolbar no-print">
          <p>Fiche de renseignement</p>
          <div className="fiche-toolbar-actions">
            <button type="button" className="btn-print" onClick={handlePrint}>
              <Printer size={16} />
              Imprimer la fiche
            </button>
            <button type="button" className="wizard-close" onClick={onClose} aria-label="Fermer">
              <X size={18} />
            </button>
          </div>
        </div>

        <article className="fiche-sheet" id="fiche-admin-print">
          <header className="fiche-sheet-header">
            <div className="fiche-brand">
              <span className="fiche-brand-mark">GRH</span>
              <div>
                <strong>Gestion des Ressources Humaines</strong>
                <small>Fiche de renseignement — Administrateur</small>
              </div>
            </div>
            <div className="fiche-meta-stamp">
              <span>{admin.identifiant}</span>
              <small>Édité le {printedAt}</small>
            </div>
          </header>

          <section className="fiche-hero-block">
            <div className="fiche-photo-frame">
              {admin.photoIdentite?.dataUrl ? (
                <img
                  src={admin.photoIdentite.dataUrl}
                  alt={`Photo de ${fullName(admin)}`}
                  className="fiche-photo"
                />
              ) : (
                <span className="fiche-photo fiche-photo-fallback" aria-hidden>
                  {initials}
                </span>
              )}
            </div>
            <div className="fiche-hero-text">
              <p className="fiche-kicker">Administrateur / Mandataire</p>
              <h2 id="fiche-title">{fullName(admin)}</h2>
              <p className="fiche-role">{admin.qualiteMandataire || 'Qualité non renseignée'}</p>
              <div className="fiche-chips">
                <span className={`fiche-chip statut-${admin.statutActuel.replace(/\s+/g, '-').toLowerCase()}`}>
                  {admin.statutActuel}
                </span>
                {admin.organisme && <span className="fiche-chip">{admin.organisme}</span>}
                <span className="fiche-chip muted">{admin.genre}</span>
              </div>
            </div>
          </section>

          <section className="fiche-section">
            <h3>Identité</h3>
            <dl className="fiche-grid">
              <Info label="Identifiant" value={admin.identifiant} />
              <Info label="Date de naissance" value={formatDate(admin.dateNaissance)} />
              <Info label="Lieu de naissance" value={admin.lieuNaissance} />
              <Info label="Nationalité" value={admin.nationalite} />
              <Info label="NIPI" value={admin.nipi} />
            </dl>
          </section>

          <section className="fiche-section">
            <h3>Coordonnées</h3>
            <dl className="fiche-grid">
              <Info
                label="Adresse"
                value={[admin.avenueNumero, admin.commune, admin.villeProvince]
                  .filter(Boolean)
                  .join(', ')}
              />
              <Info label="Téléphone principal" value={admin.telephonePrincipal} />
              <Info label="Téléphone secondaire" value={admin.telephoneSecondaire} />
              <Info label="E-mail officiel" value={admin.emailOfficiel} />
              <Info label="E-mail personnel" value={admin.emailPersonnel} />
            </dl>
          </section>

          <section className="fiche-section">
            <h3>Mandat & nomination</h3>
            <dl className="fiche-grid">
              <Info label="Organisme" value={admin.organisme} />
              <Info label="Qualité" value={admin.qualiteMandataire} />
              <Info label="Rôle spécifique" value={admin.roleSpecifique} />
              <Info label="Type d’acte" value={admin.typeActeNomination} />
              <Info label="N° d’acte" value={admin.numeroActe} />
              <Info label="Date de signature" value={formatDate(admin.dateSignatureActe)} />
              <Info label="Prise de fonction" value={formatDate(admin.datePriseFonction)} />
              <Info label="Début du mandat" value={formatDate(admin.dateDebutMandat)} />
              <Info label="Fin prévue" value={formatDate(admin.dateFinPrevue)} />
              <Info label="Renouvelable" value={ouiNon(admin.mandatRenouvelable)} />
            </dl>
          </section>

          <section className="fiche-section">
            <h3>Profil & conformité</h3>
            <dl className="fiche-grid">
              <Info label="Niveau d’études" value={admin.niveauEtude} />
              <Info label="Domaine d’expertise" value={admin.domaineExpertise} />
              <Info label="Casier judiciaire" value={ouiNon(admin.casierJudiciaireFourni)} />
              <Info label="Réf. casier" value={admin.casierReference} />
              <Info label="Bonne conduite" value={ouiNon(admin.attestationBonneConduiteFournie)} />
              <Info label="Déclaration patrimoine" value={ouiNon(admin.declarationPatrimoineEffectuee)} />
              <Info label="Certificat d’aptitude" value={ouiNon(admin.certificatAptitudeFourni)} />
            </dl>
            {admin.autresMandats.length > 0 && (
              <div className="fiche-mandats">
                <p className="fiche-subheading">Autres mandats</p>
                <ul>
                  {admin.autresMandats.map((m) => (
                    <li key={m.id}>
                      <strong>{m.organisation || 'Organisation'}</strong>
                      {m.fonction ? ` — ${m.fonction}` : ''}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <section className="fiche-section">
            <h3>Rémunération & banque</h3>
            <dl className="fiche-grid">
              <Info label="Jetons de présence" value={ouiNon(admin.eligibleJetonsPresence)} />
              <Info label="Banque" value={admin.nomBanque} />
              <Info label="Code banque" value={admin.codeBanque} />
              <Info label="N° de compte" value={admin.numeroCompte} />
              <Info label="Intitulé" value={admin.intituleCompte} />
              <Info label="RIB / Clé" value={admin.ribCle} />
            </dl>
          </section>

          <footer className="fiche-sheet-footer">
            <div>
              <span>Créé par</span>
              <strong>{admin.creePar || '—'}</strong>
            </div>
            <div>
              <span>Confidentialité</span>
              <strong>{admin.niveauConfidentialite}</strong>
            </div>
            <div>
              <span>Dernière mise à jour</span>
              <strong>{formatDate(admin.updatedAt)}</strong>
            </div>
          </footer>
        </article>
      </div>
    </div>
  )
}
