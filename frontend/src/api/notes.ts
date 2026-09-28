import type { Note, Page } from "../types/api";

type getNotesParams = {
    page?: number
    size?: number
    sort?: string
    direction?: 'ASC' | 'DESC'
}

export async function getNotes({
    page = 0,
    size = 10,
    sort = 'createdAt',
    direction = 'DESC'
}: getNotesParams = {}): Promise<Page<Note>> {
    const query = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sort,
        direction,
    })

    const response = await fetch(`/api/notes?${query}`)

    if(!response.ok){
        throw new Error('Could not find notes.')
    }

    return response.json() as Promise<Page<Note>>
}
