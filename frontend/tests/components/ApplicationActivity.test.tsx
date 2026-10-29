import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getApplicationHistory } from '../../src/apis/applications'
import ApplicationActivitySection, {
  ApplicationActivityTimeline,
} from '../../src/features/applications/ApplicationActivity'
import type { ApplicationStatusEvent, JobApplication } from '../../src/types/api'

vi.mock('../../src/apis/applications', () => ({
  getApplicationHistory: vi.fn(),
}))

const application: JobApplication = {
  id: 'application/1',
  userId: 'owner-1',
  companyId: 'company-1',
  position: 'Engineer',
  jobType: null,
  description: 'Details remain available.',
  salary: null,
  status: 'INTERVIEWING',
  appliedAt: null,
  source: 'Referral',
  postingLink: null,
  createdAt: '2026-10-01T08:00:00Z',
  updatedAt: '2026-10-03T12:00:00Z',
}

const events: ApplicationStatusEvent[] = [
  {
    id: 'event-3',
    applicationId: application.id,
    previousStatus: 'APPLIED',
    newStatus: 'INTERVIEWING',
    occurredAt: '2026-10-03T12:00:00Z',
  },
  {
    id: 'event-1',
    applicationId: application.id,
    previousStatus: null,
    newStatus: 'SAVED',
    occurredAt: '2026-10-01T08:00:00Z',
  },
  {
    id: 'event-2',
    applicationId: application.id,
    previousStatus: 'SAVED',
    newStatus: 'APPLIED',
    occurredAt: '2026-10-02T09:30:00Z',
  },
]

describe('ApplicationActivity', () => {
  beforeEach(() => vi.mocked(getApplicationHistory).mockReset())

  it('renders events chronologically and de-duplicates the initial event into creation', () => {
    render(<ApplicationActivityTimeline application={application} events={events} />)

    const timeline = screen.getByRole('list', {
      name: 'Application activity in chronological order',
    })
    const items = within(timeline).getAllByRole('listitem')
    expect(items).toHaveLength(3)
    expect(items[0]).toHaveTextContent('Application created with initial status Saved')
    expect(items[1]).toHaveTextContent('Status changed from Saved to Applied')
    expect(items[2]).toHaveTextContent('Status changed from Applied to Interviewing')
    expect(screen.queryByText(/Initial status recorded as/i)).not.toBeInTheDocument()
  })

  it('explains legacy empty history without inventing a status event', () => {
    render(<ApplicationActivityTimeline application={application} events={[]} />)

    expect(screen.getByText('Application created')).toBeInTheDocument()
    expect(screen.getByText('The initial status was not recorded.')).toBeInTheDocument()
    expect(screen.getByText(/may predate activity tracking/i)).toBeInTheDocument()
    expect(screen.queryByText(/created with initial status/i)).not.toBeInTheDocument()
  })

  it('uses localized visible timestamps with machine-readable accessible time values', () => {
    render(<ApplicationActivityTimeline application={application} events={events} />)

    const expected = new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(events[1].occurredAt))
    const time = screen.getByText(expected)
    expect(time).toHaveAttribute('datetime', events[1].occurredAt)
    expect(screen.getByRole('list')).toHaveAccessibleName(
      'Application activity in chronological order',
    )
  })

  it('isolates a history failure and retries without removing surrounding details', async () => {
    const user = userEvent.setup()
    vi.mocked(getApplicationHistory)
      .mockRejectedValueOnce(new Error('History is temporarily unavailable.'))
      .mockResolvedValueOnce(events)

    render(
      <div>
        <p>Details remain available.</p>
        <ApplicationActivitySection application={application} />
      </div>,
    )

    expect(screen.getByRole('status')).toHaveTextContent('Loading application activity')
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'History is temporarily unavailable.',
    )
    expect(screen.getByText('Details remain available.')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Retry activity' }))

    expect(
      await screen.findByText('Status changed from Applied to Interviewing'),
    ).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(getApplicationHistory).toHaveBeenCalledTimes(2)
  })
})
