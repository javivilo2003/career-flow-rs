import { useCallback, useEffect, useState } from 'react'

import { getApplications } from '../../apis/applications'
import { getCompany } from '../../apis/companies'
import { getContacts } from '../../apis/contacts'
import type { Company, Contact, JobApplication, Page } from '../../types/api'

type Section<T> = { data: T | null; loading: boolean; error: string | null; revision: number }
const section = <T>(): Section<T> => ({ data: null, loading: true, error: null, revision: 0 })

function useCompanySection(companyId: string | undefined) {
  const [state, setState] = useState<Section<Company>>(section)
  useEffect(() => {
    if (!companyId) {
      return
    }
    let cancelled = false
    void getCompany(companyId)
      .then((data) => {
        if (!cancelled) {
          setState((value) => ({ ...value, data, loading: false, error: null }))
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setState((value) => ({
            ...value,
            loading: false,
            error: reason instanceof Error ? reason.message : 'Could not load company.',
          }))
        }
      })
    return () => {
      cancelled = true
    }
  }, [companyId, state.revision])
  const retry = useCallback(
    () =>
      setState((value) => ({ ...value, loading: true, error: null, revision: value.revision + 1 })),
    [],
  )
  const synchronize = useCallback((data: Company) => setState((value) => ({ ...value, data })), [])
  return {
    state: companyId ? state : { ...state, loading: false, error: 'Company not found.' },
    retry,
    synchronize,
  }
}

function useApplicationsSection(companyId: string | undefined, page: number) {
  const [state, setState] = useState<Section<Page<JobApplication>>>(section)
  useEffect(() => {
    if (!companyId) {
      return
    }
    let cancelled = false
    void getApplications({ companyId, page, size: 10 })
      .then((data) => {
        if (!cancelled) {
          setState((value) => ({ ...value, data, loading: false, error: null }))
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setState((value) => ({
            ...value,
            loading: false,
            error: reason instanceof Error ? reason.message : 'Could not load applications.',
          }))
        }
      })
    return () => {
      cancelled = true
    }
  }, [companyId, page, state.revision])
  const retry = useCallback(
    () =>
      setState((value) => ({ ...value, loading: true, error: null, revision: value.revision + 1 })),
    [],
  )
  return { state, retry }
}

function useContactsSection(companyId: string | undefined, page: number) {
  const [state, setState] = useState<Section<Page<Contact>>>(section)
  useEffect(() => {
    if (!companyId) {
      return
    }
    let cancelled = false
    void getContacts({ companyId, page, size: 10 })
      .then((data) => {
        if (!cancelled) {
          setState((value) => ({ ...value, data, loading: false, error: null }))
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setState((value) => ({
            ...value,
            loading: false,
            error: reason instanceof Error ? reason.message : 'Could not load contacts.',
          }))
        }
      })
    return () => {
      cancelled = true
    }
  }, [companyId, page, state.revision])
  const retry = useCallback(
    () =>
      setState((value) => ({ ...value, loading: true, error: null, revision: value.revision + 1 })),
    [],
  )
  return { state, retry }
}

export default function useCompanyDetails(
  companyId: string | undefined,
  applicationPage: number,
  contactPage: number,
) {
  const company = useCompanySection(companyId)
  const applications = useApplicationsSection(companyId, applicationPage)
  const contacts = useContactsSection(companyId, contactPage)
  return {
    company: company.state,
    applications: applications.state,
    contacts: contacts.state,
    retryCompany: company.retry,
    retryApplications: applications.retry,
    retryContacts: contacts.retry,
    synchronizeCompany: company.synchronize,
    refreshApplications: applications.retry,
    refreshContacts: contacts.retry,
  }
}
