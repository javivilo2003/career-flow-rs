import type { ApiErrorResponse, Note, Page } from '../types/api'

export type NoteRequest = {
  jobApplicationId: string
  content: string
}

export type GetNotesParams = {
  page?: number
  size?: number
  sort?: 'id' | 'content' | 'createdAt'
  direction?: 'ASC' | 'DESC'
  jobApplicationId?: string
}

export class NoteApiError extends Error {
  readonly status: number
  readonly details: ApiErrorResponse['error']['details']

  constructor(message: string, status: number, details: ApiErrorResponse['error']['details'] = []) {
    super(message)
    this.name = 'NoteApiError'
    this.status = status
    this.details = details
  }
}

async function apiError(response: Response, fallback: string): Promise<never> {
  try {
    const body = (await response.json()) as Partial<ApiErrorResponse>
    throw new NoteApiError(body.error?.message ?? fallback, response.status, body.error?.details)
  } catch (error) {
    if (error instanceof NoteApiError) {
      throw error
    }
    throw new NoteApiError(fallback, response.status)
  }
}

export async function getNotes({
  page = 0,
  size = 100,
  sort = 'createdAt',
  direction = 'DESC',
  jobApplicationId,
}: GetNotesParams = {}): Promise<Page<Note>> {
  const query = new URLSearchParams({ page: String(page), size: String(size), sort, direction })
  if (jobApplicationId) {
    query.set('jobApplicationId', jobApplicationId)
  }
  const response = await fetch(`/api/notes?${query}`)
  if (!response.ok) {
    return apiError(response, 'Could not load notes.')
  }
  return response.json() as Promise<Page<Note>>
}

export async function createNote(request: NoteRequest): Promise<Note> {
  const response = await fetch('/api/notes', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    return apiError(response, 'Could not add the note.')
  }
  return response.json() as Promise<Note>
}

export async function updateNote(id: string, request: NoteRequest): Promise<Note> {
  const response = await fetch(`/api/notes/${encodeURIComponent(id)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request),
  })
  if (!response.ok) {
    return apiError(response, 'Could not update the note.')
  }
  return response.json() as Promise<Note>
}

export async function deleteNote(id: string): Promise<void> {
  const response = await fetch(`/api/notes/${encodeURIComponent(id)}`, { method: 'DELETE' })
  if (!response.ok) {
    return apiError(response, 'Could not delete the note.')
  }
}
