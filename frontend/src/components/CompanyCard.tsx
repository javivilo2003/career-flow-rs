import { Link } from 'react-router-dom'

import type { Company } from '../types/api'
import Button from './Button'
import Icon from './Icon'

export type CompanyCardProps = {
  company: Company
  detailsPath?: string
}

function companyInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join('')
    .toUpperCase()
}

function websiteLabel(websiteUrl: string | null) {
  if (!websiteUrl) {
    return 'Website not added'
  }

  try {
    return new URL(websiteUrl).hostname.replace(/^www\./, '')
  } catch {
    return websiteUrl
  }
}

export default function CompanyCard({ company, detailsPath }: CompanyCardProps) {
  return (
    <article className="relative flex h-[335px] w-[410px] max-w-full flex-col gap-[22px] overflow-hidden rounded-[24px] bg-surface p-6 text-left leading-normal">
      {detailsPath && (
        <Link
          to={detailsPath}
          aria-label={`View ${company.companyName}`}
          className="absolute inset-0 z-0 rounded-[24px] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heading"
        />
      )}
      <div className="flex w-full items-center justify-between">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-[12px] bg-page text-xl font-bold text-heading">
          {companyInitials(company.companyName)}
        </span>
        <span className="rounded-full bg-badge px-3 py-[7px] text-xs font-semibold text-heading">
          Company
        </span>
      </div>

      <div className="flex min-w-0 flex-col gap-2">
        <h2 className="m-0 truncate text-[21px] leading-[25px] font-bold text-heading">
          {company.companyName}
        </h2>
        <p className="m-0 truncate text-base text-secondary">{websiteLabel(company.websiteUrl)}</p>
        <p className="m-0 flex min-w-0 items-center gap-[7px] text-[13px] text-body">
          <Icon name="card-map-pin" />
          <span className="truncate">{company.companyAddress || 'Location not added'}</span>
        </p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col gap-[9px] border-t border-border pt-[15px]">
        <p className="m-0 text-xs text-body">About</p>
        <p className="m-0 line-clamp-1 text-[13px] text-secondary">
          {company.bio || 'No company notes added yet.'}
        </p>
      </div>

      {company.websiteUrl ? (
        <a
          href={company.websiteUrl}
          target="_blank"
          rel="noreferrer"
          className="relative z-10 inline-flex h-12 w-full items-center justify-center rounded-[10px] border border-page bg-page px-5 text-sm font-bold text-heading focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-heading"
        >
          Visit website
        </a>
      ) : (
        <Button disabled className="relative z-10 w-full">
          Website not added
        </Button>
      )}
    </article>
  )
}
