import type { FormEvent, ReactNode } from 'react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

type Props = {
  title: string
  subtitle?: string
  open: boolean
  onClose: () => void
  onSubmit: (e: FormEvent) => void
  children: ReactNode
  submitLabel?: string
  cancelLabel?: string
  panelClassName?: string
}

export function FormModal({
  title,
  subtitle = 'Formulaire d’enregistrement',
  open,
  onClose,
  onSubmit,
  children,
  submitLabel = 'Enregistrer',
  cancelLabel = 'Annuler',
  panelClassName,
}: Props) {
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  return createPortal(
    <div className="modal-backdrop" role="presentation" onClick={onClose}>
      <div
        className={`modal-panel form-dock-panel${panelClassName ? ` ${panelClassName}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="wizard-hero">
          <div className="wizard-hero-text">
            <p className="wizard-kicker">{subtitle}</p>
            <h2 id="modal-title">{title}</h2>
          </div>
          <button
            type="button"
            className="wizard-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
        </header>

        <form className="modal-form form-dock-form" onSubmit={onSubmit}>
          <div className="form-dock-body">
            <div className="form-grid">{children}</div>
          </div>
          <div className="modal-actions form-dock-actions">
            <button type="button" className="btn-ghost" onClick={onClose}>
              {cancelLabel}
            </button>
            <button type="submit" className="btn-primary">
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}

type FieldProps = {
  label: string
  children: ReactNode
  full?: boolean
}

export function Field({ label, children, full }: FieldProps) {
  return (
    <label className={`field ${full ? 'field-full' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
    </label>
  )
}
