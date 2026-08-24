import {
  findTauxMonnaieEnCours,
  isTauxMonnaieEnCours,
  parseMontantTaux,
  TAUX_EN_COURS_LABEL,
} from '../paie/tauxMonnaieEnCours'
import {
  COMPTES_COMPTABLES_REF,
  DIRECTIONS_PERSONNEL,
  FONCTIONS_REF,
  GRADES_REF,
  NIVEAUX_ETUDES_REF,
  PRIMES_REF,
  SITES_TRAVAIL_REF,
  STATUTS_PERSONNEL_REF,
  TYPES_CONTRAT_REF,
} from '../recrutement/personnelConstants'
import { schedulePushStore } from '../../sync/cloudSync'
import {
  type AppUser,
  type Bareme1Item,
  type Bareme2Item,
  type CongeItem,
  type Entreprise,
  type EntrepriseLogo,
  type MonnaieItem,
  type ParametresStore,
  type PeriodeItem,
  type RefItem,
  type TauxMonnaieItem,
  type UserRole,
} from './types'

const STORAGE_KEY = 'grh.parametres.v2'
const LEGACY_KEY = 'grh.parametres.v1'

const DEFAULT_ENTREPRISE_ID = 'entreprise-demo-1'
const DEFAULT_DB_PASSWORD = 'dbadmin123'

function now() {
  return new Date().toISOString()
}

function refFromList(prefix: string, labels: string[]): RefItem[] {
  return labels.map((libelle, index) => ({
    id: `${prefix}-${index + 1}`,
    code: `${prefix.toUpperCase()}-${String(index + 1).padStart(3, '0')}`,
    libelle,
    description: '',
    statut: 'actif' as const,
    createdAt: now(),
  }))
}

/** Garantit la présence des libellés de statut attendus (migration douce). */
function ensureStatutsPersonnel(items: RefItem[]): RefItem[] {
  const byLibelle = new Map(
    items.map((item) => [item.libelle.trim().toLowerCase(), item]),
  )
  const next = [...items]
  let seq = next.length
  for (const libelle of STATUTS_PERSONNEL_REF) {
    if (byLibelle.has(libelle.toLowerCase())) continue
    seq += 1
    const item: RefItem = {
      id: `stp-${seq}`,
      code: `STP-${String(seq).padStart(3, '0')}`,
      libelle,
      description: '',
      statut: 'actif',
      createdAt: now(),
    }
    next.push(item)
    byLibelle.set(libelle.toLowerCase(), item)
  }
  return next
}

function defaultGrades(): RefItem[] {
  return GRADES_REF.map((g, index) => ({
    id: `grd-${index + 1}`,
    code: g.code,
    libelle: g.libelle,
    description: '',
    statut: 'actif' as const,
    createdAt: now(),
  }))
}

function defaultPrimes(): RefItem[] {
  return PRIMES_REF.map((p, index) => ({
    id: `prm-${index + 1}`,
    code: p.code,
    libelle: p.libelle,
    description: '',
    statut: 'actif' as const,
    createdAt: now(),
  }))
}

function defaultFonctions(): RefItem[] {
  return FONCTIONS_REF.map((f, index) => ({
    id: `fct-${index + 1}`,
    code: f.code,
    libelle: f.libelle,
    description: '',
    statut: 'actif' as const,
    createdAt: now(),
  }))
}

function defaultNiveauxEtudes(): RefItem[] {
  return NIVEAUX_ETUDES_REF.map((n, index) => ({
    id: `niv-${index + 1}`,
    code: n.code,
    libelle: n.libelle,
    description: '',
    statut: 'actif' as const,
    createdAt: now(),
  }))
}

function defaultSitesTravail(): RefItem[] {
  return SITES_TRAVAIL_REF.map((s, index) => ({
    id: `sit-${index + 1}`,
    code: s.code,
    libelle: s.libelle,
    description: '',
    statut: 'actif' as const,
    createdAt: now(),
  }))
}

