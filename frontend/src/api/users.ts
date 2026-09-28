import type { User, Page } from "../types/api";

type getUserParams = {
    page?: number
    size?: number
    sort?: string
    direction?: 'ASC' | 'DESC'
}

export async function getUsers({
    page = 0,
    size = 10,
    sort = 'dueDate',
    direction = 'ASC'
}: getUserParams = {}): Promise<Page<User>> {
    const query = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sort,
        direction,
    })

    const response = await fetch(`/api/users?${query}`)

    if(!response.ok){
        throw new Error('Could not find Users')
    }

    return response.json() as Promise<Page<User>>
}

export async function getUser(id: string): Promise<User> {
    const response = await fetch(`/api/users/${encodeURIComponent(id)}`)

    if (!response.ok) {
            throw new Error('Could not load the user.')
    }
        
    return response.json() as Promise<User>
}

