import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { getApplications } from '../api/applications'
import {
  getInterviewDetails,
  getUpcomingInterviews,
} from '../api/interviews'
import InterviewCard from '../components/InterviewCard'
import SummaryCard from '../components/SummaryCard'
import type { InterviewDetails } from '../api/interviews'

type ApplicationSummary = {
  total: number
  interviewing: number
  offers: number
}

function Dashboard() {
  const [summary, setSummary] = useState<ApplicationSummary | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [upcomingInterviews, setUpcomingInterviews] = useState<
    InterviewDetails[]
  >([])
  const [areInterviewsLoading, setAreInterviewsLoading] = useState(true)
  const [interviewsError, setInterviewsError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadSummary() {
      try {
        const [allApplications, interviewingApplications, offerApplications] =
          await Promise.all([
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

  useEffect(() => {
    let isCancelled = false

    async function loadUpcomingInterviews() {
      try {
        const interviewsPage = await getUpcomingInterviews()
        const interviewItems = await getInterviewDetails(
          interviewsPage.content,
        )

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
    <main className="p-12 text-left">
      <header className="mb-8">
        <p className="m-0 text-accent font-bold">Overview</p>
        <h1 className="m-0 mt-8 mb-2 font-heading text-5xl font-medium tracking-normal text-heading">
          Dashboard
        </h1>
        <p className="m-0">
          The important parts of your job search, all in one place.
        </p>
      </header>

      <div className="grid grid-auto-page gap-4">
        <section className="col-span-full rounded-2xl bg-surface p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <h2 className="m-0 mb-2 font-heading text-2xl font-medium leading-tight tracking-normal text-heading">
              Application summary
            </h2>
            <Link
              to="/applications"
              className="text-accent font-bold"
            >
              View job applications
            </Link>
          </div>

          {isLoading && <p className="m-0">Loading application summary...</p>}

          {!isLoading && error && <p role="alert" className="m-0">{error}</p>}

          {!isLoading && !error && summary && (
            <div className="grid grid-auto-summary gap-4">
              <SummaryCard label="Total applications" value={summary.total} />
              <SummaryCard
                label="Interviewing"
                value={summary.interviewing}
              />
              <SummaryCard label="Offers" value={summary.offers} />
            </div>
          )}
        </section>

        <section className="rounded-2xl bg-surface p-6">
          <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
            <h2 className="m-0 mb-2 font-heading text-2xl font-medium leading-tight tracking-normal text-heading">
              Upcoming interviews
            </h2>
            <Link
              to="/interviews"
              className="text-accent font-bold"
            >
              View all interviews
            </Link>
          </div>

          {areInterviewsLoading && (
            <p className="m-0">Loading upcoming interviews...</p>
          )}

          {!areInterviewsLoading && interviewsError && (
            <p role="alert" className="m-0">
              {interviewsError}
            </p>
          )}

          {!areInterviewsLoading &&
            !interviewsError &&
            upcomingInterviews.length === 0 && (
              <p className="m-0">You do not have any upcoming interviews.</p>
            )}

          {!areInterviewsLoading &&
            !interviewsError &&
            upcomingInterviews.length > 0 && (
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

        <section className="rounded-2xl bg-surface p-6">
          <h2 className="m-0 mb-2 font-heading text-2xl font-medium leading-tight tracking-normal text-heading">
            Follow-ups
          </h2>
          <p className="m-0">
            Your pending and overdue follow-ups will appear here.
          </p>
        </section>
      </div>
    </main>
  )
}

export default Dashboard
