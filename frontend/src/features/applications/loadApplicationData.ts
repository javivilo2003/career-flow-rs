import { getApplications, type GetApplicationsParams } from '../../apis/applications'
import { getCompany } from '../../apis/companies'
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type Company,
  type JobApplication,
  type Page,
} from '../../types/api'

export type ApplicationStatusCounts = Record<ApplicationStatus, number>

export type LoadApplicationDataParams = Pick<
  GetApplicationsParams,
  'page' | 'size' | 'status' | 'position' | 'companyId' | 'sort' | 'direction'
>

export type LoadedApplicationData = {
  page: Page<JobApplication>
  applications: JobApplication[]
  companies: Company[]
  companyNames: Map<string, string>
  statusCounts: ApplicationStatusCounts
}

async function loadVisibleCompanies(applications: JobApplication[], selectedCompanyId?: string) {
  const ids = [
    ...new Set([
      ...applications.map((application) => application.companyId),
      ...(selectedCompanyId ? [selectedCompanyId] : []),
    ]),
  ]
  const results = await Promise.allSettled(ids.map((id) => getCompany(id)))
  return results.flatMap((result) => (result.status === 'fulfilled' ? [result.value] : []))
}

async function loadBoundedApplicationPage(params: LoadApplicationDataParams) {
  const page = await getApplications({ ...params, size: params.size ?? 25 })
  const requestedPage = params.page ?? 0
  if (requestedPage === 0 || requestedPage < page.totalPages) {
    return page
  }
  const boundedPage = page.totalPages === 0 ? 0 : page.totalPages - 1
  return getApplications({ ...params, page: boundedPage, size: params.size ?? 25 })
}

export async function loadApplicationData(
  params: LoadApplicationDataParams = {},
): Promise<LoadedApplicationData> {
  const sharedFilters = {
    position: params.position,
    companyId: params.companyId,
  }
  const [page, countPages] = await Promise.all([
    loadBoundedApplicationPage(params),
    Promise.all(
      APPLICATION_STATUSES.map((status) =>
        getApplications({ ...sharedFilters, status, page: 0, size: 1 }),
      ),
    ),
  ])
  const companies = await loadVisibleCompanies(page.content, params.companyId)
  const companyNames = new Map(companies.map((company) => [company.id, company.companyName]))
  const statusCounts = Object.fromEntries(
    APPLICATION_STATUSES.map((status, index) => [status, countPages[index].totalElements]),
  ) as ApplicationStatusCounts

  return { page, applications: page.content, companies, companyNames, statusCounts }
}
