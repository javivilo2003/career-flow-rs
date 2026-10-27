import { type KeyboardEvent, useEffect, useId, useMemo, useRef, useState } from 'react'

import { getCompanies, type GetCompaniesParams } from '../../apis/companies'
import Button from '../../components/Button'
import Input from '../../components/Input'
import Select from '../../components/Select'
import type { Company, Page } from '../../types/api'
import { APPLICATION_SORT_OPTIONS, type ApplicationUrlState } from './applicationUrlState'

export type SearchApplicationCompanies = (params: GetCompaniesParams) => Promise<Page<Company>>

export type ApplicationsFiltersProps = {
  value: ApplicationUrlState
  selectedCompanyName?: string
  onChange: (patch: Partial<ApplicationUrlState>) => void
  onClear: () => void
  searchCompanies?: SearchApplicationCompanies
  disabled?: boolean
}

type CompanyResultsProps = {
  results: Company[]
  activeIndex: number
  companyId: string
  listboxId: string
  loading: boolean
  error: string
  onChoose: (company: Company) => void
}

function optionId(listboxId: string, company: Company) {
  return `${listboxId}-option-${company.id}`
}

function CompanyResults({
  results,
  activeIndex,
  companyId,
  listboxId,
  loading,
  error,
  onChoose,
}: CompanyResultsProps) {
  return (
    <div
      id={listboxId}
      role="listbox"
      className="absolute top-full z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-[10px] border border-border bg-page p-[6px] shadow-lg"
    >
      {loading && (
        <p role="status" className="m-0 px-3 py-2 text-sm text-body">
          Searching…
        </p>
      )}
      {error && (
        <p role="alert" className="m-0 px-3 py-2 text-sm text-danger">
          {error}
        </p>
      )}
      {!loading && !error && results.length === 0 && (
        <p className="m-0 px-3 py-2 text-sm text-body">No companies found.</p>
      )}
      {results.map((company, index) => {
        const active = index === activeIndex
        return (
          <button
            id={optionId(listboxId, company)}
            key={company.id}
            type="button"
            role="option"
            aria-selected={company.id === companyId}
            onMouseDown={(event) => event.preventDefault()}
            onClick={() => onChoose(company)}
            className={`min-h-9 w-full rounded-[6px] px-3 text-left text-sm text-heading ${active ? 'bg-surface' : 'hover:bg-surface'}`}
          >
            {company.companyName}
          </button>
        )
      })}
    </div>
  )
}

function navigationIndex(key: string, current: number, length: number) {
  if (length === 0) {
    return -1
  }
  if (key === 'Home') {
    return 0
  }
  if (key === 'End' || (key === 'ArrowUp' && current < 0)) {
    return length - 1
  }
  if (key === 'ArrowDown') {
    return Math.min(current + 1, length - 1)
  }
  return Math.max(current - 1, 0)
}

type CompanySearchOptions = {
  companyId: string
  open: boolean
  query: string
  searchCompanies: SearchApplicationCompanies
  setResults: React.Dispatch<React.SetStateAction<Company[]>>
  setActiveIndex: React.Dispatch<React.SetStateAction<number>>
  setLoading: React.Dispatch<React.SetStateAction<boolean>>
  setError: React.Dispatch<React.SetStateAction<string>>
}

function selectedResultIndex(companies: Company[], companyId: string) {
  const selected = companies.findIndex(({ id }) => id === companyId)
  if (selected >= 0) {
    return selected
  }
  return companies.length > 0 ? 0 : -1
}

function useCompanySearch(options: CompanySearchOptions) {
  const requestRef = useRef(0)
  useEffect(() => {
    if (!options.open) {
      return
    }
    const id = ++requestRef.current
    const timer = window.setTimeout(() => {
      options.setLoading(true)
      options.setError('')
      void options
        .searchCompanies({
          companyName: options.query.trim() || undefined,
          page: 0,
          size: 10,
          sort: 'companyName',
          direction: 'ASC',
        })
        .then((page) => {
          if (requestRef.current === id) {
            options.setResults(page.content)
            options.setActiveIndex(selectedResultIndex(page.content, options.companyId))
          }
        })
        .catch(() => {
          if (requestRef.current === id) {
            options.setError('Could not search companies.')
            options.setActiveIndex(-1)
          }
        })
        .finally(() => {
          if (requestRef.current === id) {
            options.setLoading(false)
          }
        })
    }, 250)
    return () => {
      window.clearTimeout(timer)
      if (requestRef.current === id) {
        requestRef.current += 1
      }
    }
  }, [options])
}

