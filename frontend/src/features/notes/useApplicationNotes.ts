import { useCallback, useEffect, useRef, useState } from 'react'

import { createNote, deleteNote, getNotes, NoteApiError, updateNote } from '../../apis/notes'
import type { Note } from '../../types/api'

function message(reason: unknown, fallback: string) {
  return reason instanceof Error ? reason.message : fallback
}

function useNotesLoad(applicationId: string) {
  const [notes, setNotes] = useState<Note[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const request = useRef(0)
  const load = useCallback(async () => {
    await Promise.resolve()
    const token = ++request.current
    setIsLoading(true)
    try {
      const page = await getNotes({ jobApplicationId: applicationId })
      if (request.current === token) {
        setNotes(page.content)
        setError(null)
      }
    } catch (reason) {
      if (request.current === token) {
        setError(message(reason, 'Could not load notes.'))
      }
    } finally {
      if (request.current === token) {
        setIsLoading(false)
      }
    }
  }, [applicationId])
  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0)
    return () => {
      window.clearTimeout(timeout)
      request.current += 1
    }
  }, [load])
  return { notes, setNotes, isLoading, error, load }
}

function usePendingNoteAction() {
  const [mutationError, setMutationError] = useState<string | null>(null)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const pending = useRef(false)
  const run = useCallback(
    async <T>(id: string, action: () => Promise<T>, fallback: string, onMissing?: () => void) => {
      if (pending.current) {
        return null
      }
      pending.current = true
      setPendingId(id)
      setMutationError(null)
      try {
        return await action()
      } catch (reason) {
        if (reason instanceof NoteApiError && reason.status === 404) {
          onMissing?.()
        }
        setMutationError(message(reason, fallback))
        return null
      } finally {
        pending.current = false
        setPendingId(null)
      }
    },
    [],
  )
  return { mutationError, pendingId, run }
}

function useNoteMutations(
  applicationId: string,
  setNotes: React.Dispatch<React.SetStateAction<Note[]>>,
) {
  const { mutationError, pendingId, run } = usePendingNoteAction()
  const add = useCallback(
    async (content: string) => {
      const created = await run(
        'new',
        () => createNote({ jobApplicationId: applicationId, content }),
        'Could not add the note.',
      )
      if (created) {
        setNotes((current) => [created, ...current.filter((note) => note.id !== created.id)])
      }
      return created
    },
    [applicationId, run, setNotes],
  )
  const edit = useCallback(
    async (note: Note, content: string) => {
      const updated = await run(
        note.id,
        () => updateNote(note.id, { jobApplicationId: applicationId, content }),
        'Could not update the note.',
        () => setNotes((current) => current.filter((item) => item.id !== note.id)),
      )
      if (updated) {
        setNotes((current) => current.map((item) => (item.id === updated.id ? updated : item)))
      }
      return updated
    },
    [applicationId, run, setNotes],
  )
  const remove = useCallback(
    async (note: Note) => {
      const removed = await run(
        note.id,
        () => deleteNote(note.id).then(() => true),
        'Could not delete the note.',
        () => setNotes((current) => current.filter((item) => item.id !== note.id)),
      )
      if (removed) {
        setNotes((current) => current.filter((item) => item.id !== note.id))
      }
      return Boolean(removed)
    },
    [run, setNotes],
  )
  return { mutationError, pendingId, add, edit, remove }
}

export default function useApplicationNotes(applicationId: string) {
  const loaded = useNotesLoad(applicationId)
  const mutations = useNoteMutations(applicationId, loaded.setNotes)
  return {
    notes: loaded.notes,
    isLoading: loaded.isLoading,
    error: loaded.error,
    retry: loaded.load,
    ...mutations,
  }
}
