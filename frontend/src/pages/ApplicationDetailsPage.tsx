import { useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'

import {
  applicationUpdateRequest,
  deleteApplication,
  updateApplication,
} from '../apis/applications'
import DeleteApplicationModal from '../components/DeleteApplicationModal'
import PageStatus from '../components/PageStatus'
import { ApplicationDetailsContent } from '../features/applications/ApplicationDetails'
import { applicationsHref } from '../features/applications/applicationUrlState'
import EditApplicationModal from '../features/applications/EditApplicationModal'
import useApplicationDetails from '../features/applications/useApplicationDetails'
import type { ApplicationStatus, JobApplication } from '../types/api'

export default function ApplicationDetailsPage() {
  const { applicationId } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const { details, isLoading, error, notFound, synchronize } = useApplicationDetails(applicationId)
  const [editing, setEditing] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const listHref = applicationsHref(location.search)

  async function changeStatus(application: JobApplication, status: ApplicationStatus) {
    const updated = await updateApplication(application.id, {
      ...applicationUpdateRequest(application),
      status,
    })
    synchronize(updated)
    return updated
  }
  async function remove() {
    if (!details) {
      return
    }
    await deleteApplication(details.application.id)
    await navigate(listHref, { replace: true })
  }

  return (
    <main className="p-6 text-left sm:p-12">
      <Link to={listHref} className="text-sm font-semibold text-secondary hover:text-heading">
        ← Back to applications
      </Link>
      <header className="mt-8 mb-8">
        <p className="m-0 font-bold text-accent">Application</p>
        <h1 className="m-0 mt-4 font-heading text-3xl font-medium break-words text-heading sm:text-5xl">
          {details?.application.position ?? 'Application details'}
        </h1>
      </header>
      <PageStatus loading={isLoading} loadingLabel="Loading application details" error={error} />
      {notFound && (
        <Link
          to={listHref}
          className="mt-4 inline-flex text-sm font-semibold text-heading underline"
        >
          Return to applications
        </Link>
      )}
      {details && (
        <ApplicationDetailsContent
          {...details}
          onEdit={() => setEditing(true)}
          onDelete={() => setDeleting(true)}
          onStatusChange={changeStatus}
        />
      )}
      {details && (
        <>
          <EditApplicationModal
            open={editing}
            application={details.application}
            company={details.company}
            onClose={() => setEditing(false)}
            onSaved={(application) => synchronize(application)}
          />
          <DeleteApplicationModal
            open={deleting}
            title={details.application.position}
            company={details.company.companyName}
            applicationDate={
              details.application.appliedAt
                ? `Applied ${details.application.appliedAt}`
                : 'Not applied yet'
            }
            onClose={() => setDeleting(false)}
            onDelete={remove}
          />
        </>
      )}
    </main>
  )
}
