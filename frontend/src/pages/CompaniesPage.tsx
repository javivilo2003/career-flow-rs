import { useState } from 'react'

import { createCompany } from '../apis/companies'
import AddCompanyModal, { type CompanyDraft } from '../components/AddCompanyModal'
import Button from '../components/Button'
import CompanyCard from '../components/CompanyCard'
import Icon from '../components/Icon'
import Input from '../components/Input'
import useCompaniesData from '../features/companies/useCompaniesData'
import type { Company, Page } from '../types/api'

function companyRequest(draft: CompanyDraft) {
  const optional = (value: string) => value || null
  return {
    companyName: draft.companyName,
    companyAddress: optional(draft.companyAddress),
    bio: optional(draft.bio),
    websiteUrl: optional(draft.websiteUrl),
  }
}

function CompanyResults({
  companies,
  result,
  loading,
  error,
  query,
  retry,
  clear,
  add,
  setPage,
}: {
  companies: Company[]
  result: Page<Company> | null
  loading: boolean
  error: string | null
  query: string
  retry: () => void
  clear: () => void
  add: () => void
  setPage: React.Dispatch<React.SetStateAction<number>>
}) {
  if (loading) {
    return (
      <p role="status" className="rounded-[24px] bg-surface p-8">
        Loading companies…
      </p>
    )
  }
  if (error) {
    return (
      <div role="alert" className="rounded-[24px] bg-danger-surface p-8 text-danger">
        <p className="m-0">{error}</p>
        <Button variant="secondary" className="mt-4" onClick={retry}>
          Retry
        </Button>
      </div>
    )
  }
  if (!companies.length) {
    return (
      <div className="rounded-[24px] bg-surface p-8 text-center">
        <h2 className="m-0 text-2xl font-bold text-heading">
          {query ? 'No companies match your search' : 'No companies yet'}
        </h2>
        <p className="m-0 mt-2">Add a company or adjust your search.</p>
        <Button
          className="mt-6"
          variant={query ? 'secondary' : 'primary'}
          onClick={query ? clear : add}
        >
          {query ? 'Clear filters' : 'Add company'}
        </Button>
      </div>
    )
  }
  return (
    <>
      <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(410px,100%),410px))] gap-6 p-0">
        {companies.map((company) => (
          <li key={company.id} className="min-w-0">
            <CompanyCard company={company} detailsPath={`/companies/${company.id}`} />
          </li>
        ))}
      </ul>
      {result && result.totalPages > 1 && (
        <nav aria-label="Company pages" className="mt-8 flex items-center gap-4">
          <Button
            variant="secondary"
            disabled={result.first}
            onClick={() => setPage((value) => value - 1)}
          >
            Previous
          </Button>
          <span>
            Page {result.number + 1} of {result.totalPages}
          </span>
          <Button
            variant="secondary"
            disabled={result.last}
            onClick={() => setPage((value) => value + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </>
  )
}

export default function CompaniesPage() {
  const [query, setQuery] = useState('')
  const [page, setPage] = useState(0)
  const [adding, setAdding] = useState(false)
  const { companies, result, isLoading, error, retry, refresh } = useCompaniesData(query, page)

  async function handleCreate(draft: CompanyDraft) {
    await createCompany(companyRequest(draft))
    setAdding(false)
    setPage(0)
    refresh()
  }

  return (
    <main className="p-6 text-left sm:p-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="m-0 font-bold text-accent">Companies</p>
          <h1 className="m-0 mt-8 mb-2 font-heading text-5xl font-medium text-heading">
            Companies
          </h1>
          <p className="m-0">Keep your company research and opportunities organized.</p>
        </div>
        <Button className="gap-2" onClick={() => setAdding(true)}>
          <Icon name="button-add" />
          Add company
        </Button>
      </header>
      <div className="mb-8 flex max-w-2xl flex-col gap-3 sm:flex-row sm:items-end">
        <Input
          label="Search companies"
          type="search"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value)
            setPage(0)
          }}
          placeholder="Search by company name"
          wrapperClassName="flex-1"
        />
        {query && (
          <Button
            variant="secondary"
            onClick={() => {
              setQuery('')
              setPage(0)
            }}
          >
            Clear filters
          </Button>
        )}
      </div>
      <CompanyResults
        companies={companies}
        result={result}
        loading={isLoading}
        error={error}
        query={query}
        retry={retry}
        clear={() => {
          setQuery('')
          setPage(0)
        }}
        add={() => setAdding(true)}
        setPage={setPage}
      />
      <AddCompanyModal open={adding} onClose={() => setAdding(false)} onSubmit={handleCreate} />
    </main>
  )
}
