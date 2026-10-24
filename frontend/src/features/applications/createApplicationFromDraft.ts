import { createApplication } from '../../api/applications'
import { createCompany, getCompanies } from '../../api/companies'
import type { ApplicationDraft, BadgeStatus } from '../../components'
import type { ApplicationStatus, Company } from '../../types/api'

const applicationStatusByBadge: Record<BadgeStatus, ApplicationStatus> = {
  Saved: 'SAVED',
  Applied: 'APPLIED',
  Interview: 'INTERVIEWING',
  Offer: 'OFFER',
  Rejected: 'REJECTED',
}

function findCompany(companies: Company[], companyName: string) {
  const normalizedName = companyName.trim().toLocaleLowerCase()

  return companies.find(
    (company) => company.companyName.trim().toLocaleLowerCase() === normalizedName,
  )
}

async function resolveCompanyId(companyName: string, companies: Company[]) {
  const existingCompany = findCompany(companies, companyName)

  if (existingCompany) {
    return existingCompany.id
  }

  try {
    await createCompany({
      companyName: companyName.trim(),
      companyAddress: null,
      bio: null,
      websiteUrl: null,
    })
  } catch (requestError) {
    const refreshedCompanies = await getCompanies()
    const concurrentlyCreatedCompany = findCompany(refreshedCompanies.content, companyName)

    if (concurrentlyCreatedCompany) {
      return concurrentlyCreatedCompany.id
    }

    throw requestError
  }

  const refreshedCompanies = await getCompanies()
  const createdCompany = findCompany(refreshedCompanies.content, companyName)

  if (!createdCompany) {
    throw new Error('The company was created, but it could not be loaded.')
  }

  return createdCompany.id
}

export async function createApplicationFromDraft(
  draft: ApplicationDraft,
  userId: string | undefined,
  companies: Company[],
) {
  if (!userId) {
    throw new Error('Create a user before adding an application.')
  }

  const companyId = await resolveCompanyId(draft.company, companies)

  await createApplication({
    userId,
    companyId,
    position: draft.role,
    jobType: 'Full-time',
    description: draft.notes.trim() || null,
    salary: null,
    status: applicationStatusByBadge[draft.status],
    appliedAt: null,
    source: 'Manual entry',
    postingLink: draft.url.trim() || null,
  })
}