function defaultTypesContrats(): RefItem[] {
  return TYPES_CONTRAT_REF.map((t, index) => ({
    id: `tct-${index + 1}`,
    code: t.code,
    libelle: t.libelle,
    description: '',
    statut: 'actif' as const,
    createdAt: now(),
  }))
}

function normalizeEntrepriseLogo(raw: unknown): EntrepriseLogo | null {
  if (!raw || typeof raw !== 'object') return null
  const r = raw as Record<string, unknown>
  const name = String(r.name ?? '')
  const type = String(r.type ?? '')
  if (!name && !r.dataUrl) return null
  return {
    name,
    size: Number(r.size) || 0,
    type: type || 'image/*',
    dataUrl: r.dataUrl ? String(r.dataUrl) : undefined,
  }
}

function normalizeEntreprise(raw: Record<string, unknown>): Entreprise {
  return {
    id: String(raw.id ?? createId()),
    sigle: String(raw.sigle ?? ''),
    raisonSociale: String(raw.raisonSociale ?? ''),
    responsable1: String(raw.responsable1 ?? ''),
    responsable2: String(raw.responsable2 ?? ''),
    responsable3: String(raw.responsable3 ?? ''),
    ligneEntete1: String(raw.ligneEntete1 ?? ''),
    ligneEntete2: String(raw.ligneEntete2 ?? ''),
    ligneEntete3: String(raw.ligneEntete3 ?? ''),
    ligneEntete4: String(raw.ligneEntete4 ?? ''),
    ligneEntete5: String(raw.ligneEntete5 ?? ''),
    logo: normalizeEntrepriseLogo(raw.logo),
    nouveauLogo: normalizeEntrepriseLogo(raw.nouveauLogo),
    numeroRccm: String(raw.numeroRccm ?? ''),
    numeroIdNat: String(raw.numeroIdNat ?? ''),
    adresse: String(raw.adresse ?? ''),
    ville: String(raw.ville ?? ''),
    pays: String(raw.pays ?? ''),
    telephone: String(raw.telephone ?? ''),
    email: String(raw.email ?? ''),
    secteur: String(raw.secteur ?? ''),
    statut: raw.statut === 'inactive' ? 'inactive' : 'active',
    createdAt: String(raw.createdAt ?? now()),
  }
}

function defaultEntreprise(): Entreprise {
  return {
    id: DEFAULT_ENTREPRISE_ID,
    sigle: 'ARMP',
    raisonSociale: 'AUTORITE DE REGULATION',
    responsable1: 'Claude KAYEMBE',
    responsable2: 'BATAMBA BAFENI',
    responsable3: 'BILOLO LWANGO Consolatrice',
    ligneEntete1: 'REPUBLIQUE DEMOCRATIQUE DU CONGO',
    ligneEntete2: 'PRIMATURE',
    ligneEntete3: 'DIRECTION GENERALE',
    ligneEntete4: 'DIRECTION GENERALE',
    ligneEntete5: '',
    logo: null,
    nouveauLogo: null,
    numeroRccm: '',
    numeroIdNat: '',
    adresse: 'Kinshasa',
    ville: 'Kinshasa',
    pays: 'République Démocratique du Congo',
    telephone: '',
    email: 'contact@armp.cd',
    secteur: 'Administration publique',
    statut: 'active',
    createdAt: now(),
  }
}

function defaultUsers(): AppUser[] {
  return [
    {
      id: 'user-admin-1',
      nom: 'GRH',
      prenom: 'Admin',
      email: 'admin@grh.local',
      role: 'Administrateur',
      categorieUtilisateurId: 'cat-1',
      entrepriseId: DEFAULT_ENTREPRISE_ID,
      telephone: '',
      statut: 'actif',
      password: 'admin123',
      createdAt: now(),
    },
    {
      id: 'user-demo-1',
      nom: 'Démo',
      prenom: 'Utilisateur',
      email: 'demo@grh.local',
      role: 'RH',
      categorieUtilisateurId: 'cat-2',
      entrepriseId: DEFAULT_ENTREPRISE_ID,
      telephone: '',
      statut: 'actif',
      password: 'demo123',
      createdAt: now(),
    },
  ]
}

