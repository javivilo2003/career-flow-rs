import { Link } from 'react-router-dom'

import Button from '../../components/Button'
import ContactCard from '../../components/ContactCard'
import type { Company, Contact } from '../../types/api'

export type CompanyContactsSummaryProps = {
  company: Company
  contacts: readonly Contact[]
  onAddContact?: () => void
  viewAllPath?: string
}

export function ContactActions({ contact }: { contact: Contact }) {
  if (!contact.email && !contact.phone) {
    return null
  }

  return (
    <div role="group" className="flex flex-wrap gap-3" aria-label={`Contact ${contact.name}`}>
      {contact.email && (
        <a
          href={`mailto:${contact.email}`}
          aria-label={`Email ${contact.name} at ${contact.email}`}
          className="inline-flex min-h-12 min-w-0 items-center rounded-[10px] border border-body bg-surface px-4 text-sm font-bold text-heading underline decoration-border underline-offset-4"
        >
          <span className="break-all">{contact.email}</span>
        </a>
      )}
      {contact.phone && (
        <a
          href={`tel:${contact.phone}`}
          aria-label={`Call ${contact.name} at ${contact.phone}`}
          className="inline-flex min-h-12 min-w-0 items-center rounded-[10px] border border-body bg-surface px-4 text-sm font-bold text-heading underline decoration-border underline-offset-4"
        >
          <span className="break-all">{contact.phone}</span>
        </a>
      )}
    </div>
  )
}

export default function CompanyContactsSummary({
  company,
  contacts,
  onAddContact,
  viewAllPath,
}: CompanyContactsSummaryProps) {
  return (
    <section aria-labelledby="company-contacts-title">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <h2 id="company-contacts-title" className="m-0 text-2xl font-bold text-heading">
          Company Contacts
        </h2>
        <div className="flex flex-wrap gap-3">
          {viewAllPath && (
            <Link
              to={viewAllPath}
              className="inline-flex h-12 items-center rounded-[10px] border border-body bg-surface px-5 text-sm font-bold text-heading"
            >
              View company contacts
            </Link>
          )}
          {onAddContact && <Button onClick={onAddContact}>Add contact</Button>}
        </div>
      </div>
      {contacts.length === 0 ? (
        <div className="rounded-[24px] bg-surface p-6">
          <p className="m-0">No contacts for {company.companyName} yet.</p>
          {onAddContact && (
            <Button className="mt-5" onClick={onAddContact}>
              Add the first contact
            </Button>
          )}
        </div>
      ) : (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(410px,100%),410px))] gap-6 p-0">
          {contacts.map((contact) => (
            <li key={contact.id} className="flex min-w-0 flex-col gap-3">
              <ContactCard
                contact={contact}
                companyName={company.companyName}
                detailsPath={`/contacts/${contact.id}`}
              />
              <ContactActions contact={contact} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
