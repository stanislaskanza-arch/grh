import { loadParametresStore } from '../parametres/storage'
import { schedulePushStore } from '../../sync/cloudSync'
import { EMPTY_STORE, type RecrutementStore } from './types'
import { normalizePersonnel } from './personnelConstants'

const STORAGE_KEY = 'grh.recrutement.v2'

/** Émis après chaque écriture localStorage pour resynchroniser l’UI. */
export const RECRUTEMENT_STORE_CHANGED = 'grh:recrutement-changed'

export function loadRecrutementStore(): RecrutementStore {
  try {
    const refs = loadParametresStore()
    const raw = localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem('grh.recrutement.v1')
    if (!raw) {
      return {
        ...EMPTY_STORE,
        administrateurs: [],
        personnel: [],
        stagiaires: [],
        promotions: [],
        sanctions: [],
        formations: [],
        evaluations: [],
      }
    }
    const parsed = JSON.parse(raw) as Partial<RecrutementStore> & {
      mandataires?: unknown[]
    }
    return {
      administrateurs: parsed.administrateurs ?? [],
      personnel: (parsed.personnel ?? []).map((row) =>
        normalizePersonnel(row as unknown as Record<string, unknown>, refs),
      ),
      stagiaires: parsed.stagiaires ?? [],
      promotions: parsed.promotions ?? [],
      sanctions: parsed.sanctions ?? [],
      formations: parsed.formations ?? [],
      evaluations: parsed.evaluations ?? [],
    }
  } catch {
    return {
      administrateurs: [],
      personnel: [],
      stagiaires: [],
      promotions: [],
      sanctions: [],
      formations: [],
      evaluations: [],
    }
  }
}

export function saveRecrutementStore(store: RecrutementStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  schedulePushStore('recrutement', store)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(RECRUTEMENT_STORE_CHANGED, {
        detail: { personnelCount: store.personnel.length },
      }),
    )
  }
}

export function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}
