import { ClassicLevel } from 'classic-level'
import path from 'path'
import os from 'os'
import fs from 'fs'

const db = new ClassicLevel(path.join(os.tmpdir(), 'grh-ls-copy'))

function decode(buf) {
  const b = Buffer.from(buf)
  const u16 = b.toString('utf16le')
  return u16.includes('{') || u16.includes('personnel') ? u16 : b.toString('utf8')
}

function extract(v) {
  const c = String(v).replace(/^\u0000+/, '').replace(/^\u0001/, '')
  const i = c.indexOf('{')
  if (i < 0) return null
  for (let e = c.length; e > i + 10; e--) {
    try {
      return JSON.parse(c.slice(i, e))
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

function isF(s) {
  const raw = String(s ?? '')
  if (!raw) return false
  if (raw === 'F' || raw === 'f') return true
  const n = norm(raw)
  if (n === 'f' || n.includes('feminin') || n === 'femme' || n === 'female') {
    return true
  }
  // Encodage localStorage parfois corrompu (Féminin → Fminin / F???minin)
  if (/f\W*minin/i.test(raw) && !/masculin/i.test(raw)) return true
  if (raw.includes('minin') && !/masc/i.test(raw)) return true
  return false
}

const SEED_SITES = [
  { id: 'sit-1', code: 'CA', libelle: "Conseil d'Administration" },
  { id: 'sit-2', code: 'DG', libelle: 'Direction Générale' },
  { id: 'sit-3', code: 'DPHKAT', libelle: 'Direction Provinciale du Haut Katanga' },
  { id: 'sit-4', code: 'DPHUELE', libelle: 'Direction Provinciale de Haut-Uélé' },
  { id: 'sit-5', code: 'DPITU', libelle: "Direction Provinciale d'Ituri" },
  { id: 'sit-6', code: 'DPKC', libelle: 'Direction Provinciale de Kongo Central' },
  { id: 'sit-7', code: 'DPKIN', libelle: 'Direction Provinciale de Kinshasa' },
  { id: 'sit-8', code: 'DPKO', libelle: 'Direction Provinciale de Kasaï Oriental' },
  { id: 'sit-9', code: 'DPKSC', libelle: 'Direction Provinciale de Kasaï Central' },
  { id: 'sit-10', code: 'DPLUA', libelle: 'Direction Provinciale de Lualaba' },
  { id: 'sit-11', code: 'DPNKIV', libelle: 'Direction Provinciale du Nord-Kivu' },
  { id: 'sit-12', code: 'DPSKIV', libelle: 'Direction Provinciale du Sud-Kivu' },
  { id: 'sit-13', code: 'DPTSHO', libelle: 'Direction Provinciale de la Tshopo' },
]

let recrute = null
let params = null
for await (const [k, v] of db.iterator()) {
  const key = decode(k)
  const val = decode(v)
  if (key.includes('grh.recrutement.v2')) recrute = extract(val) || recrute
  if (key.includes('grh.parametres.v2')) params = extract(val) || params
}
await db.close()

const sites =
  params?.sitesAffectation?.length > 0 ? params.sitesAffectation : SEED_SITES
const dg = sites.find(
  (s) => norm(s.code) === 'dg' || norm(s.libelle).includes('direction generale'),
)
const dgId = dg?.id || 'sit-2'
const personnel = recrute?.personnel || []

let femmes = 0
let total = 0
const noms = []
for (const p of personnel) {
  if (p.siteTravailId !== dgId) continue
  total++
  if (isF(p.sexe)) {
    femmes++
    noms.push([p.prenom, p.postnom, p.nom].filter(Boolean).join(' '))
  }
}

const sexeSamples = {}
for (const p of personnel) {
  const k = String(p.sexe ?? '(vide)')
  if (!sexeSamples[k]) {
    sexeSamples[k] = {
      count: 0,
      hex: Buffer.from(k, 'utf8').toString('hex'),
      isF: isF(k),
    }
  }
  sexeSamples[k].count++
}

const out = {
  criteres: 'Site de travail = Direction Générale (code DG)',
  site: dg || { id: dgId },
  totalSurSiteDG: total,
  femmesSurSiteDG: femmes,
  hommesSurSiteDG: total - femmes,
  totalPersonnel: personnel.length,
  femmesGlobal: personnel.filter((p) => isF(p.sexe)).length,
  directionIdTousVides: personnel.every((p) => !p.directionId),
  sexeSamples,
  nomsFemmesDG: noms,
}

fs.writeFileSync(
  path.join(process.cwd(), 'scripts', 'tmp-dg-femmes.json'),
  JSON.stringify(out, null, 2),
  'utf8',
)
console.log(JSON.stringify(out, null, 2))
