import type { ApiErrorResponse, Company, Page } from '../types/api'

export type CompanyRequest = {
  companyName: string
  companyAddress: string | null
  bio: string | null
  websiteUrl: string | null
}

export type GetCompaniesParams = {
  companyName?: string
  page?: number
  size?: number
  sort?: string
  direction?: 'ASC' | 'DESC'
}

export async function getCompanies({
  companyName,
  page = 0,
  size = 100,
  sort = 'companyName',
  direction = 'ASC',
}: GetCompaniesParams = {}): Promise<Page<Company>> {
  const query = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort,
    direction,
  })
  if (companyName?.trim()) {
    query.set('companyName', companyName.trim())
  }
  const response = await fetch(`/api/companies?${query}`)

  if (!response.ok) {
    throw new Error('Could not load companies.')
  }

  return response.json() as Promise<Page<Company>>
}

export async function getCompany(id: string): Promise<Company> {
  const response = await fetch(`/api/companies/${encodeURIComponent(id)}`)

  if (!response.ok) {
    throw await companyError(response, 'Could not load the company.')
  }

  return response.json() as Promise<Company>
}

export class CompanyApiError extends Error {
  readonly status: number
  readonly code?: ApiErrorResponse['error']['code']
  readonly details: NonNullable<ApiErrorResponse['error']['details']>

  constructor(
    message: string,
    status: number,
    code?: ApiErrorResponse['error']['code'],
    details: NonNullable<ApiErrorResponse['error']['details']> = [],
  ) {
    super(message)
    this.name = 'CompanyApiError'
    this.status = status
    this.code = code
    this.details = details
  }
}

async function companyError(response: Response, fallback: string) {
  let payload: ApiErrorResponse | undefined
  try {
    payload = (await response.json()) as ApiErrorResponse
  } catch {
    // The server may return no body for an unexpected transport failure.
  }

  return new CompanyApiError(
    payload?.error.message || fallback,
    response.status,
    payload?.error.code,
    payload?.error.details,
  )
}

export async function createCompany(company: CompanyRequest): Promise<Company> {
  const response = await fetch('/api/companies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(company),
  })

  if (!response.ok) {
    throw await companyError(response, 'Could not create the company.')
  }

  return response.json() as Promise<Company>
}

export async function updateCompany(id: string, company: CompanyRequest): Promise<Company> {
  const response = await fetch(`/api/companies/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(company),
  })

  if (!response.ok) {
    throw await companyError(response, 'Could not update the company.')
  }

  return response.json() as Promise<Company>
}
