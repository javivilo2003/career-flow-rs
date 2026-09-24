import { useEffect, useState } from 'react'
import { getApplications } from '../api/applications'
import { getCompanies } from '../api/companies'
import ApplicationCard from '../components/ApplicationCard'
import type { JobApplication } from '../types/api'

function ApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [companyNames, setCompanyNames] = useState<Map<string, string>>(
    new Map(),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadApplications() {
      try {
        const [applicationsPage, companiesPage] = await Promise.all([
          getApplications(),
          getCompanies(),
        ])
        const namesById = new Map(
          companiesPage.content.map((company) => [
            company.id,
            company.companyName,
          ]),
        )

        if (!isCancelled) {
          setApplications(applicationsPage.content)
          setCompanyNames(namesById)
        }
      } catch (requestError) {
        if (!isCancelled) {
          const message =
            requestError instanceof Error
              ? requestError.message
              : 'Could not load applications.'

          setError(message)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadApplications()

    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <main className="page">
      <header className="page__header">
        <p className="page__eyebrow">Applications</p>
        <h1>Job applications</h1>
        <p>Track every opportunity in your job search.</p>
      </header>

      {isLoading && <p>Loading applications...</p>}

      {!isLoading && error && <p role="alert">{error}</p>}

      {!isLoading && !error && applications.length === 0 && (
        <p>You do not have any applications yet.</p>
      )}

      {!isLoading && !error && applications.length > 0 && (
        <ul className="application-list">
          {applications.map((application) => (
            <li key={application.id}>
              <ApplicationCard
                application={application}
                companyName={
                  companyNames.get(application.companyId) ?? 'Unknown company'
                }
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}

export default ApplicationsPage
