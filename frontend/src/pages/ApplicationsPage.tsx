import { useState } from 'react'

import { AddApplicationModal, type ApplicationDraft, Button } from '../components'
import ApplicationCard from '../components/ApplicationCard'
import Icon from '../components/Icon'
import ApplicationsSkeleton from '../features/applications/ApplicationsSkeleton'
import ApplicationStatusTabs from '../features/applications/ApplicationStatusTabs'
import { createApplicationFromDraft } from '../features/applications/createApplicationFromDraft'
import EmptyApplications from '../features/applications/EmptyApplications'
import useApplicationsData from '../features/applications/useApplicationsData'
import type { ApplicationStatus, JobApplication } from '../types/api'

function ApplicationsList({
  applications,
  companyNames,
}: {
  applications: JobApplication[]
  companyNames: Map<string, string>
}) {
  if (applications.length === 0) {
    return (
      <div className="rounded-[24px] bg-surface p-8 text-center">
        <p className="m-0 text-heading">No applications have this status yet.</p>
      </div>
    )
  }

  return (
    <ul className="m-0 grid list-none gap-4 p-0">
      {applications.map((application) => (
        <li key={application.id}>
          <ApplicationCard
            application={application}
            companyName={companyNames.get(application.companyId) ?? 'Unknown company'}
            applicationHref={`/applications/${application.id}`}
          />
        </li>
      ))}
    </ul>
  )
}

type ApplicationsResultsProps = {
  applications: JobApplication[]
  companyNames: Map<string, string>
  selectedStatus: ApplicationStatus
  onSelectStatus: (status: ApplicationStatus) => void
  isLoading: boolean
  error: string | null
}

function ApplicationsResults({
  applications,
  companyNames,
  selectedStatus,
  onSelectStatus,
  isLoading,
  error,
}: ApplicationsResultsProps) {
  if (isLoading) {
    return <ApplicationsSkeleton />
  }

  if (error) {
    return (
      <p role="alert" className="m-0">
        {error}
      </p>
    )
  }

  const filteredApplications = applications.filter(
    (application) => application.status === selectedStatus,
  )

  return (
    <>
      <ApplicationStatusTabs
        applications={applications}
        selectedStatus={selectedStatus}
        onSelect={onSelectStatus}
      />
      <section
        id="application-status-panel"
        role="tabpanel"
        aria-labelledby={`application-status-${selectedStatus.toLowerCase()}`}
      >
        <ApplicationsList applications={filteredApplications} companyNames={companyNames} />
      </section>
    </>
  )
}

export default function ApplicationsPage() {
  const {
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
  } = useApplicationsData()
  const [isAddApplicationModalOpen, setIsAddApplicationModalOpen] = useState(false)
  const [selectedStatus, setSelectedStatus] = useState<ApplicationStatus>('SAVED')

  function openAddApplicationModal() {
    setIsAddApplicationModalOpen(true)
  }

  function closeAddApplicationModal() {
    setIsAddApplicationModalOpen(false)
  }

  async function handleCreateApplication(draft: ApplicationDraft) {
    const createdApplication = await createApplicationFromDraft(draft)

    synchronizeApplication(createdApplication)
    setSelectedStatus(createdApplication.status)
    closeAddApplicationModal()

    void refresh().catch(() => {
      // The persisted application is already synchronized locally. The hook exposes
      // refreshError so refreshing can be retried without repeating the POST.
    })
  }

  const addApplicationModal = (
    <AddApplicationModal
      open={isAddApplicationModalOpen}
      companies={companies}
      onClose={closeAddApplicationModal}
      onSubmit={handleCreateApplication}
      onCompanyCreated={synchronizeCompany}
    />
  )

  if (!isLoading && !error && applications.length === 0) {
    return (
      <EmptyApplications openAddApplicationModal={openAddApplicationModal}>
        {addApplicationModal}
      </EmptyApplications>
    )
  }

  return (
    <main className="p-12 text-left">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="m-0 font-bold text-accent">Applications</p>
          <h1 className="m-0 mt-8 mb-2 font-heading text-5xl font-medium tracking-normal text-heading">
            Job applications
          </h1>
          <p className="m-0">Track every opportunity in your job search.</p>
        </div>
        {!isLoading && !error && (
          <Button className="gap-2" onClick={openAddApplicationModal}>
            <Icon name="button-add" />
            Add application
          </Button>
        )}
      </header>

      <ApplicationsResults
        applications={applications}
        companyNames={companyNames}
        selectedStatus={selectedStatus}
        onSelectStatus={setSelectedStatus}
        isLoading={isLoading}
        error={error}
      />

      {refreshError && (
        <div
          role="alert"
          className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-danger bg-danger-surface p-4"
        >
          <p className="m-0 text-sm text-danger">
            Your application was saved, but the latest list could not be loaded.
          </p>
          <Button
            variant="secondary"
            disabled={isRefreshing}
            onClick={() => void refresh().catch(() => undefined)}
          >
            {isRefreshing ? 'Refreshing…' : 'Retry refresh'}
          </Button>
        </div>
      )}

      {addApplicationModal}
    </main>
  )
}
