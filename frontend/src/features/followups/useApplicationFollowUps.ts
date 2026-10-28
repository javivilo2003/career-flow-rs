import { useCallback, useEffect, useRef, useState } from 'react'

import {
  createFollowUp,
  FollowUpApiError,
  type FollowUpRequest,
  getFollowUps,
  updateFollowUp,
} from '../../apis/followups'
import type { FollowUp } from '../../types/api'

type Values = Omit<FollowUpRequest, 'applicationId'>

async function loadAll(applicationId: string) {
  const items: FollowUp[] = []
  let pageNumber = 0
  let page
  do {
    page = await getFollowUps({ applicationId, page: pageNumber, size: 100 })
    items.push(...page.content)
    pageNumber += 1
  } while (!page.last)
  return items
}

function useFollowUpsLoad(applicationId: string) {
  const [followUps, setFollowUps] = useState<FollowUp[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const token = useRef(0)
  const load = useCallback(async () => {
    await Promise.resolve()
    const current = ++token.current
    setIsLoading(true)
    try {
      const items = await loadAll(applicationId)
      if (current === token.current) {
        setFollowUps(items)
        setError(null)
      }
    } catch (reason) {
      if (current === token.current) {
        setError(reason instanceof Error ? reason.message : 'Could not load follow-ups.')
      }
    } finally {
      if (current === token.current) {
        setIsLoading(false)
      }
    }
  }, [applicationId])
  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0)
    return () => {
      window.clearTimeout(timeout)
      token.current += 1
    }
  }, [load])
  return { followUps, setFollowUps, isLoading, error, load }
}

function useFollowUpMutations(
  applicationId: string,
  setFollowUps: React.Dispatch<React.SetStateAction<FollowUp[]>>,
) {
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const pending = useRef(false)
  const run = useCallback(
    async (id: string, action: () => Promise<FollowUp>, missing?: () => void) => {
      if (pending.current) {
        return null
      }
      pending.current = true
      setPendingId(id)
      setMutationError(null)
      try {
        return await action()
      } catch (reason) {
        if (reason instanceof FollowUpApiError && reason.status === 404) {
          missing?.()
        }
        setMutationError(reason instanceof Error ? reason.message : 'Could not save the follow-up.')
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
      const saved = await run('new', () => createFollowUp({ ...values, applicationId }))
      if (saved) {
        setFollowUps((current) => [...current, saved])
      }
      return saved
    },
    [applicationId, run, setFollowUps],
  )
  const edit = useCallback(
    async (item: FollowUp, values: Values) => {
      const saved = await run(
        item.id,
        () => updateFollowUp(item.id, { ...values, applicationId }),
        () => setFollowUps((current) => current.filter((entry) => entry.id !== item.id)),
      )
      if (saved) {
        setFollowUps((current) => current.map((entry) => (entry.id === saved.id ? saved : entry)))
      }
      return saved
    },
    [applicationId, run, setFollowUps],
  )
  return { mutationError, pendingId, add, edit }
}

function useToggleCompleted(edit: ReturnType<typeof useFollowUpMutations>['edit']) {
  return useCallback(
    (item: FollowUp) => {
      if (!item.dueDate) {
        return Promise.resolve(null)
      }
      return edit(item, { title: item.title, dueDate: item.dueDate, completed: !item.completed })
    },
    [edit],
  )
}

export default function useApplicationFollowUps(applicationId: string) {
  const loaded = useFollowUpsLoad(applicationId)
  const mutations = useFollowUpMutations(applicationId, loaded.setFollowUps)
  const toggleCompleted = useToggleCompleted(mutations.edit)
  return {
    followUps: loaded.followUps,
    isLoading: loaded.isLoading,
    error: loaded.error,
    retry: loaded.load,
    ...mutations,
    toggleCompleted,
  }
}
