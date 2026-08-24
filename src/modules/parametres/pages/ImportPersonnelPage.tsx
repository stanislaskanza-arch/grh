import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { Download, FileSpreadsheet, Upload } from 'lucide-react'
import {
  commitPersonnelImport,
  downloadPersonnelImportTemplate,
  parsePersonnelExcelFile,
  PERSONNEL_IMPORT_COLUMNS,
  PERSONNEL_IMPORT_SECTIONS,
  type PersonnelImportPreviewRow,
  type PersonnelImportResult,
} from '../importPersonnel'

export function ImportPersonnelPage() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState<PersonnelImportPreviewRow[]>([])
  const [result, setResult] = useState<PersonnelImportResult | null>(null)

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
      const rows = await parsePersonnelExcelFile(file)
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
      const summary = commitPersonnelImport(preview)
      setResult(summary)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import impossible.')
    } finally {
      setBusy(false)
    }
  }

  const validCount = preview.filter((r) => r.valid).length
  const syncedCount = result ? result.created + result.updated : 0

  return (
    <div className="import-personnel-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Importation fichier</p>
          <h1>Fichier du Personnel</h1>
          <p className="lede">
            Importez un fichier Excel contenant les mêmes champs que le fichier
            personnel de l’application. Les lignes avec un matricule déjà existant
            (non validé) seront mises à jour ; les fiches validées restent
            inchangées.
          </p>
        </div>
      </header>

      <section className="import-personnel-panel">
        <div className="import-personnel-actions">
          <button
            type="button"
            className="btn-ghost"
            onClick={() => downloadPersonnelImportTemplate()}
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
            Le modèle Excel reprend les <strong>{PERSONNEL_IMPORT_COLUMNS.length} champs</strong>{' '}
            du fichier personnel (hors photo). Conservez la ligne d’en-têtes telle quelle.
          </p>
          <div className="import-personnel-field-groups">
            {PERSONNEL_IMPORT_SECTIONS.map(([section, cols]) => (
              <div key={section} className="import-personnel-field-group">
                <h3>{section}</h3>
                <p>{cols.map((c) => c.header).join(' · ')}</p>
              </div>
            ))}
          </div>
        </div>

        {preview.length > 0 && (
          <>
            <div className="import-personnel-summary">
              <span>
                {preview.length} ligne{preview.length > 1 ? 's' : ''} lue
                {preview.length > 1 ? 's' : ''}
              </span>
              <span>{validCount} valide{validCount > 1 ? 's' : ''}</span>
              <span>
                {preview.length - validCount} à ignorer
              </span>
            </div>

            <div className="import-personnel-table-wrap">
              <table className="data-table import-personnel-table">
                <thead>
                  <tr>
                    <th>Ligne</th>
                    <th>Matricule</th>
                    <th>Nom</th>
                    <th>Prénom</th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.slice(0, 50).map((row) => (
                    <tr key={row.rowNumber} className={row.valid ? '' : 'is-invalid'}>
                      <td>{row.rowNumber}</td>
                      <td>{row.matricule || '—'}</td>
                      <td>{row.nom || '—'}</td>
                      <td>{row.prenom || '—'}</td>
                      <td>{row.valid ? 'OK' : row.error}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.length > 50 && (
                <p className="import-personnel-more">
                  Aperçu limité aux 50 premières lignes ({preview.length} au total).
                </p>
              )}
            </div>

            <button
              type="button"
              className="btn-primary"
              disabled={busy || validCount === 0}
              onClick={onImport}
            >
              Importer et synchroniser {validCount} enregistrement
              {validCount > 1 ? 's' : ''}
            </button>
          </>
        )}

        {result && (
          <div className="import-personnel-result" role="status">
            <p>
              Synchronisation terminée : <strong>{result.created}</strong> créé
              {result.created > 1 ? 's' : ''}, <strong>{result.updated}</strong>{' '}
              mis à jour, <strong>{result.skipped}</strong> ignoré
              {result.skipped > 1 ? 's' : ''}.
            </p>
            {syncedCount > 0 && (
              <p>
                Les données sont maintenant disponibles dans{' '}
                <Link to="/recrutement/captures/personnel">
                  Enregistrement du Personnel
                </Link>
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
