import { useId } from 'react'

import Button from '../../components/Button'
import type { ApplicationStatus, ApplicationStatusEvent, JobApplication } from '../../types/api'
import { formatApplicationTimestamp } from './applicationDates'
import useApplicationHistory from './useApplicationHistory'

const STATUS_LABELS: Record<ApplicationStatus, string> = {
  SAVED: 'Saved',
  PREPARING: 'Preparing',
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

type TimelineItem =
  | { kind: 'created'; id: string; occurredAt: string; initialStatus?: ApplicationStatus }
  | { kind: 'status'; event: ApplicationStatusEvent }

function timelineItems(
  application: JobApplication,
  events: ApplicationStatusEvent[],
): TimelineItem[] {
  const orderedEvents = [...events].sort(
    (left, right) =>
      left.occurredAt.localeCompare(right.occurredAt) || left.id.localeCompare(right.id),
  )
  const initialEvent = orderedEvents.find((event) => event.previousStatus === null)
  const items: TimelineItem[] = orderedEvents
    .filter((event) => event !== initialEvent)
    .map((event) => ({ kind: 'status', event }))

  items.push(
    initialEvent
      ? {
          kind: 'created',
          id: initialEvent.id,
          occurredAt: initialEvent.occurredAt,
          initialStatus: initialEvent.newStatus,
        }
      : { kind: 'created', id: `created-${application.id}`, occurredAt: application.createdAt },
  )

  return items.sort((left, right) => {
    const leftTimestamp = left.kind === 'created' ? left.occurredAt : left.event.occurredAt
    const rightTimestamp = right.kind === 'created' ? right.occurredAt : right.event.occurredAt
    return leftTimestamp.localeCompare(rightTimestamp)
  })
}

function itemContent(item: TimelineItem) {
  if (item.kind === 'created') {
    return {
      title: item.initialStatus
        ? `Application created with initial status ${STATUS_LABELS[item.initialStatus]}`
        : 'Application created',
      description: item.initialStatus
        ? 'Activity tracking started with this application.'
        : 'The initial status was not recorded.',
      occurredAt: item.occurredAt,
    }
  }

  const { event } = item
  return {
    title: event.previousStatus
      ? `Status changed from ${STATUS_LABELS[event.previousStatus]} to ${STATUS_LABELS[event.newStatus]}`
      : `Initial status recorded as ${STATUS_LABELS[event.newStatus]}`,
    description: 'Application status updated.',
    occurredAt: event.occurredAt,
  }
}

export type ApplicationActivityTimelineProps = {
  application: JobApplication
  events: ApplicationStatusEvent[]
}

export function ApplicationActivityTimeline({
  application,
  events,
}: ApplicationActivityTimelineProps) {
  const items = timelineItems(application, events)
  const hasInitialEvent = events.some((event) => event.previousStatus === null)

  return (
    <>
      <ol
        className="m-0 mt-5 list-none p-0"
        aria-label="Application activity in chronological order"
      >
        {items.map((item, index) => {
          const content = itemContent(item)
          const id = item.kind === 'created' ? item.id : item.event.id
          return (
            <li
              key={id}
              className="relative grid grid-cols-[16px_minmax(0,1fr)] gap-3 pb-5 last:pb-0"
            >
              {index < items.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute top-4 bottom-0 left-[7px] w-px bg-border"
                />
              )}
              <span
                aria-hidden="true"
                className="relative mt-1 size-4 rounded-full border-4 border-surface bg-accent"
              />
              <div className="min-w-0">
                <p className="m-0 text-sm font-semibold break-words text-secondary">
                  {content.title}
                </p>
                <p className="m-0 mt-1 text-xs text-body">{content.description}</p>
                <time dateTime={content.occurredAt} className="mt-1 block text-xs text-body">
                  {formatApplicationTimestamp(content.occurredAt)}
                </time>
              </div>
            </li>
          )
        })}
      </ol>
      {!hasInitialEvent && (
        <p className="m-0 mt-5 rounded-[10px] border border-border p-4 text-sm text-body">
          {events.length === 0
            ? 'No status events were recorded. This application may predate activity tracking, so its earlier status history is unknown.'
            : 'The initial status was not recorded. Activity tracking may have started after this application was created.'}
        </p>
      )}
    </>
  )
}

export type ApplicationActivitySectionProps = { application: JobApplication }

export default function ApplicationActivitySection({
  application,
}: ApplicationActivitySectionProps) {
  const titleId = useId()
  const { events, isLoading, error, retry } = useApplicationHistory(
    application.id,
    `${application.status}-${application.updatedAt ?? ''}`,
  )

  return (
    <section className="rounded-[24px] bg-surface p-6" aria-labelledby={titleId}>
      <h2 id={titleId} className="m-0 text-xl font-bold text-heading">
        Application activity
      </h2>
      <p className="m-0 mt-2 text-sm text-body">Status activity is shown from oldest to newest.</p>
      {isLoading && !events && (
        <div role="status" className="mt-5 text-sm text-body">
          Loading application activity…
        </div>
      )}
      {error && (
        <div role="alert" className="mt-5 rounded-[10px] bg-danger-surface p-4 text-sm text-danger">
          <p className="m-0">{error}</p>
          <Button variant="secondary" className="mt-3" onClick={() => void retry()}>
            Retry activity
          </Button>
        </div>
      )}
      {events && <ApplicationActivityTimeline application={application} events={events} />}
      {isLoading && events && (
        <p role="status" className="m-0 mt-3 text-xs text-body">
          Refreshing application activity…
        </p>
      )}
    </section>
  )
}
