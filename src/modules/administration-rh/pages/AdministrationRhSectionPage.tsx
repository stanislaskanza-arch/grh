import { ModuleShell } from '../../../components/ModuleShell'

type Props = {
  title: string
  description: string
  upcoming: string[]
}

export function AdministrationRhSectionPage({
  title,
  description,
  upcoming,
}: Props) {
  return (
    <ModuleShell
      title={title}
      description={description}
      upcoming={upcoming}
      showBackLink={false}
    />
  )
}
