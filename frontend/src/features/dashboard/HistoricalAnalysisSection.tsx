import { type FormEvent, useCallback, useEffect, useId, useState } from 'react'

import { getProgressAnalytics, type ProgressAnalyticsParams } from '../../apis/analytics'
import Button from '../../components/Button'
import Input from '../../components/Input'
import type { ProgressAnalytics } from '../../types/api'

type RangePreset = '30' | '90' | 'all' | 'custom'

const PRESETS: Array<{ value: RangePreset; label: string }> = [
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All history' },
  { value: 'custom', label: 'Custom' },
]

function utcDateString(date: Date) {
  return date.toISOString().slice(0, 10)
}

function recentUtcRange(days: number): ProgressAnalyticsParams {
  const today = new Date()
  const utcToday = new Date(
    Date.UTC(today.getUTCFullYear(), today.getUTCMonth(), today.getUTCDate()),
  )
  const from = new Date(utcToday)
  from.setUTCDate(from.getUTCDate() - (days - 1))
  return { from: utcDateString(from), to: utcDateString(utcToday) }
}

function formatPercent(rate: number) {
  return new Intl.NumberFormat(undefined, { style: 'percent', maximumFractionDigits: 1 }).format(
    rate,
  )
}

function formatHours(hours: number) {
  const number = new Intl.NumberFormat(undefined, { maximumFractionDigits: 1 })
  return hours >= 48 ? `${number.format(hours / 24)} days` : `${number.format(hours)} hours`
}

function formatDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  return new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(Date.UTC(year, month - 1, day)),
  )
}

function HelpText({ children }: { children: string }) {
  return <p className="m-0 mt-3 text-xs leading-relaxed text-body">{children}</p>
}

function Funnel({ analytics }: { analytics: ProgressAnalytics }) {
  const { funnel, coverage, definitions } = analytics
  const stages = [
    { label: 'Instrumented cohort', count: coverage.instrumentedCohortCount },
    { label: 'Submitted (APPLIED)', count: funnel.submittedCount },
    { label: 'Reached interviewing', count: funnel.interviewingCount },
    { label: 'Reached offer', count: funnel.offerCount },
  ]
  return (
    <article
      className="min-w-0 rounded-[24px] bg-surface p-6"
      aria-labelledby="recruitment-funnel-heading"
    >
      <h3 id="recruitment-funnel-heading" className="m-0 text-xl font-bold text-heading">
        Recruitment funnel
      </h3>
      <p className="m-0 mt-2 text-sm text-body">Actual explicit events for the selected cohort.</p>
      {coverage.instrumentedCohortCount === 0 && (
        <p className="m-0 mt-5 rounded-[10px] border border-border bg-page p-4">
          No instrumented applications entered the cohort in this period.
        </p>
      )}
      <ol className="m-0 mt-5 grid list-none gap-3 p-0 sm:grid-cols-2 xl:grid-cols-4">
        {stages.map((stage) => (
          <li key={stage.label} className="min-w-0 rounded-[10px] border border-border bg-page p-4">
            <span className="block text-sm text-body">{stage.label}</span>
            <strong className="mt-2 block text-2xl text-heading">{stage.count}</strong>
          </li>
        ))}
      </ol>
      {(funnel.interviewReachRate !== null || funnel.offerRate !== null) && (
        <dl className="mt-4 grid gap-3 sm:grid-cols-2">
          {funnel.interviewReachRate !== null && (
            <div className="rounded-[10px] bg-page p-4">
              <dt className="text-sm text-body">Submitted cohort reaching interview</dt>
              <dd className="m-0 mt-2 font-bold text-heading">
                {formatPercent(funnel.interviewReachRate)} (
                {funnel.interviewReachAmongSubmittedCount} of {funnel.submittedCount})
              </dd>
            </div>
          )}
          {funnel.offerRate !== null && (
            <div className="rounded-[10px] bg-page p-4">
              <dt className="text-sm text-body">Submitted cohort reaching offer</dt>
              <dd className="m-0 mt-2 font-bold text-heading">
                {formatPercent(funnel.offerRate)} ({funnel.offerAmongSubmittedCount} of{' '}
                {funnel.submittedCount})
              </dd>
            </div>
          )}
        </dl>
      )}
      <HelpText>{definitions.cohort}</HelpText>
      <HelpText>{definitions.stageReach}</HelpText>
      <HelpText>{definitions.rates}</HelpText>
      <p className="m-0 mt-3 rounded-[10px] bg-page p-3 text-xs leading-relaxed text-secondary">
        Tracking coverage: {coverage.instrumentedCohortCount} instrumented in this period;{' '}
        {coverage.legacyApplicationCount} legacy application
        {coverage.legacyApplicationCount === 1 ? '' : 's'} lack an initial tracking event. Legacy
        records are not added to the funnel, and later stages never imply earlier ones.
      </p>
    </article>
  )
}

