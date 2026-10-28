import { useCallback, useEffect, useState } from 'react'

import { getApplication } from '../../apis/applications'
import { getCompany } from '../../apis/companies'
import { getFollowUps } from '../../apis/followups'
import { getInterviewDetails, getInterviews, type InterviewDetails } from '../../apis/interviews'
import type { FollowUp } from '../../types/api'
import { localDateString } from './dateUtils'

export type FollowUpAttentionItem = {
  followUp: FollowUp
  position: string
  companyName: string
}

export type AttentionResource<T> = {
  items: T[]
  loading: boolean
  error: string | null
  retry: () => void
}

function useAttentionResource<T>(loader: () => Promise<T[]>): AttentionResource<T> {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await loader()
        if (!cancelled) {
          setItems(result)
        }
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'Could not load this summary.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [loader, version])
  return { items, loading, error, retry: useCallback(() => setVersion((value) => value + 1), []) }
}

async function loadFollowUpAttention(limit: number): Promise<FollowUpAttentionItem[]> {
  const page = await getFollowUps({
    completed: false,
    dueDateTo: localDateString(),
    size: limit,
    sort: 'dueDate',
    direction: 'ASC',
  })
  return Promise.all(
    page.content.map(async (followUp) => {
      const application = await getApplication(followUp.jobApplicationId)
      const company = await getCompany(application.companyId)
      return { followUp, position: application.position, companyName: company.companyName }
    }),
  )
}

async function loadInterviewAttention(limit: number): Promise<InterviewDetails[]> {
  const today = localDateString()
  const [scheduled, rescheduled] = await Promise.all([
    getInterviews({ status: 'SCHEDULED', interviewDateFrom: today, size: limit }),
    getInterviews({ status: 'RESCHEDULED', interviewDateFrom: today, size: limit }),
  ])
  const interviews = [...scheduled.content, ...rescheduled.content]
    .sort((left, right) => (left.interviewDate ?? '').localeCompare(right.interviewDate ?? ''))
    .slice(0, limit)
  return getInterviewDetails(interviews)
}

export default function useApplicationsAttention(limit: number, revision = 0) {
  const followUpLoader = useCallback(() => {
    void revision
    return loadFollowUpAttention(limit)
  }, [limit, revision])
  const interviewLoader = useCallback(() => {
    void revision
    return loadInterviewAttention(limit)
  }, [limit, revision])
  return {
    followUps: useAttentionResource(followUpLoader),
    interviews: useAttentionResource(interviewLoader),
  }
}
