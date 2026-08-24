import {
  ChevronLeft,
  ChevronRight,
  FileSpreadsheet,
  Printer,
  Users,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { DataTable } from '../../recrutement/components/DataTable'
import {
  isPersonnelActif,
  refLibelleSeul,
} from '../../recrutement/personnelConstants'
import { loadRecrutementStore } from '../../recrutement/storage'
import type { Personnel } from '../../recrutement/types'
import {
  loadParametresStore,
  PARAMETRES_STORE_CHANGED,
} from '../../parametres/storage'
import {
  BulletinPaieB1Modal,
  type BulletinPaieB1Data,
} from '../components/BulletinPaieB1Modal'
import {
  fonctionLibelleOnly,
  gradeCodeOnly,
} from '../calculerPaieMensuelleB1'
import {
  currentMonthValue,
  currentYearValue,
  formatMoisPaie,
  moisClePaie,
  normalizeMoisCle,
  syncDatePaie,
} from '../paieMois'
import { loadPaieStore, PAIE_STORE_CHANGED } from '../storage'
import { findTauxMonnaieEnCours } from '../tauxMonnaieEnCours'
import type { PaieMensuelleB2Item } from '../types'

type BulletinRow = {
  id: string
  mois: string
  datePaie: string
  matricule: string
  nom: string
  postnom: string
  prenom: string
  numeroCnss: string
  dateEngagement: string
  grade: string
  fonction: string
  base: string
  logement: string
  jourConge: string
  totalBrut: string
  retenueCnss: string
  retenueIpr: string
  taux: string
  netAPayer: string
  organisation: string
  annee: string
  siteTravail: string
  direction: string
  source: PaieMensuelleB2Item
  isActif: boolean
}

const MOIS_OPTIONS = [
  { value: '01', label: 'Janvier' },
  { value: '02', label: 'Février' },
  { value: '03', label: 'Mars' },
  { value: '04', label: 'Avril' },
  { value: '05', label: 'Mai' },
  { value: '06', label: 'Juin' },
  { value: '07', label: 'Juillet' },
  { value: '08', label: 'Août' },
  { value: '09', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
]

function todayIsoDate() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatDateFr(value: string) {
  if (!value) return '—'
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return value
  return d.toLocaleDateString('fr-FR')
}

function formatMoney(value: string) {
  const trimmed = value?.trim()
  if (!trimmed) return '—'
  const n = Number(String(trimmed).replace(/\s/g, '').replace(',', '.'))
  if (!Number.isFinite(n)) return trimmed
  return n.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function findPersonnelByMatricule(
  personnel: Personnel[],
  matricule: string,
): Personnel | undefined {
  const key = matricule.trim().toLowerCase()
  if (!key) return undefined
  return personnel.find((p) => p.matricule.trim().toLowerCase() === key)
}

export function BulletinNouveauBaremePage() {
  const [b2Rows, setB2Rows] = useState<PaieMensuelleB2Item[]>(
    () => loadPaieStore().paieMensuelleB2,
  )
  const [personnel, setPersonnel] = useState<Personnel[]>(
    () => loadRecrutementStore().personnel,
  )
  const [refs, setRefs] = useState(() => loadParametresStore())
  const [annee, setAnnee] = useState(currentYearValue)
  const [mois, setMois] = useState(currentMonthValue)
  const [datePaie, setDatePaie] = useState(todayIsoDate)
  const [produit, setProduit] = useState(false)
  const [bulletinData, setBulletinData] = useState<BulletinPaieB1Data | null>(
    null,
  )
  const tableAreaRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let refreshing = false
    function refresh() {
      if (refreshing) return
      refreshing = true
      try {
        setB2Rows(loadPaieStore().paieMensuelleB2)
        setPersonnel(loadRecrutementStore().personnel)
        setRefs(loadParametresStore())
      } finally {
        queueMicrotask(() => {
          refreshing = false
        })
      }
    }
    window.addEventListener(PAIE_STORE_CHANGED, refresh)
    window.addEventListener(PARAMETRES_STORE_CHANGED, refresh)
    window.addEventListener('storage', refresh)
    return () => {
      window.removeEventListener(PAIE_STORE_CHANGED, refresh)
      window.removeEventListener(PARAMETRES_STORE_CHANGED, refresh)
      window.removeEventListener('storage', refresh)
    }
  }, [])

  const entreprise = useMemo(
    () =>
      refs.entreprises.find((e) => e.statut === 'active') ??
      refs.entreprises[0] ??
      null,
    [refs.entreprises],
  )

  const moisCle = useMemo(() => moisClePaie(annee, mois), [annee, mois])
  const moisLabel = formatMoisPaie(moisCle)
  const organisation =
    entreprise?.raisonSociale || entreprise?.sigle || 'ARMP'

  const tauxEnCours = useMemo(
    () => findTauxMonnaieEnCours(refs.tauxMonnaies),
    [refs.tauxMonnaies],
  )

  const bulletinsMois = useMemo(() => {
    return b2Rows.filter(
      (row) => normalizeMoisCle(row.mois, row.datePaie) === moisCle,
    )
  }, [b2Rows, moisCle])

  const bulletins = useMemo(() => {
    if (!produit) return [] as BulletinRow[]

    return bulletinsMois.map((row) => {
      const agent = findPersonnelByMatricule(personnel, row.matricule)
      const isActif = agent ? isPersonnelActif(agent, refs) : false
      const grade = gradeCodeOnly(row.grade)
      const anneeLigne =
        row.datePaie?.slice(0, 4) ||
        normalizeMoisCle(row.mois, row.datePaie).slice(0, 4) ||
        annee

      return {
        id: row.id,
        mois: normalizeMoisCle(row.mois, row.datePaie) || row.mois,
        datePaie: row.datePaie,
        matricule: row.matricule,
        nom: row.nom,
        postnom: row.postnom,
        prenom: row.prenom,
        numeroCnss:
          agent?.numeroCnss || row.immatriculationCnss || '',
        dateEngagement: row.dateEngagement || agent?.dateEngagement || '',
        grade,
        fonction: fonctionLibelleOnly(row.fonction),
        base: row.base,
        logement: row.logement,
        jourConge: '',
        totalBrut: row.totalBrut,
        retenueCnss: row.retenueCnss,
        retenueIpr: row.retenueIpr,
        taux: tauxEnCours ? String(tauxEnCours.montantCdf || '') : '',
        netAPayer: row.netAPayer,
        organisation,
        annee: anneeLigne,
        siteTravail: agent
          ? refLibelleSeul(refs.sitesAffectation, agent.siteTravailId)
          : '',
        direction: agent
          ? refLibelleSeul(refs.directions, agent.directionId)
          : '',
        source: row,
        isActif,
      }
    })
  }, [
    annee,
    bulletinsMois,
    organisation,
    personnel,
    produit,
    refs,
    tauxEnCours,
  ])

  const stats = useMemo(() => {
    const actifs = bulletins.filter((b) => b.isActif).length
    return {
      bulletinsActifs: actifs,
      nombreBulletins: bulletins.length,
      personnelActifTotal: personnel.filter((p) =>
        isPersonnelActif(p, refs),
      ).length,
    }
  }, [bulletins, personnel, refs])

  function scrollTableHorizontal(direction: 'prev' | 'next') {
    const wrap = tableAreaRef.current?.querySelector(
      '.table-wrap',
    ) as HTMLElement | null
    if (!wrap) return
    const step = Math.max(240, Math.floor(wrap.clientWidth * 0.65))
    wrap.scrollBy({
      left: direction === 'prev' ? -step : step,
      behavior: 'smooth',
    })
  }

  function handleProduire() {
    const date = syncDatePaie(datePaie, annee, mois)
    setDatePaie(date)
    setProduit(true)
    if (bulletinsMois.length === 0) {
      window.alert(
        `Aucun enregistrement PaieMensuelleB2 pour ${moisLabel}.\n` +
          `Calculez d’abord la paie mensuelle Barème 2 dans Préparation de la paie.`,
      )
    }
  }

  function handlePrintListe() {
    window.print()
  }

  return (
    <div className="bulletin-ancien-bareme-page">
      <header className="page-header bulletin-ancien-header no-print">
        <div>
          <p className="eyebrow">Bulletins mensuels</p>
          <h2>Bulletin avec nouveau barème</h2>
          <p className="page-lead">
            Lecture du fichier PaieMensuelleB2 (Barème 2) et production des
            bulletins pour le mois sélectionné.
          </p>
        </div>
      </header>

      <section
        className="admin-rh-stats bulletin-ancien-stats no-print"
        aria-label="Statistiques des bulletins"
      >
        <div className="admin-rh-stat is-active">
          <span className="admin-rh-stat-icon" aria-hidden>
            <Users size={20} />
          </span>
          <span className="admin-rh-stat-body">
            <span className="admin-rh-stat-label">
              Bulletins personnel actif
            </span>
            <strong className="admin-rh-stat-value">
              {produit ? stats.bulletinsActifs : '—'}
            </strong>
          </span>
        </div>
        <div className="admin-rh-stat">
          <span className="admin-rh-stat-icon" aria-hidden>
            <FileSpreadsheet size={20} />
          </span>
          <span className="admin-rh-stat-body">
            <span className="admin-rh-stat-label">Nombre de bulletins</span>
            <strong className="admin-rh-stat-value">
              {produit ? stats.nombreBulletins : '—'}
            </strong>
          </span>
        </div>
      </section>

      <section
        className="admin-list-panel bulletin-ancien-panel"
        aria-labelledby="bulletin-nouveau-list-title"
      >
        <div className="admin-list-head bulletin-ancien-list-head no-print">
          <div className="admin-list-title">
            <span className="admin-list-icon" aria-hidden>
              <FileSpreadsheet size={18} />
            </span>
            <div>
              <h2 id="bulletin-nouveau-list-title">
                Liste — Bulletins (nouveau barème)
              </h2>
              <p>
                {produit
                  ? `${bulletins.length} bulletin${bulletins.length > 1 ? 's' : ''} · ${moisLabel}`
                  : `Sélectionnez le mois puis produisez les bulletins · ${moisLabel}`}
              </p>
            </div>
          </div>

          <div className="bulletin-ancien-filters">
            <label className="paie-mensuelle-b1-field">
              <span>Mois</span>
              <select
                value={mois}
                onChange={(e) => {
                  setMois(e.target.value)
                  setProduit(false)
                }}
                aria-label="Mois"
              >
                {MOIS_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="paie-mensuelle-b1-field">
              <span>Date</span>
              <input
                type="date"
                value={datePaie}
                onChange={(e) => {
                  const next = e.target.value
                  setDatePaie(next)
                  setProduit(false)
                  if (next.length >= 7) {
                    setAnnee(next.slice(0, 4))
                    setMois(next.slice(5, 7))
                  }
                }}
                aria-label="Date"
              />
            </label>

            <button
              type="button"
              className="btn-primary"
              onClick={handleProduire}
            >
              Produire les bulletins
            </button>

            <button
              type="button"
              className="btn-print"
              onClick={handlePrintListe}
              disabled={!produit || bulletins.length === 0}
            >
              <Printer size={16} aria-hidden />
              Imprimer
            </button>

            <div className="personnel-list-scroll-btns">
              <button
                type="button"
                className="btn-ghost"
                onClick={() => scrollTableHorizontal('prev')}
                aria-label="Défiler le tableau vers la gauche"
              >
                <ChevronLeft size={16} />
                Précédent
              </button>
              <button
                type="button"
                className="btn-ghost"
                onClick={() => scrollTableHorizontal('next')}
                aria-label="Défiler le tableau vers la droite"
              >
                Suivant
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>

        <header className="bulletin-ancien-print-header print-only">
          <h1>Bulletins de paie — Nouveau barème</h1>
          <p>{moisLabel}</p>
        </header>

        <div className="bulletin-ancien-table-area" ref={tableAreaRef}>
          <DataTable
            rows={bulletins}
            emptyMessage={
              produit
                ? `Aucun bulletin PaieMensuelleB2 pour ${moisLabel}.`
                : 'Cliquez sur « Produire les bulletins » pour lire PaieMensuelleB2.'
            }
            columns={[
              {
                key: 'actions',
                header: 'Actions',
                className: 'col-actions bulletin-ancien-actions-col',
                render: (r) => (
                  <button
                    type="button"
                    className="btn-icon-print"
                    title="Imprimer le bulletin de paie"
                    aria-label="Imprimer le bulletin de paie de l'agent"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setBulletinData({
                        ligne: {
                          mois: r.source.mois,
                          datePaie: r.source.datePaie,
                          matricule: r.source.matricule,
                          nom: r.source.nom,
                          postnom: r.source.postnom,
                          prenom: r.source.prenom,
                          dateEngagement: r.dateEngagement || r.source.dateEngagement,
                          grade: r.grade || r.source.grade,
                          fonction: r.fonction || r.source.fonction,
                          base: r.source.base,
                          logement: r.source.logement,
                          transport: r.source.transport,
                          totalBrut: r.source.totalBrut,
                          retenueCnss: r.source.retenueCnss,
                          retenueIpr: r.source.retenueIpr,
                          netAPayer: r.source.netAPayer,
                        },
                        numeroCnss: r.numeroCnss,
                        siteTravail: r.siteTravail,
                        direction: r.direction,
                      })
                    }}
                  >
                    <Printer size={16} aria-hidden />
                  </button>
                ),
              },
              {
                key: 'mois',
                header: 'MOIS',
                render: (r) => r.mois || '—',
              },
              {
                key: 'datePaie',
                header: 'DTE PAIE',
                render: (r) => formatDateFr(r.datePaie),
              },
              {
                key: 'matricule',
                header: 'MATRICULE',
                render: (r) => r.matricule || '—',
              },
              {
                key: 'nom',
                header: 'NOM',
                render: (r) => r.nom || '—',
              },
              {
                key: 'postnom',
                header: 'POSTNOM',
                render: (r) => r.postnom || '—',
              },
              {
                key: 'prenom',
                header: 'PRENOM',
                render: (r) => r.prenom || '—',
              },
              {
                key: 'numeroCnss',
                header: 'N° CNSS',
                render: (r) => r.numeroCnss || '—',
              },
              {
                key: 'dateEngagement',
                header: 'DATE ENGAGEMENT',
                render: (r) => formatDateFr(r.dateEngagement),
              },
              {
                key: 'grade',
                header: 'GRADE',
                render: (r) => r.grade || '—',
              },
              {
                key: 'fonction',
                header: 'FONCTION',
                render: (r) => r.fonction || '—',
              },
              {
                key: 'base',
                header: 'BASE',
                className: 'col-money',
                render: (r) => formatMoney(r.base),
              },
              {
                key: 'logement',
                header: 'LOGEMENT',
                className: 'col-money',
                render: (r) => formatMoney(r.logement),
              },
              {
                key: 'jourConge',
                header: 'JOUR CONGE',
                className: 'col-money',
                render: (r) => r.jourConge || '—',
              },
              {
                key: 'totalBrut',
                header: 'TOTAL BRUT',
                className: 'col-money',
                render: (r) => formatMoney(r.totalBrut),
              },
              {
                key: 'retenueCnss',
                header: 'RETENUE CNSS',
                className: 'col-money',
                render: (r) => formatMoney(r.retenueCnss),
              },
              {
                key: 'retenueIpr',
                header: 'RETENUE IPR',
                className: 'col-money',
                render: (r) => formatMoney(r.retenueIpr),
              },
              {
                key: 'taux',
                header: 'TAUX',
                className: 'col-money',
                render: (r) => r.taux || '—',
              },
              {
                key: 'netAPayer',
                header: 'NET A PAYER',
                className: 'col-money',
                render: (r) => formatMoney(r.netAPayer),
              },
              {
                key: 'organisation',
                header: 'ORGANISATION',
                render: (r) => r.organisation || '—',
              },
              {
                key: 'annee',
                header: 'ANNEE',
                render: (r) => r.annee || '—',
              },
              {
                key: 'siteTravail',
                header: 'SITE DE TRAVAIL',
                render: (r) => r.siteTravail || '—',
              },
              {
                key: 'direction',
                header: 'DIRECTION',
                render: (r) => r.direction || '—',
              },
            ]}
          />
        </div>
      </section>

      <BulletinPaieB1Modal
        data={bulletinData}
        entreprise={entreprise}
        onClose={() => setBulletinData(null)}
      />
    </div>
  )
}
