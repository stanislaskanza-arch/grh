import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Check, Copy, Download, FileSpreadsheet, Trash2, Upload } from 'lucide-react'
import {
  commitBareme1Import,
  downloadBareme1ImportTemplate,
  parseBareme1ExcelFile,
  type Bareme1ImportPreviewRow,
  type Bareme1ImportResult,
} from '../importBareme1'
import { BAREME1_FIELDS, headersLine, IMPORT_STRUCTURES } from '../importStructures'
import { useParametres } from '../ParametresContext'

export function ImportBareme1Page() {
  const { store, reload, setCollection } = useParametres()
  const inputRef = useRef<HTMLInputElement>(null)
  const def = IMPORT_STRUCTURES.bareme1
  const line = headersLine(def)
  const installedCount = store.baremes1.length
  const [copied, setCopied] = useState(false)
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<Bareme1ImportPreviewRow[]>([])
  const [result, setResult] = useState<Bareme1ImportResult | null>(null)

  async function copyHeaders() {
    try {
      await navigator.clipboard.writeText(line)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      window.prompt('Copiez la ligne d’en-têtes :', line)
    }
  }

  async function onFileChange(file: File | null) {
    setResult(null)
    setError('')
    setPreview([])
    setFileName('')
    if (!file) return

    const lower = file.name.toLowerCase()
    if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls')) {
      setError('Veuillez sélectionner un fichier Excel (.xlsx ou .xls).')
      return
    }

    setBusy(true)
    setFileName(file.name)
    try {
      const rows = await parseBareme1ExcelFile(file)
      setPreview(rows)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Lecture du fichier impossible.')
    } finally {
      setBusy(false)
    }
  }

  function onImport() {
    if (preview.length === 0) return
    setBusy(true)
    setError('')
    try {
      const summary = commitBareme1Import(preview)
      reload()
      setResult(summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import impossible.')
    } finally {
      setBusy(false)
    }
  }

  function supprimerBaremeInstalle() {
    if (installedCount === 0) return
    const lockedCount = store.baremes1.filter((row) => row.valide).length
    if (lockedCount === installedCount) {
      window.alert(
        'Toutes les lignes du Barème 1 sont validées : suppression impossible.',
      )
      return
    }
    const confirmed = window.confirm(
      `Attention\n\n` +
        `La suppression du barème installé (${installedCount} ligne${installedCount > 1 ? 's' : ''}) ` +
        `peut engendrer un désagrément lors des calculs de la paie.\n\n` +
        (lockedCount > 0
          ? `${lockedCount} ligne(s) validée(s) seront conservée(s).\n\n`
          : '') +
        `Êtes-vous sûr de vouloir le supprimer ?\n\n` +
        `• OK = Oui, supprimer\n` +
        `• Annuler = Non, abandonner`,
    )
    if (!confirmed) return
    setCollection('baremes1', [])
    setResult(null)
    setPreview([])
    setFileName('')
    setError('')
  }

  const validCount = preview.filter((r) => r.valid).length
  const syncedCount = result ? result.created + result.updated : 0

  return (
    <div className="import-personnel-page import-structure-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Importation fichier</p>
          <h1>Barème 1</h1>
          <p className="lede">
            Importez un fichier Excel Barème 1. Les lignes avec un grade déjà
            existant seront mises à jour dans Fichiers → Barème 1. Les lignes
            déjà validées restent inchangées.
          </p>
        </div>
        <button
          type="button"
          className="btn-ghost admin-cta admin-cta-danger"
          onClick={supprimerBaremeInstalle}
          disabled={busy || installedCount === 0}
        >
          <span className="admin-cta-icon" aria-hidden>
            <Trash2 size={18} />
          </span>
          Supprimer Barème Installé
        </button>
      </header>

      <section className="import-personnel-panel">
        <div className="import-structure-meta">
          <p>
            Fichier père : <strong>{def.fichierPere}</strong>
          </p>
          <p>{BAREME1_FIELDS.length} colonnes Excel</p>
        </div>

        <div className="import-personnel-actions">
          <button type="button" className="btn-ghost" onClick={copyHeaders}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Ligne copiée' : 'Copier la ligne des champs'}
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => downloadBareme1ImportTemplate()}
          >
            <Download size={16} />
            Télécharger le modèle Excel
          </button>
          <button
            type="button"
            className="btn-primary import-personnel-upload-btn"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
          >
            <Upload size={16} />
            Choisir un fichier Excel
          </button>
          <input
            ref={inputRef}
            type="file"
            accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            hidden
            onChange={(e) => onFileChange(e.target.files?.[0] ?? null)}
          />
        </div>

        {fileName && (
          <p className="import-personnel-filename">
            <FileSpreadsheet size={16} />
            {fileName}
          </p>
        )}

        {error && <p className="form-error">{error}</p>}

        <div className="import-personnel-hint">
          <p>
            Conservez la ligne d’en-têtes. Clé de mise à jour :{' '}
            <strong>GRADE</strong>.
          </p>
          <pre className="import-structure-headers" tabIndex={0}>
            {line}
          </pre>
        </div>

        <div className="import-personnel-table-wrap">
          <table className="data-table import-personnel-table">
            <thead>
              <tr>
                <th>N°</th>
                <th>En-tête Excel</th>
                <th>Obligatoire</th>
                <th>Valeurs</th>
              </tr>
            </thead>
            <tbody>
              {BAREME1_FIELDS.map((field, index) => (
                <tr key={field.key}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{field.header}</strong>
                  </td>
                  <td>{field.required ? 'Oui' : 'Non'}</td>
                  <td>{field.valeurs || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {preview.length > 0 && (
          <>
            <div className="import-personnel-summary">
              <span>
                {preview.length} ligne{preview.length > 1 ? 's' : ''} lue
                {preview.length > 1 ? 's' : ''}
              </span>
              <span>
                {validCount} valide{validCount > 1 ? 's' : ''}
              </span>
              <span>{preview.length - validCount} à ignorer</span>
            </div>

            <div className="import-personnel-table-wrap">
              <table className="data-table import-personnel-table">
                <thead>
                  <tr>
                    <th>Ligne</th>
                    <th>Grade</th>
                    <th>Libellé grade</th>
                    <th>Base</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 50).map((row) => (
                    <tr
                      key={row.rowNumber}
                      className={row.valid ? '' : 'is-invalid'}
                    >
                      <td>{row.rowNumber}</td>
                      <td>{row.grade || '—'}</td>
                      <td>{row.libelleGrade || '—'}</td>
                      <td>{row.data.base || '—'}</td>
                      <td>{row.valid ? 'OK' : row.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 50 && (
                <p className="import-personnel-more">
                  Aperçu limité aux 50 premières lignes ({preview.length} au
                  total).
                </p>
              )}
            </div>

            <button
              type="button"
              className="btn-primary"
              disabled={busy || validCount === 0}
              onClick={onImport}
            >
              Importer et synchroniser {validCount} ligne
              {validCount > 1 ? 's' : ''}
            </button>
          </>
        )}

        {result && (
          <div className="import-personnel-result" role="status">
            <p>
              Import terminé : <strong>{result.created}</strong> créé
              {result.created > 1 ? 's' : ''}, <strong>{result.updated}</strong>{' '}
              mis à jour, <strong>{result.skipped}</strong> ignoré
              {result.skipped > 1 ? 's' : ''}.
            </p>
            {syncedCount > 0 && (
              <p>
                Données disponibles dans{' '}
                <Link to="/parametres/fichiers/bareme1">Fichiers → Barème 1</Link>
                .
              </p>
            )}
            {result.errors.length > 0 && (
              <ul>
                {result.errors.slice(0, 10).map((msg) => (
                  <li key={msg}>{msg}</li>
                ))}
              </ul>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
