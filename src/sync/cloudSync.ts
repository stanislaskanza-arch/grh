/**
 * Synchronisation des stores locaux (localStorage) avec le serveur
 * (Postgres sur Railway, ou fichiers JSON en local).
 *
 * Au démarrage : hydrate depuis le cloud (si dispo), sinon pousse le local.
 * À chaque save : pousse vers le cloud (debounce).
 */

export type CloudStoreKey = 'parametres' | 'recrutement' | 'paie'

const LOCAL_KEYS: Record<CloudStoreKey, string> = {
  parametres: 'grh.parametres.v2',
  recrutement: 'grh.recrutement.v2',
  paie: 'grh.paie.v1',
}

const pushTimers = new Map<CloudStoreKey, ReturnType<typeof setTimeout>>()

function apiBase(): string {
  const raw = (import.meta.env.VITE_API_URL as string | undefined)?.trim()
  return raw ? raw.replace(/\/$/, '') : ''
}

function url(path: string) {
  return `${apiBase()}${path}`
}

function isNonEmptyObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function localRaw(key: CloudStoreKey): string | null {
  try {
    return localStorage.getItem(LOCAL_KEYS[key])
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

/**
 * Hydrate localStorage depuis le serveur.
 * Si un store cloud est vide et que le navigateur a déjà des données,
 * les données locales sont poussées (migration douce).
 */
export async function hydrateFromCloud(): Promise<{
  ok: boolean
  hydrated: CloudStoreKey[]
  uploaded: CloudStoreKey[]
}> {
  const hydrated: CloudStoreKey[] = []
  const uploaded: CloudStoreKey[] = []

  try {
    const stores = (await fetchJson('/api/stores')) as Record<
      string,
      unknown
    >
    for (const key of Object.keys(LOCAL_KEYS) as CloudStoreKey[]) {
      const remote = stores[key]
      const local = localRaw(key)

      if (isNonEmptyObject(remote)) {
        writeLocal(key, remote)
        hydrated.push(key)
        continue
      }

      if (local) {
        try {
          const parsed = JSON.parse(local) as unknown
          if (isNonEmptyObject(parsed) || Array.isArray(parsed)) {
            await fetchJson(`/api/stores/${key}`, {
              method: 'PUT',
              body: JSON.stringify(parsed),
            })
            uploaded.push(key)
          }
        } catch {
          /* ignore upload failure for one key */
        }
      }
    }

    return { ok: true, hydrated, uploaded }
  } catch {
    return { ok: false, hydrated, uploaded }
  }
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
