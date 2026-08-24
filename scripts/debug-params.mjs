import { ClassicLevel } from 'classic-level'
import path from 'path'
import os from 'os'

const SITES = [
  { id: 'sit-1', code: 'DG', libelle: 'Direction Générale' },
]
// Will fill from constants by importing - inline full list below after reading

const db = new ClassicLevel(path.join(os.tmpdir(), 'grh-ls-copy'))

function decodeValue(buf) {
  if (typeof buf === 'string') return buf
  const b = Buffer.from(buf)
  const u16 = b.toString('utf16le')
  if (u16.includes('{') || u16.includes('personnel')) return u16
  return b.toString('utf8')
}

function extractJson(v) {
  const cleaned = String(v).replace(/^\u0000+/, '').replace(/^\u0001/, '')
  const i = cleaned.indexOf('{')
  if (i < 0) return null
  for (let end = cleaned.length; end > i + 10; end--) {
    try {
      return JSON.parse(cleaned.slice(i, end))
    } catch {}
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
  return n === 'f' || n.includes('feminin') || n === 'femme'
}

let recrute = null
let params = null
for await (const [key, value] of db.iterator()) {
  const k = decodeValue(key)
  const v = decodeValue(value)
  if (k.includes('grh.recrutement.v2') && k.includes('5173')) {
    recrute = extractJson(v) || recrute
  }
  if (k.includes('grh.parametres.v2') && k.includes('5173')) {
    params = extractJson(v) || params
  }
}
// fallback any
if (!recrute) {
  for await (const [key, value] of db.iterator()) {
    const k = decodeValue(key)
    const v = decodeValue(value)
    if (k.includes('grh.recrutement')) recrute = extractJson(v) || recrute
    if (k.includes('grh.parametres.v2')) params = extractJson(v) || params
  }
}
await db.close()

const sites =
  params?.sitesAffectation?.length > 0
    ? params.sitesAffectation
    : [
        // fallback seed order from SITES_TRAVAIL_REF — filled by next script version
      ]

console.log(
  JSON.stringify(
    {
      hasParams: Boolean(params),
      sitesCount: params?.sitesAffectation?.length || 0,
      directionsCount: params?.directions?.length || 0,
      paramsKeys: params ? Object.keys(params) : [],
      personnel: recrute?.personnel?.length,
    },
    null,
    2,
  ),
)
