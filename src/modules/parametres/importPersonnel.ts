import * as XLSX from 'xlsx'
import {
  createEmptyPersonnel,
  generateMatricule,
  normalizePersonnel,
  type PersonnelFormState,
} from '../recrutement/personnelConstants'
import { createId, loadRecrutementStore, saveRecrutementStore } from '../recrutement/storage'
import type { Personnel } from '../recrutement/types'
import { loadParametresStore } from './storage'

export type PersonnelImportColumn = {
  key: keyof Omit<PersonnelFormState, 'photo' | 'updatedAt'>
  header: string
  section: string
  required?: boolean
  parent?: string
  valeurs?: string
}

/** Colonnes Excel = structure actuelle du fichier personnel (fils ↔ pères). */
export const PERSONNEL_IMPORT_COLUMNS: PersonnelImportColumn[] = [
  { key: 'matricule', header: 'Matricule', section: 'Identité' },
  { key: 'nom', header: 'Nom', section: 'Identité', required: true },
  { key: 'postnom', header: 'Postnom', section: 'Identité' },
  { key: 'prenom', header: 'Prenom', section: 'Identité', required: true },
  { key: 'sexe', header: 'Sexe', section: 'Identité', valeurs: 'Masculin | Féminin' },
  {
    key: 'dateNaissance',
    header: 'Date de naissance',
    section: 'Identité',
    valeurs: 'AAAA-MM-JJ',
  },
  { key: 'nationalite', header: 'Nationalite', section: 'Identité' },
  {
    key: 'dateEngagement',
    header: 'Date engagement',
    section: 'Affectation',
    valeurs: 'AAAA-MM-JJ',
  },
  {
    key: 'gradeId',
    header: 'Grade',
    section: 'Fichiers pères',
    parent: 'GRADE',
    valeurs: 'Code ou libellé du fichier Grade',
  },
  {
    key: 'fonctionId',
    header: 'Fonction',
    section: 'Fichiers pères',
    parent: 'FONCTION_AG',
    valeurs: 'Code ou libellé du fichier Fonction AG',
  },
  {
    key: 'niveauEtudesId',
    header: "Niveau d'etudes",
    section: 'Fichiers pères',
    parent: 'NIVEAU_ETUDES',
    valeurs: 'Code ou libellé du fichier Niveau d’études',
  },
  {
    key: 'numeroCompteBancaire1',
    header: 'N°Compte bancaire 1',
    section: 'Banque / CNSS',
  },
  {
    key: 'numeroCompteBancaire2',
    header: 'N°Compte bancaire 2',
    section: 'Banque / CNSS',
  },
  {
    key: 'numeroCnss',
    header: 'Immatriculation CNSS',
    section: 'Banque / CNSS',
  },
  { key: 'telephone', header: 'Telephone', section: 'Coordonnées' },
  { key: 'email', header: 'Email', section: 'Coordonnées' },
  {
    key: 'entrepriseId',
    header: 'Entreprise',
    section: 'Fichiers pères',
    parent: 'ENTREPRISE',
    valeurs: 'Sigle, raison sociale ou id',
  },
  {
    key: 'siteTravailId',
    header: 'Site de travail',
    section: 'Fichiers pères',
    parent: 'SITE DE TRAVAIL',
    valeurs: 'Code ou libellé',
  },
  {
    key: 'periodeId',
    header: 'Periode',
    section: 'Fichiers pères',
    parent: 'PERIODE',
    valeurs: 'Code ou libellé',
  },
  {
    key: 'directionId',
    header: 'Direction',
    section: 'Fichiers pères',
    parent: 'DIRECTION',
    valeurs: 'Code ou libellé',
  },
  {
    key: 'statutId',
    header: 'Statut',
    section: 'Fichiers pères',
    parent: 'STATUT',
    valeurs: 'Code ou libellé',
  },
  {
    key: 'typeContratId',
    header: 'Type de contrat',
    section: 'Fichiers pères',
    parent: 'TYPE_CONTRAT',
    valeurs: 'Code ou libellé (CDI, CDD…)',
  },
  {
    key: 'compteComptableId',
    header: 'Compte_comptable',
    section: 'Fichiers pères',
    parent: 'COMPTE_COMPTABLE',
    valeurs: 'Code ou libellé',
  },
]

export const PERSONNEL_IMPORT_SECTIONS = Array.from(
  new Map(
    PERSONNEL_IMPORT_COLUMNS.map((col) => [
      col.section,
      PERSONNEL_IMPORT_COLUMNS.filter((c) => c.section === col.section),
    ]),
  ).entries(),
)

const DATE_KEYS = new Set(['dateNaissance', 'dateEngagement'])