function defaultCategories(): RefItem[] {
  return [
    {
      id: 'cat-1',
      code: 'CAT-ADM',
      libelle: 'Administrateur système',
      description: 'Accès complet à la plateforme',
      statut: 'actif',
      createdAt: now(),
    },
    {
      id: 'cat-2',
      code: 'CAT-RH',
      libelle: 'Gestionnaire RH',
      description: 'Gestion du personnel et du recrutement',
      statut: 'actif',
      createdAt: now(),
    },
    {
      id: 'cat-3',
      code: 'CAT-LEC',
      libelle: 'Lecteur',
      description: 'Consultation seule',
      statut: 'actif',
      createdAt: now(),
    },
  ]
}

function defaultBaremes2(): Bareme2Item[] {
  return GRADES_REF.map((g) => ({
    id: `b2-${g.code.toLowerCase()}`,
    grade: g.code,
    base: '',
    logement: '',
    transport: '',
    brute: '',
    ipr3: '',
    cnss5: '',
    valide: false,
    createdAt: now(),
  }))
}

/** Charge les lignes Barème 2 persistées (sans les écraser si une ligne est atypique). */
function loadBaremes2FromParsed(
  parsed: Partial<ParametresStore>,
  seeded: Bareme2Item[],
): Bareme2Item[] {
  const rawList = (parsed as { baremes2?: unknown[] }).baremes2
  if (!Array.isArray(rawList) || rawList.length === 0) return seeded
  const normalized = rawList
    .filter((row) => row && typeof row === 'object')
    .map((row) => normalizeBareme2(row as Record<string, unknown>))
    .filter((row) => row.grade.trim() !== '')
  return normalized.length > 0 ? normalized : seeded
}

function normalizeBareme2(raw: Record<string, unknown>): Bareme2Item {
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      if (raw[key] == null || raw[key] === '') continue
      return String(raw[key]).trim()
    }
    return ''
  }
  return {
    id: String(raw.id ?? createId()),
    grade: pick('grade', 'Grade', 'GRADE', 'code', 'Code'),
    base: pick('base', 'Base', 'BASE', 'salaireBase', 'salaire_base'),
    logement: pick('logement', 'Logement', 'LOGEMENT'),
    transport: pick('transport', 'Transport', 'TRANSPORT'),
    brute: pick('brute', 'Brute', 'BRUTE', 'brut', 'valeur'),
    ipr3: pick('ipr3', 'ipr', 'IPR 3%', 'ipr 3%'),
    cnss5: pick('cnss5', 'cnss', 'CNSS 5%', 'cnss 5%'),
    valide:
      raw.valide === true ||
      raw.valide === 1 ||
      raw.valide === '1' ||
      String(raw.valide ?? '')
        .trim()
        .toLowerCase() === 'true' ||
      String(raw.valide ?? '')
        .trim()
        .toLowerCase() === 'oui',
    createdAt: String(raw.createdAt ?? now()),
  }
}

function defaultBaremes1(): Bareme1Item[] {
  return GRADES_REF.map((g) => ({
    id: `b1-${g.code.toLowerCase()}`,
    grade: g.code,
    libelleGrade: g.libelle,
    base: '',
    logement: '',
    transport: '',
    jourDuMois: '',
    joursDeConge: '',
    retenueCnss: '0.05',
    retenueIpr: '0.21',
    retenueInpp: '',
    valide: false,
    createdAt: now(),
  }))
}

function normalizeRateToken(value: string) {
  return value.trim().replace(',', '.').replace(/\s/g, '')
}

function migrateBareme1Retenues(item: Bareme1Item): Bareme1Item {
  const ipr = normalizeRateToken(item.retenueIpr)
  const cnss = normalizeRateToken(item.retenueCnss)
  let retenueIpr = item.retenueIpr
  let retenueCnss = item.retenueCnss
  if (!ipr || ipr === '0.03' || ipr === '.03') {
    retenueIpr = '0.21'
  }
  if (!cnss || cnss === '0.03' || cnss === '.03') {
    retenueCnss = '0.05'
  }
  if (retenueIpr === item.retenueIpr && retenueCnss === item.retenueCnss) {
    return item
  }
  return { ...item, retenueIpr, retenueCnss }
}

