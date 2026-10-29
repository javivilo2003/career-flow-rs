import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'

import { getCompanies } from '../apis/companies'
import { createContact } from '../apis/contacts'
import Button from '../components/Button'
import Icon from '../components/Icon'
import Input from '../components/Input'
import CompanyCombobox from '../features/companies/CompanyCombobox'
import useCompanySearch from '../features/companies/useCompanySearch'
import ContactModal from '../features/contacts/ContactModal'
import ContactsDirectoryResults from '../features/contacts/ContactsDirectoryResults'
import {
  useContactCompanyNames,
  useContactCompanySelection,
} from '../features/contacts/useContactCompanies'
import useContactsData from '../features/contacts/useContactsData'

function companySearchParams(current: URLSearchParams, companyId?: string) {
  const next = new URLSearchParams(current)
  if (companyId) {
    next.set('companyId', companyId)
  } else {
    next.delete('companyId')
  }
  return next
}

function CompanyContextStatus({
  loading,
  error,
  retry,
}: {
  loading: boolean
  error: string | null
  retry: () => void
}) {
  if (loading) {
    return (
      <p role="status" className="mb-6 rounded-[24px] bg-surface p-6">
        Loading selected company…
      </p>
    )
  }
  if (!error) {
    return null
  }
  return (
    <div role="alert" className="mb-6 rounded-[24px] bg-danger-surface p-6 text-danger">
      <p className="m-0">Could not load the selected company. Contacts remain filtered by it.</p>
      <Button variant="secondary" className="mt-4" onClick={retry}>
        Retry company
      </Button>
    </div>
  )
}

export default function ContactsPage() {
  const [name, setName] = useState('')
  const [searchParams, setSearchParams] = useSearchParams()
  const [page, setPage] = useState(0)
  const [adding, setAdding] = useState(false)
  const initialCompanyId = searchParams.get('companyId')
  const companyData = useContactCompanySelection(initialCompanyId)
  const search = useCompanySearch({
    query: companyData.query,
    initialCompanies: [],
    searchCompanies: getCompanies,
  })
  const { contacts, result, isLoading, error, retry, refresh } = useContactsData(
    name,
    initialCompanyId ?? '',
    page,
  )
  const companyNames = useContactCompanyNames(contacts, companyData.company)
  const companyContextLoading = Boolean(initialCompanyId && companyData.loading)
  const companyContextUnavailable = Boolean(initialCompanyId && !companyData.company)

  function openAddContact() {
    setAdding(!companyContextUnavailable)
  }

  function setUrlCompany(companyId?: string) {
    setSearchParams((current) => companySearchParams(current, companyId))
  }

  function clear() {
    setName('')
    companyData.clear()
    setUrlCompany()
    setPage(0)
  }

  return (
    <main className="p-6 text-left sm:p-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="m-0 font-bold text-accent">Contacts</p>
          <h1 className="m-0 mt-8 mb-2 font-heading text-5xl font-medium text-heading">Contacts</h1>
          <p className="m-0">Keep the people connected to your opportunities within reach.</p>
        </div>
        <Button className="gap-2" disabled={companyContextUnavailable} onClick={openAddContact}>
          <Icon name="button-add" />
          Add contact
        </Button>
      </header>
      <div className="mb-8 grid max-w-4xl gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <Input
          label="Search contacts"
          type="search"
          value={name}
          onChange={(event) => {
            setName(event.target.value)
            setPage(0)
          }}
          placeholder="Search by name"
        />
        <CompanyCombobox
          companies={search.companies}
          query={companyData.query}
          selectedCompanyId={companyData.company?.id ?? ''}
          onQueryChange={(value) => {
            companyData.setQuery(value)
            setUrlCompany()
            setPage(0)
          }}
          onSelect={(value) => {
            companyData.select(value)
            setUrlCompany(value.id)
            setPage(0)
          }}
          onCreate={() => undefined}
          allowCreate={false}
          loading={search.loading}
          loadingMore={search.loadingMore}
          hasMore={search.hasMore}
          searchError={search.error}
          onRetry={search.retry}
          onLoadMore={() => void search.loadMore()}
        />
        {(name || initialCompanyId) && (
          <Button variant="secondary" onClick={clear}>
            Clear filters
          </Button>
        )}
      </div>
      <CompanyContextStatus
        loading={companyContextLoading}
        error={companyData.error}
        retry={companyData.retry}
      />
      <ContactsDirectoryResults
        contacts={contacts}
        page={result}
        loading={isLoading}
        error={error}
        filtered={Boolean(name || initialCompanyId)}
        company={companyData.company}
        companyNames={companyNames}
        retry={retry}
        clear={clear}
        add={openAddContact}
        setPage={setPage}
      />
      <ContactModal
        open={adding}
        onClose={() => setAdding(false)}
        company={companyData.company}
        onSubmit={async (request) => {
          await createContact(request)
          setAdding(false)
          setPage(0)
          refresh()
        }}
      />
    </main>
  )
}
