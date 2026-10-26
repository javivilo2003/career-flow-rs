import { getApplications } from '../../apis/applications'
import { getCompany } from '../../apis/companies'
import { getContacts } from '../../apis/contacts'
import { loadAllPages } from '../../apis/pagination'
import type { Company, Contact, JobApplication } from '../../types/api'

export type CompanyDetails = {
  company: Company
  applications: JobApplication[]
  contacts: Contact[]
}

export async function loadCompanyDetails(companyId: string): Promise<CompanyDetails> {
  const [company, applications, contacts] = await Promise.all([
    getCompany(companyId),
    loadAllPages((page) => getApplications({ page, size: 100, companyId })),
    loadAllPages((page) => getContacts({ page, size: 100, companyId })),
  ])

  return { company, applications, contacts }
}
