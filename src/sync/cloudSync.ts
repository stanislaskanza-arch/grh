/**
 * Synchronisation des stores locaux (localStorage) avec le serveur
 * (Postgres sur Railway, ou fichiers JSON en local).
 *
 * Au démarrage : compare la richesse locale vs cloud, puis hydrate ou pousse.
 * À chaque save : pousse vers le cloud (debounce).
 */

export type CloudStoreKey = 'parametres' | 'recrutement' | 'paie'

const LOCAL_KEYS: Record<CloudStoreKey, string> = {
  parametres: 'grh.parametres.v2',
  recrutement: 'grh.recrutement.v2',
  paie: 'grh.paie.v1',
}

const STORE_KEYS = Object.keys(LOCAL_KEYS) as CloudStoreKey[]

const pushTimers = new Map<CloudStoreKey, ReturnType<typeof setTimeout>>()

function apiBase(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  return raw ? raw.replace(/\/$/, '') : ''
}

function url(path: string) {
  return `${apiBase()}${path}`
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : []
}

/** Score de richesse pour décider qui gagne (local vs cloud). */
export function storeRichness(key: CloudStoreKey, data: unknown): number {
  if (!isRecord(data)) return 0
  if (key === 'recrutement') {
    return (
      asArray(data.personnel).length * 10 +
      asArray(data.administrateurs).length * 5 +
      asArray(data.stagiaires).length
    )
  }
  if (key === 'paie') {
    return (
      asArray(data.paieMensuelleB1).length * 5 +
      asArray(data.paieMensuelleB2).length * 5
    )
  }
  // parametres
  return (
    asArray(data.baremes1).length +
    asArray(data.baremes2).length +
    asArray(data.conges).length * 2 +
    asArray(data.entreprises).length +
    asArray(data.utilisateurs).length +
    asArray(data.tauxMonnaies).length
  )
}

function localRaw(key: CloudStoreKey): string | null {
  try {
    return localStorage.getItem(LOCAL_KEYS[key])
  } catch {
    return null
  }
}

function readLocal(key: CloudStoreKey): unknown | null {
  const raw = localRaw(key)
  if (!raw) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function writeLocal(key: CloudStoreKey, data: unknown) {
  localStorage.setItem(LOCAL_KEYS[key], JSON.stringify(data))
}

async function fetchJson(path: string, init?: RequestInit) {
  const res = await fetch(url(path), {
    ...init,
    headers: {
      Accept: 'application/json',
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  })
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`)
  }
  return res.json()
}

/** Vérifie si l’API serveur est joignable. */
export async function isCloudAvailable(): Promise<boolean> {
  try {
    const data = await fetchJson('/api/health')
    return Boolean(data?.ok)
  } catch {
    return false
  }
}

export type SyncResult = {
  ok: boolean
  available: boolean
  hydrated: CloudStoreKey[]
  uploaded: CloudStoreKey[]
  persistence?: string
  error?: string
}

/**
 * Synchronise navigateur ↔ serveur.
 * - Si le cloud est plus riche : on hydrate le local.
 * - Si le local est plus riche (ou cloud vide) : on pousse le local.
 * - `forceUpload` : pousse toujours le local (migration manuelle).
 */
export async function syncWithCloud(
  options: { forceUpload?: boolean } = {},
): Promise<SyncResult> {
  const hydrated: CloudStoreKey[] = []
  const uploaded: CloudStoreKey[] = []

  try {
    const health = (await fetchJson('/api/health')) as {
      ok?: boolean
      persistence?: string
    }
    if (!health?.ok) {
      return {
        ok: false,
        available: false,
        hydrated,
        uploaded,
        error: 'API indisponible',
      }
    }

    const stores = (await fetchJson('/api/stores')) as Record<string, unknown>

    for (const key of STORE_KEYS) {
      const remote = stores[key]
      const local = readLocal(key)
      const remoteScore = storeRichness(key, remote)
      const localScore = storeRichness(key, local)

      if (options.forceUpload) {
        if (local && isRecord(local)) {
          await fetchJson(`/api/stores/${key}`, {
            method: 'PUT',
            body: JSON.stringify(local),
          })
          uploaded.push(key)
        }
        continue
      }

      if (remoteScore > localScore && isRecord(remote)) {
        writeLocal(key, remote)
        hydrated.push(key)
        continue
      }

      if (localScore > remoteScore && local && isRecord(local)) {
        await fetchJson(`/api/stores/${key}`, {
          method: 'PUT',
          body: JSON.stringify(local),
        })
        uploaded.push(key)
        continue
      }

      // égalité : si cloud présent, s’aligner dessus pour partager la même base
      if (remoteScore > 0 && isRecord(remote)) {
        writeLocal(key, remote)
        hydrated.push(key)
      } else if (localScore > 0 && local && isRecord(local)) {
        await fetchJson(`/api/stores/${key}`, {
          method: 'PUT',
          body: JSON.stringify(local),
        })
        uploaded.push(key)
      }
    }

    return {
      ok: true,
      available: true,
      hydrated,
      uploaded,
      persistence: health.persistence,
    }
  } catch (err) {
    return {
      ok: false,
      available: false,
      hydrated,
      uploaded,
      error: err instanceof Error ? err.message : 'Sync impossible',
    }
  }
}

/** @deprecated Utiliser syncWithCloud — conservé pour compatibilité. */
export async function hydrateFromCloud(): Promise<{
  ok: boolean
  hydrated: CloudStoreKey[]
  uploaded: CloudStoreKey[]
}> {
  const result = await syncWithCloud()
  return {
    ok: result.ok,
    hydrated: result.hydrated,
    uploaded: result.uploaded,
  }
}

/** Pousse les 3 stores locaux vers le cloud (migration forcée). */
export async function pushAllLocalStores(): Promise<SyncResult> {
  return syncWithCloud({ forceUpload: true })
}

/** Pousse un store vers le cloud (immédiat). */
export async function pushStoreNow(
  key: CloudStoreKey,
  data: unknown,
): Promise<boolean> {
  try {
    await fetchJson(`/api/stores/${key}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
    return true
  } catch {
    return false
  }
}

/** Pousse un store vers le cloud avec un court debounce. */
export function schedulePushStore(key: CloudStoreKey, data: unknown) {
  const prev = pushTimers.get(key)
  if (prev) clearTimeout(prev)
  pushTimers.set(
    key,
    setTimeout(() => {
      void pushStoreNow(key, data)
    }, 350),
  )
}
