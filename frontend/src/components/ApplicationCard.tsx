import type { JobApplication } from '../types/api'

type ApplicationCardProps = {
  application: JobApplication
  companyName: string
}

function ApplicationCard({ application, companyName }: ApplicationCardProps) {
  const statusLabel = application.status.replaceAll('_', ' ')
  const salaryLabel = application.salary?.toLocaleString() ?? 'Not specified'

  return (
    <article className="rounded-2xl border bg-surface p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <h2 className="m-0 mb-2 font-heading text-2xl font-medium leading-tight tracking-normal text-heading">
          {application.position} - {companyName}
        </h2>
        <span className="rounded-full border bg-page px-3 py-1 text-sm font-bold text-accent">
          {statusLabel}
        </span>
      </div>

      <dl className="my-5 grid grid-auto-details gap-4">
        <div>
          <dt className="text-sm text-body">Job type</dt>
          <dd className="m-0 mt-1 font-semibold text-heading">
            {application.jobType}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-body">Applied</dt>
          <dd className="m-0 mt-1 font-semibold text-heading">
            {application.appliedAt ?? 'Not applied yet'}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-body">Salary</dt>
          <dd className="m-0 mt-1 font-semibold text-heading">
            {salaryLabel}
          </dd>
        </div>
        <div>
          <dt className="text-sm text-body">Source</dt>
          <dd className="m-0 mt-1 font-semibold text-heading">
            {application.source}
          </dd>
        </div>
      </dl>

      {application.description && (
        <p className="m-0">{application.description}</p>
      )}

      {application.postingLink && (
        <a
          href={application.postingLink}
          target="_blank"
          rel="noreferrer"
          className="font-bold text-accent"
        >
          View job posting
        </a>
      )}
    </article>
  )
}

export default ApplicationCard
