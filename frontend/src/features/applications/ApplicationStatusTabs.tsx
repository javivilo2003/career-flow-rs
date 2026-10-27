import type { KeyboardEvent } from 'react'

import { APPLICATION_STATUSES, type ApplicationStatus, type JobApplication } from '../../types/api'
import type { ApplicationStatusCounts } from './loadApplicationData'

const statusLabels: Record<ApplicationStatus, string> = {
  SAVED: 'Saved',
  PREPARING: 'Preparing',
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

export type ApplicationStatusTabsProps = {
  applications?: JobApplication[]
  counts?: ApplicationStatusCounts
  selectedStatus: ApplicationStatus
  onSelect: (status: ApplicationStatus) => void
}

function moveTabFocus(event: KeyboardEvent<HTMLButtonElement>, direction: number) {
  const tabs = Array.from(event.currentTarget.parentElement?.querySelectorAll('button') ?? [])
  const currentIndex = tabs.indexOf(event.currentTarget)
  const nextIndex = (currentIndex + direction + tabs.length) % tabs.length

  tabs[nextIndex]?.focus()
  tabs[nextIndex]?.click()
}

export default function ApplicationStatusTabs({
  applications,
  counts,
  selectedStatus,
  onSelect,
}: ApplicationStatusTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Application status"
      className="mb-6 flex gap-2 overflow-x-auto pb-2"
    >
      {APPLICATION_STATUSES.map((status) => {
        const selected = status === selectedStatus
        const count =
          counts?.[status] ??
          applications?.filter((application) => application.status === status).length ??
          0

        return (
          <button
            key={status}
            id={`application-status-${status.toLowerCase()}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls="application-status-panel"
            tabIndex={selected ? 0 : -1}
            onClick={() => onSelect(status)}
            onKeyDown={(event) => {
              if (event.key === 'ArrowRight') {
                event.preventDefault()
                moveTabFocus(event, 1)
              } else if (event.key === 'ArrowLeft') {
                event.preventDefault()
                moveTabFocus(event, -1)
              }
            }}
            className={`inline-flex h-11 shrink-0 items-center gap-2 rounded-[10px] border px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heading ${selected ? 'border-heading bg-surface text-heading' : 'border-border bg-page text-secondary hover:border-body hover:text-heading'}`}
          >
            {statusLabels[status]}
            <span
              className={`inline-flex min-w-6 justify-center rounded-full px-2 py-1 text-xs ${selected ? 'bg-page text-heading' : 'bg-surface text-body'}`}
            >
              {count}
            </span>
          </button>
        )
      })}
    </div>
  )
}
