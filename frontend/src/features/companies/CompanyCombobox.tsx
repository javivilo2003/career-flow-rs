import { type ChangeEvent, type FocusEvent, type KeyboardEvent, useId, useState } from 'react'

import type { Company } from '../../types/api'

export type CompanyComboboxProps = {
  companies: readonly Company[]
  query: string
  selectedCompanyId: string
  onQueryChange: (query: string) => void
  onSelect: (company: Company) => void
  onCreate: (name: string) => void
  allowCreate?: boolean
  onRetry?: () => void
  onLoadMore?: () => void
  loading?: boolean
  loadingMore?: boolean
  hasMore?: boolean
  searchError?: string
  error?: string
  disabled?: boolean
}

type ResultsProps = CompanyComboboxProps & {
  id: string
  active: number
  canCreate: boolean
  exactMatch: boolean
  trimmedQuery: string
  setActive: (index: number) => void
  close: () => void
}

function CompanyResults(props: ResultsProps) {
  const { companies, id, active, selectedCompanyId, onSelect, setActive, close } = props
  return (
    <div
      id={`${id}-listbox`}
      role="listbox"
      aria-label="Company results"
      className="absolute top-full z-30 max-h-60 w-full overflow-y-auto overscroll-contain rounded-[10px] border border-border bg-page p-[6px] shadow-lg"
    >
      <SearchStatus {...props} />
      {companies.map((company, index) => (
        <button
          key={company.id}
          id={`${id}-option-${index}`}
          role="option"
          aria-selected={company.id === selectedCompanyId}
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onMouseMove={() => setActive(index)}
          onClick={() => {
            onSelect(company)
            close()
          }}
          className={`flex min-h-9 w-full items-center rounded-[6px] px-[10px] text-left text-sm text-heading ${active === index || company.id === selectedCompanyId ? 'bg-surface' : 'bg-page'}`}
        >
          <span className="min-w-0 break-words">{company.companyName}</span>
        </button>
      ))}
      {props.canCreate && (
        <button
          id={`${id}-option-${companies.length}`}
          role="option"
          aria-selected="false"
          type="button"
          onMouseDown={(event) => event.preventDefault()}
          onMouseMove={() => setActive(companies.length)}
          onClick={() => {
            props.onCreate(props.trimmedQuery)
            close()
          }}
          className={`mt-[2px] min-h-9 w-full rounded-[6px] px-[10px] text-left text-sm font-semibold text-heading ${active === companies.length ? 'bg-surface' : 'bg-page'}`}
        >
          Create company “{props.trimmedQuery}”
        </button>
      )}
      {props.exactMatch && props.trimmedQuery && (
        <p className="m-0 px-[10px] py-2 text-xs text-body">
          Select the existing company to avoid a duplicate.
        </p>
      )}
      {props.hasMore && !props.searchError && (
        <button
          type="button"
          disabled={props.loadingMore}
          onClick={props.onLoadMore}
          className="mt-1 min-h-9 w-full rounded-[6px] px-[10px] text-sm font-semibold text-heading disabled:text-disabled"
        >
          {props.loadingMore ? 'Loading…' : 'Load more companies'}
        </button>
      )}
    </div>
  )
}

function SearchStatus({
  loading,
  searchError,
  companies,
  onRetry,
}: Pick<ResultsProps, 'loading' | 'searchError' | 'companies' | 'onRetry'>) {
  if (loading && companies.length === 0) {
    return (
      <p role="status" className="m-0 px-[10px] py-2 text-sm text-body">
        Searching…
      </p>
    )
  }
  if (searchError) {
    return <SearchFailure message={searchError} onRetry={onRetry} />
  }
  return companies.length === 0 ? (
    <p className="m-0 px-[10px] py-2 text-sm text-body">No companies found.</p>
  ) : null
}

