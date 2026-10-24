import { createApplication } from '../../apis/applications'
import type { ApplicationDraft, ApplicationDraftStatus } from '../../components'
import type { ApplicationStatus } from '../../types/api'

const applicationStatusByDraft: Record<ApplicationDraftStatus, ApplicationStatus> = {
  Saved: 'SAVED',
  Preparing: 'PREPARING',
  Applied: 'APPLIED',
  Interview: 'INTERVIEWING',
  Offer: 'OFFER',
  Rejected: 'REJECTED',
  Withdrawn: 'WITHDRAWN',
}

export async function createApplicationFromDraft(
  draft: ApplicationDraft,
  userId: string | undefined,
) {
  if (!userId) {
    throw new Error('Create a user before adding an application.')
  }
  if (!draft.companyId) {
    throw new Error('Choose an existing company before adding an application.')
  }

  await createApplication({
    userId,
    companyId: draft.companyId,
    position: draft.role,
    jobType: draft.jobType,
    description: draft.notes.trim() || null,
    salary: draft.salary,
    status: applicationStatusByDraft[draft.status],
    appliedAt: draft.appliedAt || null,
    source: draft.source,
    postingLink: draft.url.trim() || null,
  })
}
