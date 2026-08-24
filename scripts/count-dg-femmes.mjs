import fs from 'fs'
import path from 'path'

const dir = path.join(
  process.env.LOCALAPPDATA,
  'Microsoft/Edge/User Data/Default/Local Storage/leveldb',
)

function decodeUtf16leLoose(buf) {
  // Convert sequences of ASCII spaced by 0x00 into string (common Chromium LS encoding)
  let out = ''
  for (let i = 0; i < buf.length - 1; i++) {
    if (buf[i] >= 32 && buf[i] < 127 && buf[i + 1] === 0) {
      out += String.fromCharCode(buf[i])
      i++
    } else if (buf[i] >= 32 && buf[i] < 127) {
      out += String.fromCharCode(buf[i])
    } else if (buf[i] === 10 || buf[i] === 13 || buf[i] === 9) {
      out += String.fromCharCode(buf[i])
    } else {
      out += ' '
    }
  }
  return out
}

function extractBalanced(slice, start) {
  let depth = 0
  for (let j = start; j < slice.length; j++) {
    const c = slice[j]
    if (c === '{') depth++
    else if (c === '}') {
      depth--
      if (depth === 0) return slice.slice(start, j + 1)
    }
  }
  return null
}

function tryParse(text) {
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

function normalizeText(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function isFeminin(sexe) {
  const n = normalizeText(sexe)
  return (
    n === 'f' ||
    n === 'feminin' ||
    n.startsWith('feminin') ||
    n === 'femme' ||
    n === 'female'
  )
}

function isDirectionGenerale(libelleOrCode) {
  const n = normalizeText(libelleOrCode)
  return (
    n === 'direction generale' ||
    n === 'dg' ||
    n.includes('direction generale') ||
    n.startsWith('dg ')
  )
}

const files = fs
  .readdirSync(dir)
  .filter((f) => f.endsWith('.ldb') || f.endsWith('.log'))
  .map((f) => path.join(dir, f))

let bestRec = null
let bestPar = null
let hits = []

for (const file of files) {
  const buf = fs.readFileSync(file)
  const texts = [buf.toString('utf8'), decodeUtf16leLoose(buf)]
  for (const text of texts) {
    if (!text.includes('grh.recrutement') && !text.includes('"personnel"')) continue
    hits.push({ file: path.basename(file), len: text.length, hasKey: text.includes('grh.recrutement') })

    const markers = [
      '{"personnel":',
      '{"administrateurs":',
      '{"entreprises":',
      '{"config":',
    ]
    for (const m of markers) {
      let from = 0
      while (true) {
        const s = text.indexOf(m, from)
        if (s < 0) break
        from = s + 1
        const json = extractBalanced(text, s)
        if (!json || json.length < 20) continue
        // strip non-json noise sometimes inserted
        const cleaned = json.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
        const parsed = tryParse(cleaned)
        if (!parsed) continue
        if (Array.isArray(parsed.personnel)) {
          if (!bestRec || parsed.personnel.length >= (bestRec.personnel?.length || 0)) {
            bestRec = parsed
          }
        }
        if (Array.isArray(parsed.directions) || Array.isArray(parsed.sitesAffectation)) {
          const score =
            (parsed.directions?.length || 0) + (parsed.sitesAffectation?.length || 0)
          const prev =
            (bestPar?.directions?.length || 0) + (bestPar?.sitesAffectation?.length || 0)
          if (!bestPar || score >= prev) bestPar = parsed
        }
      }
    }
  }
}

if (!bestRec) {
  // fallback: count "sexe":"Féminin" near Direction Générale via regex on utf16 text
  let femininNearDg = 0
  let totalPersonnelApprox = 0
  for (const file of files) {
    const text = decodeUtf16leLoose(fs.readFileSync(file))
    const mats = text.match(/"matricule"\s*:/g)
    if (mats) totalPersonnelApprox = Math.max(totalPersonnelApprox, mats.length)
  }
  console.log(
    JSON.stringify(
      {
        error: 'JSON Personnel non extractible proprement',
        hits,
        totalPersonnelApprox,
        femininNearDg,
      },
      null,
      2,
    ),
  )
  process.exit(1)
}

const personnel = bestRec.personnel || []
const directions = bestPar?.directions || []
const sites = bestPar?.sitesAffectation || []

const dgDirectionIds = new Set(
  directions
    .filter((d) => isDirectionGenerale(d.libelle) || isDirectionGenerale(d.code))
    .map((d) => d.id),
)
const dgSiteIds = new Set(
  sites
    .filter((s) => isDirectionGenerale(s.libelle) || isDirectionGenerale(s.code))
    .map((s) => s.id),
)

if (dgDirectionIds.size === 0) {
  // seed order: first direction is Direction Générale => dir-1
  const first = directions.find((d) => normalizeText(d.libelle).includes('generale'))
  if (first) dgDirectionIds.add(first.id)
  else dgDirectionIds.add('dir-1')
}

let femmesParDirection = 0
let femmesParSite = 0
let totalDgDirection = 0
let totalDgSite = 0
const femmesDirectionNoms = []
const femmesSiteNoms = []
const sexeCounts = {}

for (const p of personnel) {
  const k = String(p.sexe || '(vide)')
  sexeCounts[k] = (sexeCounts[k] || 0) + 1
  const feminin = isFeminin(p.sexe)
  const dirMatch =
    dgDirectionIds.has(p.directionId) || isDirectionGenerale(p.directionId)
  const siteMatch =
    dgSiteIds.has(p.siteTravailId) ||
    isDirectionGenerale(p.siteTravailId) ||
    normalizeText(p.siteTravailId).includes('direction generale')

  if (dirMatch) {
    totalDgDirection++
    if (feminin) {
      femmesParDirection++
      femmesDirectionNoms.push(
        [p.prenom, p.postnom, p.nom].filter(Boolean).join(' ') || p.matricule || p.id,
      )
    }
  }
  if (siteMatch) {
    totalDgSite++
    if (feminin) {
      femmesParSite++
      femmesSiteNoms.push(
        [p.prenom, p.postnom, p.nom].filter(Boolean).join(' ') || p.matricule || p.id,
      )
    }
  }
}

console.log(
  JSON.stringify(
    {
      totalPersonnel: personnel.length,
      directionsDg: [...dgDirectionIds],
      sitesDg: [...dgSiteIds],
      parChampDirection: {
        total: totalDgDirection,
        femmes: femmesParDirection,
        noms: femmesDirectionNoms.slice(0, 50),
      },
      parChampSiteTravail: {
        total: totalDgSite,
        femmes: femmesParSite,
        noms: femmesSiteNoms.slice(0, 50),
      },
      repartitionSexeGlobale: sexeCounts,
    },
    null,
    2,
  ),
)
