import type { TauxMonnaieItem } from '../parametres/types'

/** Observation marquant le taux applicable (fichier TauxMonnaie). */
export const TAUX_EN_COURS_LABEL = 'En cours'

function normalizeObservation(value: string | undefined | null): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
}

export function isTauxMonnaieEnCours(
  taux: Pick<TauxMonnaieItem, 'observation'>,
): boolean {
  const n = normalizeObservation(taux.observation)
  return n === 'en cours' || n.startsWith('en cours ')
}

/**
 * Retourne le taux déclaré « En cours ».
 * S’il y en a plusieurs, prend le plus récent (DTETAUX).
 */
export function findTauxMonnaieEnCours(
  items: TauxMonnaieItem[],
): TauxMonnaieItem | null {
  const enCours = items.filter(isTauxMonnaieEnCours)
  if (enCours.length === 0) return null
  return [...enCours].sort((a, b) =>
    (b.dateTaux || '').localeCompare(a.dateTaux || '', 'fr'),
  )[0]
}

/** Parse un montant saisi (formats FR / US) vers un nombre. */
export function parseMontantTaux(value: string | undefined | null): number {
  if (value == null) return 0
  let s = String(value)
    .trim()
    .replace(/[\u00a0\u202f\u2009\u2007]/g, ' ') // espaces insécables
    .replace(/\s/g, '')
    .replace(/['’`]/g, '')
    .replace(/CDF|USD|EUR|FC|\$|€/gi, '')
  if (!s) return 0

  // 1.234.567,89 ou 1.234,89 (FR)
  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(s)) {
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(s)) {
    // 1,234,567.89 (US)
    s = s.replace(/,/g, '')
  } else if (s.includes(',') && s.includes('.')) {
    if (s.lastIndexOf(',') > s.lastIndexOf('.')) {
      s = s.replace(/\./g, '').replace(',', '.')
    } else {
      s = s.replace(/,/g, '')
    }
  } else if ((s.match(/,/g) || []).length > 1 && !s.includes('.')) {
    // 1,234,567
    s = s.replace(/,/g, '')
  } else if ((s.match(/\./g) || []).length > 1 && !s.includes(',')) {
    // 1.234.567
    s = s.replace(/\./g, '')
  } else {
    s = s.replace(',', '.')
  }

  const n = Number(s)
  return Number.isFinite(n) ? n : 0
}

/**
 * Taux de conversion USD → CDF du fichier TauxMonnaie :
 * Montant CDF / Monnaie USD (USD vaut 1 en général).
 */
export function tauxConversionCdf(taux: TauxMonnaieItem): number {
  const cdf = parseMontantTaux(taux.montantCdf)
  if (!cdf) return 0
  const usd = parseMontantTaux(taux.monnaieUsd)
  if (!usd || usd === 0) return cdf
  return cdf / usd
}

export const MESSAGE_TAUX_EN_COURS_MANQUANT =
  'Aucun taux de monnaie n’est déclaré « En cours ».\n\n' +
  'Allez dans Paramètres & Sécurité → Fichiers → Taux Monnaie, ' +
  'puis indiquez « En cours » dans le champ OBSERVATION du taux à utiliser.'