function SearchFailure({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-between gap-3 px-[10px] py-2 text-sm">
      <span role="alert" className="text-danger">
        {message}
      </span>
      {onRetry && (
        <button type="button" onClick={onRetry} className="font-semibold text-heading underline">
          Retry
        </button>
      )}
    </div>
  )
}

function bounded(index: number, count: number) {
  return count === 0 ? -1 : Math.min(count - 1, Math.max(0, index))
}

function activeOption(index: number, count: number) {
  return index < 0 ? -1 : bounded(index, count)
}

export default function CompanyCombobox(props: CompanyComboboxProps) {
  const id = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActive] = useState(-1)
  const trimmedQuery = props.query.trim()
  const exactMatch = props.companies.some(
    (company) =>
      company.companyName.localeCompare(trimmedQuery, undefined, { sensitivity: 'accent' }) === 0,
  )
  const canCreate = props.allowCreate !== false && Boolean(trimmedQuery) && !exactMatch
  const itemCount = props.companies.length + Number(canCreate)
  const active = activeOption(activeIndex, itemCount)
  const expanded = open && !props.disabled

  function chooseActive() {
    const company = props.companies[active]
    if (company) {
      props.onSelect(company)
    } else if (canCreate && active === props.companies.length) {
      props.onCreate(trimmedQuery)
    } else {
      return
    }
    setOpen(false)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    const actions: Partial<Record<string, () => void>> = {
      ArrowDown: () => setActive(bounded(active + 1, itemCount)),
      ArrowUp: () => setActive(bounded(active < 0 ? itemCount - 1 : active - 1, itemCount)),
      Home: () => setActive(bounded(0, itemCount)),
      End: () => setActive(itemCount - 1),
      Enter: chooseActive,
    }
    if (event.key === 'Escape' && expanded) {
      event.preventDefault()
      event.stopPropagation()
      setOpen(false)
      return
    }
    const action = actions[event.key]
    if (action && (event.key !== 'Enter' || expanded)) {
      event.preventDefault()
      setOpen(true)
      action()
    }
  }

  function handleChange(event: ChangeEvent<HTMLInputElement>) {
    props.onQueryChange(event.target.value)
    setOpen(true)
    setActive(-1)
  }

  function handleBlur(event: FocusEvent<HTMLDivElement>) {
    if (!event.currentTarget.contains(event.relatedTarget)) {
      setOpen(false)
    }
  }

  return (
    <div className="flex min-w-0 flex-col gap-[9px] text-left" onBlur={handleBlur}>
      <label
        id={`${id}-label`}
        htmlFor={id}
        className="text-sm leading-[16px] font-medium text-heading"
      >
        Company *
      </label>
      <div className="relative">
        <input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={expanded}
          aria-controls={`${id}-listbox`}
          aria-activedescendant={active >= 0 && expanded ? `${id}-option-${active}` : undefined}
          aria-labelledby={`${id}-label`}
          aria-describedby={props.error ? `${id}-error` : undefined}
          aria-invalid={Boolean(props.error)}
          aria-required="true"
          autoComplete="off"
          disabled={props.disabled}
          value={props.query}
          placeholder="Search companies"
          onChange={handleChange}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={`h-12 w-full min-w-0 rounded-[10px] border bg-page px-4 text-[15px] leading-[1.4] text-heading placeholder:text-body focus:outline-none disabled:cursor-not-allowed disabled:text-disabled ${props.error ? 'border-danger' : 'border-border focus:border-2 focus:border-heading'}`}
        />
        {expanded && (
          <CompanyResults
            {...props}
            id={id}
            active={active}
            canCreate={canCreate}
            exactMatch={exactMatch}
            trimmedQuery={trimmedQuery}
            setActive={setActive}
            close={() => setOpen(false)}
          />
        )}
      </div>
      {props.error && (
        <p id={`${id}-error`} role="alert" className="m-0 text-xs text-danger">
          {props.error}
        </p>
      )}
    </div>
  )
}
