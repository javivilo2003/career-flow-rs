import { describe, expect, it } from 'vitest'

import {
  applicationApiPage,
  applicationDetailsHref,
  parseApplicationUrlState,
  updateApplicationUrlState,
} from '../../src/features/applications/applicationUrlState'

describe('application URL state', () => {
  it('normalizes invalid owned parameters without discarding unrelated context', () => {
    const current = new URLSearchParams(
      'status=UNKNOWN&position=%20Backend%20&sort=position&direction=ASC&page=-2&panel=followups',
    )

    const parsed = parseApplicationUrlState(current)
    const updated = updateApplicationUrlState(current, { companyId: 'company-1' })

    expect(parsed).toEqual({
      status: 'SAVED',
      position: 'Backend',
      companyId: '',
      sort: 'createdAt',
      direction: 'DESC',
      page: 1,
    })
    expect(updated.get('panel')).toBe('followups')
    expect(updated.get('companyId')).toBe('company-1')
    expect(updated.get('page')).toBe('1')
  })

  it('resets pagination for filter changes but preserves an explicit page change', () => {
    expect(
      updateApplicationUrlState('?status=APPLIED&page=4', { position: 'api' }).get('page'),
    ).toBe('1')
    expect(updateApplicationUrlState('?status=APPLIED&page=4', { page: 2 }).get('page')).toBe('2')
    expect(applicationApiPage(2)).toBe(1)
  })

  it('encodes application IDs and retains list filters in detail links', () => {
    expect(applicationDetailsHref('id/with spaces', '?status=OFFER&page=3')).toBe(
      '/applications/id%2Fwith%20spaces?status=OFFER&page=3',
    )
  })
})
