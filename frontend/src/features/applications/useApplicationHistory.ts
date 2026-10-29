import { useCallback, useEffect, useRef, useState } from 'react'

import { getApplicationHistory } from '../../apis/applications'
import type { ApplicationStatusEvent } from '../../types/api'

export type ApplicationHistoryState = {
  events: ApplicationStatusEvent[] | null
  isLoading: boolean
  error: string | null
  retry: () => Promise<void>
}

type HistoryResult = {
  applicationId: string
  refreshKey?: string | null
  events: ApplicationStatusEvent[] | null
  error: string | null
}

function historyError(reason: unknown) {
  return reason instanceof Error ? reason.message : 'Could not load application activity.'
}

export default function useApplicationHistory(
  applicationId: string,
  refreshKey?: string | null,
): ApplicationHistoryState {
  const [result, setResult] = useState<HistoryResult | null>(null)
  const [isRetrying, setIsRetrying] = useState(false)
  const requestRef = useRef(0)

  useEffect(() => {
    const request = ++requestRef.current
    void getApplicationHistory(applicationId)
      .then((events) => {
        if (requestRef.current === request) {
          setResult({ applicationId, refreshKey, events, error: null })
        }
      })
      .catch((reason: unknown) => {
        if (requestRef.current === request) {
          setResult({ applicationId, refreshKey, events: null, error: historyError(reason) })
        }
      })
    return () => {
      requestRef.current += 1
    }
  }, [applicationId, refreshKey])

  const retry = useCallback(async () => {
    const request = ++requestRef.current
    setIsRetrying(true)
    setResult((current) =>
      current?.applicationId === applicationId ? { ...current, error: null } : current,
    )
    try {
      const events = await getApplicationHistory(applicationId)
      if (requestRef.current === request) {
        setResult({ applicationId, refreshKey, events, error: null })
      }
    } catch (reason) {
      if (requestRef.current === request) {
        setResult({ applicationId, refreshKey, events: null, error: historyError(reason) })
      }
    } finally {
      if (requestRef.current === request) {
        setIsRetrying(false)
      }
    }
  }, [applicationId, refreshKey])

  const current = result?.applicationId === applicationId ? result : null
  const isRefreshing = current?.refreshKey !== refreshKey

  return {
    events: current?.events ?? null,
    isLoading: isRetrying || isRefreshing,
    error: current?.error ?? null,
    retry,
  }
}
