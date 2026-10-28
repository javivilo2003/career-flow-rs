import { type FormEvent, type ReactNode, useId, useMemo, useRef, useState } from 'react'

import { type CompanyRequest, createCompany, getCompanies } from '../apis/companies'
import ApplicationCompanyField from '../features/companies/ApplicationCompanyField'
import type { SearchCompanies } from '../features/companies/useCompanySearch'
import type { Company } from '../types/api'
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
  title?: string
  description?: string
  submitLabel?: string
  enableInlineCompanyCreation?: boolean
  busy?: boolean
  error?: string
  titleId?: string
  children?: ReactNode
  companies?: readonly Company[]
  companyOptions?: readonly SelectOption[]
  onSearchCompanies?: SearchCompanies
  onCreateCompany?: (request: CompanyRequest) => Promise<Company>
  onCompanySelected?: (company: Company) => void
  onCompanyCreated?: (company: Company) => void
  fixedCompany?: Company
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
const noCompanyOptions: readonly SelectOption[] = []
function applicationDraft(initialValues?: Partial<ApplicationDraft>): ApplicationDraft {
  return {
    role: '',
    companyId: '',
    jobType: '',
    source: 'Manual entry',
    salary: null,
    appliedAt: '',
    url: '',
    status: 'Saved',
    notes: '',
    ...initialValues,
  }
}

function hasOptionalDetails(draft: ApplicationDraft) {
  return Boolean(
    draft.jobType ||
    draft.source !== 'Manual entry' ||
    draft.salary !== null ||
    draft.appliedAt ||
    draft.notes,
  )
}

function companySeeds(companies: readonly Company[] | undefined, options: readonly SelectOption[]) {
  return companies
    ? [...companies]
    : options.map((option) => ({
        id: option.value,
        companyName: option.label,
        companyAddress: null,
        bio: null,
        websiteUrl: null,
      }))
}

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
    errors.companyId = 'Select a company or create a new one to continue.'
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

function hasOptionalErrors(errors: ApplicationErrors) {
  return Boolean(errors.salary || errors.appliedAt || errors.url || errors.notes)
}

function normalizedDraft(values: ApplicationDraft): ApplicationDraft {
  return {
    ...values,
    role: values.role.trim(),
    jobType: values.jobType.trim(),
    source: values.source.trim() || 'Manual entry',
    url: values.url.trim(),
    notes: values.notes.trim(),
  }
}

const applicationFormWidth = (open: boolean) => (open ? 'w-[1120px]' : 'w-[680px]')
const applicationFormHeight = (open: boolean) => (open ? 'h-[704px]' : 'h-[656px]')
const detailsButtonLabel = (open: boolean) =>
  open ? 'Hide optional details' : '+ Add optional details'

type ApplicationFieldsProps = {
  values: ApplicationDraft
  errors: ApplicationErrors
  update: <K extends keyof ApplicationDraft>(key: K, value: ApplicationDraft[K]) => void
}

type RequiredApplicationFieldsProps = ApplicationFieldsProps & {
  companyField: ReactNode
}

