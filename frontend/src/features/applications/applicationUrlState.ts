import { APPLICATION_STATUSES, type ApplicationStatus } from '../../types/api'

export const APPLICATION_SORT_OPTIONS = [
  { sort: 'createdAt', direction: 'DESC', label: 'Recently added' },
  { sort: 'appliedAt', direction: 'DESC', label: 'Recently applied' },
] as const

export type ApplicationSort = (typeof APPLICATION_SORT_OPTIONS)[number]['sort']
export type ApplicationDirection = (typeof APPLICATION_SORT_OPTIONS)[number]['direction']

export type ApplicationUrlState = {
  status: ApplicationStatus
  position: string
  companyId: string
  sort: ApplicationSort
  direction: ApplicationDirection
  page: number
}

export const DEFAULT_APPLICATION_URL_STATE: ApplicationUrlState = {
  status: 'SAVED',
  position: '',
  companyId: '',
  sort: 'createdAt',
  direction: 'DESC',
  page: 1,
}

function isStatus(value: string | null): value is ApplicationStatus {
  return APPLICATION_STATUSES.some((status) => status === value)
}
function isSort(value: string | null): value is ApplicationSort {
  return APPLICATION_SORT_OPTIONS.some((option) => option.sort === value)
}
function positivePage(value: string | null) {
  if (!value || !/^\d+$/.test(value)) {
    return 1
  }
  const page = Number(value)
  return Number.isSafeInteger(page) && page > 0 ? page : 1
}

export function parseApplicationUrlState(input: URLSearchParams | string): ApplicationUrlState {
  const params = typeof input === 'string' ? new URLSearchParams(input) : input
  const status = params.get('status')
  const sort = params.get('sort')
  const direction = params.get('direction')
  return {
    status: isStatus(status) ? status : DEFAULT_APPLICATION_URL_STATE.status,
    position: params.get('position')?.trim() ?? '',
    companyId: params.get('companyId')?.trim() ?? '',
    sort: isSort(sort) && direction === 'DESC' ? sort : DEFAULT_APPLICATION_URL_STATE.sort,
    direction: 'DESC',
    page: positivePage(params.get('page')),
  }
}

const PAGE_RESET_KEYS: ReadonlyArray<keyof ApplicationUrlState> = [
  'status',
  'position',
  'companyId',
  'sort',
  'direction',
]

/** Returns normalized params while retaining query parameters owned by other features. */
export function updateApplicationUrlState(
  input: URLSearchParams | string,
  patch: Partial<ApplicationUrlState>,
): URLSearchParams {
  const params = new URLSearchParams(typeof input === 'string' ? input : input.toString())
  const current = parseApplicationUrlState(params)
  const next = { ...current, ...patch }
  const changedFilter = PAGE_RESET_KEYS.some((key) => key in patch && patch[key] !== current[key])
  const normalized = parseApplicationUrlState(
    new URLSearchParams({
      status: next.status,
      position: next.position,
      companyId: next.companyId,
      sort: next.sort,
      direction: next.direction,
      page: String(changedFilter && patch.page === undefined ? 1 : next.page),
    }),
  )
  params.set('status', normalized.status)
  if (normalized.position) {
    params.set('position', normalized.position)
  } else {
    params.delete('position')
  }
  if (normalized.companyId) {
    params.set('companyId', normalized.companyId)
  } else {
    params.delete('companyId')
  }
  params.set('sort', normalized.sort)
  params.set('direction', normalized.direction)
  params.set('page', String(normalized.page))
  return params
}

export function applicationApiPage(urlPage: number) {
  return Math.max(0, Math.floor(urlPage) - 1)
}
export function applicationsHref(params: URLSearchParams | string) {
  const query = typeof params === 'string' ? params.replace(/^\?/, '') : params.toString()
  return query ? `/applications?${query}` : '/applications'
}
export function applicationDetailsHref(id: string, params?: URLSearchParams | string) {
  const query = typeof params === 'string' ? params.replace(/^\?/, '') : params?.toString()
  return `/applications/${encodeURIComponent(id)}${query ? `?${query}` : ''}`
}
