import type { Interview, JobApplication } from '../types/api'

type InterviewCardProps = {
  interview: Interview
  application: JobApplication
  companyName: string
}

function formatInterviewDate(date: string | null) {
  if (!date) {
    return 'Date not scheduled'
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
  }).format(new Date(`${date}T00:00:00`))
}

function InterviewCard({ interview, application, companyName }: InterviewCardProps) {
  const statusLabel = interview.status.replaceAll('_', ' ')

  return (
    <article className="rounded-xl border bg-code p-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="m-0 mb-1 text-lg text-heading">{interview.stage}</h3>
          <p className="m-0">
            {application.position} - {companyName}
          </p>
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          <span className="shrink-0 text-sm font-bold text-accent">{statusLabel}</span>
          <time
            dateTime={interview.interviewDate ?? undefined}
            className="shrink-0 text-sm font-bold text-accent"
          >
            {formatInterviewDate(interview.interviewDate)}
          </time>
        </div>
      </div>

      {interview.notes && <p className="m-0 mt-3">{interview.notes}</p>}
    </article>
  )
}

export default InterviewCard
