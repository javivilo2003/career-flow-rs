import { useEffect, useState } from 'react'
import {
  getInterviewDetails,
  getInterviews,
} from '../api/interviews'
import InterviewCard from '../components/InterviewCard'
import type { InterviewDetails } from '../api/interviews'
import type { Interview, Page } from '../types/api'

function InterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewDetails[]>([])
  const [interviewsPage, setInterviewsPage] = useState<Page<Interview> | null>(
    null,
  )
  const [pageNumber, setPageNumber] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function loadInterviews() {
      setIsLoading(true)
      setError(null)

      try {
        const page = await getInterviews({
          page: pageNumber,
          size: 10,
          direction: 'DESC',
        })
        const interviewItems = await getInterviewDetails(page.content)

        if (!isCancelled) {
          setInterviewsPage(page)
          setInterviews(interviewItems)
        }
      } catch (requestError) {
        if (!isCancelled) {
          const message =
            requestError instanceof Error
              ? requestError.message
              : 'Could not load interviews.'

          setError(message)
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void loadInterviews()

    return () => {
      isCancelled = true
    }
  }, [pageNumber])

  return (
    <main className="page">
      <header className="page__header">
        <p className="page__eyebrow">Interviews</p>
        <h1>Interviews</h1>
        <p>Review scheduled interviews and your interview history.</p>
      </header>

      {isLoading && <p>Loading interviews...</p>}

      {!isLoading && error && <p role="alert">{error}</p>}

      {!isLoading && !error && interviews.length === 0 && (
        <p>You do not have any interviews yet.</p>
      )}

      {!isLoading && !error && interviews.length > 0 && (
        <>
          <ul className="interviews-page-list">
            {interviews.map((item) => (
              <li key={item.interview.id}>
                <InterviewCard
                  interview={item.interview}
                  application={item.application}
                  companyName={item.companyName}
                />
              </li>
            ))}
          </ul>

          {interviewsPage && (
            <nav className="pagination" aria-label="Interview pages">
              <button
                type="button"
                disabled={interviewsPage.first}
                onClick={() => setPageNumber((current) => current - 1)}
              >
                Previous
              </button>
              <span>
                Page {interviewsPage.number + 1} of {interviewsPage.totalPages}
              </span>
              <button
                type="button"
                disabled={interviewsPage.last}
                onClick={() => setPageNumber((current) => current + 1)}
              >
                Next
              </button>
            </nav>
          )}
        </>
      )}
    </main>
  )
}

export default InterviewsPage
