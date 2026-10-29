import { describe, expect, it } from 'vitest'

import { followUpTiming, localDateString } from '../../src/features/followups/dateUtils'
import {
  compareInterviewDates,
  isUpcomingInterview,
  localInterviewDate,
} from '../../src/features/interviews/dateUtils'

describe('date-only behavior', () => {
  it('uses local calendar fields rather than UTC conversion', () => {
    const localLateEvening = new Date(2026, 9, 27, 23, 59)

    expect(localDateString(localLateEvening)).toBe('2026-10-27')
    expect(localInterviewDate(localLateEvening)).toBe('2026-10-27')
  })

  it('classifies follow-ups at inclusive day boundaries', () => {
    expect(followUpTiming('2026-10-26', '2026-10-27')).toBe('overdue')
    expect(followUpTiming('2026-10-27', '2026-10-27')).toBe('today')
    expect(followUpTiming('2026-10-28', '2026-10-27')).toBe('upcoming')
  })

  it('partitions upcoming interviews and sorts null dates last', () => {
    expect(
      isUpcomingInterview({ status: 'RESCHEDULED', interviewDate: '2026-10-27' }, '2026-10-27'),
    ).toBe(true)
    expect(
      isUpcomingInterview({ status: 'COMPLETED', interviewDate: '2026-10-28' }, '2026-10-27'),
    ).toBe(false)
    expect(
      compareInterviewDates(
        { id: 'null', interviewDate: null },
        { id: 'dated', interviewDate: '2026-10-28' },
        'DESC',
      ),
    ).toBe(1)
  })
})
