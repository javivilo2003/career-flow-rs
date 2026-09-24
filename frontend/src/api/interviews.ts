import { getApplication } from './applications'
import { getCompany } from './companies'
import type {
  Interview,
  InterviewStatus,
  JobApplication,
  Page,
} from '../types/api'

type GetInterviewsParams = {
  page?: number
  size?: number
  sort?: string
  direction?: 'ASC' | 'DESC'
  status?: InterviewStatus
  interviewDateFrom?: string
  interviewDateTo?: string
}

export type InterviewDetails = {
  interview: Interview
  application: JobApplication
  companyName: string
}

function getLocalDate(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

export async function getInterviews({
  page = 0,
  size = 10,
  sort = 'interviewDate',
  direction = 'DESC',
  status,
  interviewDateFrom,
  interviewDateTo,
}: GetInterviewsParams = {}): Promise<Page<Interview>> {
  const query = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort,
    direction,
  })

  if (status) {
    query.set('status', status)
  }

  if (interviewDateFrom) {
    query.set('interviewDateFrom', interviewDateFrom)
  }

  if (interviewDateTo) {
    query.set('interviewDateTo', interviewDateTo)
  }

  const response = await fetch(`/api/interviews?${query}`)

  if (!response.ok) {
    throw new Error('Could not load interviews.')
  }

  return response.json() as Promise<Page<Interview>>
}

export function getUpcomingInterviews(): Promise<Page<Interview>> {
  return getInterviews({
    size: 5,
    direction: 'ASC',
    status: 'SCHEDULED',
    interviewDateFrom: getLocalDate(),
  })
}

export async function getInterviewDetails(
  interviews: Interview[],
): Promise<InterviewDetails[]> {
  return Promise.all(
    interviews.map(async (interview) => {
      const application = await getApplication(interview.jobApplicationId)
      const company = await getCompany(application.companyId)

      return {
        interview,
        application,
        companyName: company.companyName,
      }
    }),
  )
}
