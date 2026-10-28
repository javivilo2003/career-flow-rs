import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'

import { updateContact } from '../apis/contacts'
import Button from '../components/Button'
import ContactCard from '../components/ContactCard'
import { ContactActions } from '../features/contacts/CompanyContactsSummary'
import ContactModal from '../features/contacts/ContactModal'
import useContactDetails from '../features/contacts/useContactDetails'

export default function ContactDetailsPage() {
  const { contactId } = useParams()
  const { details, isLoading, error, retry, synchronize } = useContactDetails(contactId)
  const [editing, setEditing] = useState(false)
  return (
    <main className="p-6 text-left sm:p-12">
      <Link to="/contacts" className="text-sm font-semibold text-secondary hover:text-heading">
        ← Back to contacts
      </Link>
      <header className="mt-8 mb-8 flex flex-wrap items-end justify-between gap-5">
        <div>
          <p className="m-0 font-bold text-accent">Contact</p>
          <h1 className="m-0 mt-8 font-heading text-5xl font-medium text-heading">
            {details?.contact.name ?? 'Contact details'}
          </h1>
        </div>
        {details && <Button onClick={() => setEditing(true)}>Edit contact</Button>}
      </header>
      {isLoading && (
        <p role="status" className="rounded-[24px] bg-surface p-8">
          Loading contact details…
        </p>
      )}
      {!isLoading && error && (
        <div role="alert" className="rounded-[24px] bg-danger-surface p-8 text-danger">
          <p className="m-0">{error}</p>
          <Button variant="secondary" className="mt-4" onClick={retry}>
            Retry
          </Button>
        </div>
      )}
      {details && !isLoading && (
        <div className="grid grid-auto-page gap-6">
          <div className="flex min-w-0 flex-col gap-3">
            <ContactCard contact={details.contact} companyName={details.company.companyName} />
            <ContactActions contact={details.contact} />
          </div>
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
      {details && (
        <ContactModal
          open={editing}
          onClose={() => setEditing(false)}
          contact={details.contact}
          company={details.company}
          onSubmit={async (request, selectedCompany) => {
            const saved = await updateContact(details.contact.id, request)
            const company = selectedCompany ?? details.company
            synchronize(saved, company)
            setEditing(false)
          }}
        />
      )}
    </main>
  )
}
