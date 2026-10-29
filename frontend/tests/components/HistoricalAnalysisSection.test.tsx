import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getProgressAnalytics } from '../../src/apis/analytics'
import HistoricalAnalysisSection from '../../src/features/dashboard/HistoricalAnalysisSection'
import type { ProgressAnalytics } from '../../src/types/api'

vi.mock('../../src/apis/analytics', () => ({ getProgressAnalytics: vi.fn() }))

const analytics: ProgressAnalytics = {
  period: {
    from: '2026-08-01',
    to: '2026-08-31',
    timezone: 'UTC',
    startInclusive: '2026-08-01T00:00:00Z',
    endExclusive: '2026-09-01T00:00:00Z',
  },
  coverage: {
    instrumentedCohortCount: 5,
    legacyApplicationCount: 2,
    earliestTrackingInstant: '2026-07-01T00:00:00Z',
  },
  funnel: {
    submittedCount: 4,
    interviewingCount: 3,
    offerCount: 2,
    interviewReachAmongSubmittedCount: 2,
    offerAmongSubmittedCount: 1,
    interviewReachRate: 0.5,
    offerRate: 0.25,
  },
  activity: {
    applicationsCreated: 6,
    appliedEvents: 4,
    genuineTransitions: 7,
    daily: [
      { date: '2026-08-03', applicationsCreated: 2, appliedEvents: 1, genuineTransitions: 3 },
      { date: '2026-08-08', applicationsCreated: 0, appliedEvents: 1, genuineTransitions: 1 },
    ],
  },
  duration: { medianSubmittedToInterviewOrOfferHours: 60, sampleCount: 2 },
  definitions: {
    cohort: 'Cohort definition.',
    stageReach: 'Explicit stages only.',
    rates: 'Submitted denominator.',
    activity: 'Separate activity measures.',
    duration: 'Earliest qualifying sequence.',
    dailyBuckets: 'Sparse UTC buckets.',
  },
}

describe('HistoricalAnalysisSection', () => {
  beforeEach(() => vi.mocked(getProgressAnalytics).mockResolvedValue(analytics))

  it('supports 30, 90, all, and validated custom UTC controls', async () => {
    const user = userEvent.setup()
    render(<HistoricalAnalysisSection />)
    await screen.findByRole('heading', { name: 'Recruitment funnel' })

    const [initialParams] = vi.mocked(getProgressAnalytics).mock.calls[0]
    expect(initialParams?.from).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(initialParams?.to).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    await user.click(screen.getByRole('button', { name: 'Last 90 days' }))
    await waitFor(() => expect(getProgressAnalytics).toHaveBeenCalledTimes(2))
    await user.click(screen.getByRole('button', { name: 'All history' }))
    await waitFor(() => expect(getProgressAnalytics).toHaveBeenLastCalledWith({}))

    await user.click(screen.getByRole('button', { name: 'Custom' }))
    await user.click(screen.getByRole('button', { name: 'Apply dates' }))
    expect(screen.getAllByText('Choose both a from date and a to date.')).toHaveLength(2)
    await user.type(screen.getByLabelText('From'), '2026-08-31')
    await user.type(screen.getByLabelText('To'), '2026-08-01')
    await user.click(screen.getByRole('button', { name: 'Apply dates' }))
    expect(screen.getAllByText('From date must be on or before to date.')).toHaveLength(2)
    await user.clear(screen.getByLabelText('From'))
    await user.type(screen.getByLabelText('From'), '2026-08-01')
    await user.click(screen.getByRole('button', { name: 'Apply dates' }))
    await waitFor(() =>
      expect(getProgressAnalytics).toHaveBeenLastCalledWith({
        from: '2026-08-01',
        to: '2026-08-01',
      }),
    )
  })

  it('renders funnel denominators, coverage, separate activity, sparse dates, and duration sample', async () => {
    render(<HistoricalAnalysisSection />)

    const funnel = await screen.findByRole('heading', { name: 'Recruitment funnel' })
    const funnelCard = funnel.closest('article')!
    expect(within(funnelCard).getByText('50% (2 of 4)')).toBeVisible()
    expect(within(funnelCard).getByText('25% (1 of 4)')).toBeVisible()
    expect(
      within(funnelCard).getByText(/2 legacy applications lack an initial tracking event/),
    ).toBeVisible()
    expect(screen.getByText('6')).toBeVisible()
    expect(screen.getByText('7')).toBeVisible()
    expect(screen.getByRole('table')).toHaveAccessibleName(
      'Daily application activity in sparse UTC date buckets',
    )
    expect(screen.getByText('2.5 days')).toBeVisible()
    expect(screen.getByText('Sample: 2 complete sequences.')).toBeVisible()
  })

  it('announces loading, isolates error with retry, and explains empty/null history', async () => {
    const user = userEvent.setup()
    let reject!: (reason: Error) => void
    vi.mocked(getProgressAnalytics).mockImplementationOnce(
      () => new Promise((_, rejectPromise) => (reject = rejectPromise)),
    )
    render(<HistoricalAnalysisSection />)
    expect(screen.getByRole('status')).toHaveTextContent('Loading historical analysis')
    reject(new Error('Analytics unavailable'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Analytics unavailable')

    vi.mocked(getProgressAnalytics).mockResolvedValueOnce({
      ...analytics,
      coverage: { ...analytics.coverage, instrumentedCohortCount: 0 },
      funnel: {
        submittedCount: 0,
        interviewingCount: 0,
        offerCount: 0,
        interviewReachAmongSubmittedCount: 0,
        offerAmongSubmittedCount: 0,
        interviewReachRate: null,
        offerRate: null,
      },
      activity: { applicationsCreated: 0, appliedEvents: 0, genuineTransitions: 0, daily: [] },
      duration: { medianSubmittedToInterviewOrOfferHours: null, sampleCount: 0 },
    })
    await user.click(screen.getByRole('button', { name: 'Retry' }))
    expect(
      await screen.findByText('No instrumented applications entered the cohort in this period.'),
    ).toBeVisible()
    expect(screen.getByText('No application activity was recorded in this period.')).toBeVisible()
    expect(screen.getByText('Insufficient history')).toBeVisible()
    expect(screen.getByText('Sample: 0 complete sequences.')).toBeVisible()
  })
})
