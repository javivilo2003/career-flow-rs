import { Link, useParams } from 'react-router-dom'

import ApplicationCard from '../components/ApplicationCard'
import ContactCard from '../components/ContactCard'
import PageStatus from '../components/PageStatus'
import useCompanyDetails from '../features/companies/useCompanyDetails'
import type { Company, Contact, JobApplication } from '../types/api'

function CompanyInformation({ company }: { company: Company }) {
  return (
    <section className="rounded-[24px] bg-surface p-6">
      <h2 className="m-0 text-2xl font-bold text-heading">Company information</h2>
      <dl className="mt-6 grid grid-auto-details gap-6">
        <div>
          <dt className="text-sm text-body">Location</dt>
          <dd className="m-0 mt-2 text-heading">{company.companyAddress || 'Not added'}</dd>
        </div>
        <div>
          <dt className="text-sm text-body">Website</dt>
          <dd className="m-0 mt-2">
            {company.websiteUrl ? (
              <a
                href={company.websiteUrl}
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-heading underline decoration-border underline-offset-4"
              >
                {company.websiteUrl}
              </a>
            ) : (
              'Not added'
            )}
          </dd>
        </div>
      </dl>
      <div className="mt-6 border-t border-border pt-[23px]">
        <p className="m-0 text-sm text-body">About</p>
        <p className="m-0 mt-2 text-secondary">{company.bio || 'No company notes added yet.'}</p>
      </div>
    </section>
  )
}

function CompanyApplications({
  applications,
  companyName,
}: {
  applications: JobApplication[]
  companyName: string
}) {
  return (
    <section>
      <h2 className="m-0 mb-5 text-2xl font-bold text-heading">Applications</h2>
      {applications.length === 0 ? (
        <p className="m-0 rounded-[24px] bg-surface p-6">No applications for this company.</p>
      ) : (
        <ul className="m-0 grid list-none gap-4 p-0">
          {applications.map((application) => (
            <li key={application.id}>
              <ApplicationCard
                application={application}
                companyName={companyName}
                applicationHref={`/applications/${application.id}`}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CompanyContacts({ contacts, companyName }: { contacts: Contact[]; companyName: string }) {
  return (
    <section>
      <h2 className="m-0 mb-5 text-2xl font-bold text-heading">Contacts</h2>
      {contacts.length === 0 ? (
        <p className="m-0 rounded-[24px] bg-surface p-6">No contacts for this company.</p>
      ) : (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(410px,100%),410px))] gap-6 p-0">
          {contacts.map((contact) => (
            <li key={contact.id} className="min-w-0">
              <ContactCard
                contact={contact}
                companyName={companyName}
                detailsPath={`/contacts/${contact.id}`}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function CompanyDetailsPage() {
  const { companyId } = useParams()
  const { details, isLoading, error } = useCompanyDetails(companyId)

  return (
    <main className="p-6 text-left sm:p-12">
      <Link to="/companies" className="text-sm font-semibold text-secondary hover:text-heading">
        ← Back to companies
      </Link>
      <header className="mt-8 mb-8">
        <p className="m-0 font-bold text-accent">Company</p>
        <h1 className="m-0 mt-8 font-heading text-5xl font-medium text-heading">
          {details?.company.companyName ?? 'Company details'}
        </h1>
      </header>

      <PageStatus loading={isLoading} loadingLabel="Loading company details" error={error} />

      {details && (
        <div className="flex flex-col gap-10">
          <CompanyInformation company={details.company} />
          <CompanyApplications
            applications={details.applications}
            companyName={details.company.companyName}
          />
          <CompanyContacts contacts={details.contacts} companyName={details.company.companyName} />
        </div>
      )}
    </main>
  )
}
