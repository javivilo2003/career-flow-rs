import ApplicationCard from '../../components/ApplicationCard'
import Button from '../../components/Button'
import ContactCard from '../../components/ContactCard'
import type { Company, Contact, JobApplication, Page } from '../../types/api'
import { ContactActions } from '../contacts/CompanyContactsSummary'

export type DetailSection<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

function Failure({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div role="alert" className="rounded-[24px] bg-danger-surface p-6 text-danger">
      <p className="m-0">{message}</p>
      <Button variant="secondary" className="mt-4" onClick={retry}>
        Retry
      </Button>
    </div>
  )
}

function Pagination({
  page,
  label,
  setPage,
}: {
  page: Page<unknown>
  label: string
  setPage: React.Dispatch<React.SetStateAction<number>>
}) {
  if (page.totalPages <= 1) {
    return null
  }
  return (
    <nav aria-label={label} className="mt-5 flex items-center gap-3">
      <Button
        variant="secondary"
        disabled={page.first}
        onClick={() => setPage((value) => value - 1)}
      >
        Previous
      </Button>
      <span>
        Page {page.number + 1} of {page.totalPages}
      </span>
      <Button
        variant="secondary"
        disabled={page.last}
        onClick={() => setPage((value) => value + 1)}
      >
        Next
      </Button>
    </nav>
  )
}

function ApplicationsContent({
  section,
  company,
  retry,
}: {
  section: DetailSection<Page<JobApplication>>
  company?: Company
  retry: () => void
}) {
  if (section.loading) {
    return (
      <p role="status" className="rounded-[24px] bg-surface p-6">
        Loading applications…
      </p>
    )
  }
  if (section.error) {
    return <Failure message={section.error} retry={retry} />
  }
  if (!section.data?.content.length) {
    return <p className="m-0 rounded-[24px] bg-surface p-6">No applications for this company.</p>
  }
  return (
    <ul className="m-0 grid list-none gap-4 p-0">
      {section.data.content.map((application) => (
        <li key={application.id}>
          <ApplicationCard
            application={application}
            companyName={company?.companyName ?? 'Company'}
            applicationHref={`/applications/${application.id}`}
          />
        </li>
      ))}
    </ul>
  )
}

export function CompanyApplicationsSection({
  section,
  company,
  retry,
  add,
  setPage,
}: {
  section: DetailSection<Page<JobApplication>>
  company?: Company
  retry: () => void
  add: () => void
  setPage: React.Dispatch<React.SetStateAction<number>>
}) {
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="m-0 text-2xl font-bold text-heading">Applications</h2>
        {company && <Button onClick={add}>Add application</Button>}
      </div>
      <ApplicationsContent section={section} company={company} retry={retry} />
      {section.data && (
        <Pagination page={section.data} label="Company application pages" setPage={setPage} />
      )}
    </section>
  )
}

export function CompanyContactsSection({
  section,
  company,
  companyId,
  retry,
  add,
  setPage,
}: {
  section: DetailSection<Page<Contact>>
  company?: Company
  companyId?: string
  retry: () => void
  add: () => void
  setPage: React.Dispatch<React.SetStateAction<number>>
}) {
  if (section.loading) {
    return (
      <p role="status" className="rounded-[24px] bg-surface p-6">
        Loading company contacts…
      </p>
    )
  }
  if (section.error) {
    return <Failure message={section.error} retry={retry} />
  }
  const companyName = company?.companyName ?? 'Company'
  return (
    <section>
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 className="m-0 text-2xl font-bold text-heading">Company Contacts</h2>
        <div className="flex flex-wrap gap-3">
          {companyId && (
            <a
              href={`/contacts?companyId=${encodeURIComponent(companyId)}`}
              className="inline-flex h-12 items-center rounded-[10px] border border-body bg-surface px-5 text-sm font-bold text-heading"
            >
              View company contacts
            </a>
          )}
          {company && <Button onClick={add}>Add contact</Button>}
        </div>
      </div>
      {!section.data?.content.length ? (
        <p className="m-0 rounded-[24px] bg-surface p-6">No contacts for this company.</p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(410px,100%),410px))] gap-6 p-0">
          {section.data.content.map((contact) => (
            <li key={contact.id} className="flex min-w-0 flex-col gap-3">
              <ContactCard
                contact={contact}
                companyName={companyName}
                detailsPath={`/contacts/${contact.id}`}
              />
              <ContactActions contact={contact} />
            </li>
          ))}
        </ul>
      )}
      {section.data && (
        <Pagination page={section.data} label="Company contact pages" setPage={setPage} />
      )}
    </section>
  )
}

export function CompanyPrimaryStatus({
  section,
  retry,
}: {
  section: DetailSection<Company>
  retry: () => void
}) {
  if (section.loading) {
    return (
      <p role="status" className="rounded-[24px] bg-surface p-6">
        Loading company…
      </p>
    )
  }
  if (section.error) {
    return <Failure message={section.error} retry={retry} />
  }
  return null
}
