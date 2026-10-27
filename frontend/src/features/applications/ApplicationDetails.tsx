import { useEffect, useId, useRef } from 'react'
import { Link } from 'react-router-dom'

import ApplicationCard from '../../components/ApplicationCard'
import Button from '../../components/Button'
import Icon from '../../components/Icon'
import type { ApplicationStatus, Company, JobApplication } from '../../types/api'
import useApplicationDetails from './useApplicationDetails'

export type ApplicationDetailsContentProps = {
  application: JobApplication
  company: Company
  companyHref?: string
  onEdit?: (application: JobApplication, company?: Company) => void
  onDelete?: (application: JobApplication) => void
  onStatusChange?: (
    application: JobApplication,
    status: ApplicationStatus,
  ) => void | JobApplication | Promise<void | JobApplication>
}

export function ApplicationDetailsContent({
  application,
  company,
  companyHref = `/companies/${company.id}`,
  onEdit,
  onDelete,
  onStatusChange,
}: ApplicationDetailsContentProps) {
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,410px)_minmax(0,1fr)]">
      <ApplicationCard
        application={application}
        companyName={company.companyName}
        onEdit={onEdit ? (selected) => onEdit(selected, company) : undefined}
        onDelete={onDelete}
        onStatusChange={onStatusChange}
      />
      <div className="flex min-w-0 flex-col gap-6">
        <section className="rounded-[24px] bg-surface p-6">
          <h2 className="m-0 text-xl font-bold text-heading">Opportunity details</h2>
          <dl className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs text-body">Salary</dt>
              <dd className="m-0 mt-1 text-sm break-words text-secondary">
                {application.salary?.toLocaleString() ?? 'Not specified'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-body">Source</dt>
              <dd className="m-0 mt-1 text-sm break-words text-secondary">{application.source}</dd>
            </div>
          </dl>
          {application.description ? (
            <p className="mt-5 text-sm break-words whitespace-pre-wrap text-secondary">
              {application.description}
            </p>
          ) : (
            <p className="mt-5 text-sm text-body">No opportunity details added.</p>
          )}
          {application.postingLink && (
            <a
              href={application.postingLink}
              target="_blank"
              rel="noreferrer"
              className="mt-5 inline-flex text-sm font-semibold text-heading underline"
            >
              Open job posting ↗
            </a>
          )}
        </section>
        <section className="rounded-[24px] bg-surface p-6">
          <h2 className="m-0 text-xl font-bold text-heading">Company</h2>
          <p className="m-0 mt-3 break-words text-secondary">{company.companyName}</p>
          {company.companyAddress && (
            <p className="m-0 mt-2 text-sm text-body">{company.companyAddress}</p>
          )}
          <Link
            to={companyHref}
            className="mt-5 inline-flex h-12 items-center rounded-[10px] bg-page px-5 text-sm font-bold text-heading"
          >
            View company
          </Link>
        </section>
      </div>
    </div>
  )
}

const PANEL_FOCUSABLE =
  'button:not(:disabled), input:not(:disabled):not([type="hidden"]), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])'

function panelControls(panel: HTMLElement) {
  return Array.from(panel.querySelectorAll<HTMLElement>(PANEL_FOCUSABLE)).filter(
    (element) => element.getClientRects().length > 0,
  )
}

function isTopLevelDialogTarget(target: EventTarget | null) {
  return target instanceof Element && Boolean(target.closest('dialog[open]'))
}

function cyclePanelTab(event: KeyboardEvent, panel: HTMLElement) {
  const controls = panelControls(panel)
  const first = controls[0]
  const last = controls[controls.length - 1]
  if (!first) {
    event.preventDefault()
    panel.focus()
  } else if (event.shiftKey && document.activeElement === first) {
    event.preventDefault()
    last.focus()
  } else if (!event.shiftKey && document.activeElement === last) {
    event.preventDefault()
    first.focus()
  }
}

function containPanelFocus(event: KeyboardEvent, panel: HTMLElement, onClose: () => void) {
  if (isTopLevelDialogTarget(event.target)) {
    return
  }
  if (!panel.contains(event.target as Node)) {
    event.preventDefault()
    panelControls(panel)[0]?.focus()
    return
  }
  if (event.key === 'Escape') {
    event.preventDefault()
    onClose()
  } else if (event.key === 'Tab') {
    cyclePanelTab(event, panel)
  }
}

export type ApplicationDetailsPanelProps = Omit<
  ApplicationDetailsContentProps,
  'application' | 'company'
> & {
  open: boolean
  applicationId?: string
  onClose: () => void
}

export function ApplicationDetailsPanel({
  open,
  applicationId,
  onClose,
  onStatusChange,
  ...actions
}: ApplicationDetailsPanelProps) {
  const titleId = useId()
  const panel = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const { details, isLoading, error, notFound, refresh, synchronize } = useApplicationDetails(
    applicationId,
    open,
  )
  useEffect(() => {
    const currentPanel = panel.current
    if (!open || !currentPanel) {
      return
    }
    const activePanel: HTMLElement = currentPanel
    previousFocus.current =
      document.activeElement instanceof HTMLElement ? document.activeElement : null
    const initialFocus = activePanel.querySelector<HTMLElement>('[data-autofocus]')
    ;(initialFocus ?? activePanel).focus()
    function keydown(event: KeyboardEvent) {
      containPanelFocus(event, activePanel, onClose)
    }
    function focusin(event: FocusEvent) {
      if (!activePanel.contains(event.target as Node) && !isTopLevelDialogTarget(event.target)) {
        panelControls(activePanel)[0]?.focus()
      }
    }
    window.addEventListener('keydown', keydown)
    document.addEventListener('focusin', focusin)
    return () => {
      window.removeEventListener('keydown', keydown)
      document.removeEventListener('focusin', focusin)
      previousFocus.current?.focus()
    }
  }, [onClose, open])
  if (!open) {
    return null
  }
  async function changeStatus(application: JobApplication, status: ApplicationStatus) {
    const updated = await onStatusChange?.(application, status)
    if (updated) {
      synchronize(updated)
    }
  }
  return (
    <div
      className="fixed inset-0 z-40 flex justify-end bg-overlay"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose()
        }
      }}
    >
      <div
        ref={panel}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="h-dvh w-full overflow-y-auto bg-page p-5 outline-none sm:max-w-[1100px] sm:p-8"
      >
        <header className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="m-0 text-sm font-bold text-accent">Application</p>
            <h1 id={titleId} className="m-0 mt-3 text-3xl font-bold text-heading">
              {details?.application.position ?? 'Application details'}
            </h1>
          </div>
          <button
            data-autofocus
            type="button"
            onClick={onClose}
            aria-label="Close application details"
            className="flex size-10 items-center justify-center rounded-[10px] bg-surface focus-visible:outline-2 focus-visible:outline-heading"
          >
            <Icon name="modal-x" />
          </button>
        </header>
        {isLoading && <p role="status">Loading application details…</p>}
        {error && (
          <div role="alert" className="rounded-[10px] bg-danger-surface p-4 text-sm text-danger">
            <p className="m-0">{notFound ? 'This application could not be found.' : error}</p>
            {!notFound && (
              <Button variant="secondary" className="mt-3" onClick={() => void refresh()}>
                Retry
              </Button>
            )}
          </div>
        )}
        {details && (
          <ApplicationDetailsContent
            {...details}
            {...actions}
            onStatusChange={onStatusChange ? changeStatus : undefined}
          />
        )}
      </div>
    </div>
  )
}
