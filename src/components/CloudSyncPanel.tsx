import { CloudUpload, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  isCloudAvailable,
  pushAllLocalStores,
  syncWithCloud,
  type SyncResult,
} from '../sync/cloudSync'

function formatSync(result: SyncResult) {
  if (!result.ok) {
    return result.error || 'Synchronisation impossible'
  }
  const parts: string[] = []
  if (result.persistence) parts.push(`Base : ${result.persistence}`)
  if (result.uploaded.length) {
    parts.push(`Envoyé : ${result.uploaded.join(', ')}`)
  }
  if (result.hydrated.length) {
    parts.push(`Reçu : ${result.hydrated.join(', ')}`)
  }
  if (!result.uploaded.length && !result.hydrated.length) {
    parts.push('Déjà à jour')
  }
  return parts.join(' · ')
}

export function CloudSyncPanel() {
  const [available, setAvailable] = useState<boolean | null>(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    void isCloudAvailable().then((ok) => {
      if (!cancelled) setAvailable(ok)
    })
    return () => {
      cancelled = true
    }
  }, [])

  async function runSync(forceUpload: boolean) {
    setBusy(true)
    setMessage('')
    try {
      const result = forceUpload
        ? await pushAllLocalStores()
        : await syncWithCloud()
      setAvailable(result.available)
      setMessage(formatSync(result))
      if (result.ok && (result.hydrated.length > 0 || result.uploaded.length > 0)) {
        window.setTimeout(() => window.location.reload(), 700)
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Erreur de synchronisation')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="cloud-sync-panel" aria-label="Synchronisation base de données">
      <div className="cloud-sync-panel-text">
        <p className="cloud-sync-eyebrow">Base de données partagée</p>
        <h2>Synchronisation cloud</h2>
        <p>
          {available === null
            ? 'Vérification du serveur…'
            : available
              ? 'Serveur joignable — vos données peuvent être partagées avec Railway.'
              : 'Serveur injoignable — lancez l’API (`npm run server` / `npm run dev:full`) ou ouvrez l’URL Railway.'}
        </p>
        {message && (
          <p className="cloud-sync-message" role="status">
            {message}
          </p>
        )}
      </div>
      <div className="cloud-sync-actions">
        <button
          type="button"
          className="btn-ghost"
          disabled={busy || available === false}
          onClick={() => void runSync(false)}
        >
          <RefreshCw size={16} />
          Synchroniser
        </button>
        <button
          type="button"
          className="btn-primary"
          disabled={busy || available === false}
          onClick={() => {
            if (
              !window.confirm(
                'Publier les données de CE navigateur vers le serveur ?\n' +
                  'Cela écrase la base cloud avec le contenu local (personnel, paie, paramètres).',
              )
            ) {
              return
            }
            void runSync(true)
          }}
        >
          <CloudUpload size={16} />
          Publier ma base vers le serveur
        </button>
      </div>
    </section>
  )
}
