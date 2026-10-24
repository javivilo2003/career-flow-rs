import { useState } from 'react'

import { AddApplicationModal, type ApplicationDraft } from '../components'
import ApplicationCard from '../components/ApplicationCard'
import { createApplicationFromDraft } from '../features/applications/createApplicationFromDraft'
import EmptyApplications from '../features/applications/EmptyApplications'
import useApplicationsData from '../features/applications/useApplicationsData'

export default function ApplicationsPage() {
  const { applications, companies, users, companyNames, isLoading, error, refresh } =
    useApplicationsData()
  const [isAddApplicationModalOpen, setIsAddApplicationModalOpen] = useState(false)
  const companyOptions = companies.map((company) => ({
    value: company.id,
    label: company.companyName,
  }))

  function openAddApplicationModal() {
    setIsAddApplicationModalOpen(true)
  }

  function closeAddApplicationModal() {
    setIsAddApplicationModalOpen(false)
  }

  async function handleCreateApplication(draft: ApplicationDraft) {
    await createApplicationFromDraft(draft, users[0]?.id)
    await refresh()
    closeAddApplicationModal()
  }

  const addApplicationModal = (
    <AddApplicationModal
      open={isAddApplicationModalOpen}
      companyOptions={companyOptions}
      onClose={closeAddApplicationModal}
      onSubmit={handleCreateApplication}
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
      <header className="mb-8">
        <p className="m-0 font-bold text-accent">Applications</p>
        <h1 className="m-0 mt-8 mb-2 font-heading text-5xl font-medium tracking-normal text-heading">
          Job applications
        </h1>
        <p className="m-0">Track every opportunity in your job search.</p>
      </header>

      {isLoading && <p className="m-0">Loading applications...</p>}

      {!isLoading && error && (
        <p role="alert" className="m-0">
          {error}
        </p>
      )}

      {!isLoading && !error && applications.length > 0 && (
        <ul className="m-0 grid list-none gap-4 p-0">
          {applications.map((application) => (
            <li key={application.id}>
              <ApplicationCard
                application={application}
                companyName={companyNames.get(application.companyId) ?? 'Unknown company'}
              />
            </li>
          ))}
        </ul>
      )}

      {addApplicationModal}
    </main>
  )
}
