import type { Company, Page } from '../types/api'

export async function getCompanies(): Promise<Page<Company>> {
  const response = await fetch(
    '/api/companies?page=0&size=100&sort=companyName&direction=ASC',
  )

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