function normalizeHeader(value: unknown): string {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/['’`]/g, "'")
    .replace(/\s+/g, ' ')
}

const HEADER_ALIASES: Record<string, PersonnelImportColumn['key']> = {
  [normalizeHeader('Post-nom')]: 'postnom',
  [normalizeHeader('Prénom')]: 'prenom',
  [normalizeHeader('DATE DE NAISSANCE')]: 'dateNaissance',
  [normalizeHeader('Nationalité')]: 'nationalite',
  [normalizeHeader('DATE ENGAGEMENT')]: 'dateEngagement',
  [normalizeHeader('Fonction AG')]: 'fonctionId',
  [normalizeHeader('FONCTION')]: 'fonctionId',
  [normalizeHeader("NIVEAU D'ETUDES")]: 'niveauEtudesId',
  [normalizeHeader('Niveau d’études')]: 'niveauEtudesId',
  [normalizeHeader('N°COMPTE BANCAIRE')]: 'numeroCompteBancaire1',
  [normalizeHeader('N°COMPTE BANCAIRE 1')]: 'numeroCompteBancaire1',
  [normalizeHeader('N°COMPTE BANCAIRE 2')]: 'numeroCompteBancaire2',
  [normalizeHeader('IMMATRICULATION')]: 'numeroCnss',
  [normalizeHeader('Immatriculation CNSS')]: 'numeroCnss',
  [normalizeHeader('Téléphone')]: 'telephone',
  [normalizeHeader('TELEPHONE')]: 'telephone',
  [normalizeHeader('E-mail')]: 'email',
  [normalizeHeader('EMAIL')]: 'email',
  [normalizeHeader('ORGANISATION')]: 'entrepriseId',
  [normalizeHeader('Période')]: 'periodeId',
}

const HEADER_TO_KEY = new Map<string, PersonnelImportColumn['key']>([
  ...PERSONNEL_IMPORT_COLUMNS.map(
    (col) => [normalizeHeader(col.header), col.key] as const,
  ),
  ...Object.entries(HEADER_ALIASES),
])

function excelDateToIso(value: unknown): string {
  if (value == null || value === '') return ''
  if (typeof value === 'number' && Number.isFinite(value)) {
    const parsed = XLSX.SSF.parse_date_code(value)
    if (!parsed) return ''
    const y = String(parsed.y).padStart(4, '0')
    const m = String(parsed.m).padStart(2, '0')
    const d = String(parsed.d).padStart(2, '0')
    return `${y}-${m}-${d}`
  }
  const text = String(value).trim()
  if (!text) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10)
  const fr = text.match(/^(\d{1,2})[\/\-.](\d{1,2})[\/\-.](\d{4})$/)
  if (fr) {
    return `${fr[3]}-${fr[2].padStart(2, '0')}-${fr[1].padStart(2, '0')}`
  }
  return text
}

function cellToString(value: unknown, key: string): string {
  if (DATE_KEYS.has(key)) return excelDateToIso(value)
  if (value == null) return ''
  if (typeof value === 'number') return String(value)
  return String(value).trim()
}

export function downloadPersonnelImportTemplate() {
  const headers = PERSONNEL_IMPORT_COLUMNS.map((c) => c.header)
  const exampleByKey: Partial<Record<PersonnelImportColumn['key'], string>> = {
    matricule: 'PER-2026-0001',
    nom: 'KABONGO',
    postnom: 'MUTOMBO',
    prenom: 'Jean',
    sexe: 'Masculin',
    dateNaissance: '1990-05-12',
    nationalite: 'Congolaise (RDC)',
    dateEngagement: '2024-01-15',
    gradeId: 'Chef de Bureau C3',
    fonctionId: 'Chargé de recrutement et carrière',
    niveauEtudesId: 'Licence / Bachelor',
    numeroCompteBancaire1: '000123456789',
    numeroCompteBancaire2: '',
    numeroCnss: 'CNSS-123',
    telephone: '+243810000000',
    email: 'jean.kabongo@email.com',
    entrepriseId: 'ARMP',
    siteTravailId: 'DG — Direction Générale',
    periodeId: '',
    directionId: 'Direction des Ressources Humaines',
    statutId: 'Actif',
    typeContratId: 'CDI',
    compteComptableId: '421000 — Rémunérations dues',
  }
  const exampleRow = PERSONNEL_IMPORT_COLUMNS.map((c) => exampleByKey[c.key] ?? '')
  const blankRows = Array.from({ length: 20 }, () => headers.map(() => ''))
  const dataSheet = XLSX.utils.aoa_to_sheet([headers, exampleRow, ...blankRows])
  dataSheet['!cols'] = headers.map((h) => ({ wch: Math.min(36, Math.max(14, h.length + 2)) }))

  const fieldsSheet = XLSX.utils.aoa_to_sheet([
    ['N°', 'Section', 'Champ', 'Clé', 'Père', 'Obligatoire', 'Valeurs'],
    ...PERSONNEL_IMPORT_COLUMNS.map((col, index) => [
      index + 1,
      col.section,
      col.header,
      col.key,
      col.parent ?? '',
      col.required ? 'Oui' : 'Non',
      col.valeurs ?? '',
    ]),
    [],
    [
      'Note',
      '',
      'Les champs pères acceptent le code ou le libellé du fichier père. La photo n’est pas importée via Excel.',
      '',
      '',
      '',
      '',
    ],
  ])
  fieldsSheet['!cols'] = [
    { wch: 5 },
    { wch: 18 },
    { wch: 28 },
    { wch: 22 },
    { wch: 18 },
    { wch: 12 },
    { wch: 40 },
  ]

  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, dataSheet, 'Personnel')
  XLSX.utils.book_append_sheet(book, fieldsSheet, 'Liste des champs')
  XLSX.writeFile(book, 'modele_import_personnel.xlsx')
}

