import { ClassicLevel } from 'classic-level'
import path from 'path'
import os from 'os'
import fs from 'fs'

const dbPath = path.join(os.tmpdir(), 'grh-ls-copy')
const db = new ClassicLevel(dbPath)

function decodeValue(buf) {
  if (typeof buf === 'string') return buf
  const b = Buffer.from(buf)
  const u16 = b.toString('utf16le')
  if (u16.includes('{') || u16.includes('personnel') || u16.includes('grh')) return u16
  return b.toString('utf8')
}

function extractJson(v) {
  const cleaned = String(v).replace(/^\u0000+/, '').replace(/^\u0001/, '')
  const i = cleaned.indexOf('{')
  if (i < 0) return null
  try {
    return JSON.parse(cleaned.slice(i))
  } catch {
    // try trim trailing junk
    for (let end = cleaned.length; end > i + 10; end--) {
      try {
        return JSON.parse(cleaned.slice(i, end))
      } catch {}
    }
  }
  return null
}

function norm(v) {
  return String(v ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isFeminin(sexe) {
  const n = norm(sexe)
  return n === 'f' || n === 'feminin' || n.startsWith('feminin') || n === 'femme'
}

function isDg(v) {
  const n = norm(v)
  return (
    n === 'dg' ||
    n === 'direction generale' ||
    n.includes('direction generale') ||
    n.includes('dir. gen') ||
    n.includes('dir gen')
  )
}

let recrute = null
let params = null
const keySamples = []

for await (const [key, value] of db.iterator()) {
  const k = decodeValue(key)
  const v = decodeValue(value)
  if (k.includes('grh.')) keySamples.push(k.slice(0, 120))
  if (k.includes('grh.recrutement')) recrute = extractJson(v) || recrute
  if (k.includes('grh.parametres')) params = extractJson(v) || params
}
await db.close()

const personnel = recrute?.personnel || []
const directions = params?.directions || []
const sites = params?.sitesAffectation || []

fs.writeFileSync(
  path.join(process.cwd(), 'scripts', 'tmp-dump-meta.json'),
  JSON.stringify(
    {
      personnelCount: personnel.length,
      directions: directions.map((d) => ({ id: d.id, code: d.code, libelle: d.libelle })),
      sites: sites.map((s) => ({ id: s.id, code: s.code, libelle: s.libelle })),
      keySamples,
    },
    null,
    2,
  ),
)

const dirById = new Map(directions.map((d) => [d.id, d]))
const siteById = new Map(sites.map((s) => [s.id, s]))

const dgDirIds = new Set(
  directions.filter((d) => isDg(d.libelle) || isDg(d.code)).map((d) => d.id),
)
const dgSiteIds = new Set(
  sites.filter((s) => isDg(s.libelle) || isDg(s.code)).map((s) => s.id),
)

// Also match by resolving personnel directionId labels
let femmesDir = 0
let totDir = 0
let femmesSite = 0
let totSite = 0
const nomsDir = []
const nomsSite = []
const directionIdCounts = {}
const siteIdCounts = {}
const sexeCounts = {}

for (const p of personnel) {
  sexeCounts[String(p.sexe || '(vide)')] = (sexeCounts[String(p.sexe || '(vide)')] || 0) + 1
  directionIdCounts[p.directionId || '(vide)'] =
    (directionIdCounts[p.directionId || '(vide)'] || 0) + 1
  siteIdCounts[p.siteTravailId || '(vide)'] =
    (siteIdCounts[p.siteTravailId || '(vide)'] || 0) + 1

  const dir = dirById.get(p.directionId)
  const site = siteById.get(p.siteTravailId)
  const dirIsDg =
    dgDirIds.has(p.directionId) ||
    isDg(p.directionId) ||
    isDg(dir?.libelle) ||
    isDg(dir?.code)
  const siteIsDg =
    dgSiteIds.has(p.siteTravailId) ||
    isDg(p.siteTravailId) ||
    isDg(site?.libelle) ||
    isDg(site?.code)

  const f = isFeminin(p.sexe)
  if (dirIsDg) {
    totDir++
    if (f) {
      femmesDir++
      nomsDir.push([p.prenom, p.postnom, p.nom].filter(Boolean).join(' '))
    }
  }
  if (siteIsDg) {
    totSite++
    if (f) {
      femmesSite++
      nomsSite.push([p.prenom, p.postnom, p.nom].filter(Boolean).join(' '))
    }
  }
}

const result = {
  totalPersonnel: personnel.length,
  dgDirections: directions.filter((d) => isDg(d.libelle) || isDg(d.code)),
  dgSites: sites.filter((s) => isDg(s.libelle) || isDg(s.code)),
  femmesChampDirection: femmesDir,
  effectifChampDirection: totDir,
  femmesChampSiteTravail: femmesSite,
  effectifChampSiteTravail: totSite,
  nomsFemmesDirection: nomsDir,
  nomsFemmesSite: nomsSite,
  sexeCounts,
  topDirectionIds: Object.entries(directionIdCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([id, n]) => ({
      id,
      n,
      libelle: dirById.get(id)?.libelle || null,
    })),
  topSiteIds: Object.entries(siteIdCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([id, n]) => ({
      id,
      n,
      libelle: siteById.get(id)?.libelle || null,
      code: siteById.get(id)?.code || null,
    })),
}

console.log(JSON.stringify(result, null, 2))
fs.writeFileSync(
  path.join(process.cwd(), 'scripts', 'tmp-dg-result.json'),
  JSON.stringify(result, null, 2),
)
