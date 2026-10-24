import { useId, useState } from 'react'

import Button from './Button'
import Icon from './Icon'
import Modal from './Modal'
export type DeleteApplicationContentProps = {
  title: string
  company: string
  applicationDate: string
  onClose: () => void
  onDelete: () => void | Promise<void>
  busy?: boolean
  error?: string
  titleId?: string
  descriptionId?: string
  autoFocusCancel?: boolean
}
export function DeleteApplicationContent({
  title,
  company,
  applicationDate,
  onClose,
  onDelete,
  busy,
  error,
  titleId,
  descriptionId,
  autoFocusCancel = false,
}: DeleteApplicationContentProps) {
  const [pending, setPending] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  async function remove() {
    if (busy || pending) {
      return
    }
    setPending(true)
    setDeleteError('')
    try {
      await onDelete()
    } catch (reason) {
      setDeleteError(reason instanceof Error ? reason.message : 'Could not delete the application.')
    } finally {
      setPending(false)
    }
  }
  return (
    <div className="flex w-[568px] max-w-full flex-col gap-6 rounded-[24px] bg-surface p-8 text-left leading-normal">
      <header className="flex items-center justify-between">
        <span className="flex size-[52px] items-center justify-center rounded-full bg-page">
          <Icon name="modal-trash2" />
        </span>
        <button
          type="button"
          aria-label="Close dialog"
          onClick={onClose}
          className="flex size-8 items-center justify-center"
        >
          <Icon name="modal-x" />
        </button>
      </header>
      <div className="flex flex-col gap-3">
        <h2 id={titleId} className="m-0 text-[28px] font-bold text-heading">
          Delete this application?
        </h2>
        <p id={descriptionId} className="m-0 text-base leading-[1.5] text-secondary">
          This will permanently remove the application and all associated notes. This action cannot
          be undone.
        </p>
      </div>
      <div className="flex flex-col gap-[6px] rounded-[10px] bg-page p-5">
        <p className="m-0 text-base font-bold text-heading">{title}</p>
        <p className="m-0 text-sm leading-[16px] text-secondary">{company}</p>
        <p className="m-0 text-xs text-body">{applicationDate}</p>
      </div>
      {(error || deleteError) && (
        <p role="alert" className="m-0 text-sm text-danger">
          {error || deleteError}
        </p>
      )}
      <footer className="flex gap-3 border-t border-border pt-[23px]">
        <Button
          variant="secondary"
          className="min-w-0 flex-1"
          onClick={onClose}
          data-autofocus={autoFocusCancel || undefined}
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          className="min-w-0 flex-1"
          onClick={() => void remove()}
          disabled={busy || pending}
        >
          {busy || pending ? 'Deleting…' : 'Delete application'}
        </Button>
      </footer>
    </div>
  )
}
export type DeleteApplicationModalProps = DeleteApplicationContentProps & { open: boolean }
export default function DeleteApplicationModal({ open, ...props }: DeleteApplicationModalProps) {
  const titleId = useId()
  const descriptionId = useId()
  return (
    <Modal
      open={open}
      onClose={props.onClose}
      labelledBy={titleId}
      describedBy={descriptionId}
      className="w-[568px]"
    >
      <DeleteApplicationContent
        {...props}
        autoFocusCancel
        titleId={titleId}
        descriptionId={descriptionId}
      />
    </Modal>
  )
}
