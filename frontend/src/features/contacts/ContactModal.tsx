import { type FormEvent, useId, useState } from 'react'

import { getCompanies } from '../../apis/companies'
import type { ContactRequest } from '../../apis/contacts'
import Button from '../../components/Button'
import Icon from '../../components/Icon'
import Input from '../../components/Input'
import Modal from '../../components/Modal'
import type { Company, Contact } from '../../types/api'
import CompanyCombobox from '../companies/CompanyCombobox'
import useCompanySearch from '../companies/useCompanySearch'

export type ContactDraft = {
  companyId: string
  name: string
  jobRole: string
  email: string
  phone: string
}

export type ContactModalProps = {
  open: boolean
  onClose: () => void
  onSubmit: (request: ContactRequest, company: Company | undefined) => Promise<void>
  contact?: Contact
  company?: Company
  fixedCompany?: Company
}

function initialDraft(contact?: Contact, company?: Company): ContactDraft {
  const empty = { companyId: company?.id ?? '', name: '', jobRole: '', email: '', phone: '' }
  if (!contact) {
    return empty
  }
  return {
    companyId: contact.companyId,
    name: contact.name,
    jobRole: contact.jobRole,
    email: contact.email ?? '',
    phone: contact.phone ?? '',
  }
}

function validateContact(draft: ContactDraft) {
  const errors: Partial<Record<keyof ContactDraft, string>> = {}
  if (!draft.name.trim()) {
    errors.name = 'Enter the contact’s name.'
  }
  if (!draft.jobRole.trim()) {
    errors.jobRole = 'Enter the contact’s job role.'
  }
  if (!draft.companyId) {
    errors.companyId = 'Select a company.'
  }
  return errors
}

function ContactCompanyField({
  fixedCompany,
  search,
  query,
  selectedCompany,
  error,
  submitting,
  select,
  change,
}: {
  fixedCompany?: Company
  search: ReturnType<typeof useCompanySearch>
  query: string
  selectedCompany?: Company
  error?: string
  submitting: boolean
  select: (company: Company) => void
  change: (value: string) => void
}) {
  if (fixedCompany) {
    return <Input label="Company *" value={fixedCompany.companyName} disabled />
  }
  return (
    <CompanyCombobox
      companies={search.companies}
      query={query}
      selectedCompanyId={selectedCompany?.id ?? ''}
      onQueryChange={change}
      onSelect={select}
      onCreate={() => undefined}
      allowCreate={false}
      loading={search.loading}
      loadingMore={search.loadingMore}
      hasMore={search.hasMore}
      searchError={search.error}
      onRetry={search.retry}
      onLoadMore={() => void search.loadMore()}
      error={error}
      disabled={submitting}
    />
  )
}

function ContactForm({
  onSubmit,
  onClose,
  contact,
  company,
  fixedCompany,
  titleId,
}: Omit<ContactModalProps, 'open'> & { titleId: string }) {
  const seed = fixedCompany ?? company
  const [draft, setDraft] = useState(() => initialDraft(contact, seed))
  const [selectedCompany, setSelectedCompany] = useState<Company | undefined>(seed)
  const [query, setQuery] = useState(seed?.companyName ?? '')
  const [errors, setErrors] = useState<Partial<Record<keyof ContactDraft, string>>>({})
  const [submitError, setSubmitError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const search = useCompanySearch({
    query,
    initialCompanies: seed ? [seed] : [],
    searchCompanies: fixedCompany ? undefined : getCompanies,
  })

  function update(key: keyof ContactDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }))
    setErrors((current) => ({ ...current, [key]: undefined }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    if (submitting) {
      return
    }
    const nextErrors = validateContact(draft)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length) {
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      await onSubmit(
        {
          companyId: draft.companyId,
          name: draft.name.trim(),
          jobRole: draft.jobRole.trim(),
          email: draft.email.trim() || null,
          phone: draft.phone.trim() || null,
        },
        fixedCompany ?? selectedCompany,
      )
    } catch (reason) {
      setSubmitError(reason instanceof Error ? reason.message : 'Could not save the contact.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form
      onSubmit={(event) => void submit(event)}
      noValidate
      className="flex w-[680px] max-w-full flex-col gap-6 rounded-[24px] bg-surface p-5 text-left sm:p-8"
    >
      <header className="flex items-start justify-between gap-4">
        <div>
          <h2 id={titleId} className="m-0 text-[28px] font-bold text-heading">
            {contact ? 'Edit contact' : 'Add contact'}
          </h2>
          <p className="m-0 mt-2 text-sm text-secondary">
            Keep the people at your companies within reach.
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
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          data-autofocus
          label="Name *"
          required
          value={draft.name}
          error={errors.name}
          onChange={(event) => update('name', event.target.value)}
        />
        <Input
          label="Job role *"
          required
          value={draft.jobRole}
          error={errors.jobRole}
          onChange={(event) => update('jobRole', event.target.value)}
        />
      </div>
      <ContactCompanyField
        fixedCompany={fixedCompany}
        search={search}
        query={query}
        selectedCompany={selectedCompany}
        error={errors.companyId}
        submitting={submitting}
        change={(value) => {
          setQuery(value)
          setSelectedCompany(undefined)
          update('companyId', '')
        }}
        select={(value) => {
          setSelectedCompany(value)
          setQuery(value.companyName)
          update('companyId', value.id)
        }}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label="Email"
          type="email"
          value={draft.email}
          onChange={(event) => update('email', event.target.value)}
        />
        <Input
          label="Phone"
          type="tel"
          value={draft.phone}
          onChange={(event) => update('phone', event.target.value)}
        />
      </div>
      {submitError && (
        <p role="alert" className="m-0 text-sm text-danger">
          {submitError}
        </p>
      )}
      <footer className="flex flex-wrap items-center justify-between gap-4 border-t border-border pt-[23px]">
        <p className="m-0 text-xs text-body">* Required fields</p>
        <div className="flex w-full gap-3 sm:w-auto">
          <Button variant="secondary" className="flex-1 sm:flex-none" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1 sm:flex-none" disabled={submitting}>
            {submitting ? 'Saving…' : 'Save contact'}
          </Button>
        </div>
      </footer>
    </form>
  )
}

export default function ContactModal({ open, ...props }: ContactModalProps) {
  const titleId = useId()
  return (
    <Modal open={open} onClose={props.onClose} labelledBy={titleId} className="w-[680px]">
      <ContactForm {...props} titleId={titleId} />
    </Modal>
  )
}
