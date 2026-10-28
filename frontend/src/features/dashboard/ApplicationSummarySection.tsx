import { useCallback, useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getApplications } from '../../apis/applications'
import Button from '../../components/Button'
import SummaryCard from '../../components/SummaryCard'
import { APPLICATION_STATUSES, type ApplicationStatus } from '../../types/api'

const LABELS: Record<ApplicationStatus, string> = {
  SAVED: 'Saved',
  PREPARING: 'Preparing',
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

type Summary = { total: number; statuses: Record<ApplicationStatus, number> }

export default function ApplicationSummarySection() {
  const [summary, setSummary] = useState<Summary | null>(null)
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
        const [all, ...statusPages] = await Promise.all([
          getApplications({ size: 1 }),
          ...APPLICATION_STATUSES.map((status) => getApplications({ size: 1, status })),
        ])
        if (!cancelled) {
          setSummary({
            total: all.totalElements,
            statuses: Object.fromEntries(
              APPLICATION_STATUSES.map((status, index) => [
                status,
                statusPages[index].totalElements,
              ]),
            ) as Record<ApplicationStatus, number>,
          })
        }
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'Could not load progress.')
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
    <section
      className="rounded-[24px] bg-surface p-6"
      aria-labelledby="application-progress-heading"
    >
      <h2 id="application-progress-heading" className="m-0 text-2xl font-bold text-heading">
        Applications
      </h2>
      <p className="m-0 mt-2 text-sm text-body">Current totals from your tracked opportunities.</p>
      {loading && (
        <p role="status" className="mt-5">
          Loading application progress…
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
      {summary && !error && (
        <>
          <div className="mt-5 grid gap-4 sm:grid-cols-3">
            <SummaryCard label="Total tracked" value={summary.total} />
            <SummaryCard label="Interviewing now" value={summary.statuses.INTERVIEWING} />
            <SummaryCard label="Current offers" value={summary.statuses.OFFER} />
          </div>
          <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {APPLICATION_STATUSES.map((status) => (
              <Link
                key={status}
                to={`/applications?status=${status}`}
                className="rounded-[10px] border border-border bg-page p-4 focus-visible:outline-2 focus-visible:outline-heading"
              >
                <span className="block text-sm text-body">{LABELS[status]}</span>
                <span className="mt-2 block text-2xl font-bold text-heading">
                  {summary.statuses[status]}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
