import { type FormEvent, useId, useRef, useState } from 'react'

import Button from './Button'
import Icon from './Icon'
import Input from './Input'
import Modal from './Modal'
import Textarea from './Textarea'

export type CompanyDraft = {
  companyName: string
  companyAddress: string
  bio: string
  websiteUrl: string
}

export type AddCompanyModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (values: CompanyDraft) => void | Promise<void>
  initialValues?: CompanyDraft
  title?: string
  submitLabel?: string
}

type CompanyErrors = Partial<Record<keyof CompanyDraft, string>>

function isValidUrl(value: string) {
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

function validateCompany(values: CompanyDraft): CompanyErrors {
  const errors: CompanyErrors = {}

  if (!values.companyName.trim()) {
    errors.companyName = 'Enter a company name to continue.'
  }
  if (values.websiteUrl.trim() && !isValidUrl(values.websiteUrl.trim())) {
    errors.websiteUrl = 'Enter a complete URL, such as https://example.com.'
  }

  return errors
}

export default function AddCompanyModal({
  open,
  onClose,
  onSubmit,
  initialValues,
  title = 'Add company',
  submitLabel = 'Save company',
}: AddCompanyModalProps) {
  const titleId = useId()
  const emptyValues: CompanyDraft = {
    companyName: '',
    companyAddress: '',
    bio: '',
    websiteUrl: '',
  }
  const [values, setValues] = useState<CompanyDraft>(initialValues ?? emptyValues)
  const [errors, setErrors] = useState<CompanyErrors>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const submittingRef = useRef(false)
  const close = () => {
    if (!submittingRef.current) {
      onClose()
    }
  }

  function update(key: keyof CompanyDraft, value: string) {
    setValues((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submittingRef.current) {
      return
    }

    const validationErrors = validateCompany(values)
    setErrors(validationErrors)
    if (Object.keys(validationErrors).length > 0) {
      return
    }

    submittingRef.current = true
    setSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit({
        companyName: values.companyName.trim(),
        companyAddress: values.companyAddress.trim(),
        bio: values.bio.trim(),
        websiteUrl: values.websiteUrl.trim(),
      })
      setValues(initialValues ?? emptyValues)
      setErrors({})
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Could not save the company.')
    } finally {
      submittingRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <Modal open={open} onClose={close} labelledBy={titleId} className="w-[680px]">
      <form
        noValidate
        onSubmit={(event) => void submit(event)}
        className="flex h-[656px] max-h-[calc(100dvh-32px)] max-w-full flex-col gap-6 overflow-hidden rounded-[24px] bg-surface p-5 text-left leading-normal sm:p-8"
      >
        <header className="flex shrink-0 items-start justify-between gap-4">
          <div className="flex flex-col gap-2">
            <h2 id={titleId} className="m-0 text-[28px] font-bold text-heading">
              {title}
            </h2>
            <p className="m-0 text-sm leading-[16px] text-secondary">
              Keep the organizations in your job search organized.
            </p>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={close}
            className="flex size-8 shrink-0 items-center justify-center"
          >
            <Icon name="modal-x" />
          </button>
        </header>

        <div className="flex min-h-0 flex-1 flex-col gap-5 overflow-y-auto overscroll-contain pr-1">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Input
              label="Company name *"
              required
              value={values.companyName}
              onChange={(event) => update('companyName', event.target.value)}
              placeholder="Ex: Acme"
              error={errors.companyName}
              wrapperClassName="min-h-[116px] sm:min-h-[99px]"
            />
            <Input
              label="Location"
              value={values.companyAddress}
              onChange={(event) => update('companyAddress', event.target.value)}
              placeholder="Ex: Madrid, Spain"
              wrapperClassName="min-h-[116px] sm:min-h-[99px]"
            />
          </div>
          <Input
            label="Website"
            type="url"
            value={values.websiteUrl}
            onChange={(event) => update('websiteUrl', event.target.value)}
            placeholder="https://example.com"
            error={errors.websiteUrl}
            wrapperClassName="min-h-[116px] sm:min-h-[99px]"
          />
          <Textarea
            label="About"
            value={values.bio}
            onChange={(event) => update('bio', event.target.value)}
            placeholder="Add a short note about this company…"
            helperText="Optional"
          />
          {submitError && (
            <p role="alert" className="m-0 text-sm text-danger">
              {submitError}
            </p>
          )}
        </div>

        <footer className="flex shrink-0 flex-wrap items-center justify-between gap-4 border-t border-border pt-[23px]">
          <p className="m-0 text-xs text-body">* Required fields</p>
          <div className="flex w-full gap-3 sm:w-auto">
            <Button
              variant="secondary"
              className="min-w-0 flex-1 sm:w-[100px] sm:flex-none"
              onClick={close}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="min-w-0 flex-1 sm:w-[148px] sm:flex-none"
              disabled={submitting}
            >
              {submitting ? 'Saving…' : submitLabel}
            </Button>
          </div>
        </footer>
      </form>
    </Modal>
  )
}
