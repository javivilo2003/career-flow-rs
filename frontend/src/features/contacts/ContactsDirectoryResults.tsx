import Button from '../../components/Button'
import ContactCard from '../../components/ContactCard'
import type { Company, Contact, Page } from '../../types/api'

export type ContactsDirectoryResultsProps = {
  contacts: Contact[]
  page: Page<Contact> | null
  loading: boolean
  error: string | null
  filtered: boolean
  company?: Company
  companyNames: Map<string, string>
  retry: () => void
  clear: () => void
  add: () => void
  setPage: React.Dispatch<React.SetStateAction<number>>
}

function contactCompanyName(
  contact: Contact,
  company: Company | undefined,
  names: Map<string, string>,
) {
  const knownName = names.get(contact.companyId)
  if (knownName) {
    return knownName
  }
  if (company?.id === contact.companyId) {
    return company.companyName
  }
  return 'Loading company…'
}

export default function ContactsDirectoryResults(props: ContactsDirectoryResultsProps) {
  if (props.loading) {
    return (
      <p role="status" className="rounded-[24px] bg-surface p-8">
        Loading contacts…
      </p>
    )
  }
  if (props.error) {
    return (
      <div role="alert" className="rounded-[24px] bg-danger-surface p-8 text-danger">
        <p className="m-0">{props.error}</p>
        <Button variant="secondary" className="mt-4" onClick={props.retry}>
          Retry
        </Button>
      </div>
    )
  }
  if (!props.contacts.length) {
    return (
      <div className="rounded-[24px] bg-surface p-8 text-center">
        <h2 className="m-0 text-2xl font-bold text-heading">
          {props.filtered ? 'No contacts match your filters' : 'No contacts yet'}
        </h2>
        <p className="m-0 mt-2">Add a contact or adjust your filters.</p>
        <Button
          variant={props.filtered ? 'secondary' : 'primary'}
          className="mt-6"
          onClick={props.filtered ? props.clear : props.add}
        >
          {props.filtered ? 'Clear filters' : 'Add contact'}
        </Button>
      </div>
    )
  }
  return (
    <>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(410px,100%),410px))] gap-6 p-0">
        {props.contacts.map((contact) => (
          <li key={contact.id} className="min-w-0">
            <ContactCard
              contact={contact}
              companyName={contactCompanyName(contact, props.company, props.companyNames)}
              detailsPath={`/contacts/${contact.id}`}
            />
          </li>
        ))}
      </ul>
      {props.page && props.page.totalPages > 1 && (
        <nav aria-label="Contact pages" className="mt-8 flex items-center gap-4">
          <Button
            variant="secondary"
            disabled={props.page.first}
            onClick={() => props.setPage((value) => value - 1)}
          >
            Previous
          </Button>
          <span>
            Page {props.page.number + 1} of {props.page.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={props.page.last}
            onClick={() => props.setPage((value) => value + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </>
  )
}
