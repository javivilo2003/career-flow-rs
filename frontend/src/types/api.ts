export type ApplicationStatus =
  | 'SAVED'
  | 'PREPARING'
  | 'APPLIED'
  | 'INTERVIEWING'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN'

export type InterviewStatus =
  | 'SCHEDULED'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'RESCHEDULED'
  | 'PASSED'
  | 'FAILED'
  | 'WAITING_FEEDBACK'

export type JobApplication = {
  id: string
  userId: string
  companyId: string
  position: string
  jobType: string
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
    code:
      | 'INVALID_REQUEST'
      | 'VALIDATION_ERROR'
      | 'NOT_FOUND'
      | 'CONFLICT'
      | 'INTERNAL_ERROR'
    message: string
    details?: Array<{
      field: string
      message: string
    }>
  }
}
