import { type FormEvent, type ReactNode, useId, useState } from 'react'

import Button from './Button'
import Icon from './Icon'
import Input from './Input'
import Modal from './Modal'
import Select, { type SelectOption } from './Select'
import Textarea from './Textarea'

export type ApplicationDraftStatus =
  'Saved' | 'Preparing' | 'Applied' | 'Interview' | 'Offer' | 'Rejected' | 'Withdrawn'

export type ApplicationDraft = {
  role: string
  companyId: string
  jobType: string
  source: string
  salary: number | null
  appliedAt: string
  url: string
  status: ApplicationDraftStatus
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
  companyOptions: readonly SelectOption[]
}
const statuses: ApplicationDraftStatus[] = [
  'Saved',
  'Preparing',
  'Applied',
  'Interview',
  'Offer',
  'Rejected',
  'Withdrawn',
]

type ApplicationErrors = Partial<Record<keyof ApplicationDraft, string>>

function isValidUrl(value: string) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function validateRequiredFields(values: ApplicationDraft): ApplicationErrors {
  const errors: ApplicationErrors = {}

  if (!values.role.trim()) {
    errors.role = 'Enter a role to continue.'
  }
  if (!values.companyId) {
    errors.companyId = 'Choose an existing company to continue.'
  }
  if (!values.jobType.trim()) {
    errors.jobType = 'Enter a job type to continue.'
  }
  if (!values.source.trim()) {
    errors.source = 'Enter a source to continue.'
  }

  return errors
}

function validateOptionalFields(values: ApplicationDraft): ApplicationErrors {
  const errors: ApplicationErrors = {}

  if (values.url.trim() && !isValidUrl(values.url.trim())) {
    errors.url = 'Enter a complete URL, such as https://example.com/job.'
  }
  if (
    values.salary !== null &&
    (!Number.isInteger(values.salary) || values.salary < 0 || values.salary > 2147483647)
  ) {
    errors.salary = 'Enter a positive whole number below 2,147,483,648.'
  }
  if (values.notes.length > 1000) {
    errors.notes = `Notes are ${values.notes.length - 1000} characters over the limit. Shorten to 1,000 characters or fewer.`
  }

  return errors
}

function validateDraft(values: ApplicationDraft): ApplicationErrors {
  return { ...validateRequiredFields(values), ...validateOptionalFields(values) }
}

function hasErrors(errors: ApplicationErrors) {
  return Object.keys(errors).length > 0
}

function hasOptionalErrors(errors: ApplicationErrors) {
  return Boolean(errors.salary || errors.appliedAt || errors.url || errors.notes)
}

function visibleErrors(showValidationErrors: boolean, errors: ApplicationErrors) {
  return showValidationErrors ? errors : {}
}

function applicationFormWidth(optionalDetailsOpen: boolean) {
  return optionalDetailsOpen ? 'w-[1120px]' : 'w-[680px]'
}

function detailsButtonLabel(optionalDetailsOpen: boolean) {
  return optionalDetailsOpen ? 'Hide optional details' : '+ Add optional details'
}

type ApplicationFieldsProps = {
  values: ApplicationDraft
  errors: ApplicationErrors
  update: <K extends keyof ApplicationDraft>(key: K, value: ApplicationDraft[K]) => void
}

type RequiredApplicationFieldsProps = ApplicationFieldsProps & {
  companyOptions: readonly SelectOption[]
}

function RequiredApplicationFields({
  values,
  errors,
  update,
  companyOptions,
}: RequiredApplicationFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Role *"
          required
          value={values.role}
          onChange={(e) => update('role', e.target.value)}
          error={errors.role}
        />
        <Select
          label="Company *"
          required
          value={values.companyId}
          onChange={(value) => update('companyId', value)}
          options={companyOptions}
          placeholder={companyOptions.length > 0 ? 'Choose a company' : 'No companies available'}
          disabled={companyOptions.length === 0}
          error={errors.companyId}
        />
      </div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Job type *"
          required
          value={values.jobType}
          onChange={(e) => update('jobType', e.target.value)}
          placeholder="Full-time"
          error={errors.jobType}
        />
        <Input
          label="Source *"
          required
          value={values.source}
          onChange={(e) => update('source', e.target.value)}
          placeholder="LinkedIn, referral, company site…"
          error={errors.source}
        />
      </div>
      <Select
        label="Status *"
        value={values.status}
        onChange={(value) => update('status', value as ApplicationDraftStatus)}
        options={statuses.map((status) => ({ value: status, label: status }))}
      />
    </>
  )
}

