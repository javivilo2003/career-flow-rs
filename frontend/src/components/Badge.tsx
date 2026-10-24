import type { HTMLAttributes } from 'react'

import Icon, { type IconName } from './Icon'
export type BadgeStatus = 'Saved' | 'Applied' | 'Interview' | 'Offer' | 'Rejected'
const icons: Record<BadgeStatus, IconName> = {
  Saved: 'badge-bookmark',
  Applied: 'badge-send',
  Interview: 'badge-messages-square',
  Offer: 'badge-check',
  Rejected: 'badge-x',
}
const colors: Record<BadgeStatus, string> = {
  Saved: 'bg-badge text-heading',
  Applied: 'bg-badge text-heading',
  Interview: 'bg-badge text-heading',
  Offer: 'bg-success-surface text-success',
  Rejected: 'bg-danger-surface text-danger',
}
export default function Badge({
  status,
  className = '',
  ...props
}: HTMLAttributes<HTMLSpanElement> & { status: BadgeStatus }) {
  return (
    <span
      className={`inline-flex h-7 shrink-0 items-center gap-[7px] rounded-full px-3 text-xs leading-normal font-semibold ${colors[status]} ${className}`}
      {...props}
    >
      <Icon name={icons[status]} />
      {status}
    </span>
  )
}
