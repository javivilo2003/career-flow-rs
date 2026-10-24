import Add01Icon from '@hugeicons/core-free-icons/Add01Icon'
import { HugeiconsIcon } from '@hugeicons/react'
import type { ReactNode } from 'react'

export default function EmptyApplications({
  openAddApplicationModal,
  children,
}: {
  openAddApplicationModal: () => void
  children: ReactNode
}) {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-[43px] bg-page px-[64px] text-center">
      <div className=" ">
        <img
          className="h-[131px] w-[180px] object-contain"
          src="/career_flow_logo.png"
          alt="CareerFlow"
        />
      </div>

      <header className="flex flex-col items-center gap-[12px]">
        <h1 className="m-0 font-heading text-[40px] leading-normal font-bold tracking-normal text-heading">
          Applications
        </h1>
        <p className="m-0 text-[18px] leading-normal font-normal text-body">
          Manage your workspace applications
        </p>
      </header>

      <button
        type="button"
        className="flex h-[400px] w-[500px] max-w-[600px] cursor-pointer flex-col items-center gap-[50px] rounded-[24px] border border-page bg-surface pt-[40px] pr-[64px] pb-[64px] pl-[62px]"
        aria-label="Create first application"
        onClick={openAddApplicationModal}
      >
        <div className="flex size-[120px] shrink-0 hover-scale items-center justify-center rounded-[60px] bg-page transition-transform">
          <HugeiconsIcon icon={Add01Icon} className="size-[48px] text-heading" aria-hidden="true" />
        </div>

        <div className="flex w-[410px] max-w-full flex-col items-center gap-4 text-center">
          <h2 className="m-0 w-full font-heading text-[28px] leading-normal font-bold tracking-normal text-heading">
            No applications yet
          </h2>
          <p className="m-0 w-full text-[16px] leading-[1.5] font-normal text-body">
            You haven&apos;t created any applications for this workspace. Select this card to start
            building your first one.
          </p>
          <p className="m-0 w-full text-sm font-normal text-body">
            Click anywhere on this card to add a job application
          </p>
        </div>
      </button>

      {children}
    </main>
  )
}
