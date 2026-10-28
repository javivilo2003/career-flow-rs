export function localInterviewDate(date = new Date()): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function isUpcomingInterview(
  interview: { status: string; interviewDate: string | null },
  today = localInterviewDate(),
) {
  return (
    (interview.status === 'SCHEDULED' || interview.status === 'RESCHEDULED') &&
    interview.interviewDate !== null &&
    interview.interviewDate >= today
  )
}

export function compareInterviewDates(
  left: { id: string; interviewDate: string | null },
  right: { id: string; interviewDate: string | null },
  direction: 'ASC' | 'DESC',
) {
  if (left.interviewDate === null) {
    return right.interviewDate === null ? left.id.localeCompare(right.id) : 1
  }
  if (right.interviewDate === null) {
    return -1
  }
  const comparison =
    left.interviewDate.localeCompare(right.interviewDate) || left.id.localeCompare(right.id)
  return direction === 'ASC' ? comparison : -comparison
}
