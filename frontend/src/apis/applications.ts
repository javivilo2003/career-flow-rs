import type {
  ApiErrorResponse,
  ApplicationStatus,
  ApplicationStatusEvent,
  JobApplication,
  Page,
} from '../types/api'

export type JobApplicationRequest = {
  userId?: string | null
  companyId: string
  position: string
  jobType?: string | null
  description?: string | null
  salary?: number | null
  status: ApplicationStatus
  appliedAt?: string | null
  source: string
  postingLink?: string | null
}

export type GetApplicationsParams = {
  page?: number
  size?: number
  sort?: string
  direction?: 'ASC' | 'DESC'
  status?: ApplicationStatus
  companyId?: string
  position?: string
}

/** PUT is a full-resource update. Keep every field, including the persisted owner. */
export type UpdateApplicationRequest = {
  userId: string
  companyId: string
  position: string
  jobType: string | null
  description: string | null
  salary: number | null
  status: ApplicationStatus
  appliedAt: string | null
  source: string
  postingLink: string | null
}

export type ApplicationApiErrorDetail = {
  field: string
  message: string
}

function addOptionalApplicationFilters(query: URLSearchParams, params: GetApplicationsParams) {
  const filters = [
    ['status', params.status],
    ['companyId', params.companyId],
    ['position', params.position?.trim()],
  ] as const

  filters.forEach(([name, value]) => {
    if (value) {
      query.set(name, value)
    }
  })
}

export class ApplicationApiError extends Error {
  readonly status: number
  readonly code?: ApiErrorResponse['error']['code']
  readonly details: ApplicationApiErrorDetail[]

  constructor(
    message: string,
    options: {
      status: number
      code?: ApiErrorResponse['error']['code']
      details?: ApplicationApiErrorDetail[]
    },
  ) {
    super(message)
    this.name = 'ApplicationApiError'
    this.status = options.status
    this.code = options.code
    this.details = options.details ?? []
  }
}

const API_ERROR_CODES = new Set<ApiErrorResponse['error']['code']>([
  'INVALID_REQUEST',
  'VALIDATION_ERROR',
  'NOT_FOUND',
  'CONFLICT',
  'INTERNAL_ERROR',
])

function isApiErrorDetail(value: unknown): value is ApplicationApiErrorDetail {
  return (
    !!value &&
    typeof value === 'object' &&
    'field' in value &&
    typeof value.field === 'string' &&
    'message' in value &&
    typeof value.message === 'string'
  )
}

function isApiErrorCode(value: unknown): value is ApiErrorResponse['error']['code'] {
  return (
    typeof value === 'string' && API_ERROR_CODES.has(value as ApiErrorResponse['error']['code'])
  )
}

function isApiErrorDetails(value: unknown): value is ApplicationApiErrorDetail[] | undefined {
  return value === undefined || (Array.isArray(value) && value.every(isApiErrorDetail))
}

function isApiError(value: unknown): value is ApiErrorResponse['error'] {
  return (
    !!value &&
    typeof value === 'object' &&
    'code' in value &&
    isApiErrorCode(value.code) &&
    'message' in value &&
    typeof value.message === 'string' &&
    (!('details' in value) || isApiErrorDetails(value.details))
  )
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  if (!value || typeof value !== 'object' || !('error' in value)) {
    return false
  }

  return isApiError(value.error)
}

async function throwApiError(response: Response, fallbackMessage: string): Promise<never> {
  let responseBody: unknown

  try {
    responseBody = await response.json()
  } catch {
    throw new ApplicationApiError(fallbackMessage, { status: response.status })
  }

  if (!isApiErrorResponse(responseBody)) {
    throw new ApplicationApiError(fallbackMessage, { status: response.status })
  }

  throw new ApplicationApiError(responseBody.error.message, {
    status: response.status,
    code: responseBody.error.code,
    details: responseBody.error.details,
  })
}

export async function getApplications({
  page = 0,
  size = 25,
  sort = 'createdAt',
  direction = 'DESC',
  status,
  companyId,
  position,
}: GetApplicationsParams = {}): Promise<Page<JobApplication>> {
  const query = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort,
    direction,
  })

  addOptionalApplicationFilters(query, { status, companyId, position })

  const response = await fetch(`/api/applications?${query}`)

  if (!response.ok) {
    return throwApiError(response, 'Could not load applications.')
  }

  return response.json() as Promise<Page<JobApplication>>
}

export async function getApplication(id: string): Promise<JobApplication> {
  const response = await fetch(`/api/applications/${encodeURIComponent(id)}`)

  if (!response.ok) {
    return throwApiError(response, 'Could not load the application.')
  }

  return response.json() as Promise<JobApplication>
}

export async function getApplicationHistory(id: string): Promise<ApplicationStatusEvent[]> {
  const response = await fetch(`/api/applications/${encodeURIComponent(id)}/history`)

  if (!response.ok) {
    return throwApiError(response, 'Could not load application activity.')
  }

  return response.json() as Promise<ApplicationStatusEvent[]>
}

export async function createApplication(
  application: JobApplicationRequest,
): Promise<JobApplication> {
  const {
    userId,
    companyId,
    position,
    jobType,
    description,
    salary,
    status,
    appliedAt,
    source,
    postingLink,
  } = application
  const response = await fetch('/api/applications', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId,
      companyId,
      position,
      jobType,
      description,
      salary,
      status,
      appliedAt,
      source,
      postingLink,
    }),
  })

  if (!response.ok) {
    return throwApiError(response, 'Could not create the application.')
  }

  return response.json() as Promise<JobApplication>
}

export async function updateApplication(
  id: string,
  application: UpdateApplicationRequest,
): Promise<JobApplication> {
  const response = await fetch(`/api/applications/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(application),
  })

  if (!response.ok) {
    return throwApiError(response, 'Could not update the application.')
  }

  return response.json() as Promise<JobApplication>
}

export async function deleteApplication(id: string): Promise<void> {
  const response = await fetch(`/api/applications/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  })

  if (!response.ok) {
    return throwApiError(response, 'Could not delete the application.')
  }
}

export function applicationUpdateRequest(application: JobApplication): UpdateApplicationRequest {
  return {
    userId: application.userId,
    companyId: application.companyId,
    position: application.position,
    jobType: application.jobType,
    description: application.description,
    salary: application.salary,
    status: application.status,
    appliedAt: application.appliedAt,
    source: application.source,
    postingLink: application.postingLink,
  }
}
