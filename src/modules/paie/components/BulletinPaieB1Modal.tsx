import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import html2canvas from 'html2canvas'
import { jsPDF } from 'jspdf'
import QRCode from 'qrcode'
import { FileDown, Printer, X } from 'lucide-react'
import type { Entreprise } from '../../parametres/types'
import { formatMoisPaie, normalizeMoisCle } from '../paieMois'
import { parseMontantTaux } from '../tauxMonnaieEnCours'
import type { PaieMensuelleB1Item } from '../types'

/** Champs communs B1/B2 nécessaires à l’affichage du bulletin. */
export type BulletinPaieLigne = Pick<
  PaieMensuelleB1Item,
  | 'mois'
  | 'datePaie'
  | 'matricule'
  | 'nom'
  | 'postnom'
  | 'prenom'
  | 'dateEngagement'
  | 'grade'
  | 'fonction'
  | 'base'
  | 'logement'
  | 'transport'
  | 'totalBrut'
  | 'retenueCnss'
  | 'retenueIpr'
  | 'netAPayer'
>

export type BulletinPaieB1Data = {
  ligne: BulletinPaieLigne
  numeroCnss: string
  siteTravail: string
  direction: string
}

/** Alias pour les bulletins issus de PaieMensuelleB2. */
export type BulletinPaieB2Data = BulletinPaieB1Data

type Props = {
  data: BulletinPaieB1Data | null
  entreprise?: Entreprise | null
  onClose: () => void
}

const MOIS_SEUL: Record<string, string> = {
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

function formatDateFr(value: string) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('fr-FR')
}

