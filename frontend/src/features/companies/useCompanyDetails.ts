import { useEffect, useState } from 'react'

import { type CompanyDetails, loadCompanyDetails } from './loadCompanyDetails'

type CompanyDetailsState = {
  details: CompanyDetails | null
  isLoading: boolean
  error: string | null
}

export default function useCompanyDetails(companyId: string | undefined): CompanyDetailsState {
  const [details, setDetails] = useState<CompanyDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function load() {
      if (!companyId) {
        setError('Company not found.')
        setIsLoading(false)
        return
      }

      try {
        const data = await loadCompanyDetails(companyId)
        if (!isCancelled) {
          setDetails(data)
          setError(null)
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(requestError instanceof Error ? requestError.message : 'Could not load company.')
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      isCancelled = true
    }
  }, [companyId])

  return { details, isLoading, error }
}