export type PersonnelImportPreviewRow = {
  rowNumber: number
  data: Record<string, string>
  nom: string
  prenom: string
  matricule: string
  valid: boolean
  error?: string
}

export type PersonnelImportResult = {
  created: number
  updated: number
  skipped: number
  errors: string[]
}

export async function parsePersonnelExcelFile(
  file: File,
): Promise<PersonnelImportPreviewRow[]> {
  const buffer = await file.arrayBuffer()
  const workbook = XLSX.read(buffer, { type: 'array', cellDates: true })
  const preferred =
    workbook.SheetNames.find((name) => normalizeHeader(name) === 'personnel') ??
    workbook.SheetNames[0]
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
  const keyByIndex = headerRow.map((cell) => HEADER_TO_KEY.get(normalizeHeader(cell)) ?? null)
  if (keyByIndex.filter(Boolean).length < 2) {
    throw new Error(
      'Impossible de reconnaître les colonnes. Téléchargez le modèle Excel et conservez les en-têtes.',
    )
  }

  const preview: PersonnelImportPreviewRow[] = []
  for (let i = 1; i < rows.length; i += 1) {
    const row = rows[i] ?? []
    if (row.every((cell) => String(cell ?? '').trim() === '')) continue

    const data: Record<string, string> = {}
    keyByIndex.forEach((key, idx) => {
      if (!key) return
      const raw = row[idx]
      data[key as string] = cellToString(
        raw instanceof Date ? raw.toISOString().slice(0, 10) : raw,
        key as string,
      )
    })

    const nom = data.nom?.trim() ?? ''
    const prenom = data.prenom?.trim() ?? ''
    preview.push({
      rowNumber: i + 1,
      data,
      nom,
      prenom,
      matricule: data.matricule?.trim() ?? '',
      valid: Boolean(nom && prenom),
      error: nom && prenom ? undefined : 'Nom et prénom obligatoires',
    })
  }

  if (preview.length === 0) {
    throw new Error('Aucune ligne de données trouvée dans le fichier.')
  }
  return preview
}

export function commitPersonnelImport(
  rows: PersonnelImportPreviewRow[],
): PersonnelImportResult {
  const refs = loadParametresStore()
  const store = loadRecrutementStore()
  let personnel = [...store.personnel]
  let created = 0
  let updated = 0
  let skipped = 0
  const errors: string[] = []
  const now = new Date().toISOString()

  for (const row of rows) {
    if (!row.valid) {
      skipped += 1
      errors.push(`Ligne ${row.rowNumber} : ${row.error ?? 'données invalides'}`)
      continue
    }
    try {
      const merged = normalizePersonnel(
        {
          ...createEmptyPersonnel(),
          ...row.data,
          photo: null,
        },
        refs,
      )
      let matricule = merged.matricule.trim()
      if (!matricule) matricule = generateMatricule(personnel)

      const existingIdx = personnel.findIndex(
        (p) => p.matricule.toLowerCase() === matricule.toLowerCase(),
      )
      if (existingIdx >= 0) {
        const prev = personnel[existingIdx]
        if (prev.valide) {
          skipped += 1
          errors.push(
            `Ligne ${row.rowNumber} : matricule « ${matricule} » déjà validé — non modifié.`,
          )
          continue
        }
        personnel[existingIdx] = {
          ...prev,
          ...merged,
          id: prev.id,
          matricule,
          photo: prev.photo,
          valide: prev.valide,
          createdAt: prev.createdAt,
          updatedAt: now,
        }
        updated += 1
      } else {
        const next: Personnel = {
          ...merged,
          id: createId(),
          matricule,
          photo: null,
          createdAt: now,
          updatedAt: now,
        }
        personnel = [...personnel, next]
        created += 1
      }
    } catch (err) {
      skipped += 1
      errors.push(
        `Ligne ${row.rowNumber} : ${err instanceof Error ? err.message : 'erreur d’import'}`,
      )
    }
  }

  saveRecrutementStore({ ...store, personnel })
  return { created, updated, skipped, errors }
}
