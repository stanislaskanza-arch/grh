import { ModuleShell } from '../../../components/ModuleShell'

type Props = {
  title: string
  description: string
  upcoming: string[]
  showBackLink?: boolean
}

export function PaieFeaturePage({
  title,
  description,
  upcoming,
  showBackLink = true,
}: Props) {
  return (
    <ModuleShell
      eyebrow="Gestion de Paie"
      title={title}
      description={description}
      upcoming={upcoming}
      showBackLink={showBackLink}
    />
  )
}