function normalizeBareme1(raw: Record<string, unknown>): Bareme1Item {
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      if (raw[key] == null || raw[key] === '') continue
      return String(raw[key]).trim()
    }
    return ''
  }
  return migrateBareme1Retenues({
    id: String(raw.id ?? createId()),
    grade: pick('grade', 'Grade', 'GRADE', 'code', 'Code'),
    libelleGrade: pick(
      'libelleGrade',
      'libelle',
      'LibelleGrade',
      'LIBELLE GRADE',
      'libelle_grade',
    ),
    base: pick('base', 'Base', 'BASE'),
    logement: pick('logement', 'Logement', 'LOGEMENT'),
    transport: pick('transport', 'Transport', 'TRANSPORT'),
    jourDuMois: pick(
      'jourDuMois',
      'joursDuMois',
      'jour_du_mois',
      'jours_du_mois',
      'JOURS DU MOIS',
    ),
    joursDeConge: pick(
      'joursDeConge',
      'jours_de_conge',
      'JOURS DE CONGE',
    ),
    retenueCnss: pick('retenueCnss', 'retenue_cnss', 'CNSS'),
    retenueIpr: pick('retenueIpr', 'retenue_ipr', 'IPR'),
    retenueInpp: pick('retenueInpp', 'retenue_inpp', 'INPP'),
    valide:
      raw.valide === true ||
      raw.valide === 1 ||
      raw.valide === '1' ||
      String(raw.valide ?? '')
        .trim()
        .toLowerCase() === 'true' ||
      String(raw.valide ?? '')
        .trim()
        .toLowerCase() === 'oui',
    createdAt: String(raw.createdAt ?? now()),
  })
}

/** Charge les lignes Barème 1 persistées (sans les écraser si une ligne est atypique). */
function loadBaremes1FromParsed(
  parsed: Partial<ParametresStore>,
  seeded: Bareme1Item[],
): Bareme1Item[] {
  const rawList = (parsed as { baremes1?: unknown[] }).baremes1
  if (!Array.isArray(rawList) || rawList.length === 0) return seeded
  const normalized = rawList
    .filter((row) => row && typeof row === 'object')
    .map((row) => normalizeBareme1(row as Record<string, unknown>))
    .filter((row) => row.grade.trim() !== '')
  return normalized.length > 0 ? normalized : seeded
}

function defaultPeriodes(): PeriodeItem[] {
  const year = new Date().getFullYear()
  return [
    {
      id: 'per-1',
      code: `PER-${year}`,
      libelle: `Exercice ${year}`,
      dateDebut: `${year}-01-01`,
      dateFin: `${year}-12-31`,
      description: 'Période annuelle',
      statut: 'actif',
      createdAt: now(),
    },
  ]
}

function defaultMonnaies(): MonnaieItem[] {
  return [
    {
      id: 'mon-1',
      code: 'CDF',
      libelle: 'Franc congolais',
      symbole: 'FC',
      description: 'Monnaie nationale',
      statut: 'actif',
      createdAt: now(),
    },
    {
      id: 'mon-2',
      code: 'USD',
      libelle: 'Dollar américain',
      symbole: '$',
      description: '',
      statut: 'actif',
      createdAt: now(),
    },
  ]
}

function isTauxMonnaieShape(row: unknown): row is TauxMonnaieItem {
  if (!row || typeof row !== 'object') return false
  const r = row as Record<string, unknown>
  return typeof r.id === 'string' && typeof r.dateTaux === 'string'
}

