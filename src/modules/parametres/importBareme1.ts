import * as XLSX from 'xlsx'
import { BAREME1_FIELDS, IMPORT_STRUCTURES } from './importStructures'
import { createId, loadParametresStore, saveParametresStore } from './storage'
import type { Bareme1Item } from './types'

export type Bareme1ImportKey = (typeof BAREME1_FIELDS)[number]['key']

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

const HEADER_ALIASES: Record<string, Bareme1ImportKey> = {
  [normalizeHeader('JOUR DU MOIS')]: 'jourDuMois',
  [normalizeHeader('JOURS DU MOIS')]: 'jourDuMois',
  [normalizeHeader('JOURS DE CONGE')]: 'joursDeConge',
  [normalizeHeader('JOURS DE CONGÉ')]: 'joursDeConge',
  [normalizeHeader('LIBELLE GRADE')]: 'libelleGrade',
  [normalizeHeader('LIBELLÉ GRADE')]: 'libelleGrade',
  [normalizeHeader('RETENUE CNSS')]: 'retenueCnss',
  [normalizeHeader('RETENUE IPR')]: 'retenueIpr',
  [normalizeHeader('RETENUE INPP')]: 'retenueInpp',
}

const HEADER_TO_KEY = new Map<string, Bareme1ImportKey>([
  ...BAREME1_FIELDS.map((col) => [normalizeHeader(col.header), col.key] as const),
  ...Object.entries(HEADER_ALIASES),
])

function cellToString(value: unknown): string {
  if (value == null) return ''
  if (typeof value === 'number') return String(value)
  return String(value).trim()
}

export function downloadBareme1ImportTemplate() {
  const def = IMPORT_STRUCTURES.bareme1
  const headers = BAREME1_FIELDS.map((c) => c.header)
  const exampleRow = def.exampleRow
  const blankRows = Array.from({ length: 20 }, () => headers.map(() => ''))
  const dataSheet = XLSX.utils.aoa_to_sheet([headers, exampleRow, ...blankRows])
  dataSheet['!cols'] = headers.map((h) => ({
    wch: Math.min(28, Math.max(14, h.length + 2)),
  }))

  const fieldsSheet = XLSX.utils.aoa_to_sheet([
    ['N°', 'Champ', 'Clé', 'Obligatoire', 'Valeurs'],
    ...BAREME1_FIELDS.map((col, index) => [
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
  XLSX.utils.book_append_sheet(book, dataSheet, 'Bareme1')
  XLSX.utils.book_append_sheet(book, fieldsSheet, 'Liste des champs')
  XLSX.writeFile(book, 'modele_import_bareme1.xlsx')
}

export type Bareme1ImportPreviewRow = {
  rowNumber: number
  data: Record<string, string>
  grade: string
  libelleGrade: string
  valid: boolean
  error?: string
}

export type Bareme1ImportResult = {
  created: number
  updated: number
  skipped: number
  errors: string[]
}

export async function parseBareme1ExcelFile(
  file: File,
): Promise<Bareme1ImportPreviewRow[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const preferred =
    workbook.SheetNames.find((name) => {
      const n = normalizeHeader(name)
      return n === 'bareme1' || n === 'bareme 1' || n === 'bareme'
    }) ?? workbook.SheetNames[0]
  if (!preferred) throw new Error('Le fichier Excel ne contient aucune feuille.')

  const sheet = workbook.Sheets[preferred]
  const rows = XLSX.utils.sheet_to_json<(string | number | Date | null)[]>(sheet, {
    header: 1,
    defval: '',
    raw: true,
  })

  if (rows.length < 2) {
    throw new Error(
      'Le fichier doit contenir une ligne d’en-têtes et au moins une ligne de données.',
    )
  }

  const headerRow = rows[0] ?? []
  const keyByIndex = headerRow.map(
    (cell) => HEADER_TO_KEY.get(normalizeHeader(cell)) ?? null,
  )
  if (keyByIndex.filter(Boolean).length < 2) {
    throw new Error(
      'Impossible de reconnaître les colonnes. Téléchargez le modèle Excel Barème 1 et conservez les en-têtes.',
    )
  }

  const preview: Bareme1ImportPreviewRow[] = []
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] ?? []
    if (row.every((cell) => String(cell ?? '').trim() === '')) continue

    const data: Record<string, string> = {}
    keyByIndex.forEach((key, idx) => {
      if (!key) return
      data[key] = cellToString(row[idx])
    })

    const grade = data.grade?.trim() ?? ''
    const libelleGrade = data.libelleGrade?.trim() ?? ''
    preview.push({
      rowNumber: i + 1,
      data,
      grade,
      libelleGrade,
      valid: Boolean(grade && libelleGrade),
      error:
        grade && libelleGrade
          ? undefined
          : 'GRADE et LIBELLE GRADE obligatoires',
    })
  }

  if (preview.length === 0) {
    throw new Error('Aucune ligne de données trouvée dans le fichier.')
  }
  return preview
}

function toBareme1Item(
  data: Record<string, string>,
  prev?: Bareme1Item,
): Bareme1Item {
  const now = new Date().toISOString()
  return {
    id: prev?.id ?? createId(),
    grade: (data.grade ?? '').trim(),
    libelleGrade: (data.libelleGrade ?? '').trim(),
    base: (data.base ?? '').trim(),
    logement: (data.logement ?? '').trim(),
    transport: (data.transport ?? '').trim(),
    jourDuMois: (data.jourDuMois ?? '').trim(),
    joursDeConge: (data.joursDeConge ?? '').trim(),
    retenueCnss: (data.retenueCnss ?? '').trim(),
    retenueIpr: (data.retenueIpr ?? '').trim(),
    retenueInpp: (data.retenueInpp ?? '').trim(),
    valide: prev?.valide ?? false,
    createdAt: prev?.createdAt ?? now,
  }
}

export function commitBareme1Import(
  rows: Bareme1ImportPreviewRow[],
): Bareme1ImportResult {
  const store = loadParametresStore()
  let baremes1 = [...store.baremes1]
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
      const existingIdx = baremes1.findIndex(
        (b) => b.grade.trim().toLowerCase() === gradeKey,
      )
      if (existingIdx >= 0) {
        if (baremes1[existingIdx].valide) {
          skipped += 1
          errors.push(
            `Ligne ${row.rowNumber} : grade « ${row.grade} » déjà validé — non modifié.`,
          )
          continue
        }
        baremes1[existingIdx] = toBareme1Item(row.data, baremes1[existingIdx])
        updated += 1
      } else {
        baremes1 = [...baremes1, toBareme1Item(row.data)]
        created += 1
      }
    } catch (err) {
      skipped += 1
      errors.push(
        `Ligne ${row.rowNumber} : ${err instanceof Error ? err.message : 'erreur d’import'}`,
      )
    }
  }

  saveParametresStore({ ...store, baremes1 })
  return { created, updated, skipped, errors }
}
