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

function InterviewCard({
  interview,
  application,
  companyName,
}: InterviewCardProps) {
  const statusLabel = interview.status.replaceAll('_', ' ')

  return (
    <article className="interview-card">
      <div className="interview-card__heading">
        <div>
          <h3>{interview.stage}</h3>
          <p>
            {application.position} - {companyName}
          </p>
        </div>
        <div className="interview-card__meta">
          <span>{statusLabel}</span>
          <time dateTime={interview.interviewDate ?? undefined}>
            {formatInterviewDate(interview.interviewDate)}
          </time>
        </div>
      </div>

      {interview.notes && <p className="interview-card__notes">{interview.notes}</p>}
    </article>
  )
}

export default InterviewCard
