import { useCallback, useEffect, useRef, useState } from 'react'

import {
  createInterview,
  getInterviews,
  InterviewApiError,
  type InterviewRequest,
  updateInterview,
} from '../../apis/interviews'
import type { Interview } from '../../types/api'

type Values = Omit<InterviewRequest, 'jobApplicationId'>

function useInterviewsLoad(applicationId: string) {
  const [interviews, setInterviews] = useState<Interview[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const request = useRef(0)
  const load = useCallback(async () => {
    await Promise.resolve()
    const token = ++request.current
    setIsLoading(true)
    try {
      const page = await getInterviews({
        jobApplicationId: applicationId,
        size: 100,
        sort: 'interviewDate',
        direction: 'DESC',
      })
      if (request.current === token) {
        setInterviews(page.content)
        setError(null)
      }
    } catch (reason) {
      if (request.current === token) {
        setError(reason instanceof Error ? reason.message : 'Could not load interviews.')
      }
    } finally {
      if (request.current === token) {
        setIsLoading(false)
      }
    }
  }, [applicationId])
  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0)
    return () => {
      window.clearTimeout(timeout)
      request.current += 1
    }
  }, [load])
  return { interviews, setInterviews, isLoading, error, load }
}

function useInterviewMutations(
  applicationId: string,
  setInterviews: React.Dispatch<React.SetStateAction<Interview[]>>,
) {
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const pending = useRef(false)
  const run = useCallback(
    async (id: string, action: () => Promise<Interview>, onMissing?: () => void) => {
      if (pending.current) {
        return null
      }
      pending.current = true
      setPendingId(id)
      setMutationError(null)
      try {
        return await action()
      } catch (reason) {
        if (reason instanceof InterviewApiError && reason.status === 404) {
          onMissing?.()
        }
        setMutationError(reason instanceof Error ? reason.message : 'Could not save the interview.')
        return null
      } finally {
        pending.current = false
        setPendingId(null)
      }
    },
    [],
  )
  const add = useCallback(
    async (values: Values) => {
      const created = await run('new', () =>
        createInterview({ ...values, jobApplicationId: applicationId }),
      )
      if (created) {
        setInterviews((current) => [created, ...current.filter((item) => item.id !== created.id)])
      }
      return created
    },
    [applicationId, run, setInterviews],
  )
  const edit = useCallback(
    async (interview: Interview, values: Values) => {
      const updated = await run(
        interview.id,
        () => updateInterview(interview.id, { ...values, jobApplicationId: applicationId }),
        () => setInterviews((current) => current.filter((item) => item.id !== interview.id)),
      )
      if (updated) {
        setInterviews((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      }
      return updated
    },
    [applicationId, run, setInterviews],
  )
  return { mutationError, pendingId, add, edit }
}

export default function useApplicationInterviews(applicationId: string) {
  const loaded = useInterviewsLoad(applicationId)
  const mutations = useInterviewMutations(applicationId, loaded.setInterviews)
  return {
    interviews: loaded.interviews,
    isLoading: loaded.isLoading,
    error: loaded.error,
    retry: loaded.load,
    ...mutations,
  }
}