function formatMontant(value: string) {
  const trimmed = value?.trim()
  if (!trimmed) return ''
  const n = parseMontantTaux(trimmed)
  return n.toLocaleString('fr-FR', {
    useGrouping: true,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function parseMontant(value: string) {
  return parseMontantTaux(value)
}

function moisSeul(mois: string, datePaie?: string) {
  const cle = normalizeMoisCle(mois, datePaie)
  const match = cle.match(/^(\d{4})-(\d{2})$/)
  if (match) return MOIS_SEUL[match[2]] || match[2]
  return formatMoisPaie(mois)
}

function anneeSeule(mois: string, datePaie?: string) {
  if (datePaie && datePaie.length >= 4) return datePaie.slice(0, 4)
  const cle = normalizeMoisCle(mois, datePaie)
  const match = cle.match(/^(\d{4})/)
  return match?.[1] ?? ''
}

function buildQrPayload(data: BulletinPaieB1Data): string {
  const { ligne } = data
  return [
    'ARMP-RDC',
    'BULLETIN DE PAIE',
    `Matricule: ${ligne.matricule || '—'}`,
    `Nom: ${[ligne.nom, ligne.postnom, ligne.prenom].filter(Boolean).join(' ')}`,
    `Net: ${formatMontant(ligne.netAPayer)} CDF`,
    `Mois: ${formatMoisPaie(ligne.mois)}`,
  ].join('\n')
}

export function BulletinPaieB1Modal({ data, entreprise, onClose }: Props) {
  const [qrDataUrl, setQrDataUrl] = useState('')
  const [exportingPdf, setExportingPdf] = useState(false)

  const qrPayload = useMemo(
    () => (data ? buildQrPayload(data) : ''),
    [data],
  )

  useEffect(() => {
    if (!data) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [data, onClose])

  useEffect(() => {
    if (!data) return
    const clear = () => document.body.classList.remove('printing-paie-fiche')
    window.addEventListener('afterprint', clear)
    return () => {
      window.removeEventListener('afterprint', clear)
      clear()
    }
  }, [data])

  useEffect(() => {
    if (!data) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [data])

  useEffect(() => {
    if (!qrPayload) {
      setQrDataUrl('')
      return
    }
    let cancelled = false
    const timer = window.setTimeout(() => {
      QRCode.toDataURL(qrPayload, {
        errorCorrectionLevel: 'M',
        margin: 1,
        width: 85,
        color: { dark: '#111111', light: '#ffffff' },
      })
        .then((url) => {
          if (!cancelled) setQrDataUrl(url)
        })
        .catch(() => {
          if (!cancelled) setQrDataUrl('')
        })
    }, 0)
    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [qrPayload])

  if (!data) return null

  const { ligne, numeroCnss, siteTravail, direction } = data
  const logoUrl = entreprise?.logo?.dataUrl || ''
  const orgName =
    entreprise?.raisonSociale ||
    'AUTORITE DE REGULATION DES MARCHES PUBLICS'
  const sigle = entreprise?.sigle || 'ARMP'
  const signRh =
    entreprise?.responsable1?.trim() || 'BILILO LWANGO Consolatrice'
  const signDaf =
    entreprise?.responsable2?.trim() || 'BATAMBA BAFENDA Micheline'

  const totalRetenues =
    parseMontant(ligne.retenueCnss) + parseMontant(ligne.retenueIpr)

  function handlePrint() {
    document.body.classList.add('printing-paie-fiche')
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => {
        window.print()
      })
    })
  }

  async function handleExportPdf() {
    const sheet = document.getElementById('bulletin-paie-b1-print')
    if (!sheet || exportingPdf) return

    setExportingPdf(true)
    try {
      const canvas = await html2canvas(sheet, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        logging: false,
      })
      const imgData = canvas.toDataURL('image/png')
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      })
      const pageWidth = pdf.internal.pageSize.getWidth()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const margin = 8
      const usableWidth = pageWidth - margin * 2
      const usableHeight = pageHeight - margin * 2
      const ratio = Math.min(
        usableWidth / canvas.width,
        usableHeight / canvas.height,
      )
      const imgWidth = canvas.width * ratio
      const imgHeight = canvas.height * ratio
      const x = (pageWidth - imgWidth) / 2
      pdf.addImage(imgData, 'PNG', x, margin, imgWidth, imgHeight)

      const mois = normalizeMoisCle(ligne.mois, ligne.datePaie) || 'mois'
      const matricule = (ligne.matricule || 'agent').replace(/[^\w-]+/g, '_')
      pdf.save(`Bulletin_paie_${matricule}_${mois}.pdf`)
    } catch {
      window.alert(
        "Impossible d'exporter le bulletin en PDF. Réessayez ou utilisez l'impression.",
      )
    } finally {
      setExportingPdf(false)
    }
  }

  return createPortal(
    <div
      className="modal-backdrop fiche-backdrop bulletin-paie-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="fiche-panel bulletin-paie-panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulletin-paie-b1-title"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="fiche-toolbar no-print">
          <p>Bulletin de paie</p>
          <div className="fiche-toolbar-actions">
            <button type="button" className="btn-print" onClick={handlePrint}>
              <Printer size={16} />
              Imprimer le bulletin
            </button>
            <button
              type="button"
              className="btn-print"
              onClick={() => void handleExportPdf()}
              disabled={exportingPdf}
              title="Exporter le bulletin en PDF"
            >
              <FileDown size={16} />
              {exportingPdf ? 'Export PDF…' : 'Exporter en PDF'}
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

        <article className="bulletin-paie-sheet" id="bulletin-paie-b1-print">
          <header className="bulletin-paie-header">
            <div className="bulletin-paie-brand">
              {logoUrl ? (
                <img
                  className="bulletin-paie-logo"
                  src={logoUrl}
                  alt={sigle || orgName}
                />
              ) : (
                <div className="bulletin-paie-logo-fallback" aria-hidden>
                  {sigle}
                </div>
              )}
            </div>

            <div className="bulletin-paie-title-wrap">
              <h1 id="bulletin-paie-b1-title" className="bulletin-paie-title">
                BULLETIN DE PAIE
              </h1>
            </div>

            <div className="bulletin-paie-qr">
              {qrDataUrl ? (
                <img
                  src={qrDataUrl}
                  alt="QR code bulletin"
                  width={83}
                  height={83}
                />
              ) : (
                <div className="bulletin-paie-qr-placeholder" aria-hidden />
              )}
            </div>
          </header>

          <section className="bulletin-paie-table" aria-label="Bulletin">
            <div className="bulletin-paie-span bulletin-paie-id-period">
              <p className="bulletin-paie-field bulletin-paie-field-period">
                <span className="bulletin-paie-field-label">MOIS</span>
                <span className="bulletin-paie-field-sep">:</span>
                <span className="bulletin-paie-field-value">
                  {moisSeul(ligne.mois, ligne.datePaie)}
                </span>
              </p>
              <p className="bulletin-paie-field bulletin-paie-field-period">
                <span className="bulletin-paie-field-label">ANNEE</span>
                <span className="bulletin-paie-field-sep">:</span>
                <span className="bulletin-paie-field-value">
                  {anneeSeule(ligne.mois, ligne.datePaie)}
                </span>
              </p>
              <p className="bulletin-paie-field bulletin-paie-field-period">
                <span className="bulletin-paie-field-label">DATE PAIE</span>
                <span className="bulletin-paie-field-sep">:</span>
                <span className="bulletin-paie-field-value">
                  {formatDateFr(ligne.datePaie)}
                </span>
              </p>
            </div>

            <div className="bulletin-paie-span bulletin-paie-site">
              <span>
                <strong>SITE D&apos;AFFECTATION :</strong>{' '}
                {siteTravail || '—'}
              </span>
            </div>

            <div className="bulletin-paie-cell bulletin-paie-id-col">
              <p className="bulletin-paie-field">
                <span className="bulletin-paie-field-label">MATRICULE</span>
                <span className="bulletin-paie-field-sep">:</span>
                <span className="bulletin-paie-field-value">
                  {ligne.matricule || '—'}
                </span>
              </p>
              <p className="bulletin-paie-field">
                <span className="bulletin-paie-field-label">NOM</span>
                <span className="bulletin-paie-field-sep">:</span>
                <span className="bulletin-paie-field-value">
                  {ligne.nom || '—'}
                </span>
              </p>
              <p className="bulletin-paie-field">
                <span className="bulletin-paie-field-label">POSTNOM</span>
                <span className="bulletin-paie-field-sep">:</span>
                <span className="bulletin-paie-field-value">
                  {ligne.postnom || '—'}
                </span>
              </p>
              <p className="bulletin-paie-field">
                <span className="bulletin-paie-field-label">PRENOM</span>
                <span className="bulletin-paie-field-sep">:</span>
                <span className="bulletin-paie-field-value">
                  {ligne.prenom || '—'}
                </span>
              </p>
            </div>

            <div className="bulletin-paie-cell bulletin-paie-id-col">
              <p className="bulletin-paie-field">
                <span className="bulletin-paie-field-label">DATE ENGAGEMENT</span>
                <span className="bulletin-paie-field-sep">:</span>
                <span className="bulletin-paie-field-value">
                  {formatDateFr(ligne.dateEngagement) || '—'}
                </span>
              </p>
              <p className="bulletin-paie-field">
                <span className="bulletin-paie-field-label">GRADE</span>
                <span className="bulletin-paie-field-sep">:</span>
                <span className="bulletin-paie-field-value">
                  {ligne.grade || '—'}
                </span>
              </p>
              <p className="bulletin-paie-field">
                <span className="bulletin-paie-field-label">FONCTION</span>
                <span className="bulletin-paie-field-sep">:</span>
                <span className="bulletin-paie-field-value">
                  {ligne.fonction || '—'}
                </span>
              </p>
              <p className="bulletin-paie-field">
                <span className="bulletin-paie-field-label">DIRECTION</span>
                <span className="bulletin-paie-field-sep">:</span>
                <span className="bulletin-paie-field-value">
                  {direction || '—'}
                </span>
              </p>
            </div>

            <div className="bulletin-paie-cell bulletin-paie-id-col">
              <p className="bulletin-paie-cnss">
                <strong>N° CNSS :</strong> {numeroCnss || '—'}
              </p>
            </div>

            <div className="bulletin-paie-cell bulletin-paie-money-col">
              <div className="bulletin-paie-money-head">
                <span>RUBRIQUE PAIE</span>
                <span>MONTANT EN CDF</span>
              </div>
              <div className="bulletin-paie-money-body">
                <div className="bulletin-paie-money-row">
                  <span>BASE :</span>
                  <span>{formatMontant(ligne.base)}</span>
                </div>
                <div className="bulletin-paie-money-row">
                  <span>LOGEMENT :</span>
                  <span>{formatMontant(ligne.logement)}</span>
                </div>
                <div className="bulletin-paie-money-row">
                  <span>TRANSPORT :</span>
                  <span>{formatMontant(ligne.transport)}</span>
                </div>
              </div>
              <div className="bulletin-paie-money-row is-total">
                <span>TOTAL BRUT :</span>
                <span>{formatMontant(ligne.totalBrut)}</span>
              </div>
            </div>

            <div className="bulletin-paie-cell bulletin-paie-money-col">
              <div className="bulletin-paie-money-head">
                <span>RETENUES</span>
                <span>MONTANT EN CDF</span>
              </div>
              <div className="bulletin-paie-money-body">
                <div className="bulletin-paie-money-row">
                  <span>CNSS (5%) :</span>
                  <span>{formatMontant(ligne.retenueCnss)}</span>
                </div>
                <div className="bulletin-paie-money-row">
                  <span>IPR (21%) :</span>
                  <span>{formatMontant(ligne.retenueIpr)}</span>
                </div>
              </div>
              <div className="bulletin-paie-money-row is-total">
                <span>TOTAL</span>
                <span>{formatMontant(String(totalRetenues))}</span>
              </div>
            </div>

            <div className="bulletin-paie-cell bulletin-paie-money-col bulletin-paie-money-net">
              <div className="bulletin-paie-money-head bulletin-paie-money-head-net">
                <span>SITUATION NET EN CDF</span>
              </div>
              <div className="bulletin-paie-money-body" />
              <div className="bulletin-paie-money-row is-total">
                <span>NET A PAYER :</span>
                <span>{formatMontant(ligne.netAPayer)}</span>
              </div>
            </div>
          </section>

          <footer className="bulletin-paie-sign">
            <div className="bulletin-paie-sign-block bulletin-paie-sign-rh">
              <p className="bulletin-paie-sign-name">{signRh}</p>
              <p className="bulletin-paie-sign-role">
                Directeur des Ressources Humaines
              </p>
            </div>
            <div className="bulletin-paie-sign-block bulletin-paie-sign-daf">
              <p className="bulletin-paie-sign-name">{signDaf}</p>
              <p className="bulletin-paie-sign-role">
                Directeur Administratif et Financier
              </p>
            </div>
          </footer>
        </article>
      </div>
    </div>,
    document.body,
  )
}
