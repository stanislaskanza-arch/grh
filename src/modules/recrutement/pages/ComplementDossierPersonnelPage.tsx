import { ModuleShell } from '../../../components/ModuleShell'

export function ComplementDossierPersonnelPage() {
  return (
    <ModuleShell
      eyebrow="Recrutement & Carrière"
      title="Complément Dossier du Personnel"
      description="Complétez et enrichissez les dossiers du personnel avec les pièces et informations complémentaires."
      upcoming={[
        'Ajout de pièces au dossier',
        'Suivi de la complétude du dossier',
        'Consultation et validation des documents',
      ]}
      showBackLink={false}
    />
  )
}
