import { useCallback, useEffect, useRef, useState } from 'react'

import { ApplicationApiError, getApplication } from '../../apis/applications'
import { getCompany } from '../../apis/companies'
import type { Company, JobApplication } from '../../types/api'

export type ApplicationDetails = { application: JobApplication; company: Company }
export type ApplicationDetailsState = {
  details: ApplicationDetails | null
  isLoading: boolean
  isRefreshing: boolean
  notFound: boolean
  error: string | null
  refresh: () => Promise<ApplicationDetails | null>
  synchronize: (application: JobApplication) => void
}

type LoadState = {
  applicationId?: string
  details: ApplicationDetails | null
  notFound: boolean
  error: string | null
}

const missingState: LoadState = {
  details: null,
  notFound: true,
  error: 'Application not found.',
}

async function fetchApplicationDetails(applicationId: string): Promise<ApplicationDetails> {
  const application = await getApplication(applicationId)
  const company = await getCompany(application.companyId)
  return { application, company }
}

function failedState(applicationId: string, reason: unknown): LoadState {
  return {
    applicationId,
    details: null,
    notFound: reason instanceof ApplicationApiError && reason.status === 404,
    error: reason instanceof Error ? reason.message : 'Could not load application.',
  }
}

function useInitialDetailsLoad(
  applicationId: string | undefined,
  enabled: boolean,
  requestRef: React.RefObject<number>,
  setState: React.Dispatch<React.SetStateAction<LoadState>>,
) {
  useEffect(() => {
    const id = ++requestRef.current
    if (applicationId && enabled) {
      void fetchApplicationDetails(applicationId)
        .then((details) => {
          if (requestRef.current === id) {
            setState({ applicationId, details, notFound: false, error: null })
          }
        })
        .catch((reason: unknown) => {
          if (requestRef.current === id) {
            setState(failedState(applicationId, reason))
          }
        })
    }
    return () => {
      requestRef.current += 1
    }
  }, [applicationId, enabled, requestRef, setState])
}

export default function useApplicationDetails(
  applicationId: string | undefined,
  enabled = true,
): ApplicationDetailsState {
  const [state, setState] = useState<LoadState>(missingState)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const requestRef = useRef(0)

  const loadDetails = useCallback(async () => {
    if (!applicationId || !enabled) {
      return null
    }
    const id = ++requestRef.current
    try {
      const details = await fetchApplicationDetails(applicationId)
      if (requestRef.current === id) {
        setState({ applicationId, details, notFound: false, error: null })
      }
      return details
    } catch (reason) {
      if (requestRef.current === id) {
        setState(failedState(applicationId, reason))
      }
      return null
    }
  }, [applicationId, enabled, requestRef])

  useInitialDetailsLoad(applicationId, enabled, requestRef, setState)

  const refresh = useCallback(async () => {
    setIsRefreshing(true)
    const result = await loadDetails()
    setIsRefreshing(false)
    return result
  }, [loadDetails])

  const synchronize = useCallback((application: JobApplication) => {
    setState((current) => ({
      ...current,
      details: current.details ? { ...current.details, application } : null,
    }))
  }, [])
  const current = applicationId ? state : missingState
  const isCurrent = current.applicationId === applicationId

  return {
    details: isCurrent ? current.details : null,
    isLoading: enabled && Boolean(applicationId) && !isCurrent,
    isRefreshing,
    notFound: isCurrent && current.notFound,
    error: isCurrent ? current.error : null,
    refresh,
    synchronize,
  }
}
