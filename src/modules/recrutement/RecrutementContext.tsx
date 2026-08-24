import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  createId,
  loadRecrutementStore,
  RECRUTEMENT_STORE_CHANGED,
  saveRecrutementStore,
} from './storage'
import type {
  Administrateur,
  BesoinFormation,
  Evaluation,
  Personnel,
  Promotion,
  RecrutementStore,
  Sanction,
  Stagiaire,
} from './types'

type CollectionKey = keyof RecrutementStore

type RecrutementContextValue = {
  store: RecrutementStore
  reload: () => void
  add: <K extends CollectionKey>(
    key: K,
    item: Omit<RecrutementStore[K][number], 'id' | 'createdAt'>,
  ) => void
  update: <K extends CollectionKey>(
    key: K,
    id: string,
    patch: Partial<RecrutementStore[K][number]>,
  ) => void
  remove: (key: CollectionKey, id: string) => void
  personnelLabel: (id: string) => string
}

const RecrutementContext = createContext<RecrutementContextValue | null>(null)

export function RecrutementProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<RecrutementStore>(() => loadRecrutementStore())

  const reload = useCallback(() => {
    setStore(loadRecrutementStore())
  }, [])

  useEffect(() => {
    function onChanged() {
      setStore(loadRecrutementStore())
    }
    window.addEventListener(RECRUTEMENT_STORE_CHANGED, onChanged)
    window.addEventListener('storage', onChanged)
    return () => {
      window.removeEventListener(RECRUTEMENT_STORE_CHANGED, onChanged)
      window.removeEventListener('storage', onChanged)
    }
  }, [])

  const persist = useCallback((next: RecrutementStore) => {
    setStore(next)
    saveRecrutementStore(next)
  }, [])

  const value = useMemo<RecrutementContextValue>(
    () => ({
      store,
      reload,
      add(key, item) {
        const record = {
          ...item,
          id: createId(),
          createdAt: new Date().toISOString(),
        } as RecrutementStore[typeof key][number]
        persist({
          ...store,
          [key]: [...store[key], record],
        })
      },
      update(key, id, patch) {
        if (key === 'personnel') {
          const existing = store.personnel.find((row) => row.id === id)
          if (existing?.valide) {
            window.alert(
              'Cet enregistrement personnel est validé et ne peut plus être modifié.',
            )
            return
          }
        }
        persist({
          ...store,
          [key]: store[key].map((row) =>
            row.id === id ? { ...row, ...patch, id: row.id } : row,
          ),
        })
      },
      remove(key, id) {
        if (key === 'personnel') {
          const existing = store.personnel.find((row) => row.id === id)
          if (existing?.valide) {
            window.alert(
              'Cet enregistrement personnel est validé et ne peut plus être supprimé.',
            )
            return
          }
        }
        persist({
          ...store,
          [key]: store[key].filter((row) => row.id !== id),
        })
      },
      personnelLabel(id) {
        const p = store.personnel.find((x) => x.id === id)
        if (!p) return 'Personnel inconnu'
        const name = `${p.prenom} ${p.postnom ?? ''} ${p.nom}`.replace(/\s+/g, ' ').trim()
        return `${p.matricule} — ${name}`
      },
    }),
    [persist, reload, store],
  )

  return (
    <RecrutementContext.Provider value={value}>
      {children}
    </RecrutementContext.Provider>
  )
}

export function useRecrutement() {
  const ctx = useContext(RecrutementContext)
  if (!ctx) {
    throw new Error('useRecrutement doit être utilisé dans RecrutementProvider')
  }
  return ctx
}

export type {
  Administrateur,
  Personnel,
  Stagiaire,
  Promotion,
  Sanction,
  BesoinFormation,
  Evaluation,
}
