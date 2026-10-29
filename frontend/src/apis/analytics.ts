import type { ProgressAnalytics } from '../types/api'

export type ProgressAnalyticsParams = {
  from?: string
  to?: string
}

export class AnalyticsApiError extends Error {
  readonly status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'AnalyticsApiError'
    this.status = status
  }
}

function apiErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('error' in value)) {
    return null
  }
  const error = value.error
  if (!error || typeof error !== 'object' || !('message' in error)) {
    return null
  }
  return typeof error.message === 'string' ? error.message : null
}

async function throwApiError(response: Response): Promise<never> {
  let body: unknown
  try {
    body = await response.json()
  } catch {
    throw new AnalyticsApiError('Could not load historical analysis.', response.status)
  }
  throw new AnalyticsApiError(
    apiErrorMessage(body) ?? 'Could not load historical analysis.',
    response.status,
  )
}

export async function getProgressAnalytics({
  from,
  to,
}: ProgressAnalyticsParams = {}): Promise<ProgressAnalytics> {
  const query = new URLSearchParams()
  if (from) {
    query.set('from', from)
  }
  if (to) {
    query.set('to', to)
  }

  const suffix = query.size ? `?${query.toString()}` : ''
  const response = await fetch(`/api/analytics/progress${suffix}`)
  if (!response.ok) {
    return throwApiError(response)
  }
  return response.json() as Promise<ProgressAnalytics>
}
