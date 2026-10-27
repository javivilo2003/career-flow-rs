import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import {
  applicationUpdateRequest,
  deleteApplication,
  updateApplication,
} from '../../apis/applications'
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type Company,
  type JobApplication,
  type Page,
} from '../../types/api'
import {
  applicationApiPage,
  type ApplicationUrlState,
  DEFAULT_APPLICATION_URL_STATE,
} from './applicationUrlState'
import {
  type ApplicationStatusCounts,
  loadApplicationData,
  type LoadApplicationDataParams,
  type LoadedApplicationData,
} from './loadApplicationData'

const PAGE_SIZE = 25
const EMPTY_COUNTS = Object.fromEntries(
  APPLICATION_STATUSES.map((status) => [status, 0]),
) as ApplicationStatusCounts
const EMPTY_PAGE: Page<JobApplication> = {
  content: [],
  number: 0,
  size: PAGE_SIZE,
  totalElements: 0,
  totalPages: 0,
  first: true,
  last: true,
  numberOfElements: 0,
  empty: true,
}

export type UseApplicationsDataOptions = {
  filters?: ApplicationUrlState
  searchDebounceMs?: number
}

export type ApplicationsDataState = LoadedApplicationData & {
  isLoading: boolean
  isRefreshing: boolean
  error: string | null
  refreshError: string | null
  isEmpty: boolean
  isEmptyFilterResult: boolean
  isCurrentData: boolean
  refresh: () => Promise<LoadedApplicationData>
  synchronizeApplication: (application: JobApplication) => void
  synchronizeCompany: (company: Company) => void
  creationFallback: JobApplication | null
  applicationCreated: (
    application: JobApplication,
    destination?: ApplicationUrlState,
  ) => Promise<void>
  applicationUpdated: (application: JobApplication) => Promise<void>
  changeStatus: (application: JobApplication, status: ApplicationStatus) => Promise<JobApplication>
  removeApplication: (application: JobApplication) => Promise<void>
}

type SetData = React.Dispatch<React.SetStateAction<LoadedApplicationData>>

function errorMessage(reason: unknown) {
  return reason instanceof Error ? reason.message : 'Could not load applications.'
}

function useApplicationDataState() {
  const [data, setData] = useState<LoadedApplicationData>({
    page: EMPTY_PAGE,
    applications: [],
    companies: [],
    companyNames: new Map(),
    statusCounts: EMPTY_COUNTS,
  })
  const [hasLoaded, setHasLoaded] = useState(false)
  const [loadedFilterKey, setLoadedFilterKey] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [creationFallback, setCreationFallback] = useState<{
    application: JobApplication
    filterKey: string
  } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [refreshError, setRefreshError] = useState<string | null>(null)
  const hasLoadedRef = useRef(false)
  const apply = useCallback((next: LoadedApplicationData, filterKey: string) => {
    setData(next)
    setCreationFallback((current) => (current?.filterKey === filterKey ? null : current))
    setHasLoaded(true)
    setLoadedFilterKey(filterKey)
    hasLoadedRef.current = true
    setError(null)
  }, [])
  return {
    data,
    setData,
    hasLoaded,
    loadedFilterKey,
    isRefreshing,
    setIsRefreshing,
    creationFallback,
    setCreationFallback,
    error,
    setError,
    refreshError,
    setRefreshError,
    hasLoadedRef,
    apply,
  }
}

type LoaderArgs = {
  requestParams: LoadApplicationDataParams
  filterKey: string
  debounceMs: number
  apply: (next: LoadedApplicationData, filterKey: string) => void
  setIsRefreshing: (value: boolean) => void
  setError: (value: string | null) => void
  setRefreshError: (value: string | null) => void
  hasLoadedRef: React.RefObject<boolean>
}

function useAutomaticApplicationLoad(args: LoaderArgs, requestRef: React.RefObject<number>) {
  const { requestParams, filterKey, debounceMs } = args
  useEffect(() => {
    const id = ++requestRef.current
    if (args.hasLoadedRef.current) {
      args.setIsRefreshing(true)
    }
    const timer = window.setTimeout(() => {
      args.setRefreshError(null)
      if (!args.hasLoadedRef.current) {
        args.setError(null)
      }
      void loadApplicationData(requestParams)
        .then((next) => {
          if (requestRef.current === id) {
            args.apply(next, args.filterKey)
          }
        })
        .catch((reason: unknown) => {
          if (requestRef.current !== id) {
            return
          }
          const message = errorMessage(reason)
          if (args.hasLoadedRef.current) {
            args.setRefreshError(message)
          } else {
            args.setError(message)
          }
        })
        .finally(() => {
          if (requestRef.current === id) {
            args.setIsRefreshing(false)
          }
        })
    }, debounceMs)
    return () => {
      window.clearTimeout(timer)
      if (requestRef.current === id) {
        requestRef.current += 1
      }
    }
  }, [args, debounceMs, filterKey, requestParams, requestRef])
}

