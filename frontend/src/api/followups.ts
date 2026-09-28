import type { FollowUp, Page } from "../types/api";

type getFollowUpParams = {
    page?: number
    size?: number
    sort?: string
    direction?: 'ASC' | 'DESC'
}

export async function getFollowUps({
    page = 0,
    size = 10,
    sort = 'dueDate',
    direction = 'ASC'
}: getFollowUpParams = {}): Promise<Page<FollowUp>> {
    const query = new URLSearchParams({
        page: page.toString(),
        size: size.toString(),
        sort,
        direction,
    })

    const response =  await fetch(`/api/followups?${query}`)

    if(!response.ok){
        throw new Error('Could not load follow ups.')
    }

    return response.json() as Promise<Page<FollowUp>>
}

export async function getFollowUp(id: string): Promise<FollowUp>{
    const response = await fetch(`/api/followups/${encodeURIComponent(id)}`)
    
    if (!response.ok) {
        throw new Error('Could not load the follow up for this interview.')
    }
    
    return response.json() as Promise<FollowUp>
}
