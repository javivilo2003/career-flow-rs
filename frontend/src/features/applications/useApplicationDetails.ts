import { useEffect, useState } from 'react'

import { getApplication } from '../../apis/applications'
import { getCompany } from '../../apis/companies'
import type { Company, JobApplication } from '../../types/api'

type ApplicationDetails = {
  application: JobApplication
  company: Company
}

type ApplicationDetailsState = {
  details: ApplicationDetails | null
  isLoading: boolean
  error: string | null
}

export default function useApplicationDetails(
  applicationId: string | undefined,
): ApplicationDetailsState {
  const [details, setDetails] = useState<ApplicationDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function load() {
      if (!applicationId) {
        setError('Application not found.')
        setIsLoading(false)
        return
      }

      try {
        const application = await getApplication(applicationId)
        const company = await getCompany(application.companyId)
        if (!isCancelled) {
          setDetails({ application, company })
          setError(null)
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError instanceof Error ? requestError.message : 'Could not load application.',
          )
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
  }, [applicationId])

  return { details, isLoading, error }
}
