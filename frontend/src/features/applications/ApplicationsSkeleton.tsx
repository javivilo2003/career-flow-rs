const skeletonItems = Array.from({ length: 3 }, (_, index) => index)

export default function ApplicationsSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading applications"
      className="grid animate-pulse grid-cols-1 gap-6 motion-reduce:animate-none md:grid-cols-2 2xl:grid-cols-4"
    >
      {skeletonItems.map((item) => (
        <article
          key={item}
          aria-hidden="true"
          className="flex h-[335px] w-[410px] max-w-full flex-col gap-[22px] rounded-[24px] bg-surface p-6"
        >
          <div className="flex w-full items-center justify-between">
            <div className="size-11 rounded-[12px] bg-border" />
            <div className="h-7 w-[82px] rounded-full bg-border" />
          </div>

          <div className="flex flex-col gap-2">
            <div className="h-[25px] w-3/5 rounded-[6px] bg-border" />
            <div className="h-4 w-2/5 rounded-[4px] bg-border" />
            <div className="flex h-4 items-center gap-[7px]">
              <div className="size-[14px] rounded-full bg-border" />
              <div className="h-[13px] w-1/2 rounded-[4px] bg-border" />
            </div>
          </div>

          <div className="flex flex-col gap-[9px] border-t border-border pt-[15px]">
            <div className="h-3 w-2/5 rounded-[4px] bg-border" />
            <div className="h-[13px] w-4/5 rounded-[4px] bg-border" />
          </div>

          <div className="flex items-center gap-3">
            <div className="h-12 min-w-0 flex-1 rounded-[10px] bg-page" />
            <div className="h-11 w-10 rounded-[10px] bg-border" />
            <div className="h-11 w-8 rounded-[10px] bg-border" />
          </div>
        </article>
      ))}
    </div>
  )
}
