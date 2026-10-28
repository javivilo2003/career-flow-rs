import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams, useSearchParams } from 'react-router-dom'

import { AddApplicationModal, type ApplicationDraft, Button } from '../components'
import ApplicationCard from '../components/ApplicationCard'
import DeleteApplicationModal from '../components/DeleteApplicationModal'
import Icon from '../components/Icon'
import { ApplicationDetailsPanel } from '../features/applications/ApplicationDetails'
import ApplicationsFilters from '../features/applications/ApplicationsFilters'
import ApplicationsPagination from '../features/applications/ApplicationsPagination'
import ApplicationsSkeleton from '../features/applications/ApplicationsSkeleton'
import ApplicationStatusTabs from '../features/applications/ApplicationStatusTabs'
import {
  applicationDetailsHref,
  applicationsHref,
  type ApplicationUrlState,
  parseApplicationUrlState,
  updateApplicationUrlState,
} from '../features/applications/applicationUrlState'
import { createApplicationFromDraft } from '../features/applications/createApplicationFromDraft'
import EditApplicationModal from '../features/applications/EditApplicationModal'
import EmptyApplications from '../features/applications/EmptyApplications'
import useApplicationsData, {
  type ApplicationsDataState,
} from '../features/applications/useApplicationsData'
import { ApplicationsAttention } from '../features/followups'
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type Company,
  type JobApplication,
} from '../types/api'

type Notice = { message: string; destination?: ApplicationStatus } | null
type EditTarget = { application: JobApplication; company?: Company }
type ListActions = {
  onOpen: (application: JobApplication) => void
  onEdit: (application: JobApplication, company?: Company) => void
  onDelete: (application: JobApplication) => void
  onStatusChange: (
    application: JobApplication,
    status: ApplicationStatus,
  ) => Promise<JobApplication>
}

function hasValidStatus(params: URLSearchParams) {
  return APPLICATION_STATUSES.some((status) => status === params.get('status'))
}

function firstPopulatedStatus(data: ApplicationsDataState) {
  return APPLICATION_STATUSES.find((status) => data.statusCounts[status] > 0) ?? 'SAVED'
}

function findCompany(companies: Company[], application: JobApplication) {
  return companies.find(({ id }) => id === application.companyId)
}

function creationDestination(filters: ApplicationUrlState, status: ApplicationStatus) {
  return { ...filters, status, position: '', companyId: '', page: 1 }
}

function useApplicationUrlState(data: ApplicationsDataState) {
  const [searchParams, setSearchParams] = useSearchParams()
  const query = searchParams.toString()
  const filters = useMemo(() => parseApplicationUrlState(query), [query])
  const update = useCallback(
    (patch: Partial<ApplicationUrlState>, replace = true) => {
      setSearchParams(updateApplicationUrlState(query, patch), { replace })
    },
    [query, setSearchParams],
  )

  useEffect(() => {
    if (!data.isCurrentData) {
      return
    }
    const current = new URLSearchParams(query)
    const status = hasValidStatus(current) ? filters.status : firstPopulatedStatus(data)
    const totalPages = data.page.totalPages
    const page = totalPages === 0 ? 1 : Math.min(filters.page, totalPages)
    const normalized = updateApplicationUrlState(current, { status, page })
    if (normalized.toString() !== query) {
      setSearchParams(normalized, { replace: true })
    }
  }, [data, filters.page, filters.status, query, setSearchParams])

  return { filters, query, searchParams, update }
}

function ApplicationList({
  applications,
  companyNames,
  actions,
}: {
  applications: JobApplication[]
  companyNames: Map<string, string>
  actions: ListActions
}) {
  return (
    <ul className="m-0 grid list-none grid-cols-1 gap-6 p-0 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
      {applications.map((application) => (
        <li key={application.id} className="min-w-0">
          <ApplicationCard
            application={application}
            companyName={companyNames.get(application.companyId) ?? 'Unknown company'}
            onOpenDetails={actions.onOpen}
            onEdit={actions.onEdit}
            onDelete={actions.onDelete}
            onStatusChange={actions.onStatusChange}
          />
        </li>
      ))}
    </ul>
  )
}

function EmptyResult({ filtered, onClear }: { filtered: boolean; onClear: () => void }) {
  return (
    <div className="rounded-[24px] bg-surface p-8 text-center">
      <p className="m-0 text-heading">
        {filtered
          ? 'No applications match these filters.'
          : 'No applications have this status yet.'}
      </p>
      {filtered && (
        <Button variant="secondary" className="mt-4" onClick={onClear}>
          Clear filters
        </Button>
      )}
    </div>
  )
}

