import type { ApiErrorResponse, Contact, Page } from '../types/api'

export type GetContactsParams = {
  page?: number
  size?: number
  sort?: string
  direction?: 'ASC' | 'DESC'
  companyId?: string
  name?: string
}

export type ContactRequest = {
  companyId: string
  name: string
  phone: string | null
  email: string | null
  jobRole: string
}

type ContactResponse = Omit<Contact, 'companyId'> & { companyID: string }

function toContact(contact: ContactResponse): Contact {
  const { companyID, ...fields } = contact

  return { ...fields, companyId: companyID }
}

export async function getContacts({
  page = 0,
  size = 10,
  sort = 'name',
  direction = 'ASC',
  companyId,
  name,
}: GetContactsParams = {}): Promise<Page<Contact>> {
  const query = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort,
    direction,
  })

  if (companyId) {
    query.set('companyId', companyId)
  }
  if (name?.trim()) {
    query.set('name', name.trim())
  }

  const response = await fetch(`/api/contacts?${query}`)

  if (!response.ok) {
    throw new Error('Could not load contacts.')
  }

  const contacts = (await response.json()) as Page<ContactResponse>

  return { ...contacts, content: contacts.content.map(toContact) }
}

export class ContactApiError extends Error {
  readonly status: number
  readonly code?: ApiErrorResponse['error']['code']
  readonly details: NonNullable<ApiErrorResponse['error']['details']>

  constructor(message: string, response: Response, payload?: ApiErrorResponse) {
    super(message)
    this.name = 'ContactApiError'
    this.status = response.status
    this.code = payload?.error.code
    this.details = payload?.error.details ?? []
  }
}

async function contactError(response: Response, fallback: string) {
  let payload: ApiErrorResponse | undefined
  try {
    payload = (await response.json()) as ApiErrorResponse
  } catch {
    // Unexpected transport responses need the operation-specific fallback.
  }
  return new ContactApiError(payload?.error.message || fallback, response, payload)
}

async function saveContact(
  path: string,
  method: 'POST' | 'PUT',
  contact: ContactRequest,
): Promise<Contact> {
  const response = await fetch(path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(contact),
  })
  if (!response.ok) {
    throw await contactError(
      response,
      `Could not ${method === 'POST' ? 'create' : 'update'} the contact.`,
    )
  }
  return toContact((await response.json()) as ContactResponse)
}

export function createContact(contact: ContactRequest): Promise<Contact> {
  return saveContact('/api/contacts', 'POST', contact)
}

export function updateContact(id: string, contact: ContactRequest): Promise<Contact> {
  return saveContact(`/api/contacts/${encodeURIComponent(id)}`, 'PUT', contact)
}

export async function getContact(id: string): Promise<Contact> {
  const response = await fetch(`/api/contacts/${encodeURIComponent(id)}`)

  if (!response.ok) {
    throw new Error('Could not load the contact for this company.')
  }

  return toContact((await response.json()) as ContactResponse)
}
