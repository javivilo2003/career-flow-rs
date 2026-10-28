import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getInterviews } from '../../apis/interviews'
import Button from '../../components/Button'
import type { InterviewStatus } from '../../types/api'

const STATUSES: readonly InterviewStatus[] = [
  'SCHEDULED',
  'RESCHEDULED',
  'WAITING_FEEDBACK',
  'COMPLETED',
  'PASSED',
  'FAILED',
  'CANCELLED',
]

export default function InterviewStatusSection() {
  const [counts, setCounts] = useState<Record<InterviewStatus, number> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const retry = useCallback(() => setVersion((value) => value + 1), [])
  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const pages = await Promise.all(
          STATUSES.map((status) => getInterviews({ status, size: 1 })),
        )
        if (!cancelled) {
          setCounts(
            Object.fromEntries(
              STATUSES.map((status, index) => [status, pages[index].totalElements]),
            ) as Record<InterviewStatus, number>,
          )
        }
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'Could not load interview progress.')
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
  }, [version])

  return (
    <section className="rounded-[24px] bg-surface p-6" aria-labelledby="interview-progress-heading">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="interview-progress-heading" className="m-0 text-2xl font-bold text-heading">
            Interviews
          </h2>
          <p className="m-0 mt-2 text-sm text-body">Current records by interview status.</p>
        </div>
        <Link to="/interviews" className="text-sm font-bold text-accent">
          View interviews
        </Link>
      </div>
      {loading && (
        <p role="status" className="mt-5">
          Loading interview progress…
        </p>
      )}
      {error && (
        <div role="alert" className="mt-5 rounded-[10px] bg-danger-surface p-4 text-danger">
          <p className="m-0">{error}</p>
          <Button variant="secondary" className="mt-3" onClick={retry}>
            Retry
          </Button>
        </div>
      )}
      {counts && !error && (
        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {STATUSES.map((status) => (
            <div key={status} className="rounded-[10px] bg-page p-4">
              <dt className="text-xs text-body">{status.replaceAll('_', ' ')}</dt>
              <dd className="m-0 mt-2 text-2xl font-bold text-heading">{counts[status]}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
