import Add01Icon from '@hugeicons/core-free-icons/Add01Icon'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ReactNode } from 'react'

export type EmptyCompaniesProps = {
  openAddCompanyModal: () => void
  children: ReactNode
}

export default function EmptyCompanies({ openAddCompanyModal, children }: EmptyCompaniesProps) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-[43px] bg-page px-4 py-12 text-center sm:px-[64px]">
      <img
        className="h-[131px] w-[180px] object-contain"
        src="/career_flow_logo.png"
        alt="CareerFlow"
      />

      <header className="flex flex-col items-center gap-3">
        <h1 className="m-0 font-heading text-[40px] leading-normal font-bold text-heading">
          Companies
        </h1>
        <p className="m-0 text-[18px] leading-normal text-body">Manage your workspace companies</p>
      </header>

      <button
        type="button"
        className="flex min-h-[400px] w-[500px] max-w-full flex-col items-center justify-center gap-[50px] rounded-[24px] border border-page bg-surface px-8 py-10 sm:px-[62px] sm:pb-16"
        aria-label="Create first company"
        onClick={openAddCompanyModal}
      >
        <div className="flex size-[120px] shrink-0 hover-scale items-center justify-center rounded-full bg-page transition-transform">
          <HugeiconsIcon icon={Add01Icon} className="size-12 text-heading" aria-hidden="true" />
        </div>

        <div className="flex max-w-[410px] flex-col items-center gap-4">
          <h2 className="m-0 font-heading text-[28px] leading-normal font-bold text-heading">
            No companies yet
          </h2>
          <p className="m-0 text-base leading-[1.5] text-body">
            You haven&apos;t created any companies for this workspace. Select this card to start
            building your first one.
          </p>
          <p className="m-0 text-sm text-body">Click anywhere on this card to add a company</p>
        </div>
      </button>

      {children}
    </main>
  )
}