function Activity({ analytics }: { analytics: ProgressAnalytics }) {
  const { activity, definitions } = analytics
  const totals = [
    { label: 'Applications created', value: activity.applicationsCreated },
    { label: 'APPLIED events', value: activity.appliedEvents },
    { label: 'Genuine transitions', value: activity.genuineTransitions },
  ]
  return (
    <article
      className="min-w-0 rounded-[24px] bg-surface p-6"
      aria-labelledby="application-activity-heading"
    >
      <h3 id="application-activity-heading" className="m-0 text-xl font-bold text-heading">
        Application activity over time
      </h3>
      <dl className="mt-5 grid gap-3 sm:grid-cols-3">
        {totals.map(({ label, value }) => (
          <div key={label} className="min-w-0 rounded-[10px] bg-page p-4">
            <dt className="text-sm text-body">{label}</dt>
            <dd className="m-0 mt-2 text-2xl font-bold text-heading">{value}</dd>
          </div>
        ))}
      </dl>
      {activity.daily.length === 0 ? (
        <p className="m-0 mt-5 rounded-[10px] border border-border bg-page p-4">
          No application activity was recorded in this period.
        </p>
      ) : (
        <div className="mt-5 max-w-full min-w-0 overflow-x-auto rounded-[10px] border border-border">
          <table className="w-full table-fixed border-collapse text-left text-xs sm:text-sm">
            <caption className="sr-only">
              Daily application activity in sparse UTC date buckets
            </caption>
            <colgroup>
              <col className="w-[40%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead className="bg-page text-heading">
              <tr>
                <th scope="col" className="p-2 sm:p-3">
                  UTC date
                </th>
                <th scope="col" className="p-2 text-right sm:p-3">
                  Created
                </th>
                <th scope="col" aria-label="APPLIED events" className="p-2 text-right sm:p-3">
                  <span aria-hidden="true" className="sm:hidden">
                    Applied
                  </span>
                  <span className="hidden sm:inline">APPLIED events</span>
                </th>
                <th scope="col" aria-label="Transitions" className="p-2 text-right sm:p-3">
                  <span aria-hidden="true" className="sm:hidden">
                    Changed
                  </span>
                  <span className="hidden sm:inline">Transitions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {activity.daily.map((day) => (
                <tr key={day.date} className="border-t border-border">
                  <th scope="row" className="p-2 font-medium text-secondary sm:p-3">
                    {formatDate(day.date)}
                  </th>
                  <td className="p-2 text-right sm:p-3">{day.applicationsCreated}</td>
                  <td className="p-2 text-right sm:p-3">{day.appliedEvents}</td>
                  <td className="p-2 text-right sm:p-3">{day.genuineTransitions}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <HelpText>{definitions.activity}</HelpText>
      <HelpText>{definitions.dailyBuckets}</HelpText>
    </article>
  )
}

function StageDuration({ analytics }: { analytics: ProgressAnalytics }) {
  const { duration, definitions } = analytics
  return (
    <article
      className="min-w-0 rounded-[24px] bg-surface p-6"
      aria-labelledby="stage-duration-heading"
    >
      <h3 id="stage-duration-heading" className="m-0 text-xl font-bold text-heading">
        Submitted-to-next-stage duration
      </h3>
      {duration.medianSubmittedToInterviewOrOfferHours === null ? (
        <div className="mt-5 rounded-[10px] border border-border bg-page p-4">
          <p className="m-0 font-bold text-heading">Insufficient history</p>
          <p className="m-0 mt-2 text-sm">
            No complete APPLIED-to-INTERVIEWING/OFFER sequence exists in this cohort.
          </p>
        </div>
      ) : (
        <dl className="mt-5 rounded-[10px] bg-page p-4">
          <dt className="text-sm text-body">Median time to next INTERVIEWING or OFFER event</dt>
          <dd className="m-0 mt-2 text-2xl font-bold text-heading">
            {formatHours(duration.medianSubmittedToInterviewOrOfferHours)}
          </dd>
        </dl>
      )}
      <p className="m-0 mt-3 text-sm text-secondary">
        Sample: {duration.sampleCount} complete sequence{duration.sampleCount === 1 ? '' : 's'}.
      </p>
      <HelpText>{definitions.duration}</HelpText>
    </article>
  )
}

export default function HistoricalAnalysisSection() {
  const [preset, setPreset] = useState<RangePreset>('30')
  const [params, setParams] = useState<ProgressAnalyticsParams>(() => recentUtcRange(30))
  const [customFrom, setCustomFrom] = useState('')
  const [customTo, setCustomTo] = useState('')
  const [validationError, setValidationError] = useState<string | null>(null)
  const [analytics, setAnalytics] = useState<ProgressAnalytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [version, setVersion] = useState(0)
  const headingId = useId()
  const retry = useCallback(() => setVersion((value) => value + 1), [])

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError(null)
      try {
        const result = await getProgressAnalytics(params)
        if (!cancelled) {
          setAnalytics(result)
        }
      } catch (reason) {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'Could not load historical analysis.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [params, version])

  function selectPreset(next: RangePreset) {
    setPreset(next)
    setValidationError(null)
    if (next === '30') {
      setParams(recentUtcRange(30))
    }
    if (next === '90') {
      setParams(recentUtcRange(90))
    }
    if (next === 'all') {
      setParams({})
    }
  }

  function applyCustom(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!customFrom || !customTo) {
      setValidationError('Choose both a from date and a to date.')
      return
    }
    if (customFrom > customTo) {
      setValidationError('From date must be on or before to date.')
      return
    }
    setValidationError(null)
    setParams({ from: customFrom, to: customTo })
  }

  return (
    <section aria-labelledby={headingId} className="mt-12 min-w-0 border-t border-border pt-10">
      <header>
        <p className="m-0 text-sm font-bold text-accent">Historical analysis</p>
        <h2 id={headingId} className="m-0 mt-2 text-3xl font-bold text-heading">
          Your tracked journey over time
        </h2>
        <p className="m-0 mt-2 max-w-3xl text-sm text-body">
          Historical metrics use recorded application events and remain separate from the current
          snapshot above.
        </p>
      </header>

      <div className="mt-6 min-w-0 rounded-[24px] bg-surface p-6">
        <fieldset>
          <legend className="text-sm font-bold text-heading">Analysis period</legend>
          <div className="mt-3 flex flex-wrap gap-3">
            {PRESETS.map((button) => (
              <Button
                key={button.value}
                variant={preset === button.value ? 'primary' : 'secondary'}
                aria-pressed={preset === button.value}
                onClick={() => selectPreset(button.value)}
              >
                {button.label}
              </Button>
            ))}
          </div>
        </fieldset>
        {preset === 'custom' && (
          <form className="mt-5" onSubmit={applyCustom} noValidate>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] lg:items-end">
              <Input
                label="From"
                type="date"
                value={customFrom}
                onChange={(event) => setCustomFrom(event.target.value)}
                error={validationError ?? undefined}
              />
              <Input
                label="To"
                type="date"
                value={customTo}
                onChange={(event) => setCustomTo(event.target.value)}
                error={validationError ?? undefined}
              />
              <Button type="submit">Apply dates</Button>
            </div>
          </form>
        )}
        <p className="m-0 mt-4 text-xs leading-relaxed text-body">
          Dates are sent exactly as entered. Both endpoints are inclusive UTC calendar dates (00:00
          UTC through the end of the selected “to” date), not converted from your local timezone.
        </p>
      </div>

      {loading && (
        <p role="status" className="mt-6 rounded-[10px] bg-surface p-4">
          Loading historical analysis…
        </p>
      )}
      {!loading && error && (
        <div role="alert" className="mt-6 rounded-[10px] bg-danger-surface p-4 text-danger">
          <p className="m-0">{error}</p>
          <Button variant="secondary" className="mt-3" onClick={retry}>
            Retry
          </Button>
        </div>
      )}
      {!loading && !error && analytics && (
        <div className="mt-6 grid min-w-0 gap-6">
          <Funnel analytics={analytics} />
          <Activity analytics={analytics} />
          <StageDuration analytics={analytics} />
        </div>
      )}
    </section>
  )
}
