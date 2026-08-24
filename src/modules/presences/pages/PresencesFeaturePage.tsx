import { ModuleShell } from '../../../components/ModuleShell'

type Props = {
  title: string
  description: string
  upcoming: string[]
}

export function PresencesFeaturePage({ title, description, upcoming }: Props) {
  return (
    <ModuleShell
      eyebrow="Gestion des Présences"
      title={title}
      description={description}
      upcoming={upcoming}
    />
  )
}
