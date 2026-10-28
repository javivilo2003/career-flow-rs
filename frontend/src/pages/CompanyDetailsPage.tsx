import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { updateCompany } from '../apis/companies'
import { createContact } from '../apis/contacts'
import AddApplicationModal, { type ApplicationDraft } from '../components/AddApplicationModal'
import AddCompanyModal, { type CompanyDraft } from '../components/AddCompanyModal'
import Button from '../components/Button'
import { createApplicationFromDraft } from '../features/applications/createApplicationFromDraft'
import {
  CompanyApplicationsSection,
  CompanyContactsSection,
  CompanyPrimaryStatus,
} from '../features/companies/CompanyDetailSections'
import useCompanyDetails from '../features/companies/useCompanyDetails'
import ContactModal from '../features/contacts/ContactModal'
import type { Company } from '../types/api'

function CompanyInformation({ company, onEdit }: { company: Company; onEdit: () => void }) {
  return (
    <section className="rounded-[24px] bg-surface p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="m-0 text-2xl font-bold text-heading">Company information</h2>
        <Button variant="secondary" onClick={onEdit}>
          Edit company
        </Button>
      </div>
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
                className="font-semibold text-heading underline underline-offset-4"
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

function optional(value: string) {
  return value || null
}

function CompanyHeaderActions({
  company,
  addContact,
  addApplication,
}: {
  company: Company | null
  addContact: () => void
  addApplication: () => void
}) {
  if (!company) {
    return null
  }
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="secondary" onClick={addContact}>
        Add contact
      </Button>
      <Button onClick={addApplication}>Add application</Button>
    </div>
  )
}

export default function CompanyDetailsPage() {
  const { companyId } = useParams()
  const [applicationPage, setApplicationPage] = useState(0)
  const [contactPage, setContactPage] = useState(0)
  const [editing, setEditing] = useState(false)
  const [addingApplication, setAddingApplication] = useState(false)
  const [addingContact, setAddingContact] = useState(false)
  const state = useCompanyDetails(companyId, applicationPage, contactPage)
  const company = state.company.data

  async function saveCompany(draft: CompanyDraft) {
    if (!company) {
      return
    }
    const saved = await updateCompany(company.id, {
      companyName: draft.companyName,
      companyAddress: optional(draft.companyAddress),
      bio: optional(draft.bio),
      websiteUrl: optional(draft.websiteUrl),
    })
    state.synchronizeCompany(saved)
    setEditing(false)
  }
  async function saveApplication(draft: ApplicationDraft) {
    await createApplicationFromDraft(draft)
    setAddingApplication(false)
    setApplicationPage(0)
    state.refreshApplications()
  }

  return (
    <main className="p-6 text-left sm:p-12">
      <Link to="/companies" className="text-sm font-semibold text-secondary hover:text-heading">
        ← Back to companies
      </Link>
      <header className="mt-8 mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="m-0 font-bold text-accent">Company</p>
          <h1 className="m-0 mt-8 font-heading text-5xl font-medium text-heading">
            {company?.companyName ?? 'Company details'}
          </h1>
        </div>
        <CompanyHeaderActions
          company={company}
          addContact={() => setAddingContact(true)}
          addApplication={() => setAddingApplication(true)}
        />
      </header>
      <div className="flex flex-col gap-10">
        <CompanyPrimaryStatus section={state.company} retry={state.retryCompany} />
        {company && <CompanyInformation company={company} onEdit={() => setEditing(true)} />}
        <CompanyApplicationsSection
          section={state.applications}
          company={company ?? undefined}
          retry={state.retryApplications}
          add={() => setAddingApplication(true)}
          setPage={setApplicationPage}
        />
        <CompanyContactsSection
          section={state.contacts}
          company={company ?? undefined}
          companyId={companyId}
          retry={state.retryContacts}
          add={() => setAddingContact(true)}
          setPage={setContactPage}
        />
      </div>
      {company && (
        <>
          <AddCompanyModal
            key={[
              company.id,
              company.companyName,
              company.companyAddress,
              company.bio,
              company.websiteUrl,
            ].join(':')}
            open={editing}
            onClose={() => setEditing(false)}
            onSubmit={saveCompany}
            title="Edit company"
            submitLabel="Save changes"
            initialValues={{
              companyName: company.companyName,
              companyAddress: company.companyAddress ?? '',
              bio: company.bio ?? '',
              websiteUrl: company.websiteUrl ?? '',
            }}
          />
          <AddApplicationModal
            open={addingApplication}
            onClose={() => setAddingApplication(false)}
            onSubmit={saveApplication}
            initialValues={{ companyId: company.id }}
            companies={[company]}
            fixedCompany={company}
            title={`Add application for ${company.companyName}`}
          />
          <ContactModal
            open={addingContact}
            onClose={() => setAddingContact(false)}
            fixedCompany={company}
            onSubmit={async (request) => {
              await createContact(request)
              setAddingContact(false)
              setContactPage(0)
              state.refreshContacts()
            }}
          />
        </>
      )}
    </main>
  )
}
