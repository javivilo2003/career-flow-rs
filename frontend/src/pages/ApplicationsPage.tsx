import { Add01Icon } from '@hugeicons/core-free-icons'
import { HugeiconsIcon } from '@hugeicons/react'
import { Fragment, useEffect, useState } from 'react'
import { createApplication, getApplications } from '../api/applications'
import { getCompanies } from '../api/companies'
import { getUsers } from '../api/users'
import ApplicationCard from '../components/ApplicationCard'
import Button from '../components/Button'
import type { FormEvent, KeyboardEvent } from 'react'
import type { ApplicationStatus, Company, JobApplication, User } from '../types/api'

type ApplicationForm = {
  userId: string
  companyId: string
  position: string
  jobType: string
  description: string
  salary: string
  status: ApplicationStatus
  appliedAt: string
  source: string
  postingLink: string
}

type CreateApplicationStep = 1 | 2 | 3

const initialApplicationForm: ApplicationForm = {
  userId: '',
  companyId: '',
  position: '',
  jobType: 'Full-time',
  description: '',
  salary: '',
  status: 'SAVED',
  appliedAt: '',
  source: 'LinkedIn',
  postingLink: '',
}

const applicationStatuses: ApplicationStatus[] = [
  'SAVED',
  'PREPARING',
  'APPLIED',
  'INTERVIEWING',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
]

const createApplicationSteps: Array<{
  label: string
  title: string
  value: CreateApplicationStep
}> = [
  {
    label: 'Role',
    title: 'Role details',
    value: 1,
  },
  {
    label: 'Track',
    title: 'Tracking details',
    value: 2,
  },
  {
    label: 'Notes',
    title: 'Owner and notes',
    value: 3,
  },
]

async function loadApplicationData() {
  const [applicationsPage, companiesPage, usersList] = await Promise.all([
    getApplications(),
    getCompanies(),
    getUsers(),
  ])
  const namesById = new Map(
    companiesPage.content.map((company) => [
      company.id,
      company.companyName,
    ]),
  )

  return {
    applications: applicationsPage.content,
    companies: companiesPage.content,
    users: usersList,
    companyNames: namesById,
  }
}