function RequestNotice({
  data,
  notice,
  onViewDestination,
}: {
  data: ApplicationsDataState
  notice: Notice
  onViewDestination: (status: ApplicationStatus) => void
}) {
  return (
    <>
      {data.isRefreshing && (
        <p role="status" className="mb-4 text-sm text-body">
          Updating applications…
        </p>
      )}
      {notice && (
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-success-surface p-4 text-sm text-success">
          <p role="status" className="m-0">
            {notice.message}
          </p>
          {notice.destination && (
            <Button variant="secondary" onClick={() => onViewDestination(notice.destination!)}>
              View destination
            </Button>
          )}
        </div>
      )}
      {data.refreshError && (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-[10px] bg-danger-surface p-4 text-sm text-danger"
        >
          <p className="m-0">
            Saved changes are retained, but the latest list could not be loaded.
          </p>
          <Button variant="secondary" onClick={() => void data.refresh().catch(() => undefined)}>
            Retry refresh
          </Button>
        </div>
      )}
    </>
  )
}

function WorkspaceResults({
  data,
  filters,
  actions,
  onClear,
  onPageChange,
}: {
  data: ApplicationsDataState
  filters: ApplicationUrlState
  actions: ListActions
  onClear: () => void
  onPageChange: (page: number) => void
}) {
  if (data.isLoading) {
    return <ApplicationsSkeleton />
  }
  if (data.error) {
    return (
      <div role="alert" className="rounded-[24px] bg-danger-surface p-6 text-danger">
        <p className="m-0">{data.error}</p>
        <Button
          variant="secondary"
          className="mt-4"
          onClick={() => void data.refresh().catch(() => undefined)}
        >
          Retry
        </Button>
      </div>
    )
  }
  if (!data.isCurrentData) {
    return data.creationFallback ? (
      <ApplicationList
        applications={[data.creationFallback]}
        companyNames={data.companyNames}
        actions={actions}
      />
    ) : (
      <ApplicationsSkeleton />
    )
  }
  if (data.applications.length === 0) {
    return <EmptyResult filtered={data.isEmptyFilterResult} onClear={onClear} />
  }
  return (
    <>
      <section
        id="application-status-panel"
        role="tabpanel"
        aria-labelledby={`application-status-${filters.status.toLowerCase()}`}
      >
        <ApplicationList
          applications={data.applications}
          companyNames={data.companyNames}
          actions={actions}
        />
      </section>
      <ApplicationsPagination
        page={data.page}
        onPageChange={onPageChange}
        disabled={data.isRefreshing}
      />
    </>
  )
}

function WorkspaceHeader({ onAdd, disabled }: { onAdd: () => void; disabled: boolean }) {
  return (
    <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
      <div>
        <p className="m-0 font-bold text-accent">Applications</p>
        <h1 className="m-0 mt-6 mb-2 font-heading text-4xl font-medium text-heading sm:text-5xl">
          Job applications
        </h1>
        <p className="m-0">Track every opportunity in your job search.</p>
      </div>
      {!disabled && (
        <Button className="gap-2" onClick={onAdd}>
          <Icon name="button-add" />
          Add application
        </Button>
      )}
    </header>
  )
}

function ApplicationEditDialog({
  target,
  companies,
  onClose,
  onSaved,
}: {
  target: EditTarget | null
  companies: Company[]
  onClose: () => void
  onSaved: (application: JobApplication) => Promise<void>
}) {
  if (!target) {
    return null
  }
  return (
    <EditApplicationModal
      key={target.application.id}
      open
      application={target.application}
      company={target.company ?? findCompany(companies, target.application)}
      onClose={onClose}
      onSaved={onSaved}
    />
  )
}

function ApplicationDeleteDialog({
  application,
  companyName,
  onClose,
  onDelete,
}: {
  application: JobApplication | null
  companyName?: string
  onClose: () => void
  onDelete: () => Promise<void>
}) {
  if (!application) {
    return null
  }
  return (
    <DeleteApplicationModal
      open
      title={application.position}
      company={companyName ?? 'Unknown company'}
      applicationDate={
        application.appliedAt ? `Applied ${application.appliedAt}` : 'Not applied yet'
      }
      onClose={onClose}
      onDelete={onDelete}
    />
  )
}

function WorkspaceAttention({
  searchParams,
  revision,
}: {
  searchParams: URLSearchParams
  revision: number
}) {
  const navigate = useNavigate()
  const openItem = useCallback(
    (id: string, section?: 'followups' | 'interviews') => {
      const detailsHref = applicationDetailsHref(id, searchParams)
      void navigate(`${detailsHref}${section ? `#${section}` : ''}`, {
        state: { applicationListOrigin: applicationsHref(searchParams) },
      })
    },
    [navigate, searchParams],
  )
  return (
    <div className="mb-8">
      <ApplicationsAttention onOpenApplication={openItem} revision={revision} />
    </div>
  )
}

function useProvisionalApplicationFilters() {
  return parseApplicationUrlState(useLocation().search)
}