function useApplicationDataLoader(args: LoaderArgs) {
  const requestRef = useRef(0)
  useAutomaticApplicationLoad(args, requestRef)
  const refresh = useCallback(async () => {
    const id = ++requestRef.current
    args.setIsRefreshing(true)
    args.setRefreshError(null)
    try {
      const next = await loadApplicationData(args.requestParams)
      if (requestRef.current === id) {
        args.apply(next, args.filterKey)
      }
      return next
    } catch (reason) {
      if (requestRef.current === id) {
        args.setRefreshError(errorMessage(reason))
      }
      throw reason
    } finally {
      if (requestRef.current === id) {
        args.setIsRefreshing(false)
      }
    }
  }, [args])
  return refresh
}

function matchesSharedFilters(application: JobApplication, filters: ApplicationUrlState) {
  const positionMatches = application.position
    .toLocaleLowerCase()
    .includes(filters.position.trim().toLocaleLowerCase())
  return positionMatches && (!filters.companyId || application.companyId === filters.companyId)
}

function adjustCount(counts: ApplicationStatusCounts, status: ApplicationStatus, delta: number) {
  return { ...counts, [status]: Math.max(0, counts[status] + delta) }
}

function pageWithCreated(page: Page<JobApplication>, application: JobApplication) {
  const content = [application, ...page.content.filter(({ id }) => id !== application.id)].slice(
    0,
    page.size,
  )
  const totalElements = page.totalElements + 1
  const totalPages = Math.ceil(totalElements / page.size)
  return {
    ...page,
    content,
    totalElements,
    totalPages,
    numberOfElements: content.length,
    empty: false,
    last: page.number + 1 >= totalPages,
  }
}

function insertCreatedApplication(
  current: LoadedApplicationData,
  application: JobApplication,
  filters: ApplicationUrlState,
) {
  if (!matchesSharedFilters(application, filters)) {
    return current
  }
  const statusCounts = adjustCount(current.statusCounts, application.status, 1)
  if (filters.status !== application.status || current.page.number !== 0) {
    return { ...current, statusCounts }
  }
  const page = pageWithCreated(current.page, application)
  return { ...current, page, applications: page.content, statusCounts }
}

function replaceApplication(current: LoadedApplicationData, application: JobApplication) {
  const replace = (item: JobApplication) => (item.id === application.id ? application : item)
  const content = current.page.content.map(replace)
  return { ...current, applications: content, page: { ...current.page, content } }
}

function removeFromPage(page: Page<JobApplication>, applicationId: string) {
  const content = page.content.filter(({ id }) => id !== applicationId)
  const totalElements = Math.max(0, page.totalElements - 1)
  const totalPages = Math.ceil(totalElements / page.size)
  return {
    ...page,
    content,
    totalElements,
    totalPages,
    numberOfElements: content.length,
    empty: content.length === 0,
    last: page.number + 1 >= totalPages,
  }
}

function reconcileApplicationUpdate(
  current: LoadedApplicationData,
  previous: JobApplication,
  updated: JobApplication,
  filters: ApplicationUrlState,
) {
  const replaced = replaceApplication(current, updated)
  const wasIncluded = matchesSharedFilters(previous, filters)
  const isIncluded = matchesSharedFilters(updated, filters)
  let statusCounts = replaced.statusCounts
  if (wasIncluded) {
    statusCounts = adjustCount(statusCounts, previous.status, -1)
  }
  if (isIncluded) {
    statusCounts = adjustCount(statusCounts, updated.status, 1)
  }
  const wasVisible = wasIncluded && filters.status === previous.status
  const isVisible = isIncluded && filters.status === updated.status
  if (wasVisible && !isVisible) {
    const page = removeFromPage(replaced.page, updated.id)
    return { ...replaced, page, applications: page.content, statusCounts }
  }
  if (!wasVisible && isVisible && replaced.page.number === 0) {
    const page = pageWithCreated(replaced.page, updated)
    return { ...replaced, page, applications: page.content, statusCounts }
  }
  return { ...replaced, statusCounts }
}

async function refreshAfterMutation(refresh: () => Promise<LoadedApplicationData>) {
  try {
    await refresh()
  } catch {
    // Persistence succeeded. The hook exposes refreshError without repeating the mutation.
  }
}

function useApplicationSynchronization(setData: SetData) {
  const synchronizeApplication = useCallback(
    (application: JobApplication) => setData((current) => replaceApplication(current, application)),
    [setData],
  )
  const synchronizeCompany = useCallback(
    (company: Company) =>
      setData((current) => ({
        ...current,
        companies: current.companies.some(({ id }) => id === company.id)
          ? current.companies.map((item) => (item.id === company.id ? company : item))
          : [...current.companies, company],
        companyNames: new Map(current.companyNames).set(company.id, company.companyName),
      })),
    [setData],
  )
  return { synchronizeApplication, synchronizeCompany }
}

