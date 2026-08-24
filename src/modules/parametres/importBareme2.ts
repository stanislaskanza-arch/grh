import * as XLSX from 'xlsx'
import { BAREME2_FIELDS, IMPORT_STRUCTURES } from './importStructures'
import { createId, loadParametresStore, saveParametresStore } from './storage'
import type { Bareme2Item } from './types'

export type Bareme2ImportKey = (typeof BAREME2_FIELDS)[number]['key']

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, "'")
    .replace(/[—–−]/g, '-')
    .replace(/\s+/g, ' ')
}

const HEADER_ALIASES: Record<string, Bareme2ImportKey> = {
  [normalizeHeader('IPR 3%')]: 'ipr3',
  [normalizeHeader('IPR3')]: 'ipr3',
  [normalizeHeader('IPR')]: 'ipr3',
  [normalizeHeader('CNSS 5%')]: 'cnss5',
  [normalizeHeader('CNSS5')]: 'cnss5',
  [normalizeHeader('CNSS')]: 'cnss5',
  [normalizeHeader('Salaire de base')]: 'base',
  [normalizeHeader('Salaire base')]: 'base',
  [normalizeHeader('Indemnite de logement')]: 'logement',
  [normalizeHeader('Indemnité de logement')]: 'logement',
  [normalizeHeader('Indemnite de transport')]: 'transport',
  [normalizeHeader('Indemnité de transport')]: 'transport',
  [normalizeHeader('Total brute')]: 'brute',
  [normalizeHeader('Total brut')]: 'brute',
}

const HEADER_TO_KEY = new Map<string, Bareme2ImportKey>([
  ...BAREME2_FIELDS.map((col) => [normalizeHeader(col.header), col.key] as const),
  ...Object.entries(HEADER_ALIASES),
])

function cellToString(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'number') return String(value)
  return String(value).trim()
}

export function downloadBareme2ImportTemplate() {
  const def = IMPORT_STRUCTURES.bareme2
  const headers = BAREME2_FIELDS.map((c) => c.header)
  const exampleRow = def.exampleRow
  const blankRows = Array.from({ length: 20 }, () => headers.map(() => ''))
  const dataSheet = XLSX.utils.aoa_to_sheet([headers, exampleRow, ...blankRows])
  dataSheet['!cols'] = headers.map((h) => ({
    wch: Math.min(28, Math.max(14, h.length + 2)),
  }))

  const fieldsSheet = XLSX.utils.aoa_to_sheet([
    ['N°', 'Champ', 'Clé', 'Obligatoire', 'Valeurs'],
    ...BAREME2_FIELDS.map((col, index) => [
      index + 1,
      col.header,
      col.key,
      col.required ? 'Oui' : 'Non',
      col.valeurs ?? '',
    ]),
  ])
  fieldsSheet['!cols'] = [
    { wch: 5 },
    { wch: 22 },
    { wch: 16 },
    { wch: 12 },
    { wch: 28 },
  ]

  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, dataSheet, 'Bareme2')
  XLSX.utils.book_append_sheet(book, fieldsSheet, 'Liste des champs')
  XLSX.writeFile(book, 'modele_import_bareme2.xlsx')
}

export type Bareme2ImportPreviewRow = {
  rowNumber: number
  data: Record<string, string>
  grade: string
  valid: boolean
  error?: string
}

export type Bareme2ImportResult = {
  created: number
  updated: number
  skipped: number
  errors: string[]
}

export async function parseBareme2ExcelFile(
  file: File,
): Promise<Bareme2ImportPreviewRow[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array' })
  const sheetName =
    workbook.SheetNames.find((name) => {
      const n = normalizeHeader(name)
      return n === 'bareme2' || n === 'bareme 2' || n === 'bareme'
    }) ?? workbook.SheetNames[0]
  if (!sheetName) throw new Error('Feuille Excel introuvable.')

  const sheet = workbook.Sheets[sheetName]
  const rows = XLSX.utils.sheet_to_json<(string | number | null)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  })
  if (rows.length < 2) {
    throw new Error('Le fichier ne contient aucune ligne de données.')
  }

  const headerRow = rows[0] ?? []
  const colMap = new Map<number, Bareme2ImportKey>()
  headerRow.forEach((cell, index) => {
    const key = HEADER_TO_KEY.get(normalizeHeader(cell))
    if (key) colMap.set(index, key)
  })

  if (!colMap.size || ![...colMap.values()].includes('grade')) {
    throw new Error(
      'Impossible de reconnaître les colonnes. Téléchargez le modèle Excel Barème 2 et conservez les en-têtes.',
    )
  }

  const preview: Bareme2ImportPreviewRow[] = []
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] ?? []
    const data: Record<string, string> = {}
    for (const [index, key] of colMap) {
      data[key] = cellToString(row[index])
    }
    const grade = (data.grade ?? '').trim()
    const empty = Object.values(data).every((v) => !v)
    if (empty) continue

    let valid = true
    let error: string | undefined
    if (!grade) {
      valid = false
      error = 'GRADE obligatoire'
    }

    preview.push({
      rowNumber: i + 1,
      data,
      grade,
      valid,
      error,
    })
  }

  if (preview.length === 0) {
    throw new Error('Aucune ligne de données trouvée dans le fichier.')
  }
  return preview
}

function toBareme2Item(
  data: Record<string, string>,
  prev?: Bareme2Item,
): Bareme2Item {
  const stamp = new Date().toISOString()
  return {
    id: prev?.id ?? createId(),
    grade: (data.grade ?? '').trim(),
    base: (data.base ?? '').trim(),
    logement: (data.logement ?? '').trim(),
    transport: (data.transport ?? '').trim(),
    brute: (data.brute ?? '').trim(),
    ipr3: (data.ipr3 ?? '').trim(),
    cnss5: (data.cnss5 ?? '').trim(),
    valide: prev?.valide ?? false,
    createdAt: prev?.createdAt ?? stamp,
  }
}

export function commitBareme2Import(
  rows: Bareme2ImportPreviewRow[],
): Bareme2ImportResult {
  const store = loadParametresStore()
  let baremes2 = [...store.baremes2]
  let created = 0
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows) {
    if (!row.valid) {
      skipped += 1
      errors.push(`Ligne ${row.rowNumber} : ${row.error ?? 'données invalides'}`)
      continue
    }
    try {
      const gradeKey = row.grade.toLowerCase()
      const existingIdx = baremes2.findIndex(
        (b) => b.grade.trim().toLowerCase() === gradeKey,
      )
      if (existingIdx >= 0) {
        if (baremes2[existingIdx].valide) {
          skipped += 1
          errors.push(
            `Ligne ${row.rowNumber} : grade « ${row.grade} » déjà validé — non modifié.`,
          )
          continue
        }
        baremes2[existingIdx] = toBareme2Item(row.data, baremes2[existingIdx])
        updated += 1
      } else {
        baremes2 = [...baremes2, toBareme2Item(row.data)]
        created += 1
      }
    } catch (err) {
      skipped += 1
      errors.push(
        `Ligne ${row.rowNumber} : ${err instanceof Error ? err.message : 'erreur d’import'}`,
      )
    }
  }

  saveParametresStore({ ...store, baremes2 })
  return { created, updated, skipped, errors }
}
