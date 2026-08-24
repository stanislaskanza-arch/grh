import type { CSSProperties, FormEvent, ReactNode } from 'react'
import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { Check, Save, X } from 'lucide-react'

export type WizardStepDef = {
  id: number
  title: string
  short: string
}

type Props = {
  title: string
  subtitle?: string
  open: boolean
  step: number
  steps: readonly WizardStepDef[]
  onStepChange: (step: number) => void
  onClose: () => void
  onSubmit: (e: FormEvent) => void
  onSaveDraft?: () => void
  draftSavedAt?: string | null
  panelClassName?: string
  children: ReactNode
}

export function WizardModal({
  title,
  subtitle,
  open,
  step,
  steps,
  onStepChange,
  onClose,
  onSubmit,
  onSaveDraft,
  draftSavedAt,
  panelClassName,
  children,
}: Props) {
  const viewportRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const active = viewportRef.current?.querySelector<HTMLElement>(
      '.wizard-slide.is-active',
    )
    active?.scrollTo({ top: 0, behavior: 'auto' })
  }, [step, open])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open) return null

  const isFirst = step === 1
  const isLast = step === steps.length
  const progress =
    steps.length <= 1 ? 100 : ((step - 1) / (steps.length - 1)) * 100
  const slidePercent = 100 / steps.length
  const current = steps[step - 1]

  return createPortal(
    <div
      className="modal-backdrop wizard-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className={`modal-panel wizard-panel${panelClassName ? ` ${panelClassName}` : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="wizard-hero">
          <div className="wizard-hero-text">
            <p className="wizard-kicker">
              {subtitle ?? `Parcours en ${steps.length} étapes`}
            </p>
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

        <nav className="wizard-steps-wrap" aria-label="Étapes du formulaire">
          <div className="wizard-track" aria-hidden>
            <div className="wizard-track-fill" style={{ width: `${progress}%` }} />
          </div>
          <ol className="wizard-steps">
            {steps.map((s) => {
              const done = step > s.id
              const isCurrent = step === s.id
              return (
                <li key={s.id} className="wizard-step-item">
                  <button
                    type="button"
                    className={`wizard-step ${isCurrent ? 'is-current' : ''} ${done ? 'is-done' : ''}`}
                    onClick={() => onStepChange(s.id)}
                  >
                    <span className="wizard-step-num">
                      {done ? <Check size={14} strokeWidth={3} /> : s.id}
                    </span>
                    <strong className="wizard-step-short">{s.short}</strong>
                    <small className="wizard-step-full">{s.title}</small>
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <form className="modal-form wizard-form" onSubmit={onSubmit}>
          <div className="wizard-body">
            <div className="wizard-step-intro">
              <span className="wizard-step-pill">
                Étape {step} sur {steps.length}
              </span>
              <h3>{current.title}</h3>
              <p>
                {current.short} — renseignez les informations demandées
                {onSaveDraft
                  ? '. Utilisez « Sauvegarder » pour reprendre plus tard à cette étape.'
                  : '.'}
              </p>
            </div>

            <div className="wizard-viewport" ref={viewportRef}>
              <div
                className="wizard-h-track"
                style={
                  {
                    '--wizard-steps': steps.length,
                    width: `${steps.length * 100}%`,
                    transform: `translateX(-${(step - 1) * slidePercent}%)`,
                  } as CSSProperties
                }
              >
                {children}
              </div>
            </div>
          </div>

          <div className="modal-actions wizard-actions">
            <div className="wizard-actions-left">
              <button type="button" className="btn-ghost" onClick={onClose}>
                Fermer
              </button>
              {onSaveDraft && (
                <button
                  type="button"
                  className="btn-save-draft"
                  onClick={onSaveDraft}
                  title="Conserver la saisie pour reprendre plus tard"
                >
                  <Save size={16} />
                  Sauvegarder
                </button>
              )}
              {draftSavedAt && (
                <span className="draft-saved-hint" role="status">
                  Brouillon enregistré — étape {step}
                </span>
              )}
            </div>
            <div className="wizard-nav-btns">
              {!isFirst && (
                <button
                  type="button"
                  className="btn-ghost"
                  onClick={() => onStepChange(step - 1)}
                >
                  Précédent
                </button>
              )}
              {!isLast ? (
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => onStepChange(step + 1)}
                >
                  Continuer
                </button>
              ) : (
                <button type="submit" className="btn-primary btn-save">
                  Enregistrer la fiche
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>,
    document.body,
  )
}
