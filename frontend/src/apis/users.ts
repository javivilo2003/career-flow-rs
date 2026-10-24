import type { User } from '../types/api'

export async function getUsers(): Promise<User[]> {
  const response = await fetch('/api/users')

  if (!response.ok) {
    throw new Error('Could not find users.')
  }

  return response.json() as Promise<User[]>
}

export async function getUser(id: string): Promise<User> {
  const response = await fetch(`/api/users/${encodeURIComponent(id)}`)

  if (!response.ok) {
    throw new Error('Could not load the user.')
  }

  return response.json() as Promise<User>
}
