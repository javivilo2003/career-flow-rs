import { useState } from 'react'

import Button from '../../components/Button'
import Input from '../../components/Input'
import type { FollowUp } from '../../types/api'
import { followUpTiming, formatDateOnly } from './dateUtils'
import useApplicationFollowUps from './useApplicationFollowUps'

type Draft = { title: string; dueDate: string }
const EMPTY_DRAFT: Draft = { title: '', dueDate: '' }

function FollowUpForm({
  draft,
  pending,
  label,
  onChange,
  onSubmit,
  onCancel,
}: {
  draft: Draft
  pending: boolean
  label: string
  onChange: (draft: Draft) => void
  onSubmit: (event: React.FormEvent) => void
  onCancel?: () => void
}) {
  const [validate, setValidate] = useState(false)
  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        setValidate(true)
        onSubmit(event)
      }}
    >
      <Input
        label="Follow-up"
        value={draft.title}
        disabled={pending}
        maxLength={255}
        error={validate && !draft.title.trim() ? 'Enter a follow-up title.' : undefined}
        onChange={(event) => onChange({ ...draft, title: event.target.value })}
      />
      <Input
        label="Due date"
        type="date"
        value={draft.dueDate}
        disabled={pending}
        error={validate && !draft.dueDate ? 'Choose a due date.' : undefined}
        onChange={(event) => onChange({ ...draft, dueDate: event.target.value })}
      />
      <div className="flex flex-wrap gap-2">
        <Button type="submit" disabled={pending || !draft.title.trim() || !draft.dueDate}>
          {pending ? 'Saving…' : label}
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

function FollowUpRow({
  item,
  pending,
  onEdit,
  onToggle,
}: {
  item: FollowUp
  pending: boolean
  onEdit: () => void
  onToggle: () => void
}) {
  if (!item.dueDate) {
    return null
  }
  const timing = followUpTiming(item.dueDate)
  let dueLabel = 'Due · '
  if (item.completed) {
    dueLabel = 'Completed · '
  } else if (timing === 'overdue') {
    dueLabel = 'Overdue · '
  } else if (timing === 'today') {
    dueLabel = 'Due today · '
  }
  let toggleLabel = item.completed ? 'Reopen' : 'Mark complete'
  if (pending) {
    toggleLabel = 'Saving…'
  }
  return (
    <li className="rounded-[10px] border border-border bg-page p-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="m-0 text-base font-bold break-words text-heading">{item.title}</h3>
          <p
            className={`m-0 mt-1 text-sm ${!item.completed && timing === 'overdue' ? 'text-danger' : 'text-secondary'}`}
          >
            {dueLabel}
            <time dateTime={item.dueDate}>{formatDateOnly(item.dueDate)}</time>
          </p>
        </div>
        <span className="text-xs font-semibold text-body">
          {item.completed ? 'Completed' : 'Open'}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button variant="secondary" disabled={pending} onClick={onToggle}>
          {toggleLabel}
        </Button>
        <Button variant="secondary" disabled={pending} onClick={onEdit}>
          Edit
        </Button>
      </div>
    </li>
  )
}

export type ApplicationFollowUpsSectionProps = {
  applicationId: string
  onAttentionChanged?: () => void
}

export default function ApplicationFollowUpsSection({
  applicationId,
  onAttentionChanged,
}: ApplicationFollowUpsSectionProps) {
  const state = useApplicationFollowUps(applicationId)
  const [draft, setDraft] = useState(EMPTY_DRAFT)
  const [editing, setEditing] = useState<FollowUp | null>(null)
  const [editDraft, setEditDraft] = useState(EMPTY_DRAFT)
  const byDueDate = (left: FollowUp, right: FollowUp) =>
    (left.dueDate ?? '').localeCompare(right.dueDate ?? '')
  const outstanding = state.followUps.filter((item) => !item.completed).sort(byDueDate)
  const completed = state.followUps.filter((item) => item.completed).sort(byDueDate)

  function submitDraft(value: Draft, item?: FollowUp) {
    const values = {
      title: value.title.trim(),
      dueDate: value.dueDate,
      completed: item?.completed ?? false,
    }
    return item ? state.edit(item, values) : state.add(values)
  }

  function rows(items: FollowUp[]) {
    return (
      <ul className="mt-4 grid list-none gap-3 p-0">
        {items.map((item) => (
          <FollowUpRow
            key={item.id}
            item={item}
            pending={state.pendingId !== null}
            onToggle={() => {
              void state.toggleCompleted(item).then((saved) => {
                if (saved) {
                  onAttentionChanged?.()
                }
              })
            }}
            onEdit={() => {
              setEditing(item)
              setEditDraft({ title: item.title, dueDate: item.dueDate ?? '' })
            }}
          />
        ))}
      </ul>
    )
  }

  return (
    <section
      id="followups"
      className="rounded-[24px] bg-surface p-6"
      aria-labelledby="follow-ups-heading"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="follow-ups-heading" className="m-0 text-xl font-bold text-heading">
          Follow-ups
        </h2>
        {state.isLoading && (
          <span role="status" className="text-sm text-body">
            Refreshing…
          </span>
        )}
      </div>
      {state.error && (
        <div role="alert" className="mt-4 rounded-[10px] bg-danger-surface p-4 text-sm text-danger">
          <p className="m-0">{state.error}</p>
          <Button variant="secondary" className="mt-3" onClick={() => void state.retry()}>
            Retry
          </Button>
        </div>
      )}
      {state.mutationError && (
        <p role="alert" className="mt-4 text-sm text-danger">
          {state.mutationError}
        </p>
      )}
      <div className="mt-5">
        {editing ? (
          <FollowUpForm
            draft={editDraft}
            pending={state.pendingId !== null}
            label="Save follow-up"
            onChange={setEditDraft}
            onCancel={() => setEditing(null)}
            onSubmit={(event) => {
              event.preventDefault()
              if (editDraft.title.trim() && editDraft.dueDate) {
                void submitDraft(editDraft, editing).then((saved) => {
                  if (saved) {
                    setEditing(null)
                    onAttentionChanged?.()
                  }
                })
              }
            }}
          />
        ) : (
          <FollowUpForm
            draft={draft}
            pending={state.pendingId !== null}
            label="Add follow-up"
            onChange={setDraft}
            onSubmit={(event) => {
              event.preventDefault()
              if (draft.title.trim() && draft.dueDate) {
                void submitDraft(draft).then((saved) => {
                  if (saved) {
                    setDraft(EMPTY_DRAFT)
                    onAttentionChanged?.()
                  }
                })
              }
            }}
          />
        )}
      </div>
      <h3 className="m-0 mt-6 text-base font-bold text-heading">
        Outstanding ({outstanding.length})
      </h3>
      {!state.isLoading && !state.error && outstanding.length === 0 && (
        <p className="mt-3 text-sm text-body">No outstanding follow-ups.</p>
      )}
      {outstanding.length > 0 && rows(outstanding)}
      {completed.length > 0 && (
        <details className="mt-6">
          <summary className="cursor-pointer text-sm font-bold text-secondary">
            Completed ({completed.length})
          </summary>
          {rows(completed)}
        </details>
      )}
    </section>
  )
}
