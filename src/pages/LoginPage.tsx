import { useState, type FormEvent } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth/AuthContext'

export function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const from =
    (location.state as { from?: string } | null)?.from &&
    (location.state as { from?: string }).from !== '/login'
      ? (location.state as { from: string }).from
      : '/'

  const [email, setEmail] = useState('admin@grh.local')
  const [password, setPassword] = useState('admin123')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (result.ok) {
      navigate(from, { replace: true })
      return
    }
    setError(result.message)
  }

  return (
    <div className="login-page">
      <div className="login-visual" aria-hidden>
        <div className="login-visual-overlay" />
        <div className="login-visual-content">
          <p className="login-brand">GRH</p>
          <p className="login-visual-text">
            Une plateforme claire pour piloter le capital humain de votre
            organisation.
          </p>
        </div>
      </div>

      <div className="login-panel">
        <div className="login-panel-inner">
          <p className="login-kicker">Accès sécurisé</p>
          <h1 className="login-title">Connexion</h1>
          <p className="login-subtitle">
            Identifiez-vous pour accéder aux modules RH.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Adresse e-mail</span>
              <input
                type="email"
                autoComplete="username"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </label>

            <label className="field">
              <span>Mot de passe</span>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </label>

            {error && <p className="form-error" role="alert">{error}</p>}

            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Connexion…' : 'Se connecter'}
            </button>
          </form>

          <p className="login-hint">
            Comptes démo : <code>admin@grh.local</code> / <code>admin123</code>
            {' · '}
            <code>demo@grh.local</code> / <code>demo123</code>
            . Les comptes se gèrent aussi dans Paramètres.
          </p>
        </div>
      </div>
    </div>
  )
}
