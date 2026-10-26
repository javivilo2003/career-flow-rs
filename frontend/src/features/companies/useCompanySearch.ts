import { useEffect, useMemo, useRef, useState } from 'react'

import type { GetCompaniesParams } from '../../apis/companies'
import type { Company, Page } from '../../types/api'

export type SearchCompanies = (params: GetCompaniesParams) => Promise<Page<Company>>

function requestParams(query: string, page: number): GetCompaniesParams {
  return {
    companyName: query.trim() || undefined,
    page,
    size: 20,
    sort: 'companyName',
    direction: 'ASC',
  }
}

function useFirstPage(query: string, searchCompanies?: SearchCompanies) {
  const [companies, setCompanies] = useState<Company[]>([])
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [revision, setRevision] = useState(0)
  const request = useRef(0)

  useEffect(() => {
    if (!searchCompanies) {
      return
    }
    const requestId = ++request.current
    const timer = window.setTimeout(() => {
      setLoading(true)
      setError('')
      void searchCompanies(requestParams(query, 0))
        .then((result) => {
          if (request.current !== requestId) {
            return
          }
          setCompanies(result.content)
          setPage(result.number)
          setHasMore(!result.last)
        })
        .catch(() => {
          if (request.current === requestId) {
            setError('Company search failed. Check your connection and try again.')
          }
        })
        .finally(() => {
          if (request.current === requestId) {
            setLoading(false)
          }
        })
    }, 250)
    return () => window.clearTimeout(timer)
  }, [query, revision, searchCompanies])

  return {
    companies,
    error,
    hasMore,
    loading,
    page,
    request,
    setCompanies,
    setError,
    setHasMore,
    setPage,
    retry: () => setRevision((value) => value + 1),
  }
}

export default function useCompanySearch({
  query,
  initialCompanies,
  searchCompanies,
}: {
  query: string
  initialCompanies: readonly Company[]
  searchCompanies?: SearchCompanies
}) {
  const first = useFirstPage(query, searchCompanies)
  const [loadingMore, setLoadingMore] = useState(false)
  const companies = useMemo(() => {
    const source = searchCompanies ? first.companies : initialCompanies
    const normalized = query.trim().toLocaleLowerCase()
    return searchCompanies || !normalized
      ? source
      : source.filter((company) => company.companyName.toLocaleLowerCase().includes(normalized))
  }, [first.companies, initialCompanies, query, searchCompanies])

  async function loadMore() {
    if (!searchCompanies || loadingMore || !first.hasMore) {
      return
    }
    const requestId = first.request.current
    setLoadingMore(true)
    first.setError('')
    try {
      const result = await searchCompanies(requestParams(query, first.page + 1))
      if (first.request.current !== requestId) {
        return
      }
      first.setCompanies((current) => {
        const ids = new Set(current.map((company) => company.id))
        return [...current, ...result.content.filter((company) => !ids.has(company.id))]
      })
      first.setPage(result.number)
      first.setHasMore(!result.last)
    } catch {
      if (first.request.current === requestId) {
        first.setError('Could not load more companies. Try again.')
      }
    } finally {
      if (first.request.current === requestId) {
        setLoadingMore(false)
      }
    }
  }

  return {
    companies,
    error: first.error,
    hasMore: first.hasMore,
    loading: first.loading,
    loadingMore,
    loadMore,
    retry: first.retry,
  }
}