export default function ApplicationsPage() {
  const data = useApplicationsData({ filters: useProvisionalApplicationFilters() })
  const url = useApplicationUrlState(data)
  const navigate = useNavigate()
  const location = useLocation()
  const { applicationId } = useParams()
  const [adding, setAdding] = useState(false)
  const [editing, setEditing] = useState<EditTarget | null>(null)
  const [deleting, setDeleting] = useState<JobApplication | null>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const [detailsRevision, setDetailsRevision] = useState(0)
  const [attentionRevision, setAttentionRevision] = useState(0)
  const beginEdit = useCallback((application: JobApplication, company?: Company) => {
    setEditing({ application, company })
  }, [])
  const clearFilters = useCallback(() => {
    url.update({ position: '', companyId: '', sort: 'createdAt', direction: 'DESC' })
  }, [url])
  const openDetails = useCallback(
    (application: JobApplication) => {
      void navigate(applicationDetailsHref(application.id, url.searchParams), {
        state: { applicationListOrigin: applicationsHref(url.searchParams) },
      })
    },
    [navigate, url.searchParams],
  )
  const changeStatus = useCallback(
    async (application: JobApplication, status: ApplicationStatus) => {
      const updated = await data.changeStatus(application, status)
      setNotice({
        message: `Moved to ${status.toLowerCase().replaceAll('_', ' ')}.`,
        destination: status,
      })
      return updated
    },
    [data],
  )
  const actions = useMemo<ListActions>(
    () => ({
      onOpen: openDetails,
      onEdit: beginEdit,
      onDelete: setDeleting,
      onStatusChange: changeStatus,
    }),
    [beginEdit, changeStatus, openDetails],
  )
  async function createApplication(draft: ApplicationDraft) {
    const created = await createApplicationFromDraft(draft)
    const destination = creationDestination(url.filters, created.status)
    await data.applicationCreated(created, destination)
    setAdding(false)
    setNotice({ message: 'Application created successfully.' })
    url.update({ status: created.status, position: '', companyId: '', page: 1 }, false)
  }
  async function deleteSelected() {
    if (!deleting) {
      return
    }
    await data.removeApplication(deleting)
    const deletedId = deleting.id
    setDeleting(null)
    setNotice({ message: 'Application deleted.' })
    if (applicationId === deletedId) {
      closeDetails(true)
    }
  }
  function closeDetails(replace = false) {
    const state = location.state as { applicationListOrigin?: string } | null
    if (!replace && state?.applicationListOrigin) {
      void navigate(-1)
    } else {
      void navigate(applicationsHref(url.searchParams), { replace: true })
    }
  }
  const addModal = (
    <AddApplicationModal
      open={adding}
      companies={data.companies}
      onClose={() => setAdding(false)}
      onSubmit={createApplication}
      onCompanySelected={data.synchronizeCompany}
      onCompanyCreated={data.synchronizeCompany}
    />
  )
  if (data.isEmpty && !applicationId) {
    return (
      <EmptyApplications openAddApplicationModal={() => setAdding(true)}>
        {addModal}
      </EmptyApplications>
    )
  }
  return (
    <main className="p-6 text-left sm:p-12">
      <WorkspaceHeader onAdd={() => setAdding(true)} disabled={Boolean(data.error)} />
      <WorkspaceAttention searchParams={url.searchParams} revision={attentionRevision} />
      <ApplicationsFilters
        value={url.filters}
        selectedCompanyName={data.companyNames.get(url.filters.companyId)}
        onChange={url.update}
        onClear={clearFilters}
      />
      <ApplicationStatusTabs
        counts={data.statusCounts}
        selectedStatus={url.filters.status}
        onSelect={(status) => url.update({ status }, false)}
      />
      <RequestNotice
        data={data}
        notice={notice}
        onViewDestination={(status) => url.update({ status }, false)}
      />
      <WorkspaceResults
        data={data}
        filters={url.filters}
        actions={actions}
        onClear={clearFilters}
        onPageChange={(page) => url.update({ page }, false)}
      />
      {addModal}
      <ApplicationEditDialog
        target={editing}
        companies={data.companies}
        onClose={() => setEditing(null)}
        onSaved={async (updated) => {
          await data.applicationUpdated(updated)
          setEditing(null)
          setDetailsRevision((revision) => revision + 1)
          setAttentionRevision((revision) => revision + 1)
          setNotice({ message: 'Application updated.' })
        }}
      />
      <ApplicationDeleteDialog
        application={deleting}
        companyName={deleting ? data.companyNames.get(deleting.companyId) : undefined}
        onClose={() => setDeleting(null)}
        onDelete={deleteSelected}
      />
      <ApplicationDetailsPanel
        key={`${applicationId ?? 'closed'}-${detailsRevision}`}
        open={Boolean(applicationId)}
        applicationId={applicationId}
        onClose={() => closeDetails()}
        onEdit={beginEdit}
        onDelete={setDeleting}
        onStatusChange={changeStatus}
        onAttentionChanged={() => setAttentionRevision((revision) => revision + 1)}
      />
    </main>
  )
}
