import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import QRCode from 'qrcode'
import { Printer, X } from 'lucide-react'
import {
  fonctionLibelleOnly,
  gradeCodeOnly,
} from '../calculerPaieMensuelleB1'
import type { PaieMensuelleB2Item } from '../types'

type Props = {
  ligne: PaieMensuelleB2Item | null
  onClose: () => void
}

const MOIS_LABELS: Record<string, string> = {
  '01': 'Janvier',
  '02': 'Février',
  '03': 'Mars',
  '04': 'Avril',
  '05': 'Mai',
  '06': 'Juin',
  '07': 'Juillet',
  '08': 'Août',
  '09': 'Septembre',
  '10': 'Octobre',
  '11': 'Novembre',
  '12': 'Décembre',
}

function formatDate(value: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('fr-FR')
}

function formatMontant(value: string) {
  const trimmed = value?.trim()
  if (!trimmed) return '—'
  const n = Number(String(trimmed).replace(/\s/g, '').replace(',', '.'))
  if (!Number.isFinite(n)) return trimmed
  return `${n.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })} CDF`
}

function formatMois(value: string) {
  const text = value?.trim()
  if (!text) return '—'
  const match = text.match(/^(\d{4})-(\d{2})$/)
  if (match) {
    const label = MOIS_LABELS[match[2]] || match[2]
    return `${label} ${match[1]}`
  }
  return text
}

function fullName(ligne: PaieMensuelleB2Item) {
  return [ligne.nom, ligne.postnom, ligne.prenom].filter(Boolean).join(' ').trim()
}

/** Contenu encodé dans le QR de la fiche de paie B2. */
export function buildPaieB2QrPayload(ligne: PaieMensuelleB2Item): string {
  const grade = gradeCodeOnly(ligne.grade) || '—'
  const mois = formatMois(ligne.mois)
  const net = formatMontant(ligne.netAPayer)
  const matricule = ligne.matricule?.trim() || '—'
  return [
    'ARMP-RDC',
    `Matricule: ${matricule}`,
    `Grade: ${grade}`,
    `Net à Payer: ${net}`,
    `Mois: ${mois}`,
    'Bareme: 2',
  ].join('\n')
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="fiche-info">
      <dt>{label}</dt>
      <dd>{value?.trim() ? value : '—'}</dd>
    </div>
  )
}

