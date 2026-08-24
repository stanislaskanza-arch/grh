import { useMemo } from 'react'
import { useParams } from 'react-router-dom'
import { loadParametresStore } from '../../parametres/storage'
import { PaieFeaturePage } from './PaieFeaturePage'

function normalizeCode(value: string) {
  return decodeURIComponent(value || '')
    .trim()
    .toLowerCase()
}

export function BulletinPrimeTypePage() {
  const { codePrime = '' } = useParams()
  const prime = useMemo(() => {
    const wanted = normalizeCode(codePrime)
    const primes = loadParametresStore().primes ?? []
    return (
      primes.find((p) => normalizeCode(p.code) === wanted) ??
      primes.find(
        (p) =>
          normalizeCode(p.libelle).replace(/[^a-z0-9]+/g, '-') === wanted,
      ) ??
      null
    )
  }, [codePrime])

  const title = prime?.libelle || codePrime.toUpperCase() || 'Bulletin prime'

  return (
    <PaieFeaturePage
      title={title}
      description={
        prime
          ? `Bulletins de paie pour la prime « ${prime.libelle} » (code ${prime.code}).`
          : 'Générez et consultez les bulletins de cette prime.'
      }
      upcoming={[
        'Génération des bulletins de prime',
        'Consultation par période',
        'Impression des bulletins',
      ]}
      showBackLink={false}
    />
  )
}