type MutationArgs = {
  filters: ApplicationUrlState
  setData: SetData
  refresh: () => Promise<LoadedApplicationData>
  setCreationFallback: React.Dispatch<
    React.SetStateAction<{ application: JobApplication; filterKey: string } | null>
  >
}

function applicationFilterKey(filters: ApplicationUrlState) {
  return `${filters.status}|${filters.position}|${filters.companyId}|${filters.sort}|${filters.direction}|${filters.page}`
}

function useApplicationMutations(args: MutationArgs) {
  const applicationCreated = useCallback(
    (application: JobApplication, destination?: ApplicationUrlState) => {
      const target = destination ?? {
        ...args.filters,
        status: application.status,
        position: '',
        companyId: '',
        page: 1,
      }
      args.setData((current) => insertCreatedApplication(current, application, args.filters))
      args.setCreationFallback({ application, filterKey: applicationFilterKey(target) })
      return Promise.resolve()
    },
    [args],
  )
  const applicationUpdated = useCallback(
    async (application: JobApplication) => {
      args.setData((current) => {
        const previous = current.page.content.find(({ id }) => id === application.id)
        return previous
          ? reconcileApplicationUpdate(current, previous, application, args.filters)
          : replaceApplication(current, application)
      })
      await refreshAfterMutation(args.refresh)
    },
    [args],
  )
  const changeStatus = useCallback(
    async (application: JobApplication, status: ApplicationStatus) => {
      const updated = await updateApplication(application.id, {
        ...applicationUpdateRequest(application),
        status,
      })
      args.setData((current) =>
        reconcileApplicationUpdate(current, application, updated, args.filters),
      )
      await refreshAfterMutation(args.refresh)
      return updated
    },
    [args],
  )
  const removeApplication = useCallback(
    async (application: JobApplication) => {
      await deleteApplication(application.id)
      args.setData((current) => {
        const page = removeFromPage(current.page, application.id)
        const statusCounts = matchesSharedFilters(application, args.filters)
          ? adjustCount(current.statusCounts, application.status, -1)
          : current.statusCounts
        return { ...current, applications: page.content, statusCounts, page }
      })
      await refreshAfterMutation(args.refresh)
    },
    [args],
  )
  return { applicationCreated, applicationUpdated, changeStatus, removeApplication }
}

function currentCreationFallback(
  fallback: { application: JobApplication; filterKey: string } | null,
  filterKey: string,
) {
  return fallback?.filterKey === filterKey ? fallback.application : null
}

function useApplicationRequestParams(filters: ApplicationUrlState) {
  return useMemo<LoadApplicationDataParams>(
    () => ({
      page: applicationApiPage(filters.page),
      size: PAGE_SIZE,
      status: filters.status,
      position: filters.position || undefined,
      companyId: filters.companyId || undefined,
      sort: filters.sort,
      direction: filters.direction,
    }),
    [
      filters.companyId,
      filters.direction,
      filters.page,
      filters.position,
      filters.sort,
      filters.status,
    ],
  )
}

export default function useApplicationsData({
  filters = DEFAULT_APPLICATION_URL_STATE,
  searchDebounceMs = 300,
}: UseApplicationsDataOptions = {}): ApplicationsDataState {
  const filterKey = applicationFilterKey(filters)
  const requestParams = useApplicationRequestParams(filters)
  const state = useApplicationDataState()
  const loaderArgs = useMemo<LoaderArgs>(
    () => ({
      requestParams,
      filterKey,
      debounceMs: searchDebounceMs,
      apply: state.apply,
      setIsRefreshing: state.setIsRefreshing,
      setError: state.setError,
      setRefreshError: state.setRefreshError,
      hasLoadedRef: state.hasLoadedRef,
    }),
    [
      filterKey,
      requestParams,
      searchDebounceMs,
      state.apply,
      state.hasLoadedRef,
      state.setError,
      state.setIsRefreshing,
      state.setRefreshError,
    ],
  )
  const refresh = useApplicationDataLoader(loaderArgs)
  const synchronization = useApplicationSynchronization(state.setData)
  const mutations = useApplicationMutations({
    filters,
    setData: state.setData,
    refresh,
    setCreationFallback: state.setCreationFallback,
  })
  const activeFilters = Boolean(filters.position || filters.companyId)
  const isCurrentData = state.loadedFilterKey === filterKey
  const matchingApplicationCount = Object.values(state.data.statusCounts).reduce(
    (total, count) => total + count,
    0,
  )
  return {
    ...state.data,
    isLoading: !state.hasLoaded && !state.error,
    isRefreshing: state.isRefreshing,
    error: state.error,
    refreshError: state.refreshError,
    isEmpty: isCurrentData && !activeFilters && matchingApplicationCount === 0,
    isEmptyFilterResult: isCurrentData && activeFilters && matchingApplicationCount === 0,
    isCurrentData,
    creationFallback: currentCreationFallback(state.creationFallback, filterKey),
    refresh,
    ...synchronization,
    ...mutations,
  }
}