function normalizeTauxMonnaie(raw: Record<string, unknown>): TauxMonnaieItem {
  return {
    id: String(raw.id ?? createId()),
    dateTaux: String(raw.dateTaux ?? raw.dteTaux ?? raw.DTETAUX ?? ''),
    monnaieUsd: String(raw.monnaieUsd ?? raw.monnaieUSD ?? '1'),
    montantCdf: String(raw.montantCdf ?? raw.montantCDF ?? ''),
    montantEuro: String(raw.montantEuro ?? raw.montantEURO ?? ''),
    observation: String(raw.observation ?? ''),
    createdAt: String(raw.createdAt ?? now()),
  }
}

/**
 * Corrige un « En cours » obsolète (ex. 1687.40 / 2022) et n’en garde qu’un seul
 * (le plus récent) pour le calcul de paie.
 */
function normalizeTauxMonnaiesList(items: TauxMonnaieItem[]): TauxMonnaieItem[] {
  let next = items.map((row) => ({ ...row }))

  const current = findTauxMonnaieEnCours(next)
  if (current) {
    const cdf = parseMontantTaux(current.montantCdf)
    const isLegacySeed =
      current.id === 'txm-1' ||
      (Math.abs(cdf - 1687.4) < 0.001 && current.dateTaux === '2022-08-30')

    if (isLegacySeed) {
      const better = [...next]
        .filter(
          (t) =>
            t.id !== current.id &&
            parseMontantTaux(t.montantCdf) > 1,
        )
        .sort((a, b) =>
          (b.dateTaux || '').localeCompare(a.dateTaux || '', 'fr'),
        )[0]

      if (better) {
        next = next.map((row) => {
          if (row.id === better.id) {
            return { ...row, observation: TAUX_EN_COURS_LABEL }
          }
          if (row.id === current.id) {
            return { ...row, observation: '' }
          }
          return row
        })
      }
    }
  }

  const enCours = next.filter(isTauxMonnaieEnCours)
  if (enCours.length > 1) {
    const keeper = [...enCours].sort((a, b) =>
      (b.dateTaux || '').localeCompare(a.dateTaux || '', 'fr'),
    )[0]
    next = next.map((row) =>
      isTauxMonnaieEnCours(row) && row.id !== keeper.id
        ? { ...row, observation: '' }
        : row,
    )
  }

  return next
}

function defaultTauxMonnaies(): TauxMonnaieItem[] {
  return [
    {
      id: 'txm-1',
      dateTaux: '2022-08-30',
      monnaieUsd: '1',
      montantCdf: '1687.40',
      montantEuro: '0.00',
      observation: '',
      createdAt: now(),
    },
    {
      id: 'txm-2',
      dateTaux: '2022-09-28',
      monnaieUsd: '1',
      montantCdf: '2000.00',
      montantEuro: '0.00',
      observation: '',
      createdAt: now(),
    },
    {
      id: 'txm-3',
      dateTaux: '2024-07-15',
      monnaieUsd: '1',
      montantCdf: '2518.30',
      montantEuro: '0.00',
      observation: '',
      createdAt: now(),
    },
    {
      id: 'txm-4',
      dateTaux: '2024-08-14',
      monnaieUsd: '1',
      montantCdf: '2800.00',
      montantEuro: '0.00',
      observation: 'En cours',
      createdAt: now(),
    },
    {
      id: 'txm-5',
      dateTaux: '2025-09-08',
      monnaieUsd: '1',
      montantCdf: '1.00',
      montantEuro: '1.00',
      observation: '',
      createdAt: now(),
    },
  ]
}

