import { useCallback, useEffect, useState } from 'react'

import { getCompanies } from '../../apis/companies'
import { loadAllPages } from '../../apis/pagination'
import type { Company } from '../../types/api'

export type CompaniesDataState = {
  companies: Company[]
  isLoading: boolean
  error: string | null
  refresh: () => Promise<void>
}

export default function useCompaniesData(): CompaniesDataState {
  const [companies, setCompanies] = useState<Company[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    const loadedCompanies = await loadAllPages((page) => getCompanies({ page, size: 100 }))
    setCompanies(loadedCompanies)
    setError(null)
  }, [])

  useEffect(() => {
    let isCancelled = false

    async function loadCompanies() {
      try {
        const loadedCompanies = await loadAllPages((page) => getCompanies({ page, size: 100 }))
        if (!isCancelled) {
          setCompanies(loadedCompanies)
          setError(null)
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError instanceof Error ? requestError.message : 'Could not load companies.',
          )
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadCompanies()
    return () => {
      isCancelled = true
    }
  }, [])

  return { companies, isLoading, error, refresh }
}
