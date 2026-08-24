import type { AdminFormState } from './administrateurConstants'

const DRAFT_KEY = 'grh.administrateur.draft.v1'

export type AdministrateurDraft = {
  form: AdminFormState
  step: number
  editingId: string | null
  savedAt: string
}

export function loadAdministrateurDraft(): AdministrateurDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as AdministrateurDraft
    if (!parsed?.form || typeof parsed.step !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

export function saveAdministrateurDraft(draft: Omit<AdministrateurDraft, 'savedAt'>) {
  const payload: AdministrateurDraft = {
    ...draft,
    savedAt: new Date().toISOString(),
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(payload))
  return payload
}

export function clearAdministrateurDraft() {
  localStorage.removeItem(DRAFT_KEY)
}
