import { Link, useParams } from 'react-router-dom'

import ApplicationCard from '../components/ApplicationCard'
import PageStatus from '../components/PageStatus'
import useApplicationDetails from '../features/applications/useApplicationDetails'

export default function ApplicationDetailsPage() {
  const { applicationId } = useParams()
  const { details, isLoading, error } = useApplicationDetails(applicationId)

  return (
    <main className="p-6 text-left sm:p-12">
      <Link to="/applications" className="text-sm font-semibold text-secondary hover:text-heading">
        ← Back to applications
      </Link>
      <header className="mt-8 mb-8">
        <p className="m-0 font-bold text-accent">Application</p>
        <h1 className="m-0 mt-8 font-heading text-5xl font-medium text-heading">
          {details?.application.position ?? 'Application details'}
        </h1>
      </header>

      <PageStatus loading={isLoading} loadingLabel="Loading application details" error={error} />

      {details && (
        <div className="grid grid-auto-page gap-6">
          <ApplicationCard
            application={details.application}
            companyName={details.company.companyName}
          />
          <section className="rounded-[24px] bg-surface p-6">
            <h2 className="m-0 text-2xl font-bold text-heading">Company</h2>
            <p className="m-0 mt-3 text-secondary">{details.company.companyName}</p>
            <Link
              to={`/companies/${details.company.id}`}
              className="mt-6 inline-flex h-12 items-center rounded-[10px] bg-page px-5 text-sm font-bold text-heading"
            >
              View company
            </Link>
          </section>
        </div>
      )}
    </main>
  )
}
