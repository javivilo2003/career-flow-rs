import type { Contact, Page } from "../types/api";

type GetContactParams = {
  page?: number
  size?: number
  sort?: string
  direction?: 'ASC' | 'DESC' 
}

export async function getContacts({
  page = 0,
  size = 10,
  sort = 'createdAt',
  direction = 'DESC'
}: GetContactParams = {}): Promise<Page<Contact>> {
    const query = new URLSearchParams({
      page: page.toString(),
      size: size.toString(),
      sort,
      direction,
    })

    const response = await fetch(`/api/contacts?${query}`)

    if(!response.ok) {
        throw new Error('Could not load contacts.')
    }

    return response.json() as Promise<Page<Contact>>
}

export async function getContact(id: string): Promise<Contact> {
  const response = await fetch(`/api/contacts/${encodeURIComponent(id)}`)

  if (!response.ok) {
    throw new Error('Could not load the contact for this company.')
  }

  return response.json() as Promise<Contact>
}
