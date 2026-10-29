import { type Dispatch, type SetStateAction, useCallback, useEffect, useState } from 'react'

import { getCompany } from '../../apis/companies'
import type { Company, Contact } from '../../types/api'

type CompanySelection = {
  companyId: string | null
  company?: Company
  query: string
  loading: boolean
  error: string | null
}

const emptySelection: CompanySelection = {
  companyId: null,
  query: '',
  loading: false,
  error: null,
}

function useLoadContactCompany(
  companyId: string | null,
  revision: number,
  setSelection: Dispatch<SetStateAction<CompanySelection>>,
) {
  useEffect(() => {
    if (!companyId) {
      return
    }
    let cancelled = false
    void getCompany(companyId)
      .then((company) => {
        if (!cancelled) {
          setSelection({
            companyId,
            company,
            query: company.companyName,
            loading: false,
            error: null,
          })
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setSelection({
            companyId,
            query: '',
            loading: false,
            error:
              reason instanceof Error ? reason.message : 'Could not load the selected company.',
          })
        }
      })
    return () => {
      cancelled = true
    }
  }, [companyId, revision, setSelection])
}

export function useContactCompanySelection(initialCompanyId: string | null) {
  const [selection, setSelection] = useState<CompanySelection>(emptySelection)
  const [revision, setRevision] = useState(0)
  useLoadContactCompany(initialCompanyId, revision, setSelection)
  const retry = useCallback(() => {
    setSelection((current) => ({ ...current, loading: true, error: null }))
    setRevision((value) => value + 1)
  }, [])
  function clear() {
    setSelection(emptySelection)
  }
  function select(value: Company) {
    setSelection({
      companyId: value.id,
      company: value,
      query: value.companyName,
      loading: false,
      error: null,
    })
  }
  const matchesUrl = selection.companyId === initialCompanyId
  return {
    company: matchesUrl ? selection.company : undefined,
    query: selection.companyId === null || matchesUrl ? selection.query : '',
    loading: Boolean(initialCompanyId && (!matchesUrl || selection.loading)),
    error: matchesUrl ? selection.error : null,
    retry,
    setQuery: (query: string) =>
      setSelection({ companyId: null, company: undefined, query, loading: false, error: null }),
    clear,
    select,
  }
}

export function useContactCompanyNames(contacts: readonly Contact[], selected?: Company) {
  const [names, setNames] = useState<Map<string, string>>(new Map())
  useEffect(() => {
    const known = selected ? new Map(names).set(selected.id, selected.companyName) : names
    const missing = [...new Set(contacts.map((contact) => contact.companyId))].filter(
      (id) => !known.has(id),
    )
    if (!missing.length) {
      return
    }
    let cancelled = false
    void Promise.all(missing.map((id) => getCompany(id)))
      .then((companies) => {
        if (!cancelled) {
          setNames(
            (current) =>
              new Map([
                ...current,
                ...companies.map((item) => [item.id, item.companyName] as const),
              ]),
          )
        }
      })
      .catch(() => undefined)
    return () => {
      cancelled = true
    }
  }, [contacts, names, selected])
  if (selected && names.get(selected.id) !== selected.companyName) {
    return new Map(names).set(selected.id, selected.companyName)
  }
  return names
}
