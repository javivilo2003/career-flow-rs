import ContactCard from '../components/ContactCard'
import PageStatus from '../components/PageStatus'
import useContactsData from '../features/contacts/useContactsData'

export default function ContactsPage() {
  const { contacts, companyNames, isLoading, error } = useContactsData()
  const isReady = !isLoading && !error

  return (
    <main className="p-6 text-left sm:p-12">
      <header className="mb-8">
        <p className="m-0 font-bold text-accent">Contacts</p>
        <h1 className="m-0 mt-8 mb-2 font-heading text-5xl font-medium text-heading">Contacts</h1>
        <p className="m-0">Keep the people connected to your opportunities within reach.</p>
      </header>

      <PageStatus loading={isLoading} loadingLabel="Loading contacts" error={error} />

      {isReady && contacts.length === 0 && (
        <div className="rounded-[24px] bg-surface p-8 text-center">
          <h2 className="m-0 text-2xl font-bold text-heading">No contacts yet</h2>
          <p className="m-0 mt-2">Contacts associated with your companies will appear here.</p>
        </div>
      )}

      {isReady && contacts.length > 0 && (
        <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(410px,100%),410px))] gap-6 p-0">
          {contacts.map((contact) => (
            <li key={contact.id} className="min-w-0">
              <ContactCard
                contact={contact}
                companyName={companyNames.get(contact.companyId) ?? 'Unknown company'}
                detailsPath={`/contacts/${contact.id}`}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  )
}
