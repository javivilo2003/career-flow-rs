import { getApplications } from '../../apis/applications'
import { getCompanies } from '../../apis/companies'
import { loadAllPages } from '../../apis/pagination'
import type { Company, JobApplication } from '../../types/api'

export type LoadedApplicationData = {
  applications: JobApplication[]
  companies: Company[]
  companyNames: Map<string, string>
}

export async function loadApplicationData(): Promise<LoadedApplicationData> {
  const [applications, companies] = await Promise.all([
    loadAllPages((page) => getApplications({ page, size: 100 })),
    loadAllPages((page) => getCompanies({ page, size: 100 })),
  ])
  const namesById = new Map(companies.map((company) => [company.id, company.companyName]))

  return {
    applications,
    companies,
    companyNames: namesById,
  }
}
