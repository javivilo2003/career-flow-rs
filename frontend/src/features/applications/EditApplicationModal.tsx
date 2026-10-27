import { type FormEvent, useId, useState } from 'react'

import {
  applicationUpdateRequest,
  updateApplication,
  type UpdateApplicationRequest,
} from '../../apis/applications'
import { getCompanies } from '../../apis/companies'
import Button from '../../components/Button'
import Icon from '../../components/Icon'
import Input from '../../components/Input'
import Modal from '../../components/Modal'
import Select from '../../components/Select'
import Textarea from '../../components/Textarea'
import {
  APPLICATION_STATUSES,
  type ApplicationStatus,
  type Company,
  type JobApplication,
} from '../../types/api'
import { RemoteCompanyPicker, type SearchApplicationCompanies } from './ApplicationsFilters'

export type EditApplicationModalProps = {
  open: boolean
  application: JobApplication
  company?: Company
  onClose: () => void
  onSaved: (application: JobApplication) => void | Promise<void>
  searchCompanies?: SearchApplicationCompanies
}

type Values = {
  companyId: string
  position: string
  jobType: string
  description: string
  salary: string
  status: ApplicationStatus
  appliedAt: string
  source: string
  postingLink: string
}

function initialValues(application: JobApplication): Values {
  return {
    companyId: application.companyId,
    position: application.position,
    jobType: application.jobType ?? '',
    description: application.description ?? '',
    salary: application.salary?.toString() ?? '',
    status: application.status,
    appliedAt: application.appliedAt ?? '',
    source: application.source,
    postingLink: application.postingLink ?? '',
  }
}

function validUrl(value: string) {
  if (!value.trim()) {
    return true
  }
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function positionError(value: string) {
  return !value.trim() ? 'Enter a role to continue.' : ''
}

function companyIdError(value: string) {
  return !value ? 'Select a company to continue.' : ''
}

function sourceError(value: string) {
  return !value.trim() ? 'Enter a source to continue.' : ''
}

function salaryError(salary: number | null) {
  if (salary === null) {
    return ''
  }
  if (!Number.isInteger(salary) || salary < 0 || salary > 2147483647) {
    return 'Enter a positive whole number below 2,147,483,648.'
  }
  return ''
}

function postingLinkError(value: string) {
  return validUrl(value) ? '' : 'Enter a complete URL, such as https://example.com/job.'
}

function visibleError(showErrors: boolean, error: string) {
  return showErrors ? error : ''
}

function CompanyFieldError({ show, error }: { show: boolean; error: string }) {
  if (!show || !error) {
    return null
  }
  return (
    <p role="alert" className="m-0 text-xs text-danger sm:col-start-2">
      {error}
    </p>
  )
}

function computeEditErrors(values: Values, salary: number | null) {
  return {
    position: positionError(values.position),
    companyId: companyIdError(values.companyId),
    source: sourceError(values.source),
    salary: salaryError(salary),
    postingLink: postingLinkError(values.postingLink),
  }
}

function buildEditRequest(
  application: JobApplication,
  values: Values,
  salary: number | null,
): UpdateApplicationRequest {
  return {
    ...applicationUpdateRequest(application),
    companyId: values.companyId,
    position: values.position.trim(),
    jobType: values.jobType.trim() || null,
    description: values.description.trim() || null,
    salary,
    status: values.status,
    appliedAt: values.appliedAt || null,
    source: values.source.trim(),
    postingLink: values.postingLink.trim() || null,
  }
}

type UseEditApplicationOptions = {
  application: JobApplication
  onSaved: (application: JobApplication) => void | Promise<void>
  onClose: () => void
}

type UseEditApplicationReturn = {
  values: Values
  busy: boolean
  error: string
  showErrors: boolean
  errors: ReturnType<typeof computeEditErrors>
  setField: <K extends keyof Values>(key: K, value: Values[K]) => void
  submit: (event: FormEvent) => Promise<void>
}

function useEditApplication({
  application,
  onSaved,
  onClose,
}: UseEditApplicationOptions): UseEditApplicationReturn {
  const [values, setValues] = useState(() => initialValues(application))
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [showErrors, setShowErrors] = useState(false)

  const salary = values.salary === '' ? null : Number(values.salary)
  const errors = computeEditErrors(values, salary)
  const invalid = Object.values(errors).some(Boolean)

  function setField<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setShowErrors(true)
    if (busy || invalid) {
      return
    }
    setBusy(true)
    setError('')
    try {
      const updated = await updateApplication(
        application.id,
        buildEditRequest(application, values, salary),
      )
      await onSaved(updated)
      onClose()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Could not update the application.')
    } finally {
      setBusy(false)
    }
  }

  return { values, busy, error, showErrors, errors, setField, submit }
}

