import { Link } from 'react-router-dom'

import type { Contact } from '../types/api'

export type ContactCardProps = {
  contact: Contact
  companyName: string
  detailsPath?: string
}

function contactInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export default function ContactCard({ contact, companyName, detailsPath }: ContactCardProps) {
  return (
    <article className="relative flex min-h-[260px] w-[410px] max-w-full flex-col gap-[22px] rounded-[24px] bg-surface p-6 text-left leading-normal">
      {detailsPath && (
        <Link
          to={detailsPath}
          aria-label={`View ${contact.name}`}
          className="absolute inset-0 rounded-[24px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heading"
        />
      )}
      <div className="flex items-center justify-between gap-4">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-page text-base font-bold text-heading">
          {contactInitials(contact.name)}
        </span>
        <span className="rounded-full bg-badge px-3 py-[7px] text-xs font-semibold text-heading">
          Contact
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="m-0 truncate text-[21px] leading-[25px] font-bold text-heading">
          {contact.name}
        </h2>
        <p className="m-0 truncate text-base text-secondary">{contact.jobRole}</p>
        <p className="m-0 truncate text-[13px] text-body">{companyName}</p>
      </div>
      <div className="flex flex-col gap-[9px] border-t border-border pt-[15px] text-[13px] text-secondary">
        <p className="m-0 truncate">{contact.email || 'Email not added'}</p>
        <p className="m-0 truncate">{contact.phone || 'Phone not added'}</p>
      </div>
    </article>
  )
}
