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
  loadParametresStore,
  PARAMETRES_STORE_CHANGED,
  saveParametresStore,
} from './storage'
import type { ParametresStore } from './types'

type CollectionKey = Exclude<keyof ParametresStore, 'config'>

type ParametresContextValue = {
  store: ParametresStore
  reload: () => void
  add: <K extends CollectionKey>(
    key: K,
    item: Omit<ParametresStore[K][number], 'id' | 'createdAt'>,
  ) => void
  update: <K extends CollectionKey>(
    key: K,
    id: string,
    patch: Partial<ParametresStore[K][number]>,
  ) => void
  remove: (key: CollectionKey, id: string) => void
  setCollection: <K extends CollectionKey>(
    key: K,
    items: ParametresStore[K],
  ) => void
  entrepriseLabel: (id: string) => string
  categorieLabel: (id: string) => string
  updateDbPassword: (password: string) => void
}

const ParametresContext = createContext<ParametresContextValue | null>(null)

export function ParametresProvider({ children }: { children: ReactNode }) {
  const [store, setStore] = useState<ParametresStore>(() => loadParametresStore())

  const reload = useCallback(() => {
    setStore(loadParametresStore())
  }, [])

  useEffect(() => {
    function onChanged() {
      setStore(loadParametresStore())
    }
    window.addEventListener(PARAMETRES_STORE_CHANGED, onChanged)
    window.addEventListener('storage', onChanged)
    return () => {
      window.removeEventListener(PARAMETRES_STORE_CHANGED, onChanged)
      window.removeEventListener('storage', onChanged)
    }
  }, [])

  const persist = useCallback((next: ParametresStore) => {
    setStore(next)
    saveParametresStore(next)
  }, [])

  const value = useMemo<ParametresContextValue>(
    () => ({
      store,
      reload,
      add(key, item) {
        const record = {
          ...item,
          id: createId(),
          createdAt: new Date().toISOString(),
        } as ParametresStore[typeof key][number]
        persist({
          ...store,
          [key]: [...store[key], record],
        })
      },
      update(key, id, patch) {
        if (key === 'baremes1') {
          const existing = store.baremes1.find((row) => row.id === id)
          if (existing?.valide) {
            window.alert(
              'Cette ligne du Barème 1 est validée et ne peut plus être modifiée.',
            )
            return
          }
        }
        if (key === 'baremes2') {
          const existing = store.baremes2.find((row) => row.id === id)
          if (existing?.valide) {
            window.alert(
              'Cette ligne du Barème 2 est validée et ne peut plus être modifiée.',
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
        if (key === 'entreprises') {
          const linked = store.utilisateurs.some((u) => u.entrepriseId === id)
          if (linked) {
            window.alert(
              'Impossible de supprimer cette entreprise : des utilisateurs y sont encore rattachés.',
            )
            return
          }
        }
        if (key === 'baremes1') {
          const existing = store.baremes1.find((row) => row.id === id)
          if (existing?.valide) {
            window.alert(
              'Cette ligne du Barème 1 est validée et ne peut plus être supprimée.',
            )
            return
          }
        }
        if (key === 'baremes2') {
          const existing = store.baremes2.find((row) => row.id === id)
          if (existing?.valide) {
            window.alert(
              'Cette ligne du Barème 2 est validée et ne peut plus être supprimée.',
            )
            return
          }
        }
        persist({
          ...store,
          [key]: store[key].filter((row) => row.id !== id),
        })
      },
      setCollection(key, items) {
        if (key === 'baremes1' || key === 'baremes2') {
          const current = key === 'baremes1' ? store.baremes1 : store.baremes2
          const locked = current.filter((row) => row.valide)
          if (locked.length > 0) {
            const label = key === 'baremes1' ? 'Barème 1' : 'Barème 2'
            const lockedIds = new Set(locked.map((row) => row.id))
            const lockedGrades = new Set(
              locked.map((row) => row.grade.trim().toLowerCase()),
            )
            const typedItems =
              key === 'baremes1'
                ? (items as typeof store.baremes1)
                : (items as typeof store.baremes2)
            const unlockedIncoming = typedItems.filter((row) => {
              if (lockedIds.has(row.id)) return false
              const grade = row.grade.trim().toLowerCase()
              return !grade || !lockedGrades.has(grade)
            })
            persist({
              ...store,
              [key]: [...locked, ...unlockedIncoming],
            })
            if (items.length === 0) {
              window.alert(
                locked.length === current.length
                  ? `Toutes les lignes du ${label} sont validées : suppression impossible.`
                  : `${locked.length} ligne(s) validée(s) conservée(s) ; les autres ont été supprimées.`,
              )
            }
            return
          }
        }
        persist({
          ...store,
          [key]: items,
        })
      },
      entrepriseLabel(id) {
        const e = store.entreprises.find((x) => x.id === id)
        if (!e) return '—'
        return e.sigle ? `${e.sigle} — ${e.raisonSociale}` : e.raisonSociale
      },
      categorieLabel(id) {
        const c = store.categoriesUtilisateurs.find((x) => x.id === id)
        return c?.libelle ?? '—'
      },
      updateDbPassword(password) {
        const next = password.trim()
        if (!next) {
          window.alert('Le mot de passe ne peut pas être vide.')
          return
        }
        persist({
          ...store,
          config: { ...store.config, dbAdminPassword: next },
        })
      },
    }),
    [persist, reload, store],
  )

  return (
    <ParametresContext.Provider value={value}>{children}</ParametresContext.Provider>
  )
}

export function useParametres() {
  const ctx = useContext(ParametresContext)
  if (!ctx) {
    throw new Error('useParametres doit être utilisé dans ParametresProvider')
  }
  return ctx
}
