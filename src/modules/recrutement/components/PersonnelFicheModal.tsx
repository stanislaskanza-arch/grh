import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { Printer, X } from 'lucide-react'
import {
  entrepriseLibelle,
  fullNamePersonnel,
  periodeLibelle,
  refLibelle,
} from '../personnelConstants'
import type { ParametresStore } from '../../parametres/types'
import type { Personnel } from '../types'

type Props = {
  personnel: Personnel | null
  refs: ParametresStore
  onClose: () => void
}

function formatDate(value: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('fr-FR')
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="fiche-info">
      <dt>{label}</dt>
      <dd>{value?.trim() ? value : '—'}</dd>
    </div>
  )
}

export function PersonnelFicheModal({ personnel, refs, onClose }: Props) {
  useEffect(() => {
    if (!personnel) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [personnel, onClose])

  useEffect(() => {
    if (!personnel) return
    const clear = () => document.body.classList.remove('printing-personnel-fiche')
    window.addEventListener('afterprint', clear)
    return () => {
      window.removeEventListener('afterprint', clear)
      clear()
    }
  }, [personnel])

  useEffect(() => {
    if (!personnel) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [personnel])

  if (!personnel) return null

  const name = fullNamePersonnel(personnel)
  const initials = (personnel.prenom?.[0] || personnel.nom?.[0] || 'P').toUpperCase()
  const printedAt = new Date().toLocaleString('fr-FR')
  const grade = refLibelle(refs.grades, personnel.gradeId)
  const fonction = refLibelle(refs.fonctions, personnel.fonctionId)
  const statut = refLibelle(refs.statutsPersonnel, personnel.statutId)
  const site = refLibelle(refs.sitesAffectation, personnel.siteTravailId)

  function handlePrint() {
    document.body.classList.add('printing-personnel-fiche')
    // Laisser le navigateur appliquer la classe avant d’ouvrir la boîte d’impression
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.print()
      })
    })
  }

  return createPortal(
    <div
      className="modal-backdrop fiche-backdrop fiche-backdrop-personnel"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="fiche-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="fiche-personnel-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fiche-toolbar no-print">
          <p>Fiche de renseignement</p>
          <div className="fiche-toolbar-actions">
            <button type="button" className="btn-print" onClick={handlePrint}>
              <Printer size={16} />
              Imprimer la fiche
            </button>
            <button
              type="button"
              className="wizard-close"
              onClick={onClose}
              aria-label="Fermer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        <article className="fiche-sheet fiche-sheet-personnel" id="fiche-personnel-print">
          <header className="fiche-sheet-header">
            <div className="fiche-brand">
              <span className="fiche-brand-mark">GRH</span>
              <div>
                <strong>Gestion des Ressources Humaines</strong>
                <small>Fiche de renseignement — Personnel</small>
              </div>
            </div>
            <div className="fiche-meta-stamp">
              <span>{personnel.matricule}</span>
              <small>Édité le {printedAt}</small>
            </div>
          </header>

          <section className="fiche-hero-block">
            <div className="fiche-photo-frame">
              {personnel.photo?.dataUrl ? (
                <img
                  src={personnel.photo.dataUrl}
                  alt={`Photo de ${name}`}
                  className="fiche-photo"
                />
              ) : (
                <span className="fiche-photo fiche-photo-fallback" aria-hidden>
                  {initials}
                </span>
              )}
            </div>
            <div className="fiche-hero-text">
              <p className="fiche-kicker">Agent / Personnel</p>
              <h2 id="fiche-personnel-title">{name}</h2>
              <p className="fiche-role">{fonction || 'Fonction non renseignée'}</p>
              <div className="fiche-chips">
                {statut && <span className="fiche-chip">{statut}</span>}
                {personnel.valide && (
                  <span className="fiche-chip">Validé paie</span>
                )}
                {grade && <span className="fiche-chip">{grade}</span>}
                {site && <span className="fiche-chip muted">{site}</span>}
              </div>
            </div>
          </section>

          <section className="fiche-section">
            <h3>Identité</h3>
            <dl className="fiche-grid">
              <Info label="Matricule" value={personnel.matricule} />
              <Info label="Sexe" value={personnel.sexe} />
              <Info label="Date de naissance" value={formatDate(personnel.dateNaissance)} />
              <Info label="Nationalité" value={personnel.nationalite} />
              <Info label="Date d’engagement" value={formatDate(personnel.dateEngagement)} />
            </dl>
          </section>

          <section className="fiche-section">
            <h3>Fichiers pères / Affectation</h3>
            <dl className="fiche-grid">
              <Info label="Grade" value={grade} />
              <Info label="Fonction AG" value={fonction} />
              <Info
                label="Niveau d’études"
                value={refLibelle(refs.niveauxEtudes, personnel.niveauEtudesId)}
              />
              <Info
                label="Entreprise"
                value={entrepriseLibelle(refs.entreprises, personnel.entrepriseId)}
              />
              <Info label="Site de travail" value={site} />
              <Info
                label="Période"
                value={periodeLibelle(refs.periodes, personnel.periodeId)}
              />
              <Info
                label="Direction"
                value={refLibelle(refs.directions, personnel.directionId)}
              />
              <Info label="Statut" value={statut} />
              <Info
                label="Validé (paie)"
                value={personnel.valide ? 'Oui — éligible si actif' : 'Non'}
              />
              <Info
                label="Type de contrat"
                value={refLibelle(refs.typesContrats, personnel.typeContratId)}
              />
              <Info
                label="Compte comptable"
                value={refLibelle(refs.comptesComptables, personnel.compteComptableId)}
              />
            </dl>
          </section>

          <section className="fiche-section">
            <h3>Coordonnées, banque et CNSS</h3>
            <dl className="fiche-grid">
              <Info label="Téléphone" value={personnel.telephone} />
              <Info label="E-mail" value={personnel.email} />
              <Info label="N° compte bancaire 1" value={personnel.numeroCompteBancaire1} />
              <Info label="N° compte bancaire 2" value={personnel.numeroCompteBancaire2} />
              <Info label="Immatriculation CNSS" value={personnel.numeroCnss} />
            </dl>
          </section>

          <footer className="fiche-sheet-footer">
            <div>
              <span>Créé le</span>
              <strong>{formatDate(personnel.createdAt)}</strong>
            </div>
            <div>
              <span>Dernière mise à jour</span>
              <strong>{formatDate(personnel.updatedAt)}</strong>
            </div>
            <div>
              <span>Statut</span>
              <strong>{statut || '—'}</strong>
            </div>
          </footer>
        </article>
      </div>
    </div>,
    document.body,
  )
}
