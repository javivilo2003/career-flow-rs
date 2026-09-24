import type { JobApplication } from '../types/api'

type ApplicationCardProps = {
  application: JobApplication
  companyName: string
}

function ApplicationCard({ application, companyName }: ApplicationCardProps) {
  const statusLabel = application.status.replaceAll('_', ' ')
  const salaryLabel = application.salary?.toLocaleString() ?? 'Not specified'

  return (
    <article className="application-card">
      <div className="application-card__heading">
        <h2>
          {application.position} - {companyName}
        </h2>
        <span>{statusLabel}</span>
      </div>

      <dl className="application-card__details">
        <div>
          <dt>Job type</dt>
          <dd>{application.jobType}</dd>
        </div>
        <div>
          <dt>Applied</dt>
          <dd>{application.appliedAt ?? 'Not applied yet'}</dd>
        </div>
        <div>
          <dt>Salary</dt>
          <dd>{salaryLabel}</dd>
        </div>
        <div>
          <dt>Source</dt>
          <dd>{application.source}</dd>
        </div>
      </dl>

      {application.description && <p>{application.description}</p>}

      {application.postingLink && (
        <a
          href={application.postingLink}
          target="_blank"
          rel="noreferrer"
        >
          View job posting
        </a>
      )}
    </article>
  )
}

export default ApplicationCard
