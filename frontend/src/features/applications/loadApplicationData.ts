import { getApplications } from '../../api/applications'
import { getCompanies } from '../../api/companies'
import { getUsers } from '../../api/users'
import type { Company, JobApplication, User } from '../../types/api'

export type LoadedApplicationData = {
  applications: JobApplication[]
  companies: Company[]
  users: User[]
  companyNames: Map<string, string>
}

export async function loadApplicationData(): Promise<LoadedApplicationData> {
  const [applicationsPage, companiesPage, usersList] = await Promise.all([
    getApplications(),
    getCompanies(),
    getUsers(),
  ])
  const namesById = new Map(
    companiesPage.content.map((company) => [company.id, company.companyName]),
  )

  return {
    applications: applicationsPage.content,
    companies: companiesPage.content,
    users: usersList,
    companyNames: namesById,
  }
}
