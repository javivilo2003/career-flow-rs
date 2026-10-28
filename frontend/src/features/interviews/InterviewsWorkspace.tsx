import { useCallback, useEffect, useState } from 'react'

import { getInterviewDetails, getInterviews, type InterviewDetails } from '../../apis/interviews'
import Button from '../../components/Button'
import type { Interview, InterviewStatus } from '../../types/api'
import { compareInterviewDates, isUpcomingInterview, localInterviewDate } from './dateUtils'
import InterviewWorkspaceCard from './InterviewWorkspaceCard'

const PAGE_SIZE = 6
const ACTIVE: readonly InterviewStatus[] = ['SCHEDULED', 'RESCHEDULED']
const FINISHED: readonly InterviewStatus[] = [
  'COMPLETED',
  'CANCELLED',
  'PASSED',
  'FAILED',
  'WAITING_FEEDBACK',
]

type Stream = { items: Interview[]; total: number }
type State = { items: InterviewDetails[]; total: number; loading: boolean; error: string | null }

async function prefixForStatus(
  status: InterviewStatus,
  count: number,
  upcomingOnly = false,
): Promise<Stream> {
  const size = Math.min(100, Math.max(PAGE_SIZE, count))
  const items: Interview[] = []
  let pageNumber = 0
  let page
  do {
    page = await getInterviews({
      page: pageNumber,
      size,
      status,
      sort: 'interviewDate',
      direction: upcomingOnly ? 'ASC' : 'DESC',
      interviewDateFrom: upcomingOnly ? localInterviewDate() : undefined,
    })
    items.push(...page.content)
    pageNumber += 1
  } while (items.length < count && !page.last)
  return { items: items.slice(0, count), total: page.totalElements }
}

async function activeHistoryPrefix(status: InterviewStatus, count: number): Promise<Stream> {
  const size = Math.min(100, Math.max(PAGE_SIZE, count))
  const items: Interview[] = []
  let pageNumber = 0
  let page
  do {
    page = await getInterviews({
      page: pageNumber,
      size,
      status,
      sort: 'interviewDate',
      direction: 'DESC',
    })
    items.push(...page.content.filter((interview) => !isUpcomingInterview(interview)))
    pageNumber += 1
  } while (items.length < count && !page.last)
  const upcoming = await getInterviews({ status, interviewDateFrom: localInterviewDate(), size: 1 })
  return { items: items.slice(0, count), total: page.totalElements - upcoming.totalElements }
}

async function loadKind(kind: 'upcoming' | 'history', pageNumber: number) {
  const needed = (pageNumber + 1) * PAGE_SIZE
  const streams =
    kind === 'upcoming'
      ? await Promise.all(ACTIVE.map((status) => prefixForStatus(status, needed, true)))
      : await Promise.all([
          ...ACTIVE.map((status) => activeHistoryPrefix(status, needed)),
          ...FINISHED.map((status) => prefixForStatus(status, needed)),
        ])
  const direction = kind === 'upcoming' ? 'ASC' : 'DESC'
  const merged = streams
    .flatMap((stream) => stream.items)
    .sort((left, right) => compareInterviewDates(left, right, direction))
  const interviews = merged.slice(pageNumber * PAGE_SIZE, (pageNumber + 1) * PAGE_SIZE)
  return {
    items: await getInterviewDetails(interviews),
    total: streams.reduce((sum, stream) => sum + stream.total, 0),
  }
}

function useSection(kind: 'upcoming' | 'history', pageNumber: number) {
  const [state, setState] = useState<State>({ items: [], total: 0, loading: true, error: null })
  const [version, setVersion] = useState(0)
  useEffect(() => {
    let cancelled = false
    async function load() {
      setState((current) => ({ ...current, loading: true, error: null }))
      try {
        const result = await loadKind(kind, pageNumber)
        if (!cancelled) {
          setState({ ...result, loading: false, error: null })
        }
      } catch (reason) {
        if (!cancelled) {
          setState((current) => ({
            ...current,
            loading: false,
            error: reason instanceof Error ? reason.message : 'Could not load interviews.',
          }))
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [kind, pageNumber, version])
  return { ...state, retry: useCallback(() => setVersion((value) => value + 1), []) }
}

function Section({
  title,
  description,
  state,
  page,
  setPage,
}: {
  title: string
  description: string
  state: ReturnType<typeof useSection>
  page: number
  setPage: (page: number) => void
}) {
  const pages = Math.ceil(state.total / PAGE_SIZE)
  return (
    <section aria-labelledby={`interviews-${title.toLowerCase().replaceAll(' ', '-')}`}>
      <h2
        id={`interviews-${title.toLowerCase().replaceAll(' ', '-')}`}
        className="m-0 text-2xl font-bold text-heading"
      >
        {title}
      </h2>
      <p className="m-0 mt-2 text-sm text-body">{description}</p>
      {state.loading && (
        <p role="status" className="mt-5 text-sm">
          Loading {title.toLowerCase()}…
        </p>
      )}
      {state.error && (
        <div role="alert" className="mt-5 rounded-[10px] bg-danger-surface p-4 text-sm text-danger">
          <p className="m-0">{state.error}</p>
          <Button variant="secondary" className="mt-3" onClick={state.retry}>
            Retry
          </Button>
        </div>
      )}
      {!state.loading && !state.error && state.items.length === 0 && (
        <p className="mt-5 rounded-[24px] bg-surface p-6 text-sm text-body">
          Nothing to show here.
        </p>
      )}
      {state.items.length > 0 && (
        <ul className="mt-5 grid list-none gap-4 p-0">
          {state.items.map((item) => (
            <li key={item.interview.id}>
              <InterviewWorkspaceCard {...item} />
            </li>
          ))}
        </ul>
      )}
      {pages > 1 && (
        <nav className="mt-5 flex items-center justify-center gap-4" aria-label={`${title} pages`}>
          <Button
            variant="secondary"
            disabled={state.loading || page === 0}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <span className="text-sm text-body">
            Page {page + 1} of {pages}
          </span>
          <Button
            variant="secondary"
            disabled={state.loading || page + 1 >= pages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </nav>
      )}
    </section>
  )
}

export default function InterviewsWorkspace() {
  const [upcomingPage, setUpcomingPage] = useState(0)
  const [historyPage, setHistoryPage] = useState(0)
  const upcoming = useSection('upcoming', upcomingPage)
  const history = useSection('history', historyPage)
  return (
    <div className="grid gap-12">
      <Section
        title="Upcoming"
        description="Scheduled and rescheduled interviews from today onward."
        state={upcoming}
        page={upcomingPage}
        setPage={setUpcomingPage}
      />
      <Section
        title="History and other interviews"
        description="Past, completed, cancelled, feedback, and undated interview records."
        state={history}
        page={historyPage}
        setPage={setHistoryPage}
      />
    </div>
  )
}
