import type { InterviewDetails } from '../../apis/interviews'
import Button from '../../components/Button'
import { followUpTiming, formatDateOnly } from './dateUtils'
import useApplicationsAttention, {
  type AttentionResource,
  type FollowUpAttentionItem,
} from './useApplicationsAttention'

export type ApplicationsAttentionSection = 'followups' | 'interviews'

export type ApplicationsAttentionProps = {
  onOpenApplication: (applicationId: string, section?: ApplicationsAttentionSection) => void
  limit?: number
  revision?: number
}

function ResourceError({ message, retry }: { message: string; retry: () => void }) {
  return (
    <div role="alert" className="rounded-[10px] bg-danger-surface p-3 text-sm text-danger">
      <p className="m-0">{message}</p>
      <Button variant="secondary" className="mt-2" onClick={retry}>
        Retry
      </Button>
    </div>
  )
}

function duePrefix(timing: ReturnType<typeof followUpTiming>) {
  if (timing === 'overdue') {
    return 'Overdue · '
  }
  if (timing === 'today') {
    return 'Due today · '
  }
  return 'Due · '
}

function FollowUpsAttention({
  state,
  onOpen,
}: {
  state: AttentionResource<FollowUpAttentionItem>
  onOpen: ApplicationsAttentionProps['onOpenApplication']
}) {
  return (
    <div>
      <h3 className="m-0 mb-3 text-sm font-bold text-heading">Follow-ups</h3>
      {state.loading && (
        <p role="status" className="m-0 text-sm text-body">
          Loading follow-ups…
        </p>
      )}
      {state.error && <ResourceError message={state.error} retry={state.retry} />}
      {!state.loading && !state.error && state.items.length === 0 && (
        <p className="m-0 text-sm text-body">No due follow-ups.</p>
      )}
      {state.items.length > 0 && (
        <ul className="m-0 grid list-none gap-2 p-0">
          {state.items.map(({ followUp, position, companyName }) => {
            if (!followUp.dueDate) {
              return null
            }
            const timing = followUpTiming(followUp.dueDate)
            return (
              <li key={followUp.id}>
                <button
                  type="button"
                  className="w-full cursor-pointer rounded-[10px] border border-border bg-page p-3 text-left focus-visible:outline-2 focus-visible:outline-heading"
                  onClick={() => onOpen(followUp.jobApplicationId, 'followups')}
                >
                  <span className="block text-sm font-bold break-words text-heading">
                    {followUp.title}
                  </span>
                  <span className="mt-1 block text-xs break-words text-body">
                    {position} · {companyName}
                  </span>
                  <span
                    className={`mt-1 block text-xs ${timing === 'overdue' ? 'text-danger' : 'text-secondary'}`}
                  >
                    {duePrefix(timing)}
                    {formatDateOnly(followUp.dueDate)}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}

function InterviewsAttention({
  state,
  onOpen,
}: {
  state: AttentionResource<InterviewDetails>
  onOpen: ApplicationsAttentionProps['onOpenApplication']
}) {
  return (
    <div>
      <h3 className="m-0 mb-3 text-sm font-bold text-heading">Upcoming interviews</h3>
      {state.loading && (
        <p role="status" className="m-0 text-sm text-body">
          Loading interviews…
        </p>
      )}
      {state.error && <ResourceError message={state.error} retry={state.retry} />}
      {!state.loading && !state.error && state.items.length === 0 && (
        <p className="m-0 text-sm text-body">No upcoming interviews.</p>
      )}
      {state.items.length > 0 && (
        <ul className="m-0 grid list-none gap-2 p-0">
          {state.items.map(
            ({ interview, application, companyName }) =>
              interview.interviewDate && (
                <li key={interview.id}>
                  <button
                    type="button"
                    className="w-full cursor-pointer rounded-[10px] border border-border bg-page p-3 text-left focus-visible:outline-2 focus-visible:outline-heading"
                    onClick={() => onOpen(interview.jobApplicationId, 'interviews')}
                  >
                    <span className="block text-sm font-bold break-words text-heading">
                      {interview.stage}
                    </span>
                    <span className="mt-1 block text-xs break-words text-body">
                      {application.position} · {companyName}
                    </span>
                    <span className="mt-1 block text-xs text-secondary">
                      {interview.status === 'RESCHEDULED' ? 'Rescheduled · ' : ''}
                      {formatDateOnly(interview.interviewDate)}
                    </span>
                  </button>
                </li>
              ),
          )}
        </ul>
      )}
    </div>
  )
}

export default function ApplicationsAttention({
  onOpenApplication,
  limit = 3,
  revision = 0,
}: ApplicationsAttentionProps) {
  const { followUps, interviews } = useApplicationsAttention(limit, revision)
  const isEmpty =
    !followUps.loading &&
    !interviews.loading &&
    !followUps.error &&
    !interviews.error &&
    followUps.items.length === 0 &&
    interviews.items.length === 0
  if (isEmpty) {
    return null
  }
  return (
    <section className="rounded-[24px] bg-surface p-6" aria-labelledby="attention-heading">
      <div className="mb-5">
        <h2 id="attention-heading" className="m-0 text-xl font-bold text-heading">
          Needs attention
        </h2>
        <p className="m-0 mt-2 text-sm text-body">Due follow-ups and upcoming interviews.</p>
      </div>
      <div className="grid gap-5 lg:grid-cols-2">
        <FollowUpsAttention state={followUps} onOpen={onOpenApplication} />
        <InterviewsAttention state={interviews} onOpen={onOpenApplication} />
      </div>
    </section>
  )
}
