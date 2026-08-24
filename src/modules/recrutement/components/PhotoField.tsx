import { Camera, ImagePlus, Trash2, Upload } from 'lucide-react'
import {
  useId,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
} from 'react'
import { formatFileSize, readFileAsRef } from '../fileUtils'
import type { FileRef } from '../types'

type PhotoFieldProps = {
  label?: string
  value: FileRef | null
  onChange: (file: FileRef | null) => void
  accept?: string
  hint?: string
  full?: boolean
}

export function PhotoField({
  label = 'Photo',
  value,
  onChange,
  accept = 'image/jpeg,image/png,image/webp',
  hint = 'JPG, PNG ou WebP — portrait clair, fond uni de préférence',
  full,
}: PhotoFieldProps) {
  const inputId = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function applyFile(file: File | null | undefined) {
    setError(null)
    if (!file) {
      onChange(null)
      return
    }
    if (!file.type.startsWith('image/')) {
      setError('Veuillez sélectionner une image.')
      return
    }
    const ref = await readFileAsRef(file)
    if (!ref.dataUrl) {
      setError('Image trop volumineuse. Choisissez un fichier plus léger.')
      return
    }
    onChange(ref)
  }

  async function handleChange(e: ChangeEvent<HTMLInputElement>) {
    await applyFile(e.target.files?.[0])
    e.target.value = ''
  }

  function handleDragOver(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(true)
  }

  function handleDragLeave(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
  }

  async function handleDrop(e: DragEvent) {
    e.preventDefault()
    e.stopPropagation()
    setDragging(false)
    await applyFile(e.dataTransfer.files?.[0])
  }

  function openPicker() {
    inputRef.current?.click()
  }

  function removePhoto() {
    setError(null)
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  const hasPhoto = Boolean(value?.dataUrl)

  return (
    <div className={`field photo-field ${full ? 'field-full' : ''}`}>
      <span className="field-label">{label}</span>

      <div
        className={`photo-dropzone${dragging ? ' is-dragging' : ''}${hasPhoto ? ' has-photo' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          className="photo-dropzone-input"
          onChange={handleChange}
        />

        <div className="photo-preview-frame" aria-hidden={!hasPhoto}>
          {hasPhoto ? (
            <img
              src={value!.dataUrl}
              alt=""
              className="photo-preview-img"
            />
          ) : (
            <div className="photo-preview-empty">
              <span className="photo-preview-icon" aria-hidden>
                <Camera size={28} strokeWidth={1.6} />
              </span>
              <span className="photo-preview-empty-text">Photo agent</span>
            </div>
          )}
        </div>

        <div className="photo-dropzone-body">
          {hasPhoto ? (
            <>
              <p className="photo-dropzone-title">Photo enregistrée</p>
              <p className="photo-dropzone-meta">
                <strong>{value!.name}</strong>
                <span>{formatFileSize(value!.size)}</span>
              </p>
              <div className="photo-dropzone-actions">
                <button
                  type="button"
                  className="btn-ghost photo-action-btn"
                  onClick={openPicker}
                >
                  <ImagePlus size={15} aria-hidden />
                  Changer
                </button>
                <button
                  type="button"
                  className="btn-ghost photo-action-btn photo-action-remove"
                  onClick={removePhoto}
                >
                  <Trash2 size={15} aria-hidden />
                  Retirer
                </button>
              </div>
            </>
          ) : (
            <>
              <p className="photo-dropzone-title">
                Glissez-déposez la photo ici
              </p>
              <p className="photo-dropzone-meta">
                ou cliquez pour parcourir vos fichiers
              </p>
              <button
                type="button"
                className="btn-primary photo-action-btn photo-action-upload"
                onClick={openPicker}
              >
                <Upload size={15} aria-hidden />
                Choisir une photo
              </button>
            </>
          )}
        </div>
      </div>

      {hint && <small className="field-hint">{hint}</small>}
      {error && (
        <small className="field-hint photo-field-error" role="alert">
          {error}
        </small>
      )}
    </div>
  )
}
