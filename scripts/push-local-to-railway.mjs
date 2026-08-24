/**
 * Copie les stores Postgres local → Railway (pour que vos amis voient les mêmes données).
 *
 * Usage : npm run sync:railway
 * Prérequis : API locale démarrée (npm run server ou npm run dev:full)
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const KEYS = ['parametres', 'recrutement', 'paie']

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return
  for (const line of fs.readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq <= 0) continue
    const key = trimmed.slice(0, eq).trim()
    let value = trimmed.slice(eq + 1).trim()
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1)
    }
    if (process.env[key] === undefined) process.env[key] = value
  }
}

loadEnvFile(path.join(ROOT, '.env'))

const LOCAL =
  (process.env.LOCAL_API_URL || 'http://127.0.0.1:3000').replace(/\/$/, '')
const RAILWAY = (
  process.env.RAILWAY_API_URL ||
  process.env.VITE_MIRROR_API_URL ||
  'https://grh-web-production-bafa.up.railway.app'
).replace(/\/$/, '')

async function getJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return res.json()
}

async function putJson(url, body) {
  const res = await fetch(url, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`${url} → HTTP ${res.status}`)
  return res.json()
}

console.log(`[sync] Local   : ${LOCAL}`)
console.log(`[sync] Railway : ${RAILWAY}`)

const health = await getJson(`${LOCAL}/api/health`)
if (!health?.ok) {
  console.error('[sync] API locale indisponible. Lancez : npm run server')
  process.exit(1)
}

const stores = await getJson(`${LOCAL}/api/stores`)
for (const key of KEYS) {
  const data = stores[key]
  if (!data || typeof data !== 'object') {
    console.warn(`[sync] ${key} : vide en local — ignoré`)
    continue
  }
  await putJson(`${RAILWAY}/api/stores/${key}`, data)
  const size = JSON.stringify(data).length
  console.log(`[sync] ${key} → Railway OK (${size} octets)`)
}

const remote = await getJson(`${RAILWAY}/api/stores`)
console.log('[sync] Vérification Railway :')
for (const key of KEYS) {
  const present = remote[key] != null
  console.log(`  - ${key}: ${present ? 'présent' : 'ABSENT'}`)
}
console.log('[sync] Terminé.')
