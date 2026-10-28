export const APPLICATION_STATUSES = [
  'SAVED',
  'PREPARING',
  'APPLIED',
  'INTERVIEWING',
  'OFFER',
  'REJECTED',
  'WITHDRAWN',
] as const

export type ApplicationStatus = (typeof APPLICATION_STATUSES)[number]

export type InterviewStatus =
  'SCHEDULED' | 'COMPLETED' | 'CANCELLED' | 'RESCHEDULED' | 'PASSED' | 'FAILED' | 'WAITING_FEEDBACK'

export type JobApplication = {
  id: string
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

export type Company = {
  id: string
  companyName: string
  companyAddress: string | null
  bio: string | null
  websiteUrl: string | null
}

export type Interview = {
  id: string
  jobApplicationId: string
  stage: string
  status: InterviewStatus
  interviewDate: string | null
  notes: string | null
}

export type Contact = {
  id: string
  companyId: string
  name: string
  phone: string | null
  email: string | null
  jobRole: string
}

export type FollowUp = {
  id: string
  jobApplicationId: string
  title: string
  dueDate: string | null
  completed: boolean
}

/** Follow-up wire shape. The API retains `applicationId`; the API adapter maps it to the domain name. */
export type FollowUpResponse = {
  id: string
  applicationId: string
  title: string
  dueDate: string
  completed: boolean
}

export type Note = {
  id: string
  jobApplicationId: string
  content: string
}

export type User = {
  id: string
  username: string
  dob: string | null
  cv: string
}

export type Page<T> = {
  content: T[]
  number: number
  size: number
  totalElements: number
  totalPages: number
  first: boolean
  last: boolean
  numberOfElements: number
  empty: boolean
}

export type ApiErrorResponse = {
  error: {
    code: 'INVALID_REQUEST' | 'VALIDATION_ERROR' | 'NOT_FOUND' | 'CONFLICT' | 'INTERNAL_ERROR'
    message: string
    details?: Array<{
      field: string
      message: string
    }>
  }
}
