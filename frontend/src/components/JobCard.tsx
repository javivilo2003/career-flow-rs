import type { HTMLAttributes } from 'react'

import Badge, { type BadgeStatus } from './Badge'
import Button from './Button'
import Icon from './Icon'
export type JobCardProps = Omit<HTMLAttributes<HTMLElement>, 'title'> & {
  title: string
  company: string
  initials?: string
  location: string
  status: Extract<BadgeStatus, 'Saved' | 'Applied' | 'Interview' | 'Offer'>
  applicationDate: string
  nextStep: string
  actionLabel?: string
  onAction: () => void
  onEdit: () => void
  onDelete: () => void
}
const actions = {
  Saved: 'Apply now',
  Applied: 'View application',
  Interview: 'View interview',
  Offer: 'Review offer',
}
export default function JobCard({
  title,
  company,
  initials,
  location,
  status,
  applicationDate,
  nextStep,
  actionLabel,
  onAction,
  onEdit,
  onDelete,
  className = '',
  ...props
}: JobCardProps) {
  return (
    <article
      className={`flex w-[410px] max-w-full flex-col gap-[22px] rounded-[24px] bg-surface p-6 text-left leading-normal ${className}`}
      {...props}
    >
      <div className="flex w-full items-center justify-between">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-page text-xl font-bold text-heading">
          {initials ?? company.slice(0, 1)}
        </span>
        <Badge status={status} />
      </div>
      <div className="flex flex-col gap-2">
        <h3 className="m-0 text-[21px] leading-[25px] font-bold text-heading">{title}</h3>
        <p className="m-0 text-base text-secondary">{company}</p>
        <p className="m-0 flex items-center gap-[7px] text-[13px] text-body">
          <Icon name="card-map-pin" />
          {location}
        </p>
      </div>
      <div className="flex flex-col gap-[9px] border-t border-border pt-[15px]">
        <p className="m-0 text-xs text-body">{applicationDate}</p>
        <p className="m-0 text-[13px] text-secondary">{nextStep}</p>
      </div>
      <div className="flex items-center gap-3">
        <Button className="min-w-0 flex-1 px-2" onClick={onAction}>
          {actionLabel ?? actions[status]}
        </Button>
        <button
          type="button"
          className="flex h-11 w-10 shrink-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-heading"
          aria-label={`Edit ${title} at ${company}`}
          onClick={onEdit}
        >
          <Icon name="card-pencil" />
        </button>
        <button
          type="button"
          className="flex h-11 w-8 shrink-0 items-center justify-center rounded focus-visible:outline-2 focus-visible:outline-heading"
          aria-label={`Delete ${title} at ${company}`}
          onClick={onDelete}
        >
          <Icon name="card-trash2" />
        </button>
      </div>
    </article>
  )
}
