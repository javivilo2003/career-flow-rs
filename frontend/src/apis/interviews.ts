import type {
  ApiErrorResponse,
  Interview,
  InterviewStatus,
  JobApplication,
  Page,
} from '../types/api'
import { getApplication } from './applications'
import { getCompany } from './companies'

export type InterviewRequest = {
  jobApplicationId: string
  stage: string
  status: InterviewStatus
  interviewDate: string | null
  notes: string | null
}

export type GetInterviewsParams = {
  page?: number
  size?: number
  sort?: 'id' | 'stage' | 'status' | 'interviewDate'
  direction?: 'ASC' | 'DESC'
  status?: InterviewStatus
  jobApplicationId?: string
  interviewDateFrom?: string
  interviewDateTo?: string
}

export type InterviewDetails = {
  interview: Interview
  application: JobApplication
  companyName: string
}

export class InterviewApiError extends Error {
  readonly status: number
  readonly details: ApiErrorResponse['error']['details']

  constructor(message: string, status: number, details: ApiErrorResponse['error']['details'] = []) {
    super(message)
    this.name = 'InterviewApiError'
    this.status = status
    this.details = details
  }
}

async function apiError(response: Response, fallback: string): Promise<never> {
  try {
    const body = (await response.json()) as Partial<ApiErrorResponse>
    throw new InterviewApiError(
      body.error?.message ?? fallback,
      response.status,
      body.error?.details,
    )
  } catch (error) {
    if (error instanceof InterviewApiError) {
      throw error
    }
    throw new InterviewApiError(fallback, response.status)
  }
}

export function getLocalDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function addInterviewFilters(query: URLSearchParams, params: GetInterviewsParams) {
  const filters = [
    ['status', params.status],
    ['jobApplicationId', params.jobApplicationId],
    ['interviewDateFrom', params.interviewDateFrom],
    ['interviewDateTo', params.interviewDateTo],
  ] as const
  filters.forEach(([name, value]) => {
    if (value) {
      query.set(name, value)
    }
  })
}

export async function getInterviews({
  page = 0,
  size = 10,
  sort = 'interviewDate',
  direction = 'ASC',
  status,
  jobApplicationId,
  interviewDateFrom,
  interviewDateTo,
}: GetInterviewsParams = {}): Promise<Page<Interview>> {
  const query = new URLSearchParams({ page: String(page), size: String(size), sort, direction })
  addInterviewFilters(query, { status, jobApplicationId, interviewDateFrom, interviewDateTo })
  const response = await fetch(`/api/interviews?${query}`)
  if (!response.ok) {
    return apiError(response, 'Could not load interviews.')
  }
  return response.json() as Promise<Page<Interview>>
}

export async function getUpcomingInterviews(): Promise<Page<Interview>> {
  const today = getLocalDate()
  const [scheduled, rescheduled] = await Promise.all([
    getInterviews({ size: 5, direction: 'ASC', status: 'SCHEDULED', interviewDateFrom: today }),
    getInterviews({ size: 5, direction: 'ASC', status: 'RESCHEDULED', interviewDateFrom: today }),
  ])
  const content = [...scheduled.content, ...rescheduled.content]
    .sort((left, right) => (left.interviewDate ?? '').localeCompare(right.interviewDate ?? ''))
    .slice(0, 5)
  const totalElements = scheduled.totalElements + rescheduled.totalElements
  return {
    content,
    number: 0,
    size: 5,
    totalElements,
    totalPages: Math.ceil(totalElements / 5),
    first: true,
    last: totalElements <= 5,
    numberOfElements: content.length,
    empty: content.length === 0,
  }
}

export async function createInterview(request: InterviewRequest): Promise<Interview> {
  const response = await fetch('/api/interviews', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    return apiError(response, 'Could not add the interview.')
  }
  return response.json() as Promise<Interview>
}

export async function updateInterview(id: string, request: InterviewRequest): Promise<Interview> {
  const response = await fetch(`/api/interviews/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    return apiError(response, 'Could not update the interview.')
  }
  return response.json() as Promise<Interview>
}

export async function getInterviewDetails(interviews: Interview[]): Promise<InterviewDetails[]> {
  return Promise.all(
    interviews.map(async (interview) => {
      const application = await getApplication(interview.jobApplicationId)
      const company = await getCompany(application.companyId)
      return { interview, application, companyName: company.companyName }
    }),
  )
}
