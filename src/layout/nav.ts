import type { LucideIcon } from 'lucide-react'
import {
  BriefcaseBusiness,
  Building2,
  CalendarCheck2,
  CalendarDays,
  ClipboardList,
  Clock3,
  FileBarChart2,
  FilePlus2,
  FileSpreadsheet,
  FileText,
  GraduationCap,
  LayoutDashboard,
  Settings2,
  UserRoundCog,
  UserX,
  Wallet,
  WalletCards,
} from 'lucide-react'

export type NavChild = {
  to: string
  label: string
  icon?: LucideIcon
  iconColor?: string
}

export type NavItem = {
  to: string
  label: string
  description: string
  end?: boolean
  icon: LucideIcon
  iconColor: string
  children?: NavChild[]
}

export const NAV_ITEMS: NavItem[] = [
  {
    to: '/',
    label: 'Tableau de bord',
    description: 'Vue d’ensemble',
    end: true,
    icon: LayoutDashboard,
    iconColor: '#F4C95F',
  },
  {
    to: '/administration-rh',
    label: 'Administration RH',
    description: 'Organisation et procédures RH',
    icon: Building2,
    iconColor: '#8FB8A8',
  },
  {
    to: '/recrutement',
    label: 'Recrutement & Carrière',
    description: 'Personnel et parcours',
    icon: BriefcaseBusiness,
    iconColor: '#E8915B',
    children: [
      {
        to: '/recrutement/captures',
        label: "Capture Info du Conseil d'Administration et du Personnel",
        icon: ClipboardList,
        iconColor: '#7DD3C0',
      },
      {
        to: '/recrutement/complement-dossier',
        label: 'Complément Dossier du Personnel',
        icon: FilePlus2,
        iconColor: '#6BB3E0',
      },
      {
        to: '/recrutement/suivi',
        label: 'Suivi du personnel',
        icon: UserRoundCog,
        iconColor: '#F0B27A',
      },
      {
        to: '/recrutement/formation',
        label: 'Formation du personnel',
        icon: GraduationCap,
        iconColor: '#7DD3C0',
      },
    ],
  },
  {
    to: '/presences',
    label: 'Gestion des Présences',
    description: 'Pointages, congés, absences',
    icon: CalendarCheck2,
    iconColor: '#5EC8A2',
    children: [
      {
        to: '/presences/pointage',
        label: 'Pointage quotidien',
        icon: Clock3,
        iconColor: '#5EC8A2',
      },
      {
        to: '/presences/calendrier-conges',
        label: 'Calendrier de congés',
        icon: CalendarDays,
        iconColor: '#7DD3C0',
      },
      {
        to: '/presences/absences-retards',
        label: 'Suivi des absences et retards',
        icon: UserX,
        iconColor: '#F0B27A',
      },
      {
        to: '/presences/rapports',
        label: 'Rapports de présence',
        icon: FileBarChart2,
        iconColor: '#6BB3E0',
      },
    ],
  },
  {
    to: '/paie',
    label: 'Gestion de Paie',
    description: 'Bulletins, salaires, charges',
    icon: Wallet,
    iconColor: '#6BB3E0',
    children: [
      {
        to: '/paie/preparation',
        label: 'Préparation de la paie',
        icon: WalletCards,
        iconColor: '#6BB3E0',
      },
      {
        to: '/paie/feuille-paie',
        label: 'Feuille de Paie',
        icon: FileSpreadsheet,
        iconColor: '#7DD3C0',
      },
      {
        to: '/paie/bulletins',
        label: 'Bulletins de Paie',
        icon: FileText,
        iconColor: '#F0B27A',
      },
      {
        to: '/paie/bulletin-individuel',
        label: 'Bulletin Individuel',
        icon: ClipboardList,
        iconColor: '#5EC8A2',
      },
    ],
  },
  {
    to: '/parametres',
    label: 'Paramètres & Sécurité',
    description: 'Admin BDD, fichiers, référentiels',
    icon: Settings2,
    iconColor: '#E07A7A',
  },
]
