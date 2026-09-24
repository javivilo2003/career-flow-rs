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
    <main className="page">
      <header className="page__header">
        <p className="page__eyebrow">Overview</p>
        <h1>Dashboard</h1>
        <p>The important parts of your job search, all in one place.</p>
      </header>

      <div className="dashboard-grid">
        <section className="dashboard-panel">
          <div className="dashboard-panel__heading">
            <h2>Application summary</h2>
            <Link to="/applications">View job applications</Link>
          </div>

          {isLoading && <p>Loading application summary...</p>}

          {!isLoading && error && <p role="alert">{error}</p>}

          {!isLoading && !error && summary && (
            <div className="summary-grid">
              <SummaryCard label="Total applications" value={summary.total} />
              <SummaryCard
                label="Interviewing"
                value={summary.interviewing}
              />
              <SummaryCard label="Offers" value={summary.offers} />
            </div>
          )}
        </section>

        <section className="dashboard-panel">
          <div className="dashboard-panel__heading">
            <h2>Upcoming interviews</h2>
            <Link to="/interviews">View all interviews</Link>
          </div>

          {areInterviewsLoading && <p>Loading upcoming interviews...</p>}

          {!areInterviewsLoading && interviewsError && (
            <p role="alert">{interviewsError}</p>
          )}

          {!areInterviewsLoading &&
            !interviewsError &&
            upcomingInterviews.length === 0 && (
              <p>You do not have any upcoming interviews.</p>
            )}

          {!areInterviewsLoading &&
            !interviewsError &&
            upcomingInterviews.length > 0 && (
              <ul className="interview-list">
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

        <section className="dashboard-panel">
          <h2>Follow-ups</h2>
          <p>Your pending and overdue follow-ups will appear here.</p>
        </section>
      </div>
    </main>
  )
}

export default Dashboard
