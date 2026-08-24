import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { AuthProvider } from './auth/AuthContext'
import App from './App'
import { hydrateFromCloud } from './sync/cloudSync'
import './styles/index.css'

async function boot() {
  const rootEl = document.getElementById('root')
  if (!rootEl) return

  try {
    const result = await hydrateFromCloud()
    if (result.ok) {
      console.info(
        '[grh] Sync cloud',
        `hydraté=${result.hydrated.join(',') || '—'}`,
        `envoyé=${result.uploaded.join(',') || '—'}`,
      )
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
