import { ModuleShell } from '../../../components/ModuleShell'

export function SuiviAbsencesRetardsPage() {
  return (
    <ModuleShell
      eyebrow="Gestion des Présences"
      title="Suivi des absences et retards"
      description="Suivez les absences, retards et justifications du personnel."
      upcoming={[
        'Liste des absences et retards',
        'Motifs et justifications',
        'Alertes de récurrence',
        'Rapports par période',
      ]}
    />
  )
}
