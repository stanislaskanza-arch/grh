import type { ChangeEvent, ReactNode } from 'react'
import type { FileRef } from '../types'
import { formatFileSize, readFileAsRef } from '../fileUtils'

type FieldProps = {
  label: string
  children: ReactNode
  full?: boolean
  hint?: string
}

export function Field({ label, children, full, hint }: FieldProps) {
  return (
    <label className={`field ${full ? 'field-full' : ''}`}>
      <span className="field-label">{label}</span>
      {children}
      {hint && <small className="field-hint">{hint}</small>}
    </label>
  )
}

type SwitchProps = {
  label: string
  checked: boolean
  onChange: (value: boolean) => void
  full?: boolean
}

export function SwitchField({ label, checked, onChange, full }: SwitchProps) {
  return (
    <div className={`field switch-field ${full ? 'field-full' : ''}`}>
      <span className="field-label">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        className={`switch ${checked ? 'is-on' : ''}`}
        onClick={() => onChange(!checked)}
      >
        <span className="switch-knob" />
        <span className="switch-label">{checked ? 'OUI' : 'NON'}</span>
      </button>
    </div>
  )
}

type FileProps = {
  label: string
  accept: string
  value: FileRef | null
  onChange: (file: FileRef | null) => void
  full?: boolean
  hint?: string
}

export function FileField({ label, accept, value, onChange, full, hint }: FileProps) {
  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) {
      onChange(null)
      return
    }
    const ref = await readFileAsRef(file)
    onChange(ref)
  }

  return (
    <div className={`field ${full ? 'field-full' : ''}`}>
      <span className="field-label">{label}</span>
      <div className="file-field">
        <input type="file" accept={accept} onChange={handleChange} />
        {value ? (
          <div className="file-chip">
            {value.dataUrl && value.type.startsWith('image/') ? (
              <img src={value.dataUrl} alt="" className="file-thumb" />
            ) : null}
            <div>
              <strong>{value.name}</strong>
              <small>{formatFileSize(value.size)}</small>
            </div>
            <button type="button" className="btn-link danger" onClick={() => onChange(null)}>
              Retirer
            </button>
          </div>
        ) : (
          <p className="file-placeholder">Aucun fichier sélectionné</p>
        )}
      </div>
      {hint && <small className="field-hint">{hint}</small>}
    </div>
  )
}

type RadioProps = {
  label: string
  name: string
  value: string
  options: { value: string; label: string }[]
  onChange: (value: string) => void
  full?: boolean
}

export function RadioGroup({ label, name, value, options, onChange, full }: RadioProps) {
  return (
    <fieldset className={`field radio-group ${full ? 'field-full' : ''}`}>
      <legend>{label}</legend>
      <div className="radio-options">
        {options.map((opt) => (
          <label key={opt.value} className="radio-option">
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
