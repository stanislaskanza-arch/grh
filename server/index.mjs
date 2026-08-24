import cors from 'cors'
import express from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import pg from 'pg'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const DATA_DIR = path.join(ROOT, 'data')
const STORE_KEYS = ['parametres', 'recrutement', 'paie']

const PORT = Number(process.env.PORT || 3000)
const DATABASE_URL = process.env.DATABASE_URL?.trim() || ''

/** @type {pg.Pool | null} */
let pool = null

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true })
  }
}

function filePath(key) {
  return path.join(DATA_DIR, `${key}.json`)
}

async function initDb() {
  if (!DATABASE_URL) {
    ensureDataDir()
    console.log('[grh] Persistance fichier JSON →', DATA_DIR)
    return
  }
  pool = new pg.Pool({
    connectionString: DATABASE_URL,
    ssl:
      process.env.PGSSLMODE === 'disable'
        ? false
        : { rejectUnauthorized: false },
  })
  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_stores (
      key TEXT PRIMARY KEY,
      data JSONB NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  console.log('[grh] Persistance Postgres (DATABASE_URL)')
}

async function readStore(key) {
  if (!STORE_KEYS.includes(key)) return null
  if (pool) {
    const result = await pool.query(
      'SELECT data FROM app_stores WHERE key = $1',
      [key],
    )
    return result.rows[0]?.data ?? null
  }
  const fp = filePath(key)
  if (!fs.existsSync(fp)) return null
  try {
    return JSON.parse(fs.readFileSync(fp, 'utf8'))
  } catch {
    return null
  }
}

async function writeStore(key, data) {
  if (!STORE_KEYS.includes(key)) {
    throw new Error(`Clé inconnue: ${key}`)
  }
  if (pool) {
    await pool.query(
      `INSERT INTO app_stores (key, data, updated_at)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (key) DO UPDATE
       SET data = EXCLUDED.data, updated_at = NOW()`,
      [key, JSON.stringify(data)],
    )
    return
  }
  ensureDataDir()
  fs.writeFileSync(filePath(key), JSON.stringify(data), 'utf8')
}

async function readAllStores() {
  /** @type {Record<string, unknown>} */
  const out = {}
  for (const key of STORE_KEYS) {
    out[key] = await readStore(key)
  }
  return out
}

const app = express()
app.use(cors())
app.use(express.json({ limit: '40mb' }))

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    persistence: pool ? 'postgres' : 'file',
    stores: STORE_KEYS,
  })
})

app.get('/api/stores', async (_req, res) => {
  try {
    const stores = await readAllStores()
    res.json(stores)
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Lecture impossible',
    })
  }
})

app.get('/api/stores/:key', async (req, res) => {
  const key = String(req.params.key || '')
  if (!STORE_KEYS.includes(key)) {
    res.status(404).json({ error: 'Store inconnu' })
    return
  }
  try {
    const data = await readStore(key)
    res.json({ key, data })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Lecture impossible',
    })
  }
})

app.put('/api/stores/:key', async (req, res) => {
  const key = String(req.params.key || '')
  if (!STORE_KEYS.includes(key)) {
    res.status(404).json({ error: 'Store inconnu' })
    return
  }
  if (req.body == null || typeof req.body !== 'object') {
    res.status(400).json({ error: 'Corps JSON requis' })
    return
  }
  try {
    await writeStore(key, req.body)
    res.json({ ok: true, key })
  } catch (err) {
    console.error(err)
    res.status(500).json({
      error: err instanceof Error ? err.message : 'Écriture impossible',
    })
  }
})

const distDir = path.join(ROOT, 'dist')
if (fs.existsSync(distDir)) {
  app.use(express.static(distDir))
  app.use((req, res, next) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      next()
      return
    }
    if (req.path.startsWith('/api')) {
      next()
      return
    }
    res.sendFile(path.join(distDir, 'index.html'))
  })
}

await initDb()
app.listen(PORT, () => {
  console.log(`[grh] Serveur prêt sur http://localhost:${PORT}`)
})
