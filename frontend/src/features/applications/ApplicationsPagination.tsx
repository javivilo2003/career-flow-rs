import Button from '../../components/Button'
import type { Page } from '../../types/api'

export type ApplicationsPaginationProps = {
  page: Pick<Page<unknown>, 'number' | 'totalPages' | 'totalElements' | 'first' | 'last'>
  onPageChange: (page: number) => void
  disabled?: boolean
}

export default function ApplicationsPagination({
  page,
  onPageChange,
  disabled,
}: ApplicationsPaginationProps) {
  if (page.totalPages <= 1) {
    return null
  }
  return (
    <nav
      aria-label="Applications pagination"
      className="mt-8 flex flex-wrap items-center justify-between gap-4"
    >
      <p className="m-0 text-sm text-secondary">
        Page {page.number + 1} of {page.totalPages} · {page.totalElements} applications
      </p>
      <div className="flex gap-3">
        <Button
          variant="secondary"
          disabled={disabled || page.first}
          onClick={() => onPageChange(page.number)}
        >
          Previous
        </Button>
        <Button
          variant="secondary"
          disabled={disabled || page.last}
          onClick={() => onPageChange(page.number + 2)}
        >
          Next
        </Button>
      </div>
    </nav>
  )
}
