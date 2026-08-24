import { normalizeMoisCle } from './paieMois'
import { schedulePushStore } from '../../sync/cloudSync'
import {
  EMPTY_PAIE_STORE,
  type PaieMensuelleB1Item,
  type PaieMensuelleB2Item,
  type PaieStore,
} from './types'

const STORAGE_KEY = 'grh.paie.v1'

export const PAIE_STORE_CHANGED = 'grh:paie-changed'

function now() {
  return new Date().toISOString()
}

export function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function createEmptyPaieMensuelleB1(): Omit<
  PaieMensuelleB1Item,
  'id' | 'createdAt' | 'updatedAt'
> {
  return {
    mois: '',
    datePaie: '',
    matricule: '',
    nom: '',
    postnom: '',
    prenom: '',
    dateEngagement: '',
    grade: '',
    fonction: '',
    base: '',
    logement: '',
    transport: '',
    totalBrut: '',
    retenueCnss: '',
    retenueIpr: '',
    retenueInpp: '',
    netAPayer: '',
  }
}

export function createEmptyPaieMensuelleB2(): Omit<
  PaieMensuelleB2Item,
  'id' | 'createdAt' | 'updatedAt'
> {
  return {
    mois: '',
    datePaie: '',
    matricule: '',
    nom: '',
    postnom: '',
    prenom: '',
    dateEngagement: '',
    grade: '',
    fonction: '',
    immatriculationCnss: '',
    base: '',
    logement: '',
    transport: '',
    totalBrut: '',
    retenueCnss: '',
    retenueIpr: '',
    retenueInpp: '',
    totalRetenue: '',
    netAPayer: '',
  }
}

function isPaieMensuelleB1Shape(row: unknown): row is PaieMensuelleB1Item {
  if (!row || typeof row !== 'object') return false
  const r = row as Record<string, unknown>
  return typeof r.matricule === 'string' && typeof r.mois === 'string'
}

function isPaieMensuelleB2Shape(row: unknown): row is PaieMensuelleB2Item {
  if (!row || typeof row !== 'object') return false
  const r = row as Record<string, unknown>
  return (
    typeof r.matricule === 'string' &&
    typeof r.mois === 'string' &&
    ('immatriculationCnss' in r || 'totalRetenue' in r)
  )
}

export function normalizePaieMensuelleB1(
  raw: Record<string, unknown>,
): PaieMensuelleB1Item {
  const stamp = now()
  const datePaie = String(raw.datePaie ?? raw.date_paie ?? raw.dtePaie ?? '')
  return {
    id: String(raw.id ?? createId()),
    mois: normalizeMoisCle(String(raw.mois ?? ''), datePaie),
    datePaie,
    matricule: String(raw.matricule ?? ''),
    nom: String(raw.nom ?? ''),
    postnom: String(raw.postnom ?? ''),
    prenom: String(raw.prenom ?? ''),
    dateEngagement: String(
      raw.dateEngagement ?? raw.date_engagement ?? raw.dateEmbauche ?? '',
    ),
    grade: String(raw.grade ?? ''),
    fonction: String(raw.fonction ?? ''),
    base: String(raw.base ?? ''),
    logement: String(raw.logement ?? ''),
    transport: String(raw.transport ?? ''),
    totalBrut: String(raw.totalBrut ?? raw.total_brut ?? ''),
    retenueCnss: String(raw.retenueCnss ?? raw.retenue_cnss ?? ''),
    retenueIpr: String(raw.retenueIpr ?? raw.retenue_ipr ?? ''),
    retenueInpp: String(raw.retenueInpp ?? raw.retenue_inpp ?? ''),
    netAPayer: String(raw.netAPayer ?? raw.net_a_payer ?? ''),
    createdAt: String(raw.createdAt ?? stamp),
    updatedAt: String(raw.updatedAt ?? raw.createdAt ?? stamp),
  }
}

export function normalizePaieMensuelleB2(
  raw: Record<string, unknown>,
): PaieMensuelleB2Item {
  const stamp = now()
  const datePaie = String(
    raw.datePaie ?? raw.date_paie ?? raw.dtePaie ?? raw.dte_paie ?? '',
  )
  return {
    id: String(raw.id ?? createId()),
    mois: normalizeMoisCle(String(raw.mois ?? ''), datePaie),
    datePaie,
    matricule: String(raw.matricule ?? ''),
    nom: String(raw.nom ?? ''),
    postnom: String(raw.postnom ?? ''),
    prenom: String(raw.prenom ?? ''),
    dateEngagement: String(
      raw.dateEngagement ?? raw.date_engagement ?? raw.dateEmbauche ?? '',
    ),
    grade: String(raw.grade ?? ''),
    fonction: String(raw.fonction ?? ''),
    immatriculationCnss: String(
      raw.immatriculationCnss ??
        raw.immatriculation_cnss ??
        raw.numeroCnss ??
        '',
    ),
    base: String(raw.base ?? ''),
    logement: String(raw.logement ?? ''),
    transport: String(raw.transport ?? ''),
    totalBrut: String(raw.totalBrut ?? raw.total_brut ?? ''),
    retenueCnss: String(raw.retenueCnss ?? raw.retenue_cnss ?? ''),
    retenueIpr: String(raw.retenueIpr ?? raw.retenue_ipr ?? ''),
    retenueInpp: String(raw.retenueInpp ?? raw.retenue_inpp ?? ''),
    totalRetenue: String(raw.totalRetenue ?? raw.total_retenue ?? ''),
    netAPayer: String(raw.netAPayer ?? raw.net_a_payer ?? ''),
    createdAt: String(raw.createdAt ?? stamp),
    updatedAt: String(raw.updatedAt ?? raw.createdAt ?? stamp),
  }
}

export function loadPaieStore(): PaieStore {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...EMPTY_PAIE_STORE }
    const parsed = JSON.parse(raw) as Partial<PaieStore>
    return {
      paieMensuelleB1: Array.isArray(parsed.paieMensuelleB1)
        ? parsed.paieMensuelleB1
            .filter(isPaieMensuelleB1Shape)
            .map((row) =>
              normalizePaieMensuelleB1(row as unknown as Record<string, unknown>),
            )
        : [],
      paieMensuelleB2: Array.isArray(parsed.paieMensuelleB2)
        ? parsed.paieMensuelleB2
            .filter(isPaieMensuelleB2Shape)
            .map((row) =>
              normalizePaieMensuelleB2(row as unknown as Record<string, unknown>),
            )
        : [],
    }
  } catch {
    return { ...EMPTY_PAIE_STORE }
  }
}

export function savePaieStore(store: PaieStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  schedulePushStore('paie', store)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(PAIE_STORE_CHANGED, {
        detail: {
          paieMensuelleB1Count: store.paieMensuelleB1.length,
          paieMensuelleB2Count: store.paieMensuelleB2.length,
        },
      }),
    )
  }
}
