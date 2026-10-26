import { type ReactNode, useEffect, useRef } from 'react'
export type ModalProps = {
  open: boolean
  onClose: () => void
  labelledBy: string
  describedBy?: string
  children: ReactNode
  className?: string
}
export default function Modal({
  open,
  onClose,
  labelledBy,
  describedBy,
  children,
  className = '',
}: ModalProps) {
  const ref = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    const dialog = ref.current
    if (!dialog || !open) {
      return
    }
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    dialog.showModal()
    dialog.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    const overflow = document.body.style.overflow
    const paddingRight = document.body.style.paddingRight
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth
    if (scrollbarWidth > 0) {
      const currentPaddingRight = Number.parseFloat(
        window.getComputedStyle(document.body).paddingRight,
      )
      document.body.style.paddingRight = `${currentPaddingRight + scrollbarWidth}px`
    }
    document.body.style.overflow = 'hidden'
    return () => {
      dialog.close()
      document.body.style.overflow = overflow
      document.body.style.paddingRight = paddingRight
      previous?.focus()
    }
  }, [open])
  return (
    <dialog
      ref={ref}
      aria-labelledby={labelledBy}
      aria-describedby={describedBy}
      onKeyDown={(event) => {
        if (event.key !== 'Tab') {
          return
        }
        const controls = Array.from(
          event.currentTarget.querySelectorAll<HTMLElement>(
            'button:not(:disabled), input:not(:disabled):not([type="hidden"]), textarea:not(:disabled), select:not(:disabled), a[href], [tabindex]:not([tabindex="-1"])',
          ),
        ).filter((element) => element.getClientRects().length > 0)
        const first = controls[0]
        const last = controls[controls.length - 1]
        if (!first) {
          event.preventDefault()
          return
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }}
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          const box = event.currentTarget.getBoundingClientRect()
          if (
            event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom
          ) {
            onClose()
          }
        }
      }}
      className={`m-auto max-h-[calc(100dvh-32px)] max-w-[calc(100vw-32px)] overflow-visible rounded-[24px] border-0 bg-surface p-0 text-left text-heading ${className}`}
    >
      {open && children}
    </dialog>
  )
}