export function EditApplicationForm({
  application,
  company,
  searchCompanies,
  onSaved,
  onClose,
  titleId,
}: {
  application: JobApplication
  company?: Company
  searchCompanies: SearchApplicationCompanies
  onSaved: (application: JobApplication) => void | Promise<void>
  onClose: () => void
  titleId: string
}) {
  const { values, busy, error, showErrors, errors, setField, submit } = useEditApplication({
    application,
    onSaved,
    onClose,
  })
  const [companyName, setCompanyName] = useState(company?.companyName ?? '')

  return (
    <form
      noValidate
      onSubmit={(event) => void submit(event)}
      className="flex max-h-[calc(100dvh-32px)] w-[760px] max-w-full flex-col gap-6 overflow-hidden rounded-[24px] bg-surface p-5 sm:p-8"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 id={titleId} className="m-0 text-[28px] font-bold text-heading">
            Edit application
          </h2>
          <p className="m-0 mt-2 text-sm text-secondary">
            Update this opportunity without losing its existing details.
          </p>
        </div>
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="flex size-8 items-center justify-center"
        >
          <Icon name="modal-x" />
        </button>
      </header>
      <div className="grid min-h-0 flex-1 grid-cols-1 gap-5 overflow-y-auto pr-1 sm:grid-cols-2">
        <Input
          label="Role *"
          required
          value={values.position}
          onChange={(event) => setField('position', event.target.value)}
          error={visibleError(showErrors, errors.position)}
        />
        <RemoteCompanyPicker
          companyId={values.companyId}
          selectedCompanyName={companyName}
          searchCompanies={searchCompanies}
          disabled={busy}
          onSelect={(next) => {
            setField('companyId', next?.id ?? '')
            setCompanyName(next?.companyName ?? '')
          }}
        />
        <CompanyFieldError show={showErrors} error={errors.companyId} />
        <Input
          label="Job type"
          value={values.jobType}
          onChange={(event) => setField('jobType', event.target.value)}
        />
        <Input
          label="Source *"
          required
          value={values.source}
          onChange={(event) => setField('source', event.target.value)}
          error={visibleError(showErrors, errors.source)}
        />
        <Input
          label="Salary"
          type="number"
          min={0}
          max={2147483647}
          step={1}
          value={values.salary}
          onChange={(event) => setField('salary', event.target.value)}
          error={visibleError(showErrors, errors.salary)}
        />
        <Input
          label="Applied date"
          type="date"
          value={values.appliedAt}
          onChange={(event) => setField('appliedAt', event.target.value)}
        />
        <Select
          label="Status *"
          value={values.status}
          options={APPLICATION_STATUSES.map((status) => ({
            value: status,
            label: status[0] + status.slice(1).toLowerCase(),
          }))}
          onChange={(status) => setField('status', status as ApplicationStatus)}
        />
        <Input
          label="Job URL"
          type="url"
          value={values.postingLink}
          onChange={(event) => setField('postingLink', event.target.value)}
          error={visibleError(showErrors, errors.postingLink)}
        />
        <Textarea
          label="Opportunity details"
          value={values.description}
          onChange={(event) => setField('description', event.target.value)}
          wrapperClassName="sm:col-span-2"
        />
      </div>
      {error && (
        <p role="alert" className="m-0 text-sm text-danger">
          {error}
        </p>
      )}
      <footer className="flex justify-end gap-3 border-t border-border pt-[23px]">
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy}>
          {busy ? 'Saving…' : 'Save changes'}
        </Button>
      </footer>
    </form>
  )
}

export default function EditApplicationModal({
  open,
  application,
  company,
  onClose,
  onSaved,
  searchCompanies = getCompanies,
}: EditApplicationModalProps) {
  const titleId = useId()
  return (
    <Modal open={open} onClose={onClose} labelledBy={titleId} className="w-[760px]">
      <EditApplicationForm
        key={application.id}
        titleId={titleId}
        application={application}
        company={company}
        searchCompanies={searchCompanies}
        onSaved={onSaved}
        onClose={onClose}
      />
    </Modal>
  )
}
