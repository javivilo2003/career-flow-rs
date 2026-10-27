import { useState } from 'react'
import { Link } from 'react-router-dom'

import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type Company,
  type JobApplication,
} from '../types/api'
import Button from './Button'
import Icon from './Icon'

export type ApplicationCardProps = {
  application: JobApplication
  companyName: string
  applicationHref?: string
  onOpenDetails?: (application: JobApplication) => void
  onEdit?: (application: JobApplication, company?: Company) => void
  onDelete?: (application: JobApplication) => void
  onStatusChange?: (
    application: JobApplication,
    status: ApplicationStatus,
  ) => void | JobApplication | Promise<void | JobApplication>
}

const labels: Record<ApplicationStatus, string> = {
  SAVED: 'Saved',
  PREPARING: 'Preparing',
  APPLIED: 'Applied',
  INTERVIEWING: 'Interviewing',
  OFFER: 'Offer',
  REJECTED: 'Rejected',
  WITHDRAWN: 'Withdrawn',
}

function companyInitials(companyName: string) {
  return (
    companyName
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 2)
      .map((word) => word[0])
      .join('')
      .toUpperCase() || '?'
  )
}

function CardStatus({
  application,
  companyName,
  onStatusChange,
}: Pick<ApplicationCardProps, 'application' | 'companyName' | 'onStatusChange'>) {
  const [pendingStatus, setPendingStatus] = useState<ApplicationStatus | null>(null)
  const [failedStatus, setFailedStatus] = useState<ApplicationStatus | null>(null)
  const [statusError, setStatusError] = useState('')
  const [statusSaved, setStatusSaved] = useState(false)
  async function changeStatus(status: ApplicationStatus) {
    if (!onStatusChange || pendingStatus || status === application.status) {
      return
    }
    setPendingStatus(status)
    setFailedStatus(null)
    setStatusError('')
    setStatusSaved(false)
    try {
      await onStatusChange(application, status)
      setStatusSaved(true)
    } catch (reason) {
      setFailedStatus(status)
      setStatusError(reason instanceof Error ? reason.message : 'Could not update status.')
    } finally {
      setPendingStatus(null)
    }
  }
  return (
    <div className="flex min-w-0 flex-col items-end gap-1">
      <label htmlFor={`application-status-${application.id}`} className="sr-only">
        Status for {application.position} at {companyName}
      </label>
      <select
        id={`application-status-${application.id}`}
        value={application.status}
        disabled={!onStatusChange || Boolean(pendingStatus)}
        onChange={(event) => void changeStatus(event.target.value as ApplicationStatus)}
        className="h-9 max-w-[160px] rounded-[10px] border border-border bg-badge px-3 text-xs font-semibold text-heading focus:outline-2 focus:outline-heading disabled:text-disabled"
      >
        {APPLICATION_STATUSES.map((status) => (
          <option key={status} value={status}>
            {labels[status]}
          </option>
        ))}
      </select>
      {pendingStatus && (
        <span role="status" className="text-xs text-body">
          Saving…
        </span>
      )}
      {statusSaved && !pendingStatus && (
        <span role="status" className="text-xs text-success">
          Saved
        </span>
      )}
      {statusError && (
        <div className="flex flex-wrap items-center justify-end gap-2" role="alert">
          <span className="text-xs text-danger">{statusError}</span>
          {failedStatus && (
            <button
              type="button"
              className="text-xs font-semibold text-heading underline"
              onClick={() => void changeStatus(failedStatus)}
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function OpenDetailsAction({
  application,
  applicationHref,
  onOpenDetails,
}: Pick<ApplicationCardProps, 'application' | 'applicationHref' | 'onOpenDetails'>) {
  if (onOpenDetails) {
    return (
      <Button className="min-w-0 flex-1 px-2" onClick={() => onOpenDetails(application)}>
        View details
      </Button>
    )
  }
  if (applicationHref) {
    return (
      <Link
        to={applicationHref}
        className="inline-flex h-12 min-w-0 flex-1 items-center justify-center rounded-[10px] bg-page px-2 text-sm font-bold text-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heading"
      >
        View details
      </Link>
    )
  }
  return null
}

function CardActions(props: ApplicationCardProps) {
  const { application, companyName, onEdit, onDelete } = props
  return (
    <div className="flex items-center gap-3">
      <OpenDetailsAction {...props} />
      {onEdit && (
        <button
          type="button"
          onClick={() => onEdit(application)}
          aria-label={`Edit ${application.position} at ${companyName}`}
          className="flex h-11 w-10 shrink-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-heading"
        >
          <Icon name="card-pencil" />
        </button>
      )}
      {onDelete && (
        <button
          type="button"
          onClick={() => onDelete(application)}
          aria-label={`Delete ${application.position} at ${companyName}`}
          className="flex h-11 w-8 shrink-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-heading"
        >
          <Icon name="card-trash2" />
        </button>
      )}
    </div>
  )
}

export default function ApplicationCard(props: ApplicationCardProps) {
  const { application, companyName } = props
  return (
    <article className="flex w-full max-w-[410px] flex-col gap-[22px] rounded-[24px] bg-surface p-6 text-left leading-normal">
      <div className="flex items-start justify-between gap-3">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-page text-base font-bold text-heading">
          {companyInitials(companyName)}
        </span>
        <CardStatus {...props} />
      </div>
      <div className="min-w-0">
        <h2 className="m-0 text-[21px] leading-[25px] font-bold break-words text-heading">
          {application.position}
        </h2>
        <p className="m-0 mt-2 text-base break-words text-secondary">{companyName}</p>
        <p className="m-0 mt-2 text-[13px] text-body">
          {application.jobType?.trim() || 'Job type not specified'}
        </p>
      </div>
      <div className="flex flex-col gap-[9px] border-t border-border pt-[15px]">
        <p className="m-0 text-xs text-body">
          {application.appliedAt ? `Applied ${application.appliedAt}` : 'Not applied yet'}
        </p>
        <p className="m-0 truncate text-[13px] text-secondary">Source: {application.source}</p>
      </div>
      <CardActions {...props} />
    </article>
  )
}