function RequiredApplicationFields({
  values,
  errors,
  update,
  companyField,
}: RequiredApplicationFieldsProps) {
  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <Input
          label="Role *"
          required
          value={values.role}
          onChange={(e) => update('role', e.target.value)}
          placeholder="Ex: Backend Developer"
          error={errors.role}
          wrapperClassName="min-h-[116px] sm:min-h-[99px]"
        />
        {companyField}
      </div>
      <Input
        label="Job URL"
        type="url"
        value={values.url}
        onChange={(e) => update('url', e.target.value)}
        placeholder="https://company.com/jobs/…"
        helperText="Optional · Paste the original listing to find it later."
        error={errors.url}
        wrapperClassName="min-h-[116px] sm:min-h-[99px]"
      />
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
          label="Job type"
          value={values.jobType}
          onChange={(e) => update('jobType', e.target.value)}
          placeholder="Ex: Full-time"
          wrapperClassName="min-h-[99px]"
        />
        <Input
          label="Source"
          value={values.source}
          onChange={(e) => update('source', e.target.value)}
          placeholder="Ex: LinkedIn or referral"
          error={errors.source}
          wrapperClassName="min-h-[99px]"
        />
      </div>
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
          wrapperClassName="min-h-[116px]"
        />
        <Input
          label="Applied date"
          type="date"
          value={values.appliedAt}
          onChange={(e) => update('appliedAt', e.target.value)}
          wrapperClassName="min-h-[116px]"
        />
      </div>
      <Textarea
        label="Notes"
        value={values.notes}
        onChange={(e) => update('notes', e.target.value)}
        placeholder="Add details about this opportunity…"
        helperText="Optional · Up to 1,000 characters"
        error={errors.notes}
        wrapperClassName="min-h-[176px] sm:min-h-[159px]"
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

function ApplicationFormFooter({
  pending,
  onClose,
  submitLabel,
}: {
  pending: boolean
  onClose: () => void
  submitLabel: string
}) {
  return (
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
          {pending ? 'Saving…' : submitLabel}
        </Button>
      </div>
    </footer>
  )
}

type ApplicationFormStateProps = AddApplicationFormProps & {
  initialDraft: ApplicationDraft
  title: string
  description: string
  submitLabel: string
  enableInlineCompanyCreation: boolean
}

function ApplicationFormState({
  initialDraft,
  onSubmit,
  onClose,
  title,
  description,
  submitLabel,
  enableInlineCompanyCreation,
  busy = false,
  error,
  titleId,
  children,
  companies: suppliedCompanies,
  companyOptions = noCompanyOptions,
  onSearchCompanies,
  onCreateCompany,
  onCompanySelected,
  onCompanyCreated,
  fixedCompany,
}: ApplicationFormStateProps) {
  const generatedId = useId()
  const optionalDetailsId = `${generatedId}-optional-details`
  const [values, setValues] = useState<ApplicationDraft>(initialDraft)
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const [submitError, setSubmitError] = useState('')
  const [showValidationErrors, setShowValidationErrors] = useState(false)
  const [optionalDetailsOpen, setOptionalDetailsOpen] = useState(() =>
    hasOptionalDetails(initialDraft),
  )
  const initialCompanies = useMemo<Company[]>(
    () => (fixedCompany ? [fixedCompany] : companySeeds(suppliedCompanies, companyOptions)),
    [companyOptions, fixedCompany, suppliedCompanies],
  )
  const initiallySelected = initialCompanies.find((company) => company.id === values.companyId)
  const pending = busy || submitting
  const validationErrors = validateDraft(values)
  const errors = showValidationErrors ? validationErrors : {}
  function update<K extends keyof ApplicationDraft>(key: K, value: ApplicationDraft[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (pending || submittingRef.current) {
      return
    }
    setShowValidationErrors(true)
    if (Object.keys(validationErrors).length > 0) {
      if (hasOptionalErrors(validationErrors)) {
        setOptionalDetailsOpen(true)
      }
      return
    }
    submittingRef.current = true
    setSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit(normalizedDraft(values))
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Could not save the application.')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }
  return (
    <form
      noValidate
      onSubmit={(event) => {
        void submit(event)
      }}
      className={`flex max-h-[calc(100dvh-32px)] max-w-full flex-col gap-5 overflow-hidden rounded-[24px] bg-surface p-5 text-left leading-normal transition-[width,height] duration-200 motion-reduce:transition-none sm:gap-6 sm:p-8 ${applicationFormWidth(optionalDetailsOpen)} ${applicationFormHeight(optionalDetailsOpen)}`}
    >
      <header className="flex shrink-0 items-start justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h2 id={titleId ?? generatedId} className="m-0 text-[28px] font-bold text-heading">
            {title}
          </h2>
          <p className="m-0 text-sm leading-[16px] text-secondary">{description}</p>
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
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1">
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
              companyField={
                <ApplicationCompanyField
                  initialCompanies={initialCompanies}
                  selectedCompanyId={values.companyId}
                  selectedCompanyName={initiallySelected?.companyName}
                  error={errors.companyId}
                  disabled={pending || Boolean(fixedCompany)}
                  searchCompanies={onSearchCompanies}
                  createCompany={onCreateCompany}
                  enableInlineCompanyCreation={enableInlineCompanyCreation && !fixedCompany}
                  onChange={(company) => update('companyId', company?.id ?? '')}
                  onCompanySelected={onCompanySelected}
                  onCompanyCreated={onCompanyCreated}
                />
              }
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
      <ApplicationFormFooter pending={pending} onClose={onClose} submitLabel={submitLabel} />
    </form>
  )
}

export function AddApplicationForm(props: AddApplicationFormProps) {
  const initialDraft = applicationDraft(props.initialValues)

  return (
    <ApplicationFormState
      key={JSON.stringify(initialDraft)}
      {...props}
      initialDraft={initialDraft}
      title={props.title ?? 'Add job application'}
      description={props.description ?? 'Keep your next opportunity in one place.'}
      submitLabel={props.submitLabel ?? 'Save application'}
      enableInlineCompanyCreation={props.enableInlineCompanyCreation ?? true}
    />
  )
}
export type AddApplicationModalProps = AddApplicationFormProps & { open: boolean }
export default function AddApplicationModal({
  open,
  onSearchCompanies = getCompanies,
  onCreateCompany = createCompany,
  ...props
}: AddApplicationModalProps) {
  const titleId = useId()
  return (
    <Modal open={open} onClose={props.onClose} labelledBy={titleId} className="w-fit">
      <AddApplicationForm
        {...props}
        onSearchCompanies={onSearchCompanies}
        onCreateCompany={onCreateCompany}
        titleId={titleId}
      />
    </Modal>
  )
}
