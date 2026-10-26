type PageStatusProps = {
  loading: boolean
  loadingLabel: string
  error: string | null
}

export default function PageStatus({ loading, loadingLabel, error }: PageStatusProps) {
  if (loading) {
    return (
      <div
        role="status"
        aria-label={loadingLabel}
        className="flex min-h-40 animate-pulse items-center rounded-[24px] bg-surface p-8 motion-reduce:animate-none"
      >
        <div className="h-6 w-48 rounded-[6px] bg-border" />
      </div>
    )
  }

  if (error) {
    return (
      <p role="alert" className="m-0 rounded-[24px] bg-danger-surface p-8 text-danger">
        {error}
      </p>
    )
  }

  return null
}
