import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import App from './App'
import { syncWithCloud } from './sync/cloudSync'
import './styles/index.css'

async function boot() {
  const rootEl = document.getElementById('root')
  if (!rootEl) return

  try {
    const result = await syncWithCloud()
    if (result.ok) {
      console.info(
        '[grh] Sync cloud',
        `persistence=${result.persistence ?? '—'}`,
        `hydraté=${result.hydrated.join(',') || '—'}`,
        `envoyé=${result.uploaded.join(',') || '—'}`,
      )
    } else {
      console.warn('[grh] Sync cloud indisponible', result.error)
    }
  } catch {
    /* mode local uniquement */
  }

  createRoot(rootEl).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>,
  )
}

void boot()
