import { ModuleShell } from '../../../components/ModuleShell'

export function PointageQuotidienPage() {
  return (
    <ModuleShell
      eyebrow="Gestion des Présences"
      title="Pointage quotidien"
      description="Enregistrez les heures d’entrée et de sortie du personnel au quotidien."
      upcoming={[
        'Saisie entrée / sortie par agent',
        'Import des pointages',
        'Contrôle des heures travaillées',
        'Export journalier',
      ]}
    />
  )
}
