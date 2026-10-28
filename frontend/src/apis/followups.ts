import type { ApiErrorResponse, FollowUp, FollowUpResponse, Page } from '../types/api'

export type FollowUpRequest = {
  applicationId: string
  title: string
  dueDate: string
  completed: boolean
}

export type GetFollowUpsParams = {
  page?: number
  size?: number
  sort?: 'id' | 'title' | 'dueDate' | 'completed'
  direction?: 'ASC' | 'DESC'
  applicationId?: string
  completed?: boolean
  dueDateFrom?: string
  dueDateTo?: string
}

export class FollowUpApiError extends Error {
  readonly status: number
  readonly details: ApiErrorResponse['error']['details']

  constructor(message: string, status: number, details: ApiErrorResponse['error']['details'] = []) {
    super(message)
    this.name = 'FollowUpApiError'
    this.status = status
    this.details = details
  }
}

async function apiError(response: Response, fallback: string): Promise<never> {
  try {
    const body = (await response.json()) as Partial<ApiErrorResponse>
    throw new FollowUpApiError(
      body.error?.message ?? fallback,
      response.status,
      body.error?.details,
    )
  } catch (error) {
    if (error instanceof FollowUpApiError) {
      throw error
    }
    throw new FollowUpApiError(fallback, response.status)
  }
}

/** Explicitly adapts the backend's applicationId wire name to the domain model. */
export function followUpFromResponse(response: FollowUpResponse): FollowUp {
  return {
    id: response.id,
    jobApplicationId: response.applicationId,
    title: response.title,
    dueDate: response.dueDate,
    completed: response.completed,
  }
}

function pageFromResponse(page: Page<FollowUpResponse>): Page<FollowUp> {
  return { ...page, content: page.content.map(followUpFromResponse) }
}

function addFilters(query: URLSearchParams, params: GetFollowUpsParams) {
  const filters = [
    ['applicationId', params.applicationId],
    ['completed', params.completed === undefined ? undefined : String(params.completed)],
    ['dueDateFrom', params.dueDateFrom],
    ['dueDateTo', params.dueDateTo],
  ] as const
  filters.forEach(([name, value]) => {
    if (value !== undefined) {
      query.set(name, value)
    }
  })
}

export async function getFollowUps({
  page = 0,
  size = 10,
  sort = 'dueDate',
  direction = 'ASC',
  applicationId,
  completed,
  dueDateFrom,
  dueDateTo,
}: GetFollowUpsParams = {}): Promise<Page<FollowUp>> {
  const query = new URLSearchParams({ page: String(page), size: String(size), sort, direction })
  addFilters(query, { applicationId, completed, dueDateFrom, dueDateTo })
  const response = await fetch(`/api/followups?${query}`)
  if (!response.ok) {
    return apiError(response, 'Could not load follow-ups.')
  }
  return pageFromResponse((await response.json()) as Page<FollowUpResponse>)
}

export async function getFollowUp(id: string): Promise<FollowUp> {
  const response = await fetch(`/api/followups/${encodeURIComponent(id)}`)
  if (!response.ok) {
    return apiError(response, 'Could not load the follow-up.')
  }
  return followUpFromResponse((await response.json()) as FollowUpResponse)
}

export async function createFollowUp(request: FollowUpRequest): Promise<FollowUp> {
  const response = await fetch('/api/followups', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    return apiError(response, 'Could not add the follow-up.')
  }
  return followUpFromResponse((await response.json()) as FollowUpResponse)
}

export async function updateFollowUp(id: string, request: FollowUpRequest): Promise<FollowUp> {
  const response = await fetch(`/api/followups/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    return apiError(response, 'Could not update the follow-up.')
  }
  return followUpFromResponse((await response.json()) as FollowUpResponse)
}
