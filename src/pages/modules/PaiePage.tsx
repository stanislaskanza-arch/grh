import { ModuleShell } from '../../components/ModuleShell'

export function PaiePage() {
  return (
    <ModuleShell
      eyebrow="Module 3"
      title="Gestion de Paie"
      description="Préparez et suivez les éléments de rémunération, bulletins et historiques de paie."
      upcoming={[
        'Fiches de paie et éléments variables',
        'Calcul des salaires et retenues',
        'Historique des bulletins',
        'Exports et contrôles avant paiement',
      ]}
    />
  )
}
