import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import type { InterviewDetails } from '../../api/interviews'
import { getInterviewDetails, getUpcomingInterviews } from '../../api/interviews'
import InterviewCard from '../../components/InterviewCard'

export default function UpcomingInterviewsSection() {
  const [upcomingInterviews, setUpcomingInterviews] = useState<InterviewDetails[]>([])
  const [areInterviewsLoading, setAreInterviewsLoading] = useState(true)
  const [interviewsError, setInterviewsError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadUpcomingInterviews() {
      try {
        const interviewsPage = await getUpcomingInterviews()
        const interviewItems = await getInterviewDetails(interviewsPage.content)

        if (!isCancelled) {
          setUpcomingInterviews(interviewItems)
        }
      } catch (requestError) {
        if (!isCancelled) {
          const message =
            requestError instanceof Error
              ? requestError.message
              : 'Could not load upcoming interviews.'

          setInterviewsError(message)
        }
      } finally {
        if (!isCancelled) {
          setAreInterviewsLoading(false)
        }
      }
    }

    void loadUpcomingInterviews()

    return () => {
      isCancelled = true
    }
  }, [])
  return (
    <section className="rounded-2xl bg-surface p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <h2 className="m-0 mb-2 font-heading text-2xl leading-tight font-medium tracking-normal text-heading">
          Upcoming interviews
        </h2>
        <Link to="/interviews" className="font-bold text-accent">
          View all interviews
        </Link>
      </div>

      {areInterviewsLoading && <p className="m-0">Loading upcoming interviews...</p>}

      {!areInterviewsLoading && interviewsError && (
        <p role="alert" className="m-0">
          {interviewsError}
        </p>
      )}

      {!areInterviewsLoading && !interviewsError && upcomingInterviews.length === 0 && (
        <p className="m-0">You do not have any upcoming interviews.</p>
      )}

      {!areInterviewsLoading && !interviewsError && upcomingInterviews.length > 0 && (
        <ul className="m-0 mt-5 grid list-none gap-3 p-0">
          {upcomingInterviews.map((item) => (
            <li key={item.interview.id}>
              <InterviewCard
                interview={item.interview}
                application={item.application}
                companyName={item.companyName}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
