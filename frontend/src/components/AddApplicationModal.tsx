import { type FormEvent, type ReactNode, useId, useState } from 'react'

import type { BadgeStatus } from './Badge'
import Button from './Button'
import Icon from './Icon'
import Input from './Input'
import Modal from './Modal'
import Select from './Select'
import Textarea from './Textarea'

export type ApplicationDraft = {
  role: string
  company: string
  url: string
  status: BadgeStatus
  notes: string
}
export type AddApplicationFormProps = {
  initialValues?: Partial<ApplicationDraft>
  onSubmit: (values: ApplicationDraft) => void | Promise<void>
  onClose: () => void
  busy?: boolean
  error?: string
  titleId?: string
  children?: ReactNode
}
const statuses: BadgeStatus[] = ['Saved', 'Applied', 'Interview', 'Offer', 'Rejected']
export function AddApplicationForm({
  initialValues,
  onSubmit,
  onClose,
  busy = false,
  error,
  titleId,
  children,
}: AddApplicationFormProps) {
  const generatedId = useId()
  const [values, setValues] = useState<ApplicationDraft>({
    role: '',
    company: '',
    url: '',
    status: 'Saved',
    notes: '',
    ...initialValues,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const pending = busy || submitting
  function update<K extends keyof ApplicationDraft>(key: K, value: ApplicationDraft[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pending || !values.role.trim() || !values.company.trim() || values.notes.length > 1000) {
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit({ ...values, role: values.role.trim(), company: values.company.trim() })
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Could not save the application.')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <form
      onSubmit={(event) => {
        void submit(event)
      }}
      className="flex w-[680px] max-w-full flex-col gap-6 rounded-[24px] bg-surface p-8 text-left leading-normal"
    >
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 id={titleId ?? generatedId} className="m-0 text-[28px] font-bold text-heading">
            Add job application
          </h2>
          <p className="m-0 text-sm leading-[16px] text-secondary">
            Keep your next opportunity in one place.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="flex size-8 shrink-0 items-center justify-center"
        >
          <Icon name="modal-x" />
        </button>
      </header>
      <div className="flex flex-col gap-5">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <Input
            label="Role *"
            required
            value={values.role}
            onChange={(e) => update('role', e.target.value)}
          />
          <Input
            label="Company *"
            required
            value={values.company}
            onChange={(e) => update('company', e.target.value)}
          />
        </div>
        <Input
          label="Job URL"
          type="url"
          value={values.url}
          onChange={(e) => update('url', e.target.value)}
          helperText="Paste the original listing so you can find it later."
        />
        <Select
          label="Status"
          value={values.status}
          onChange={(value) => update('status', value as BadgeStatus)}
          options={statuses.map((status) => ({ value: status, label: status }))}
        />
        <Textarea
          label="Notes"
          value={values.notes}
          onChange={(e) => update('notes', e.target.value)}
          placeholder="Add details about this opportunity…"
          helperText="Optional · Up to 1,000 characters"
          error={
            values.notes.length > 1000
              ? `Notes are ${values.notes.length - 1000} characters over the limit. Shorten to 1,000 characters or fewer.`
              : undefined
          }
        />
        {children}
        {(error || submitError) && (
          <p role="alert" className="m-0 text-sm text-danger">
            {error || submitError}
          </p>
        )}
      </div>
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-[23px]">
        <p className="m-0 text-xs text-body">* Required fields</p>
        <div className="flex w-full gap-3 sm:w-auto">
          <Button
            variant="secondary"
            className="min-w-0 flex-1 sm:w-[100px] sm:flex-none"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            className="min-w-0 flex-1 sm:w-[172px] sm:flex-none"
            disabled={pending || values.notes.length > 1000}
          >
            {pending ? 'Saving…' : 'Save application'}
          </Button>
        </div>
      </footer>
    </form>
  )
}
export type AddApplicationModalProps = AddApplicationFormProps & { open: boolean }
export default function AddApplicationModal({ open, ...props }: AddApplicationModalProps) {
  const titleId = useId()
  return (
    <Modal open={open} onClose={props.onClose} labelledBy={titleId} className="w-[680px]">
      <AddApplicationForm {...props} titleId={titleId} />
    </Modal>
  )
}
