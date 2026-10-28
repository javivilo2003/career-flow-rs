import { useState } from 'react'

import Button from '../../components/Button'
import Textarea from '../../components/Textarea'
import type { Note } from '../../types/api'
import useApplicationNotes from './useApplicationNotes'

export type ApplicationNotesSectionProps = { applicationId: string }

export default function ApplicationNotesSection({ applicationId }: ApplicationNotesSectionProps) {
  const { notes, isLoading, error, mutationError, pendingId, retry, add, edit, remove } =
    useApplicationNotes(applicationId)
  const [draft, setDraft] = useState('')
  const [draftError, setDraftError] = useState<string | undefined>()
  const [editing, setEditing] = useState<Note | null>(null)
  const [editDraft, setEditDraft] = useState('')

  async function submitNew(event: React.FormEvent) {
    event.preventDefault()
    if (!draft.trim()) {
      setDraftError('Enter a note before saving.')
      return
    }
    setDraftError(undefined)
    if (await add(draft.trim())) {
      setDraft('')
    }
  }

  async function submitEdit(event: React.FormEvent) {
    event.preventDefault()
    if (!editing || !editDraft.trim()) {
      return
    }
    if (await edit(editing, editDraft.trim())) {
      setEditing(null)
    }
  }

  return (
    <section className="rounded-[24px] bg-surface p-6" aria-labelledby="application-notes-heading">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 id="application-notes-heading" className="m-0 text-xl font-bold text-heading">
          Notes
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
      <form className="mt-5" onSubmit={(event) => void submitNew(event)}>
        <Textarea
          label="Add a note"
          value={draft}
          error={draftError}
          disabled={pendingId !== null}
          maxLength={5000}
          onChange={(event) => {
            setDraft(event.target.value)
            setDraftError(undefined)
          }}
        />
        <Button type="submit" className="mt-3" disabled={pendingId !== null}>
          {pendingId === 'new' ? 'Saving…' : 'Add note'}
        </Button>
      </form>
      {!isLoading && !error && notes.length === 0 && (
        <p className="mt-5 text-sm text-body">No notes added to this application.</p>
      )}
      {notes.length > 0 && (
        <ul className="mt-5 grid list-none gap-3 p-0">
          {notes.map((note) => (
            <li key={note.id} className="rounded-[10px] border border-border bg-page p-4">
              {editing?.id === note.id ? (
                <form onSubmit={(event) => void submitEdit(event)}>
                  <Textarea
                    label="Edit note"
                    value={editDraft}
                    disabled={pendingId !== null}
                    onChange={(event) => setEditDraft(event.target.value)}
                  />
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="submit" disabled={!editDraft.trim() || pendingId !== null}>
                      {pendingId === note.id ? 'Saving…' : 'Save'}
                    </Button>
                    <Button
                      variant="secondary"
                      disabled={pendingId !== null}
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <>
                  <p className="m-0 text-sm break-words whitespace-pre-wrap text-secondary">
                    {note.content}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      disabled={pendingId !== null}
                      onClick={() => {
                        setEditing(note)
                        setEditDraft(note.content)
                      }}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      disabled={pendingId !== null}
                      onClick={() => {
                        if (window.confirm('Delete this note?')) {
                          void remove(note)
                        }
                      }}
                    >
                      {pendingId === note.id ? 'Deleting…' : 'Delete'}
                    </Button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
