import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { getApplications } from '../../api/applications'
import SummaryCard from '../../components/SummaryCard'

type ApplicationSummary = {
  total: number
  interviewing: number
  offers: number
}

export default function ApplicationSummarySection() {
  const [summary, setSummary] = useState<ApplicationSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  useEffect(() => {
    let isCancelled = false

    async function loadSummary() {
      try {
        const [allApplications, interviewingApplications, offerApplications] = await Promise.all([
          getApplications({ size: 1 }),
          getApplications({ size: 1, status: 'INTERVIEWING' }),
          getApplications({ size: 1, status: 'OFFER' }),
        ])

        if (!isCancelled) {
          setSummary({
            total: allApplications.totalElements,
            interviewing: interviewingApplications.totalElements,
            offers: offerApplications.totalElements,
          })
        }
      } catch (requestError) {
        if (!isCancelled) {
          const message =
            requestError instanceof Error
              ? requestError.message
              : 'Could not load the application summary.'

          setError(message)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadSummary()

    return () => {
      isCancelled = true
    }
  }, [])

  return (
    <section className="col-span-full rounded-2xl bg-surface p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <h2 className="m-0 mb-2 font-heading text-2xl leading-tight font-medium tracking-normal text-heading">
          Application summary
        </h2>
        <Link to="/applications" className="font-bold text-accent">
          View job applications
        </Link>
      </div>

      {isLoading && <p className="m-0">Loading application summary...</p>}

      {!isLoading && error && (
        <p role="alert" className="m-0">
          {error}
        </p>
      )}

      {!isLoading && !error && summary && (
        <div className="grid grid-auto-summary gap-4">
          <SummaryCard label="Total applications" value={summary.total} />
          <SummaryCard label="Interviewing" value={summary.interviewing} />
          <SummaryCard label="Offers" value={summary.offers} />
        </div>
      )}
    </section>
  )
}
