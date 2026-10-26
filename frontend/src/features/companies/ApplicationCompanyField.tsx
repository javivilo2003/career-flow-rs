import { useEffect, useRef, useState } from 'react'

import { CompanyApiError, type CompanyRequest } from '../../apis/companies'
import Button from '../../components/Button'
import Input from '../../components/Input'
import type { Company } from '../../types/api'
import CompanyCombobox from './CompanyCombobox'
import useCompanySearch, { type SearchCompanies } from './useCompanySearch'

export type ApplicationCompanyFieldProps = {
  initialCompanies: readonly Company[]
  selectedCompanyId: string
  selectedCompanyName?: string
  error?: string
  disabled?: boolean
  searchCompanies?: SearchCompanies
  createCompany?: (request: CompanyRequest) => Promise<Company>
  onChange: (company: Company | null) => void
  onCompanyCreated?: (company: Company) => void
}

function creationError(reason: unknown) {
  if (reason instanceof CompanyApiError && (reason.status === 409 || reason.code === 'CONFLICT')) {
    return 'A company with this name already exists. Return to search and select it.'
  }
  return reason instanceof Error && reason.message
    ? reason.message
    : 'Could not create the company. Your application draft is still here; try again.'
}

function InlineCompanyForm({
  name,
  busy,
  error,
  onNameChange,
  onCancel,
  onCreate,
}: {
  name: string
  busy: boolean
  error: string
  onNameChange: (value: string) => void
  onCancel: () => void
  onCreate: () => void
}) {
  const sectionRef = useRef<HTMLElement>(null)

  useEffect(() => {
    sectionRef.current?.querySelector<HTMLInputElement>('input')?.focus()
  }, [])

  return (
    <section
      ref={sectionRef}
      aria-labelledby="inline-company-title"
      className="mt-3 flex flex-col gap-3 rounded-[10px] border border-border bg-page p-4"
    >
      <div>
        <h3 id="inline-company-title" className="m-0 text-sm font-semibold text-heading">
          Create company
        </h3>
        <p className="m-0 mt-1 text-xs text-body">You can add more company details later.</p>
      </div>
      <Input
        label="Company name *"
        required
        value={name}
        disabled={busy}
        onChange={(event) => onNameChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            onCreate()
          }
        }}
      />
      {error && (
        <p role="alert" className="m-0 text-xs text-danger">
          {error}
        </p>
      )}
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="secondary" disabled={busy} onClick={onCancel}>
          Back to search
        </Button>
        <Button disabled={busy || !name.trim()} onClick={onCreate}>
          {busy ? 'Creating…' : 'Create and select'}
        </Button>
      </div>
    </section>
  )
}

export default function ApplicationCompanyField({
  initialCompanies,
  selectedCompanyId,
  selectedCompanyName = '',
  error,
  disabled,
  searchCompanies,
  createCompany,
  onChange,
  onCompanyCreated,
}: ApplicationCompanyFieldProps) {
  const [query, setQuery] = useState(selectedCompanyName)
  const [createName, setCreateName] = useState('')
  const [createMode, setCreateMode] = useState(false)
  const [createBusy, setCreateBusy] = useState(false)
  const createBusyRef = useRef(false)
  const [createError, setCreateError] = useState('')
  const search = useCompanySearch({ query, initialCompanies, searchCompanies })

  function select(company: Company) {
    setQuery(company.companyName)
    setCreateMode(false)
    setCreateError('')
    onChange(company)
  }

  async function create() {
    if (!createCompany || createBusyRef.current || !createName.trim()) {
      return
    }
    createBusyRef.current = true
    setCreateBusy(true)
    setCreateError('')
    try {
      const company = await createCompany({
        companyName: createName.trim(),
        companyAddress: null,
        bio: null,
        websiteUrl: null,
      })
      select(company)
      onCompanyCreated?.(company)
    } catch (reason) {
      setCreateError(creationError(reason))
    } finally {
      createBusyRef.current = false
      setCreateBusy(false)
    }
  }

  return (
    <div className="min-w-0">
      <CompanyCombobox
        companies={search.companies}
        query={query}
        selectedCompanyId={selectedCompanyId}
        onQueryChange={(value) => {
          setQuery(value)
          onChange(null)
        }}
        onSelect={select}
        onCreate={(name) => {
          setCreateName(name)
          setCreateError('')
          setCreateMode(true)
        }}
        onRetry={search.retry}
        onLoadMore={() => void search.loadMore()}
        loading={search.loading}
        loadingMore={search.loadingMore}
        hasMore={search.hasMore}
        searchError={search.error}
        error={error}
        disabled={disabled || createMode}
      />
      {createMode && (
        <InlineCompanyForm
          name={createName}
          busy={createBusy}
          error={createError}
          onNameChange={setCreateName}
          onCancel={() => {
            setCreateMode(false)
            setCreateError('')
          }}
          onCreate={() => void create()}
        />
      )}
    </div>
  )
}
