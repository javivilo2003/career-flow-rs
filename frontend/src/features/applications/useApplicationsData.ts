import { useCallback, useEffect, useState } from 'react'

import type { Company, JobApplication, User } from '../../types/api'
import { loadApplicationData, type LoadedApplicationData } from './loadApplicationData'

export type ApplicationsDataState = {
  applications: JobApplication[]
  companies: Company[]
  users: User[]
  companyNames: Map<string, string>
  isLoading: boolean
  error: string | null
  refresh: () => Promise<LoadedApplicationData>
}

export default function useApplicationsData(): ApplicationsDataState {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [companyNames, setCompanyNames] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const applyData = useCallback((data: LoadedApplicationData) => {
    setApplications(data.applications)
    setCompanies(data.companies)
    setUsers(data.users)
    setCompanyNames(data.companyNames)
    setError(null)
  }, [])

  const refresh = useCallback(async () => {
    const data = await loadApplicationData()
    applyData(data)

    return data
  }, [applyData])

  useEffect(() => {
    let isCancelled = false

    async function loadInitialData() {
      try {
        const data = await loadApplicationData()

        if (!isCancelled) {
          applyData(data)
        }
      } catch (requestError) {
        if (!isCancelled) {
          const message =
            requestError instanceof Error ? requestError.message : 'Could not load applications.'

          setError(message)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInitialData()

    return () => {
      isCancelled = true
    }
  }, [applyData])

  return {
    applications,
    companies,
    users,
    companyNames,
    isLoading,
    error,
    refresh,
  }
}