function normalizeConge(raw: Record<string, unknown>): CongeItem {
  const stamp = now()
  return {
    id: String(raw.id ?? createId()),
    mois: String(raw.mois ?? ''),
    datePaie: String(raw.datePaie ?? raw.date_paie ?? raw.dtePaie ?? ''),
    matricule: String(raw.matricule ?? ''),
    nom: String(raw.nom ?? ''),
    postnom: String(raw.postnom ?? ''),
    prenom: String(raw.prenom ?? ''),
    numeroCnss: String(
      raw.numeroCnss ?? raw.numero_cnss ?? raw.nCnss ?? '',
    ),
    dateEngagement: String(
      raw.dateEngagement ?? raw.date_engagement ?? '',
    ),
    grade: String(raw.grade ?? ''),
    fonction: String(raw.fonction ?? ''),
    base: String(raw.base ?? ''),
    logement: String(raw.logement ?? ''),
    jourConge: String(
      raw.jourConge ?? raw.jour_conge ?? raw.joursConge ?? '',
    ),
    totalBrut: String(raw.totalBrut ?? raw.total_brut ?? ''),
    retenueCnss: String(raw.retenueCnss ?? raw.retenue_cnss ?? ''),
    retenueIpr: String(raw.retenueIpr ?? raw.retenue_ipr ?? ''),
    taux: String(raw.taux ?? ''),
    netAPayer: String(raw.netAPayer ?? raw.net_a_payer ?? ''),
    organisation: String(raw.organisation ?? ''),
    annee: String(raw.annee ?? ''),
    siteTravail: String(
      raw.siteTravail ?? raw.site_travail ?? raw.siteDeTravail ?? '',
    ),
    direction: String(raw.direction ?? ''),
    createdAt: String(raw.createdAt ?? stamp),
    updatedAt: String(raw.updatedAt ?? raw.createdAt ?? stamp),
  }
}

function isCongeShape(row: unknown): row is CongeItem {
  if (!row || typeof row !== 'object') return false
  const r = row as Record<string, unknown>
  return typeof r.matricule === 'string' && typeof r.mois === 'string'
}

function loadCongesFromParsed(
  parsed: Partial<ParametresStore>,
): CongeItem[] {
  const rawList = (parsed as { conges?: unknown[] }).conges
  if (!Array.isArray(rawList) || rawList.length === 0) return []
  return rawList
    .filter(isCongeShape)
    .map((row) => normalizeConge(row as unknown as Record<string, unknown>))
}

export function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

export function seedParametresStore(): ParametresStore {
  return {
    config: { dbAdminPassword: DEFAULT_DB_PASSWORD },
    entreprises: [defaultEntreprise()],
    utilisateurs: defaultUsers(),
    categoriesUtilisateurs: defaultCategories(),
    grades: defaultGrades(),
    fonctions: defaultFonctions(),
    baremes1: defaultBaremes1(),
    baremes2: defaultBaremes2(),
    conges: [],
    niveauxEtudes: defaultNiveauxEtudes(),
    sitesAffectation: defaultSitesTravail(),
    periodes: defaultPeriodes(),
    monnaies: defaultMonnaies(),
    tauxMonnaies: defaultTauxMonnaies(),
    directions: refFromList('dir', DIRECTIONS_PERSONNEL),
    statutsPersonnel: refFromList('stp', STATUTS_PERSONNEL_REF),
    comptesComptables: refFromList('ccp', COMPTES_COMPTABLES_REF),
    typesContrats: defaultTypesContrats(),
    primes: defaultPrimes(),
  }
}

function migrateUser(raw: Record<string, unknown>): AppUser {
  return {
    id: String(raw.id ?? createId()),
    nom: String(raw.nom ?? ''),
    prenom: String(raw.prenom ?? ''),
    email: String(raw.email ?? ''),
    role: (raw.role as UserRole) || 'RH',
    categorieUtilisateurId: String(raw.categorieUtilisateurId ?? ''),
    entrepriseId: String(raw.entrepriseId ?? ''),
    telephone: String(raw.telephone ?? ''),
    statut: raw.statut === 'inactif' ? 'inactif' : 'actif',
    password: String(raw.password ?? ''),
    createdAt: String(raw.createdAt ?? now()),
  }
}

