import { useEffect, useState } from 'react'

import type { InterviewDetails } from '../api/interviews'
import { getInterviewDetails, getInterviews } from '../api/interviews'
import Button from '../components/Button'
import InterviewCard from '../components/InterviewCard'
import type { Interview, Page } from '../types/api'

function InterviewsPage() {
  const [interviews, setInterviews] = useState<InterviewDetails[]>([])
  const [interviewsPage, setInterviewsPage] = useState<Page<Interview> | null>(null)
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
            requestError instanceof Error ? requestError.message : 'Could not load interviews.'

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

  const isReady = !isLoading && !error

  return (
    <main className="p-12 text-left">
      <header className="mb-8">
        <p className="m-0 font-bold text-accent">Interviews</p>
        <h1 className="m-0 mt-8 mb-2 font-heading text-5xl font-medium tracking-normal text-heading">
          Interviews
        </h1>
        <p className="m-0">Review scheduled interviews and your interview history.</p>
      </header>

      {isLoading && <p className="m-0">Loading interviews...</p>}

      {!isLoading && error && (
        <p role="alert" className="m-0">
          {error}
        </p>
      )}

      {isReady && interviews.length === 0 && (
        <p className="m-0">You do not have any interviews yet.</p>
      )}

      {isReady && interviews.length > 0 && (
        <>
          <ul className="m-0 grid list-none gap-4 p-0">
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
            <nav
              className="mt-6 flex items-center justify-center gap-4"
              aria-label="Interview pages"
            >
              <Button
                type="button"
                disabled={interviewsPage.first}
                figmaVariant="Variante3"
                onClick={() => setPageNumber((current) => current - 1)}
              >
                Previous
              </Button>
              <span className="text-body">
                Page {interviewsPage.number + 1} of {interviewsPage.totalPages}
              </span>
              <Button
                type="button"
                disabled={interviewsPage.last}
                figmaVariant="Variante3"
                onClick={() => setPageNumber((current) => current + 1)}
              >
                Next
              </Button>
            </nav>
          )}
        </>
      )}
    </main>
  )
}

export default InterviewsPage