export function FichePaieB2Modal({ ligne, onClose }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState('')

  const qrPayload = useMemo(
    () => (ligne ? buildPaieB2QrPayload(ligne) : ''),
    [ligne],
  )

  useEffect(() => {
    if (!ligne) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ligne, onClose])

  useEffect(() => {
    if (!ligne) return
    const clear = () => document.body.classList.remove('printing-paie-fiche')
    window.addEventListener('afterprint', clear)
    return () => {
      window.removeEventListener('afterprint', clear)
      clear()
    }
  }, [ligne])

  useEffect(() => {
    if (!ligne) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [ligne])

  useEffect(() => {
    if (!qrPayload) {
      setQrDataUrl('')
      return
    }
    let cancelled = false
    QRCode.toDataURL(qrPayload, {
      errorCorrectionLevel: 'M',
      margin: 1,
      width: 160,
      color: {
        dark: '#0a3540',
        light: '#ffffff',
      },
    })
      .then((url) => {
        if (!cancelled) setQrDataUrl(url)
      })
      .catch(() => {
        if (!cancelled) setQrDataUrl('')
      })
    return () => {
      cancelled = true
    }
  }, [qrPayload])

  if (!ligne) return null

  const name = fullName(ligne) || 'Agent'
  const printedAt = new Date().toLocaleString('fr-FR')
  const grade = gradeCodeOnly(ligne.grade)
  const fonction = fonctionLibelleOnly(ligne.fonction)

  function handlePrint() {
    document.body.classList.add('printing-paie-fiche')
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
        aria-labelledby="fiche-paie-b2-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fiche-toolbar no-print">
          <p>Fiche de paie</p>
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

        <article
          className="fiche-sheet fiche-sheet-personnel fiche-sheet-paie"
          id="fiche-paie-b2-print"
        >
          <header className="fiche-sheet-header">
            <div className="fiche-brand">
              <span className="fiche-brand-mark">GRH</span>
              <div>
                <strong>Gestion des Ressources Humaines</strong>
                <small>Fiche de paie — Barème 2</small>
              </div>
            </div>
            <div className="fiche-meta-stamp">
              <span>{ligne.matricule || '—'}</span>
              <small>Édité le {printedAt}</small>
            </div>
          </header>

          <section className="fiche-hero-block fiche-hero-block-paie">
            <div className="fiche-hero-text">
              <p className="fiche-kicker">Bulletin / Fiche de paie</p>
              <h2 id="fiche-paie-b2-title">{name}</h2>
              <p className="fiche-role">
                {fonction || 'Fonction non renseignée'}
              </p>
              <div className="fiche-chips">
                {grade ? <span className="fiche-chip">{grade}</span> : null}
                <span className="fiche-chip muted">{formatMois(ligne.mois)}</span>
                <span className="fiche-chip muted">
                  Paie du {formatDate(ligne.datePaie)}
                </span>
              </div>
            </div>
            {qrDataUrl ? (
              <div className="fiche-paie-qr">
                <img
                  src={qrDataUrl}
                  alt="Code QR de la fiche de paie"
                  width={112}
                  height={112}
                />
                <small>ARMP-RDC</small>
              </div>
            ) : null}
          </section>

          <section className="fiche-section">
            <h3>Identité de l’agent</h3>
            <dl className="fiche-grid">
              <Info label="Matricule" value={ligne.matricule} />
              <Info label="Nom" value={ligne.nom} />
              <Info label="Postnom" value={ligne.postnom} />
              <Info label="Prénom" value={ligne.prenom} />
              <Info
                label="Date d’engagement"
                value={formatDate(ligne.dateEngagement)}
              />
              <Info label="Grade" value={grade} />
              <Info label="Fonction" value={fonction} />
              <Info
                label="Immatriculation CNSS"
                value={ligne.immatriculationCnss}
              />
            </dl>
          </section>

          <section className="fiche-section">
            <h3>Période de paie</h3>
            <dl className="fiche-grid">
              <Info label="Mois" value={formatMois(ligne.mois)} />
              <Info label="Date de paie" value={formatDate(ligne.datePaie)} />
            </dl>
          </section>

          <section className="fiche-section">
            <h3>Éléments de salaire (CDF)</h3>
            <dl className="fiche-grid">
              <Info label="Base" value={formatMontant(ligne.base)} />
              <Info label="Logement" value={formatMontant(ligne.logement)} />
              <Info label="Transport" value={formatMontant(ligne.transport)} />
              <Info label="Total brut" value={formatMontant(ligne.totalBrut)} />
            </dl>
          </section>

          <section className="fiche-section">
            <h3>Retenues (CDF)</h3>
            <dl className="fiche-grid">
              <Info
                label="Retenue CNSS"
                value={formatMontant(ligne.retenueCnss)}
              />
              <Info
                label="Retenue IPR"
                value={formatMontant(ligne.retenueIpr)}
              />
              <Info
                label="Retenue INPP"
                value={formatMontant(ligne.retenueInpp)}
              />
              <Info
                label="Total retenue"
                value={formatMontant(ligne.totalRetenue)}
              />
            </dl>
          </section>

          <section className="fiche-section fiche-section-net">
            <h3>Net à payer</h3>
            <p className="fiche-paie-net">{formatMontant(ligne.netAPayer)}</p>
          </section>

          <footer className="fiche-sheet-footer">
            <div>
              <span>Agent</span>
              <strong>{name}</strong>
            </div>
            <div>
              <span>Mois</span>
              <strong>{formatMois(ligne.mois)}</strong>
            </div>
            <div>
              <span>Net à payer</span>
              <strong>{formatMontant(ligne.netAPayer)}</strong>
            </div>
          </footer>
        </article>
      </div>
    </div>,
    document.body,
  )
}
