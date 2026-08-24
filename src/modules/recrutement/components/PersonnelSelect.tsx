import { useMemo } from 'react'
import { useRecrutement } from '../RecrutementContext'
import {
  fullNamePersonnel,
  isPersonnelEligiblePaie,
  refLibelle,
} from '../personnelConstants'
import { loadParametresStore } from '../../parametres/storage'

type Props = {
  value: string
  onChange: (id: string) => void
  required?: boolean
}

export function PersonnelSelect({ value, onChange, required }: Props) {
  const { store } = useRecrutement()
  const refs = useMemo(() => loadParametresStore(), [])
  const list = store.personnel.filter((p) => isPersonnelEligiblePaie(p, refs))

  return (
    <select
      required={required}
      value={value}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">— Sélectionner —</option>
      {list.map((p) => (
        <option key={p.id} value={p.id}>
          {p.matricule} — {fullNamePersonnel(p)} (
          {refLibelle(refs.fonctions, p.fonctionId) || 'Sans fonction'})
        </option>
      ))}
    </select>
  )
}
