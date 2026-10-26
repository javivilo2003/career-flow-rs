import type { Contact, Page } from '../types/api'

type GetContactParams = {
  page?: number
  size?: number
  sort?: string
  direction?: 'ASC' | 'DESC'
  companyId?: string
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
}: GetContactParams = {}): Promise<Page<Contact>> {
  const query = new URLSearchParams({
    page: page.toString(),
    size: size.toString(),
    sort,
    direction,
  })

  if (companyId) {
    query.set('companyId', companyId)
  }

  const response = await fetch(`/api/contacts?${query}`)

  if (!response.ok) {
    throw new Error('Could not load contacts.')
  }

  const contacts = (await response.json()) as Page<ContactResponse>

  return { ...contacts, content: contacts.content.map(toContact) }
}

export async function getContact(id: string): Promise<Contact> {
  const response = await fetch(`/api/contacts/${encodeURIComponent(id)}`)

  if (!response.ok) {
    throw new Error('Could not load the contact for this company.')
  }

  return toContact((await response.json()) as ContactResponse)
}