function OptionalApplicationFields({ values, errors, update }: ApplicationFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Salary"
          type="number"
          min={0}
          max={2147483647}
          step={1}
          inputMode="numeric"
          value={values.salary ?? ''}
          onChange={(e) => update('salary', e.target.value === '' ? null : e.target.valueAsNumber)}
          placeholder="Annual amount"
          error={errors.salary}
        />
        <Input
          label="Applied date"
          type="date"
          value={values.appliedAt}
          onChange={(e) => update('appliedAt', e.target.value)}
        />
      </div>
      <Input
        label="Job URL"
        type="url"
        value={values.url}
        onChange={(e) => update('url', e.target.value)}
        helperText="Paste the original listing so you can find it later."
        error={errors.url}
      />
      <Textarea
        label="Notes"
        value={values.notes}
        onChange={(e) => update('notes', e.target.value)}
        placeholder="Add details about this opportunity…"
        helperText="Optional · Up to 1,000 characters"
        error={errors.notes}
      />
    </>
  )
}

type OptionalDetailsSectionProps = ApplicationFieldsProps & {
  id: string
  open: boolean
}

function OptionalDetailsSection({ id, open, values, errors, update }: OptionalDetailsSectionProps) {
  if (!open) {
    return null
  }

  return (
    <section
      id={id}
      aria-labelledby={`${id}-title`}
      className="flex min-w-0 flex-col gap-5 border-t border-border pt-[23px] lg:border-t-0 lg:border-l lg:pt-0 lg:pl-[23px]"
    >
      <h3 id={`${id}-title`} className="m-0 text-base font-semibold text-heading">
        Optional details
      </h3>
      <OptionalApplicationFields values={values} errors={errors} update={update} />
    </section>
  )
}

function FormFeedback({
  children,
  error,
  submitError,
}: {
  children?: ReactNode
  error?: string
  submitError: string
}) {
  const message = error || submitError

  return (
    <>
      {children}
      {message && (
        <p role="alert" className="m-0 text-sm text-danger">
          {message}
        </p>
      )}
    </>
  )
}

export function AddApplicationForm({
  initialValues,
  onSubmit,
  onClose,
  busy = false,
  error,
  titleId,
  children,
  companyOptions,
}: AddApplicationFormProps) {
  const generatedId = useId()
  const optionalDetailsId = `${generatedId}-optional-details`
  const [values, setValues] = useState<ApplicationDraft>({
    role: '',
    companyId: '',
    jobType: 'Full-time',
    source: 'Manual entry',
    salary: null,
    appliedAt: '',
    url: '',
    status: 'Saved',
    notes: '',
    ...initialValues,
  })
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [optionalDetailsOpen, setOptionalDetailsOpen] = useState(false)
  const pending = busy || submitting
  const validationErrors = validateDraft(values)
  const errors = visibleErrors(showValidationErrors, validationErrors)
  function update<K extends keyof ApplicationDraft>(key: K, value: ApplicationDraft[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }
  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pending) {
      return
    }
    setShowValidationErrors(true)
    if (hasErrors(validationErrors)) {
      if (hasOptionalErrors(validationErrors)) {
        setOptionalDetailsOpen(true)
      }
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit({
        ...values,
        role: values.role.trim(),
        jobType: values.jobType.trim(),
        source: values.source.trim(),
        url: values.url.trim(),
        notes: values.notes.trim(),
      })
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Could not save the application.')
    } finally {
      setSubmitting(false)
    }
  }
  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submit(event)
      }}
      className={`flex h-[656px] max-h-[calc(100dvh-32px)] max-w-full flex-col gap-6 overflow-hidden rounded-[24px] bg-surface p-8 text-left leading-normal transition-[width] duration-200 motion-reduce:transition-none ${applicationFormWidth(optionalDetailsOpen)}`}
    >
      <header className="flex shrink-0 items-start justify-between gap-4">
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
      <div className="min-h-0 flex-1 overflow-y-auto">
        <div
          className={`grid gap-6 ${optionalDetailsOpen ? 'lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]' : ''}`}
        >
          <section
            className="flex min-w-0 flex-col gap-5"
            aria-label="Required application details"
          >
            <RequiredApplicationFields
              values={values}
              errors={errors}
              update={update}
              companyOptions={companyOptions}
            />
            <button
              type="button"
              aria-expanded={optionalDetailsOpen}
              aria-controls={optionalDetailsId}
              onClick={() => setOptionalDetailsOpen((open) => !open)}
              className="self-start rounded-[10px] border border-border px-3 py-2 text-xs font-medium text-secondary transition-colors hover:border-body hover:text-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heading"
            >
              {detailsButtonLabel(optionalDetailsOpen)}
            </button>
          </section>
          <OptionalDetailsSection
            id={optionalDetailsId}
            open={optionalDetailsOpen}
            values={values}
            errors={errors}
            update={update}
          />
        </div>
        <FormFeedback error={error} submitError={submitError}>
          {children}
        </FormFeedback>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-border pt-[23px]">
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
            disabled={pending}
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
    <Modal open={open} onClose={props.onClose} labelledBy={titleId} className="w-fit">
      <AddApplicationForm {...props} titleId={titleId} />
    </Modal>
  )
}
