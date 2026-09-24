import type { ApplicationStatus, JobApplication, Page } from '../types/api'

type GetApplicationsParams = {
  page?: number
  size?: number
  sort?: string
  direction?: 'ASC' | 'DESC'
  status?: ApplicationStatus
}

export async function getApplications({
  page = 0,
  size = 10,
  sort = 'createdAt',
  direction = 'DESC',
  status,
}: GetApplicationsParams = {}): Promise<Page<JobApplication>> {
  const query = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort,
    direction,
  })

  if (status) {
    query.set('status', status)
  }

  const response = await fetch(`/api/applications?${query}`)

  if (!response.ok) {
    throw new Error('Could not load applications.')
  }

  return response.json() as Promise<Page<JobApplication>>
}

export async function getApplication(id: string): Promise<JobApplication> {
  const response = await fetch(`/api/applications/${encodeURIComponent(id)}`)

  if (!response.ok) {
    throw new Error('Could not load the application for this interview.')
  }

  return response.json() as Promise<JobApplication>
}
