import type { PersonnelFormState } from './personnelConstants'

const DRAFT_KEY = 'grh.personnel.draft.v2'

export type PersonnelDraft = {
  form: PersonnelFormState
  step: number
  editingId: string | null
  savedAt: string
}

export function loadPersonnelDraft(): PersonnelDraft | null {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    if (!raw) return null
    return JSON.parse(raw) as PersonnelDraft
  } catch {
    return null
  }
}

export function savePersonnelDraft(input: {
  form: PersonnelFormState
  step: number
  editingId: string | null
}): PersonnelDraft {
  const draft: PersonnelDraft = {
    ...input,
    savedAt: new Date().toISOString(),
  }
  localStorage.setItem(DRAFT_KEY, JSON.stringify(draft))
  return draft
}

export function clearPersonnelDraft() {
  localStorage.removeItem(DRAFT_KEY)
}
