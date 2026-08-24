import { createPortal } from 'react-dom'
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Gift, X } from 'lucide-react'
import {
  loadParametresStore,
  PARAMETRES_STORE_CHANGED,
} from '../../parametres/storage'
import type { RefItem } from '../../parametres/types'

type Props = {
  open: boolean
  onClose: () => void
}

function primeSlug(prime: RefItem): string {
  const code = (prime.code || '').trim().toLowerCase()
  if (code) return encodeURIComponent(code)
  return encodeURIComponent(
    (prime.libelle || 'prime')
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') || 'prime',
  )
}

export function BulletinsPrimesDialog({ open, onClose }: Props) {
  const [primes, setPrimes] = useState<RefItem[]>(
    () => loadParametresStore().primes ?? [],
  )

  useEffect(() => {
    if (!open) return
    function refresh() {
      setPrimes(loadParametresStore().primes ?? [])
    }
    refresh()
    window.addEventListener(PARAMETRES_STORE_CHANGED, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(PARAMETRES_STORE_CHANGED, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  const liens = useMemo(() => {
    return [...primes]
      .filter((p) => p.statut !== 'inactif' && (p.libelle || p.code))
      .sort((a, b) =>
        (a.libelle || a.code).localeCompare(b.libelle || b.code, 'fr', {
          sensitivity: 'base',
        }),
      )
  }, [primes])

  if (!open) return null

  return createPortal(
    <div
      className="modal-backdrop bulletins-primes-dialog-backdrop"
      role="presentation"
      onClick={onClose}
    >
      <div
        className="modal-panel bulletins-primes-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="bulletins-primes-dialog-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="bulletins-primes-dialog-head">
          <div className="bulletins-primes-dialog-brand">
            <span className="bulletins-primes-dialog-mark" aria-hidden>
              <Gift size={20} strokeWidth={1.75} />
            </span>
            <div>
              <p className="bulletins-primes-dialog-eyebrow">
                Bulletins de Paie
              </p>
              <h2 id="bulletins-primes-dialog-title">
                Primes et avantages
              </h2>
              <p className="bulletins-primes-dialog-lead">
                Sélectionnez une prime pour ouvrir son bulletin.
              </p>
            </div>
          </div>
          <button
            type="button"
            className="bulletins-primes-dialog-close"
            onClick={onClose}
            aria-label="Fermer"
          >
            <X size={18} strokeWidth={2} />
          </button>
        </header>

        <div className="bulletins-primes-dialog-meta">
          <span>
            {liens.length} type{liens.length > 1 ? 's' : ''} de prime
            {liens.length > 1 ? 's' : ''}
          </span>
        </div>

        <div className="bulletins-primes-dialog-body">
          {liens.length === 0 ? (
            <p className="bulletins-primes-dialog-empty">
              Aucune prime active. Ajoutez-en dans Paramètres → Fichiers →
              Prime.
            </p>
          ) : (
            <ul className="bulletins-primes-dialog-links">
              {liens.map((prime, index) => (
                <li
                  key={prime.id}
                  style={{ animationDelay: `${40 + index * 28}ms` }}
                >
                  <Link
                    to={`/paie/bulletins/primes-avantages/${primeSlug(prime)}`}
                    className="bulletins-primes-dialog-link"
                    onClick={onClose}
                  >
                    <span className="bulletins-primes-dialog-code">
                      {prime.code || '—'}
                    </span>
                    <span className="bulletins-primes-dialog-libelle">
                      {prime.libelle || prime.code}
                    </span>
                    <ChevronRight
                      className="bulletins-primes-dialog-chevron"
                      size={16}
                      aria-hidden
                    />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <footer className="bulletins-primes-dialog-foot">
          <button
            type="button"
            className="bulletins-primes-dialog-btn"
            onClick={onClose}
          >
            Fermer
          </button>
        </footer>
      </div>
    </div>,
    document.body,
  )
}
