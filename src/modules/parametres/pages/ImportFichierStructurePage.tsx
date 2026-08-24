import { useMemo, useState } from 'react'
import { Check, Copy } from 'lucide-react'
import {
  headersLine,
  IMPORT_STRUCTURES,
  type ImportStructureDef,
} from '../importStructures'

type Props = {
  structureId: keyof typeof IMPORT_STRUCTURES
}

export function ImportFichierStructurePage({ structureId }: Props) {
  const def = IMPORT_STRUCTURES[structureId] as ImportStructureDef
  const [copied, setCopied] = useState(false)
  const line = useMemo(() => headersLine(def), [def])

  async function copyHeaders() {
    try {
      await navigator.clipboard.writeText(line)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback : sélection via invite
      window.prompt('Copiez la ligne d’en-têtes :', line)
    }
  }

  return (
    <div className="import-personnel-page import-structure-page">
      <header className="page-header">
        <div>
          <p className="eyebrow">Importation fichier</p>
          <h1>{def.title}</h1>
          <p className="lede">{def.description}</p>
        </div>
      </header>

      <section className="import-personnel-panel">
        <div className="import-structure-meta">
          <p>
            Fichier père : <strong>{def.fichierPere}</strong>
          </p>
          <p>
            {def.fields.length} colonnes Excel — hors champs techniques (
            <code>id</code>, <code>createdAt</code>).
          </p>
        </div>

        <div className="import-personnel-actions">
          <button type="button" className="btn-primary" onClick={copyHeaders}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
            {copied ? 'Ligne copiée' : 'Copier la ligne des champs'}
          </button>
        </div>

        <div className="import-personnel-hint">
          <p>
            Collez cette ligne en <strong>A1</strong> dans Excel (séparateur
            tabulation). Conservez les en-têtes pour préparer l’importation.
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
                <th>Clé</th>
                <th>Obligatoire</th>
                <th>Valeurs</th>
              </tr>
            </thead>
            <tbody>
              {def.fields.map((field, index) => (
                <tr key={field.key}>
                  <td>{index + 1}</td>
                  <td>
                    <strong>{field.header}</strong>
                  </td>
                  <td>
                    <code className="id-code">{field.key}</code>
                  </td>
                  <td>{field.required ? 'Oui' : 'Non'}</td>
                  <td>
                    {field.valeurs || '—'}
                    {field.note ? ` — ${field.note}` : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="import-structure-example">
          <h3>Ligne d’exemple</h3>
          <pre className="import-structure-headers">
            {def.exampleRow.join('\t')}
          </pre>
        </div>
      </section>
    </div>
  )
}
