import { useState } from 'react'

import Button from '../../components/Button'
import Input from '../../components/Input'
import Select from '../../components/Select'
import Textarea from '../../components/Textarea'
import type { Interview, InterviewStatus } from '../../types/api'
import useApplicationInterviews from './useApplicationInterviews'

const STATUS_OPTIONS: ReadonlyArray<{ value: InterviewStatus; label: string }> = [
  { value: 'SCHEDULED', label: 'Scheduled' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RESCHEDULED', label: 'Rescheduled' },
  { value: 'PASSED', label: 'Passed' },
  { value: 'FAILED', label: 'Failed' },
  { value: 'WAITING_FEEDBACK', label: 'Waiting for feedback' },
]

type Draft = { stage: string; status: InterviewStatus; interviewDate: string; notes: string }
const EMPTY_DRAFT: Draft = { stage: '', status: 'SCHEDULED', interviewDate: '', notes: '' }

function formatDate(date: string | null) {
  if (!date) {
    return 'Date not scheduled'
  }
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(
    new Date(`${date}T00:00:00`),
  )
}

function InterviewForm({
  draft,
  pending,
  submitLabel,
  onChange,
  onSubmit,
  onCancel,
}: {
  draft: Draft
  pending: boolean
  submitLabel: string
  onChange: (draft: Draft) => void
  onSubmit: (event: React.FormEvent) => void
  onCancel?: () => void
}) {
  const [showError, setShowError] = useState(false)
  return (
    <form
      onSubmit={(event) => {
        setShowError(true)
        onSubmit(event)
      }}
      className="grid gap-4"
    >
      <Input
        label="Stage"
        value={draft.stage}
        disabled={pending}
        error={showError && !draft.stage.trim() ? 'Enter the interview stage.' : undefined}
        onChange={(event) => onChange({ ...draft, stage: event.target.value })}
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Select
          label="Status"
          options={STATUS_OPTIONS}
          value={draft.status}
          disabled={pending}
          onChange={(status) => onChange({ ...draft, status: status as InterviewStatus })}
        />
        <Input
          label="Date"
          type="date"
          value={draft.interviewDate}
          disabled={pending}
          onChange={(event) => onChange({ ...draft, interviewDate: event.target.value })}
        />
      </div>
      <Textarea
        label="Interview notes"
        value={draft.notes}
        disabled={pending}
        maxLength={5000}
        onChange={(event) => onChange({ ...draft, notes: event.target.value })}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending || !draft.stage.trim()}>
          {pending ? 'Saving…' : submitLabel}
        </Button>
        {onCancel && (
          <Button variant="secondary" disabled={pending} onClick={onCancel}>
            Cancel
          </Button>
        )}
      </div>
    </form>
  )
}

export type ApplicationInterviewsSectionProps = {
  applicationId: string
  onAttentionChanged?: () => void
}

export default function ApplicationInterviewsSection({
  applicationId,
  onAttentionChanged,
}: ApplicationInterviewsSectionProps) {
  const { interviews, isLoading, error, mutationError, pendingId, retry, add, edit } =
    useApplicationInterviews(applicationId)
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT)
  const [editing, setEditing] = useState<Interview | null>(null)
  const [editDraft, setEditDraft] = useState<Draft>(EMPTY_DRAFT)

  function request(draftValue: Draft) {
    return {
      stage: draftValue.stage.trim(),
      status: draftValue.status,
      interviewDate: draftValue.interviewDate || null,
      notes: draftValue.notes.trim() || null,
    }
  }

  return (
    <section
      id="interviews"
      className="rounded-[24px] bg-surface p-6"
      aria-labelledby="application-interviews-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="application-interviews-heading" className="m-0 text-xl font-bold text-heading">
          Interviews
        </h2>
        {isLoading && (
          <span role="status" className="text-sm text-body">
            Refreshing…
          </span>
        )}
      </div>
      {error && (
        <div role="alert" className="mt-4 rounded-[10px] bg-danger-surface p-4 text-sm text-danger">
          <p className="m-0">{error}</p>
          <Button variant="secondary" className="mt-3" onClick={() => void retry()}>
            Retry
          </Button>
        </div>
      )}
      {mutationError && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {mutationError}
        </p>
      )}
      <div className="mt-5">
        <InterviewForm
          draft={draft}
          pending={pendingId !== null}
          submitLabel="Add interview"
          onChange={setDraft}
          onSubmit={(event) => {
            event.preventDefault()
            if (draft.stage.trim()) {
              void add(request(draft)).then((saved) => {
                if (saved) {
                  setDraft(EMPTY_DRAFT)
                  onAttentionChanged?.()
                }
              })
            }
          }}
        />
      </div>
      {!isLoading && !error && interviews.length === 0 && (
        <p className="mt-5 text-sm text-body">No interviews added to this application.</p>
      )}
      {interviews.length > 0 && (
        <ul className="mt-5 grid list-none gap-3 p-0">
          {interviews.map((interview) => (
            <li key={interview.id} className="rounded-[10px] border border-border bg-page p-4">
              {editing?.id === interview.id ? (
                <InterviewForm
                  draft={editDraft}
                  pending={pendingId !== null}
                  submitLabel="Save interview"
                  onChange={setEditDraft}
                  onCancel={() => setEditing(null)}
                  onSubmit={(event) => {
                    event.preventDefault()
                    if (editDraft.stage.trim()) {
                      void edit(interview, request(editDraft)).then((saved) => {
                        if (saved) {
                          setEditing(null)
                          onAttentionChanged?.()
                        }
                      })
                    }
                  }}
                />
              ) : (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <h3 className="m-0 text-base font-bold text-heading">{interview.stage}</h3>
                      <p className="m-0 mt-1 text-sm text-secondary">
                        {interview.status.replaceAll('_', ' ')}
                      </p>
                    </div>
                    <time
                      dateTime={interview.interviewDate ?? undefined}
                      className="text-sm text-heading"
                    >
                      {formatDate(interview.interviewDate)}
                    </time>
                  </div>
                  {interview.notes && (
                    <p className="mt-3 text-sm break-words whitespace-pre-wrap text-secondary">
                      {interview.notes}
                    </p>
                  )}
                  <Button
                    variant="secondary"
                    className="mt-3"
                    disabled={pendingId !== null}
                    onClick={() => {
                      setEditing(interview)
                      setEditDraft({
                        stage: interview.stage,
                        status: interview.status,
                        interviewDate: interview.interviewDate ?? '',
                        notes: interview.notes ?? '',
                      })
                    }}
                  >
                    Edit
                  </Button>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
