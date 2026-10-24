import type { Company, Page } from '../types/api'

export type CompanyRequest = {
  companyName: string
  companyAddress: string | null
  bio: string | null
  websiteUrl: string | null
}

export async function getCompanies(): Promise<Page<Company>> {
  const response = await fetch('/api/companies?page=0&size=100&sort=companyName&direction=ASC')

  if (!response.ok) {
    throw new Error('Could not load companies.')
  }

  return response.json() as Promise<Page<Company>>
}

export async function getCompany(id: string): Promise<Company> {
  const response = await fetch(`/api/companies/${encodeURIComponent(id)}`)

  if (!response.ok) {
    throw new Error('Could not load the company for this interview.')
  }

  return response.json() as Promise<Company>
}

export async function createCompany(company: CompanyRequest): Promise<void> {
  const response = await fetch('/api/companies', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(company),
  })

  if (!response.ok) {
    throw new Error('Could not create the company.')
  }
}
