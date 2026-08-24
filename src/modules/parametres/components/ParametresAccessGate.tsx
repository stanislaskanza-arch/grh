import { useState, type FormEvent } from 'react'
import { Database, Lock } from 'lucide-react'
import { DEFAULT_DB_PASSWORD, verifyDbAdminPassword } from '../storage'

const UNLOCK_KEY = 'grh.parametres.dbUnlocked'

export function isParametresUnlocked() {
  return sessionStorage.getItem(UNLOCK_KEY) === '1'
}

export function lockParametresAccess() {
  sessionStorage.removeItem(UNLOCK_KEY)
}

type Props = {
  onUnlocked: () => void
}

export function ParametresAccessGate({ onUnlocked }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)

  function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!verifyDbAdminPassword(password)) {
      setError('Mot de passe administrateur de base de données incorrect.')
      return
    }
    sessionStorage.setItem(UNLOCK_KEY, '1')
    setError(null)
    onUnlocked()
  }

  return (
    <div className="param-gate">
      <div className="param-gate-card">
        <div className="param-gate-icon" aria-hidden>
          <Database size={28} />
        </div>
        <h1>Accès Paramètres & Sécurité</h1>
        <p>
          Cette zone est réservée à l’administrateur de base de données.
          Saisissez le mot de passe pour continuer.
        </p>
        <form className="param-gate-form" onSubmit={handleSubmit}>
          <label className="field">
            <span className="field-label">Mot de passe administrateur BDD</span>
            <div className="param-gate-input">
              <Lock size={16} aria-hidden />
              <input
                type="password"
                autoFocus
                autoComplete="current-password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value)
                  setError(null)
                }}
                placeholder="••••••••"
              />
            </div>
          </label>
          {error && <p className="form-error">{error}</p>}
          <button type="submit" className="btn-primary">
            Déverrouiller
          </button>
        </form>
        <p className="param-gate-hint">
          Mot de passe initial : <code>{DEFAULT_DB_PASSWORD}</code>
        </p>
      </div>
    </div>
  )
}
