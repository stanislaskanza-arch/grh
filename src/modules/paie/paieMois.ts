/** Clé de paie mensuelle : toujours `YYYY-MM` (12 paies distinctes par année). */

const MOIS_LABELS: Record<string, string> = {
  '01': 'Janvier',
  '02': 'Février',
  '03': 'Mars',
  '04': 'Avril',
  '05': 'Mai',
  '06': 'Juin',
  '07': 'Juillet',
  '08': 'Août',
  '09': 'Septembre',
  '10': 'Octobre',
  '11': 'Novembre',
  '12': 'Décembre',
}

export function currentYearValue() {
  return String(new Date().getFullYear())
}

export function currentMonthValue() {
  return String(new Date().getMonth() + 1).padStart(2, '0')
}

export function moisClePaie(annee: string, moisCode: string): string {
  const year = (annee || '').trim()
  const mois = (moisCode || '').trim().padStart(2, '0')
  if (/^\d{4}$/.test(year) && /^\d{2}$/.test(mois)) return `${year}-${mois}`
  return mois
}

/** Construit YYYY-MM à partir de la date de paie + code mois. */
export function moisCleDepuisDate(datePaie: string, moisCode: string): string {
  const year = datePaie?.slice(0, 4)
  if (year && /^\d{4}$/.test(year)) return moisClePaie(year, moisCode)
  return moisClePaie(currentYearValue(), moisCode)
}

/**
 * Normalise une clé mois stockée (ex. « 08 » + datePaie → « 2026-08 »).
 */
export function normalizeMoisCle(
  mois: string,
  datePaie?: string,
): string {
  const value = (mois || '').trim()
  if (/^\d{4}-\d{2}$/.test(value)) return value
  if (/^\d{2}$/.test(value)) {
    const year = datePaie?.slice(0, 4)
    if (year && /^\d{4}$/.test(year)) return `${year}-${value}`
  }
  const match = value.match(/^(\d{4})[/-](\d{1,2})$/)
  if (match) {
    return `${match[1]}-${match[2].padStart(2, '0')}`
  }
  return value
}

export function formatMoisPaie(mois: string): string {
  const cle = normalizeMoisCle(mois)
  const match = cle.match(/^(\d{4})-(\d{2})$/)
  if (match) {
    const label = MOIS_LABELS[match[2]] || match[2]
    return `${label} ${match[1]}`
  }
  return mois?.trim() || '—'
}

export function anneeDepuisMoisCle(mois: string): string {
  const cle = normalizeMoisCle(mois)
  const match = cle.match(/^(\d{4})-/)
  return match?.[1] ?? ''
}

/** Nombre de mois distincts (YYYY-MM) présents dans les lignes. */
export function compterMoisDistincts(
  lignes: { mois: string; datePaie?: string }[],
  annee?: string,
): number {
  const set = new Set<string>()
  for (const row of lignes) {
    const cle = normalizeMoisCle(row.mois, row.datePaie)
    if (!cle) continue
    if (annee && !cle.startsWith(`${annee}-`)) continue
    set.add(cle)
  }
  return set.size
}

export function filtrerLignesParAnnee<T extends { mois: string; datePaie?: string }>(
  lignes: T[],
  annee: string,
): T[] {
  if (!annee) return lignes
  return lignes.filter((row) => {
    const cle = normalizeMoisCle(row.mois, row.datePaie)
    return cle.startsWith(`${annee}-`)
  })
}

export function anneesDisponibles(
  lignes: { mois: string; datePaie?: string }[],
): string[] {
  const set = new Set<string>()
  set.add(currentYearValue())
  for (const row of lignes) {
    const y = anneeDepuisMoisCle(normalizeMoisCle(row.mois, row.datePaie))
    if (y) set.add(y)
    const fromDate = row.datePaie?.slice(0, 4)
    if (fromDate && /^\d{4}$/.test(fromDate)) set.add(fromDate)
  }
  return [...set].sort((a, b) => b.localeCompare(a))
}

/** Ajuste la date ISO pour coller à l’année / mois sélectionnés. */
export function syncDatePaie(datePaie: string, annee: string, moisCode: string): string {
  const day = datePaie?.slice(8, 10) || '01'
  const y = /^\d{4}$/.test(annee) ? annee : currentYearValue()
  const m = (moisCode || '01').padStart(2, '0')
  const maxDay = new Date(Number(y), Number(m), 0).getDate()
  const d = Math.min(Number(day) || 1, maxDay)
  return `${y}-${m}-${String(d).padStart(2, '0')}`
}

export { MOIS_LABELS }
