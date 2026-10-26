import { useCallback, useEffect, useState } from 'react'

import type { Company, JobApplication } from '../../types/api'
import { loadApplicationData, type LoadedApplicationData } from './loadApplicationData'

export type ApplicationsDataState = {
  applications: JobApplication[]
  companies: Company[]
  companyNames: Map<string, string>
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  refreshError: string | null
  refresh: () => Promise<LoadedApplicationData>
  synchronizeApplication: (application: JobApplication) => void
  synchronizeCompany: (company: Company) => void
}

type ApplyApplicationData = (data: LoadedApplicationData) => void

function useInitialApplicationData(applyData: ApplyApplicationData) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadInitialData() {
      try {
        const data = await loadApplicationData()

        if (!isCancelled) {
          applyData(data)
          setError(null)
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

  const clearError = useCallback(() => setError(null), [])

  return { isLoading, error, clearError }
}

function useApplicationRefresh(applyData: ApplyApplicationData, clearError: () => void) {
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [refreshError, setRefreshError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    setRefreshError(null)

    try {
      const data = await loadApplicationData()
      applyData(data)
      clearError()

      return data
    } catch (requestError) {
      const message =
        requestError instanceof Error ? requestError.message : 'Could not refresh applications.'

      setRefreshError(message)
      throw requestError
    } finally {
      setIsRefreshing(false)
    }
  }, [applyData, clearError])

  return { isRefreshing, refreshError, refresh }
}

export default function useApplicationsData(): ApplicationsDataState {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [companyNames, setCompanyNames] = useState<Map<string, string>>(new Map())

  const applyData = useCallback((data: LoadedApplicationData) => {
    setApplications(data.applications)
    setCompanies(data.companies)
    setCompanyNames(data.companyNames)
  }, [])

  const { isLoading, error, clearError } = useInitialApplicationData(applyData)
  const { isRefreshing, refreshError, refresh } = useApplicationRefresh(applyData, clearError)

  const synchronizeApplication = useCallback((application: JobApplication) => {
    setApplications((currentApplications) => {
      const existingIndex = currentApplications.findIndex(({ id }) => id === application.id)

      if (existingIndex === -1) {
        return [application, ...currentApplications]
      }

      return currentApplications.map((currentApplication, index) =>
        index === existingIndex ? application : currentApplication,
      )
    })
  }, [])

  const synchronizeCompany = useCallback((company: Company) => {
    setCompanies((currentCompanies) => {
      const companyExists = currentCompanies.some(({ id }) => id === company.id)

      return companyExists
        ? currentCompanies.map((currentCompany) =>
            currentCompany.id === company.id ? company : currentCompany,
          )
        : [company, ...currentCompanies]
    })
    setCompanyNames((currentNames) => new Map(currentNames).set(company.id, company.companyName))
  }, [])

  return {
    applications,
    companies,
    companyNames,
    isLoading,
    isRefreshing,
    error,
    refreshError,
    refresh,
    synchronizeApplication,
    synchronizeCompany,
  }
}
