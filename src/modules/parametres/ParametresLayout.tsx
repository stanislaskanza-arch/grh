import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ParametresProvider } from './ParametresContext'
import {
  ParametresAccessGate,
  isParametresUnlocked,
  lockParametresAccess,
} from './components/ParametresAccessGate'
import { ParametresMenuBar } from './components/ParametresMenuBar'

export function ParametresLayout() {
  const [unlocked, setUnlocked] = useState(() => isParametresUnlocked())

  if (!unlocked) {
    return (
      <ParametresProvider>
        <div className="module-page parametres-module">
          <ParametresAccessGate onUnlocked={() => setUnlocked(true)} />
        </div>
      </ParametresProvider>
    )
  }

  return (
    <ParametresProvider>
      <div className="module-page parametres-module">
        <header className="param-shell-header">
          <div>
            <p className="eyebrow">Administration</p>
            <h1>Paramètres & Sécurité</h1>
          </div>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              lockParametresAccess()
              setUnlocked(false)
            }}
          >
            Verrouiller
          </button>
        </header>
        <ParametresMenuBar />
        <div className="param-shell-content">
          <Outlet />
        </div>
      </div>
    </ParametresProvider>
  )
}
