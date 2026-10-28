/** Returns a local calendar date without converting through UTC. */
export function localDateString(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function formatDateOnly(date: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(
    new Date(`${date}T00:00:00`),
  )
}

export function followUpTiming(dueDate: string, today = localDateString()) {
  if (dueDate < today) {
    return 'overdue' as const
  }
  if (dueDate === today) {
    return 'today' as const
  }
  return 'upcoming' as const
}