function ApplicationsPage() {
  const [applications, setApplications] = useState<JobApplication[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [companyNames, setCompanyNames] = useState<Map<string, string>>(
    new Map(),
  )
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [createStep, setCreateStep] = useState<CreateApplicationStep>(1)
  const [isSaving, setIsSaving] = useState(false)
  const [createError, setCreateError] = useState<string | null>(null)
  const [form, setForm] = useState<ApplicationForm>(initialApplicationForm)

  useEffect(() => {
    let isCancelled = false

    async function loadInitialData() {
      try {
        const data = await loadApplicationData()

        if (!isCancelled) {
          setApplications(data.applications)
          setCompanies(data.companies)
          setUsers(data.users)
          setCompanyNames(data.companyNames)
          setForm((current) => ({
            ...current,
            companyId: current.companyId || data.companies[0]?.id || '',
            userId: current.userId || data.users[0]?.id || '',
          }))
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

    void loadInitialData()

    return () => {
      isCancelled = true
    }
  }, [])

  function updateForm(field: keyof ApplicationForm, value: string) {
    setForm((current) => ({
      ...current,
      [field]: value,
    }))
  }

  function openCreateModal() {
    setCreateError(null)
    setCreateStep(1)
    setIsCreateModalOpen(true)
  }

  function closeCreateModal() {
    setCreateError(null)
    setCreateStep(1)
    setIsCreateModalOpen(false)
  }

  function goToPreviousCreateStep() {
    setCreateError(null)
    setCreateStep((current) => (current === 3 ? 2 : 1))
  }

  function goToNextCreateStep() {
    setCreateError(null)
    setCreateStep((current) => (current === 1 ? 2 : 3))
  }

  function handleCreateCardKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      openCreateModal()
    }
  }

  async function handleCreateApplication(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()
    setCreateError(null)

    if (createStep < 3) {
      goToNextCreateStep()
      return
    }

    setIsSaving(true)

    try {
      await createApplication({
        userId: form.userId,
        companyId: form.companyId,
        position: form.position.trim(),
        jobType: form.jobType.trim(),
        description: form.description.trim() || null,
        salary: form.salary ? Number(form.salary) : null,
        status: form.status,
        appliedAt: form.appliedAt || null,
        source: form.source.trim(),
        postingLink: form.postingLink.trim() || null,
      })

      const data = await loadApplicationData()

      setApplications(data.applications)
      setCompanies(data.companies)
      setUsers(data.users)
      setCompanyNames(data.companyNames)
      setError(null)
      setIsLoading(false)
      closeCreateModal()
      setForm({
        ...initialApplicationForm,
        companyId: data.companies[0]?.id || '',
        userId: data.users[0]?.id || '',
      })
    } catch (requestError) {
      const message =
        requestError instanceof Error
          ? requestError.message
          : 'Could not create the application.'

      setCreateError(message)
    } finally {
      setIsSaving(false)
    }
  }

  const isCreateDisabled =
    isSaving ||
    !form.userId ||
    !form.companyId ||
    !form.position.trim() ||
    !form.jobType.trim() ||
    !form.source.trim()
  const isCurrentStepDisabled =
    isSaving ||
    (createStep === 1 &&
      (!form.companyId || !form.position.trim() || !form.jobType.trim())) ||
    (createStep === 2 && !form.source.trim()) ||
    (createStep === 3 && isCreateDisabled)
  const activeCreateStep = createApplicationSteps[createStep - 1]

  const createApplicationModal = isCreateModalOpen && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-overlay p-6">
      <form
        className="flex w-[640px] max-w-full flex-col gap-6 rounded-[24px] border border-page bg-surface p-8 text-left"
        onSubmit={handleCreateApplication}
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-application-title"
      >
        <header className="flex flex-col gap-2">
          <h2
            className="m-0 font-heading text-[28px] font-bold leading-normal text-heading"
            id="create-application-title"
          >
            Create job application
          </h2>
          <p className="m-0 text-[16px] leading-[1.5] text-body">
            {activeCreateStep.title}
          </p>
        </header>

        <div
          className="flex flex-col gap-3"
          aria-label={`Step ${createStep} of 3: ${activeCreateStep.title}`}
        >
          <div className="flex items-center gap-3">
            {createApplicationSteps.map((step, index) => {
              const isActive = createStep >= step.value
              const isComplete = createStep > step.value

              return (
                <Fragment key={step.value}>
                  <span
                    className={`inline-flex h-[28px] w-[28px] items-center justify-center rounded-full text-[12px] font-bold ${
                      isActive ? 'bg-accent text-page' : 'bg-page text-body'
                    }`}
                  >
                    {step.value}
                  </span>
                  {index < createApplicationSteps.length - 1 && (
                    <span
                      className={`h-[6px] flex-1 rounded-full ${
                        isComplete ? 'bg-accent' : 'bg-page'
                      }`}
                    />
                  )}
                </Fragment>
              )
            })}
          </div>
          <div className="grid grid-cols-3 gap-3 text-center text-[12px] font-bold">
            {createApplicationSteps.map((step) => (
              <span
                className={createStep >= step.value ? 'text-accent' : 'text-body'}
                key={step.value}
              >
                {step.label}
              </span>
            ))}
          </div>
        </div>

        {createError && (
          <p className="m-0 rounded-lg border border-page bg-page p-4 text-sm text-accent" role="alert">
            {createError}
          </p>
        )}

        {createStep === 1 && (
          <div className="grid grid-auto-details gap-4">
            <label className="flex flex-col gap-2 text-sm font-bold text-heading">
              Position
              <input
                className="h-[44px] rounded-lg border bg-page px-3 text-heading"
                required
                value={form.position}
                onChange={(event) => updateForm('position', event.target.value)}
                placeholder="Frontend engineer"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-bold text-heading">
              Company
              <select
                className="h-[44px] rounded-lg border bg-page px-3 text-heading"
                required
                value={form.companyId}
                onChange={(event) => updateForm('companyId', event.target.value)}
              >
                {companies.length === 0 && <option value="">No companies found</option>}
                {companies.map((company) => (
                  <option key={company.id} value={company.id}>
                    {company.companyName}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-bold text-heading">
              Job type
              <input
                className="h-[44px] rounded-lg border bg-page px-3 text-heading"
                required
                value={form.jobType}
                onChange={(event) => updateForm('jobType', event.target.value)}
                placeholder="Full-time"
              />
            </label>
          </div>
        )}

        {createStep === 2 && (
          <div className="grid grid-auto-details gap-4">
            <label className="flex flex-col gap-2 text-sm font-bold text-heading">
              Status
              <select
                className="h-[44px] rounded-lg border bg-page px-3 text-heading"
                value={form.status}
                onChange={(event) =>
                  updateForm('status', event.target.value as ApplicationStatus)
                }
              >
                {applicationStatuses.map((status) => (
                  <option key={status} value={status}>
                    {status.replaceAll('_', ' ')}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-bold text-heading">
              Source
              <input
                className="h-[44px] rounded-lg border bg-page px-3 text-heading"
                required
                value={form.source}
                onChange={(event) => updateForm('source', event.target.value)}
                placeholder="LinkedIn"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-bold text-heading">
              Applied date
              <input
                className="h-[44px] rounded-lg border bg-page px-3 text-heading"
                type="date"
                value={form.appliedAt}
                onChange={(event) => updateForm('appliedAt', event.target.value)}
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-bold text-heading">
              Salary
              <input
                className="h-[44px] rounded-lg border bg-page px-3 text-heading"
                min="0"
                type="number"
                value={form.salary}
                onChange={(event) => updateForm('salary', event.target.value)}
                placeholder="85000"
              />
            </label>
          </div>
        )}

        {createStep === 3 && (
          <div className="flex flex-col gap-4">
            <label className="flex flex-col gap-2 text-sm font-bold text-heading">
              User
              <select
                className="h-[44px] rounded-lg border bg-page px-3 text-heading"
                required
                value={form.userId}
                onChange={(event) => updateForm('userId', event.target.value)}
              >
                {users.length === 0 && <option value="">No users found</option>}
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.username}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-2 text-sm font-bold text-heading">
              Posting link
              <input
                className="h-[44px] rounded-lg border bg-page px-3 text-heading"
                type="url"
                value={form.postingLink}
                onChange={(event) => updateForm('postingLink', event.target.value)}
                placeholder="https://company.com/jobs/frontend"
              />
            </label>

            <label className="flex flex-col gap-2 text-sm font-bold text-heading">
              Description
              <textarea
                className="h-[96px] resize-none rounded-lg border bg-page p-4 text-heading"
                value={form.description}
                onChange={(event) => updateForm('description', event.target.value)}
                placeholder="Notes about the role, requirements, or next steps"
              />
            </label>
          </div>
        )}

        <footer className="flex items-center justify-between gap-3">
          <Button
            figmaVariant="Variante6"
            type="button"
            onClick={closeCreateModal}
          >
            Cancel
          </Button>
          <div className="flex items-center justify-end gap-3">
            {createStep > 1 && (
              <Button
                figmaVariant="Variante3"
                type="button"
                onClick={goToPreviousCreateStep}
              >
                Back
              </Button>
            )}
            <Button
              disabled={isCurrentStepDisabled}
              figmaVariant="Variante2"
              type="submit"
            >
              {createStep < 3 ? 'Next' : isSaving ? 'Creating' : 'Create'}
            </Button>
          </div>
        </footer>
      </form>
    </div>
  )

  if (!isLoading && !error && applications.length === 0) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center gap-[43px] bg-page px-[64px] text-center">
        <img
          className="h-[131px] w-[180px] object-contain"
          src="/career_flow_logo.png"
          alt="CareerFlow"
        />

        <header className="flex flex-col items-center gap-[12px]">
          <h1 className="m-0 font-heading text-[40px] font-bold leading-normal tracking-normal text-heading">
            Applications
          </h1>
          <p className="m-0 text-[18px] font-normal leading-normal text-body">
            Manage your workspace applications
          </p>
        </header>

        <div
          className="flex h-[400px] w-[400px] max-w-[400px] cursor-pointer flex-col items-center gap-[50px] rounded-[24px] border border-page bg-surface pt-[40px] pr-[64px] pb-[64px] pl-[62px]"
          role="button"
          tabIndex={0}
          aria-label="Create first application"
          onClick={openCreateModal}
          onKeyDown={handleCreateCardKeyDown}
        >
          <div className="hover-scale flex size-[120px] shrink-0 items-center justify-center rounded-[60px] bg-page transition-transform">
            <HugeiconsIcon
              icon={Add01Icon}
              className="size-[48px] text-heading"
              aria-hidden="true"
            />
          </div>

          <div className="flex w-[410px] max-w-full flex-col items-center gap-4 text-center">
            <h2 className="m-0 w-full font-heading text-[28px] font-bold leading-normal tracking-normal text-heading">
              No applications yet
            </h2>
            <p className="m-0 w-full text-[16px] font-normal leading-[1.5] text-body">
              You haven&apos;t created any applications for this workspace.
              Select this card to start building your first one.
            </p>
            <p className="m-0 w-full text-sm font-normal text-body">
              Click anywhere on this card to add a job application
            </p>
          </div>
        </div>

        {createApplicationModal}
      </main>
    )
  }

  return (
    <main className="p-12 text-left">
      <header className="mb-8">
        <p className="m-0 text-accent font-bold">Applications</p>
        <h1 className="m-0 mt-8 mb-2 font-heading text-5xl font-medium tracking-normal text-heading">
          Job applications
        </h1>
        <p className="m-0">Track every opportunity in your job search.</p>
      </header>

      {isLoading && <p className="m-0">Loading applications...</p>}

      {!isLoading && error && <p role="alert" className="m-0">{error}</p>}

      {!isLoading && !error && applications.length > 0 && (
        <ul className="m-0 grid list-none gap-4 p-0">
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

      {createApplicationModal}
    </main>
  )
}

export default ApplicationsPage
