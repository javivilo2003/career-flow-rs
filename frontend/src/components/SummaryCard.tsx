type SummaryCardProps = {
  label: string
  value: number
}

function SummaryCard({ label, value }: SummaryCardProps) {
  return (
    <article className="rounded-xl bg-page p-5">
      <p className="m-0 text-sm text-body">{label}</p>
      <p className="m-0 mt-2 text-3xl font-extrabold leading-none text-heading">
        {value}
      </p>
    </article>
  )
}

export default SummaryCard