export function RemoteCompanyPicker({
  companyId,
  selectedCompanyName = '',
  onSelect,
  searchCompanies,
  disabled,
}: {
  companyId: string
  selectedCompanyName?: string
  onSelect: (company: Company | null) => void
  searchCompanies: SearchApplicationCompanies
  disabled?: boolean
}) {
  const inputId = useId()
  const listboxId = useId()
  const rootRef = useRef<HTMLDivElement>(null)
  const [queryState, setQueryState] = useState({ companyId, query: selectedCompanyName })
  const query = queryState.companyId === companyId ? queryState.query : selectedCompanyName
  const [results, setResults] = useState<Company[]>([])
  const [activeIndex, setActiveIndex] = useState(-1)
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const searchOptions = useMemo<CompanySearchOptions>(
    () => ({
      companyId,
      open,
      query,
      searchCompanies,
      setResults,
      setActiveIndex,
      setLoading,
      setError,
    }),
    [companyId, open, query, searchCompanies],
  )
  useCompanySearch(searchOptions)

  function choose(company: Company) {
    setQueryState({ companyId: company.id, query: company.companyName })
    onSelect(company)
    setOpen(false)
    setActiveIndex(-1)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Escape' && open) {
      event.preventDefault()
      setOpen(false)
      setActiveIndex(-1)
      return
    }
    if (event.key === 'Enter' && open && activeIndex >= 0) {
      event.preventDefault()
      const company = results[activeIndex]
      if (company) {
        choose(company)
      }
      return
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) {
      return
    }
    event.preventDefault()
    setOpen(true)
    setActiveIndex((current) => navigationIndex(event.key, current, results.length))
  }

  const activeCompany = open && activeIndex >= 0 ? results[activeIndex] : undefined
  return (
    <div
      ref={rootRef}
      className="relative flex min-w-0 flex-col gap-[9px] text-left"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) {
          setOpen(false)
          setActiveIndex(-1)
        }
      }}
    >
      <label htmlFor={inputId} className="text-sm font-medium text-heading">
        Company
      </label>
      <div className="flex gap-2">
        <input
          id={inputId}
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={activeCompany ? optionId(listboxId, activeCompany) : undefined}
          autoComplete="off"
          value={query}
          disabled={disabled}
          placeholder="Search companies"
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          onChange={(event) => {
            setQueryState({ companyId: '', query: event.target.value })
            setActiveIndex(-1)
            if (companyId) {
              onSelect(null)
            }
            setOpen(true)
          }}
          className="h-12 min-w-0 flex-1 rounded-[10px] border border-border bg-page px-4 text-[15px] text-heading placeholder:text-body focus:border-2 focus:border-heading focus:outline-none"
        />
        {companyId && (
          <Button
            variant="secondary"
            className="px-3"
            onClick={() => {
              setQueryState({ companyId: '', query: '' })
              setOpen(false)
              setActiveIndex(-1)
              onSelect(null)
            }}
          >
            Clear
          </Button>
        )}
      </div>
      {open && (
        <CompanyResults
          results={results}
          activeIndex={activeIndex}
          companyId={companyId}
          listboxId={listboxId}
          loading={loading}
          error={error}
          onChoose={choose}
        />
      )}
    </div>
  )
}

export default function ApplicationsFilters({
  value,
  selectedCompanyName,
  onChange,
  onClear,
  searchCompanies = getCompanies,
  disabled,
}: ApplicationsFiltersProps) {
  const sortValue = `${value.sort}:${value.direction}`
  return (
    <section
      aria-label="Application filters"
      className="mb-6 grid grid-cols-1 gap-4 rounded-[24px] bg-surface p-5 md:grid-cols-[minmax(220px,1fr)_minmax(220px,1fr)_220px_auto] md:items-end"
    >
      <Input
        label="Search positions"
        type="search"
        value={value.position}
        disabled={disabled}
        placeholder="Ex: Frontend Engineer"
        onChange={(event) => onChange({ position: event.target.value })}
      />
      <RemoteCompanyPicker
        companyId={value.companyId}
        selectedCompanyName={selectedCompanyName}
        onSelect={(company) => onChange({ companyId: company?.id ?? '' })}
        searchCompanies={searchCompanies}
        disabled={disabled}
      />
      <Select
        label="Sort by"
        value={sortValue}
        disabled={disabled}
        options={APPLICATION_SORT_OPTIONS.map((option) => ({
          value: `${option.sort}:${option.direction}`,
          label: option.label,
        }))}
        onChange={(next) => {
          const option = APPLICATION_SORT_OPTIONS.find(
            ({ sort, direction }) => `${sort}:${direction}` === next,
          )
          if (option) {
            onChange({ sort: option.sort, direction: option.direction })
          }
        }}
      />
      <Button
        variant="secondary"
        disabled={disabled || (!value.position && !value.companyId && value.sort === 'createdAt')}
        onClick={onClear}
      >
        Clear filters
      </Button>
    </section>
  )
}
