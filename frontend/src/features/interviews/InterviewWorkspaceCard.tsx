import { Link } from 'react-router-dom'

import type { Interview, JobApplication } from '../../types/api'

export type InterviewWorkspaceCardProps = {
  interview: Interview
  application: JobApplication
  companyName: string
}

function formatDate(date: string | null) {
  if (!date) {
    return 'Date not scheduled'
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(`${date}T00:00:00`),
  )
}

export default function InterviewWorkspaceCard({
  interview,
  application,
  companyName,
}: InterviewWorkspaceCardProps) {
  return (
    <article className="rounded-[24px] border border-border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="m-0 text-lg font-bold text-heading">{interview.stage}</h3>
          <p className="m-0 mt-1 text-secondary">{companyName}</p>
          <Link
            to={`/applications/${application.id}`}
            className="mt-2 inline-flex text-sm font-semibold text-heading underline"
          >
            {application.position}
          </Link>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="text-sm font-bold text-accent">
            {interview.status.replaceAll('_', ' ')}
          </span>
          <time dateTime={interview.interviewDate ?? undefined} className="text-sm text-secondary">
            {formatDate(interview.interviewDate)}
          </time>
        </div>
      </div>
      {interview.notes && (
        <p className="m-0 mt-4 break-words whitespace-pre-wrap text-secondary">{interview.notes}</p>
      )}
    </article>
  )
}
