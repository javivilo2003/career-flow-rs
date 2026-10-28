import { useCallback, useEffect, useRef, useState } from 'react'

import { getCompanies } from '../../apis/companies'
import type { Company, Page } from '../../types/api'

export default function useCompaniesData(query: string, page: number, size = 12) {
  const [result, setResult] = useState<Page<Company> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const request = useRef(0)

  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    const requestId = ++request.current
    const timer = window.setTimeout(
      () => {
        setIsLoading(true)
        setError(null)
        void getCompanies({ companyName: query, page, size, sort: 'companyName', direction: 'ASC' })
          .then((data) => {
            if (request.current === requestId) {
              setResult(data)
            }
          })
          .catch((reason) => {
            if (request.current === requestId) {
              setError(reason instanceof Error ? reason.message : 'Could not load companies.')
            }
          })
          .finally(() => {
            if (request.current === requestId) {
              setIsLoading(false)
            }
          })
      },
      query ? 250 : 0,
    )
    return () => window.clearTimeout(timer)
  }, [page, query, revision, size])

  return { result, companies: result?.content ?? [], isLoading, error, retry: refresh, refresh }
}
