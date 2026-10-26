import { createApplication } from '../../apis/applications'
import type { ApplicationDraft, ApplicationDraftStatus } from '../../components'
import type { ApplicationStatus, JobApplication } from '../../types/api'

const applicationStatusByDraft: Record<ApplicationDraftStatus, ApplicationStatus> = {
  Saved: 'SAVED',
  Preparing: 'PREPARING',
  Applied: 'APPLIED',
  Interview: 'INTERVIEWING',
  Offer: 'OFFER',
  Rejected: 'REJECTED',
  Withdrawn: 'WITHDRAWN',
}

export async function createApplicationFromDraft(draft: ApplicationDraft): Promise<JobApplication> {
  if (!draft.companyId) {
    throw new Error('Select a company or create a new one before adding an application.')
  }

  const status = applicationStatusByDraft[draft.status]

  return createApplication({
    companyId: draft.companyId,
    position: draft.role,
    jobType: draft.jobType.trim() || null,
    description: draft.notes.trim() || null,
    salary: draft.salary,
    status,
    appliedAt: draft.appliedAt || null,
    source: draft.source,
    postingLink: draft.url.trim() || null,
  })
}
