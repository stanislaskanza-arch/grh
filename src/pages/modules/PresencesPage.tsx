import { ModuleShell } from '../../components/ModuleShell'

export function PresencesPage() {
  return (
    <ModuleShell
      eyebrow="Module 2"
      title="Gestion des Présences"
      description="Suivez les pointages, absences et demandes de congés pour une vision fiable de l’effectif."
      upcoming={[
        'Pointage quotidien (entrée / sortie)',
        'Demandes de congés et validation',
        'Suivi des absences et retards',
        'Rapports de présence par période',
      ]}
    />
  )
}