export function loadParametresStore(): ParametresStore {
  try {
    const raw =
      localStorage.getItem(STORAGE_KEY) ?? localStorage.getItem(LEGACY_KEY)
    if (!raw) {
      const seeded = seedParametresStore()
      saveParametresStore(seeded)
      return seeded
    }
    const parsed = JSON.parse(raw) as Partial<ParametresStore>
    const seeded = seedParametresStore()
    const store: ParametresStore = {
      config: {
        dbAdminPassword:
          parsed.config?.dbAdminPassword?.trim() || DEFAULT_DB_PASSWORD,
      },
      entreprises:
        parsed.entreprises?.length
          ? parsed.entreprises.map((e) =>
              normalizeEntreprise(e as unknown as Record<string, unknown>),
            )
          : seeded.entreprises,
      utilisateurs: (parsed.utilisateurs ?? []).map((u) =>
        migrateUser(u as unknown as Record<string, unknown>),
      ),
      categoriesUtilisateurs:
        parsed.categoriesUtilisateurs?.length
          ? parsed.categoriesUtilisateurs
          : seeded.categoriesUtilisateurs,
      grades: seeded.grades,
      fonctions: seeded.fonctions,
      baremes1: loadBaremes1FromParsed(parsed, seeded.baremes1),
      baremes2: loadBaremes2FromParsed(parsed, seeded.baremes2),
      conges: loadCongesFromParsed(parsed),
      niveauxEtudes: seeded.niveauxEtudes,
      sitesAffectation: seeded.sitesAffectation,
      periodes: parsed.periodes?.length ? parsed.periodes : seeded.periodes,
      monnaies: parsed.monnaies?.length ? parsed.monnaies : seeded.monnaies,
      tauxMonnaies: normalizeTauxMonnaiesList(
        parsed.tauxMonnaies?.length &&
          parsed.tauxMonnaies.every(isTauxMonnaieShape)
          ? parsed.tauxMonnaies.map((row) =>
              normalizeTauxMonnaie(row as unknown as Record<string, unknown>),
            )
          : seeded.tauxMonnaies,
      ),
      directions: parsed.directions?.length ? parsed.directions : seeded.directions,
      statutsPersonnel: ensureStatutsPersonnel(
        parsed.statutsPersonnel?.length
          ? parsed.statutsPersonnel
          : seeded.statutsPersonnel,
      ),
      comptesComptables: parsed.comptesComptables?.length
        ? parsed.comptesComptables
        : seeded.comptesComptables,
      typesContrats: seeded.typesContrats,
      primes: parsed.primes?.length ? parsed.primes : seeded.primes,
    }
    if (store.utilisateurs.length === 0) {
      store.utilisateurs = seeded.utilisateurs
    }

    // Ne réécrire le stockage que si une migration a réellement changé les données
    // (évite d’écraser Barème 1 / 2 à chaque lecture).
    const needsPersist =
      !parsed.config?.dbAdminPassword?.trim() ||
      !parsed.statutsPersonnel?.length ||
      !parsed.primes?.length ||
      store.utilisateurs.length === 0 ||
      JSON.stringify(parsed.baremes1 ?? []) !== JSON.stringify(store.baremes1) ||
      JSON.stringify(parsed.baremes2 ?? []) !== JSON.stringify(store.baremes2)

    if (needsPersist) {
      // Persistance silencieuse des migrations + sync cloud
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
      schedulePushStore('parametres', store)
    }

    return store
  } catch {
    return seedParametresStore()
  }
}

/** Émis après chaque écriture pour resynchroniser l’UI Paramètres. */
export const PARAMETRES_STORE_CHANGED = 'grh:parametres-changed'

export function saveParametresStore(store: ParametresStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
  schedulePushStore('parametres', store)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(PARAMETRES_STORE_CHANGED))
  }
}

export function verifyDbAdminPassword(password: string): boolean {
  const store = loadParametresStore()
  return password === store.config.dbAdminPassword
}

export function findUserForLogin(email: string, password: string): AppUser | null {
  const store = loadParametresStore()
  const normalized = email.trim().toLowerCase()
  return (
    store.utilisateurs.find(
      (u) =>
        u.email.trim().toLowerCase() === normalized &&
        u.password === password &&
        u.statut === 'actif',
    ) ?? null
  )
}

export function findEntrepriseById(id: string): Entreprise | null {
  if (!id) return null
  return loadParametresStore().entreprises.find((e) => e.id === id) ?? null
}

export { DEFAULT_DB_PASSWORD }
