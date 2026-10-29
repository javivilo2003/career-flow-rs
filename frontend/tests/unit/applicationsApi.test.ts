import { afterEach, describe, expect, it, vi } from 'vitest'

import { ApplicationApiError, getApplicationHistory } from '../../src/apis/applications'

describe('getApplicationHistory', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('encodes the application ID and preserves the history response', async () => {
    const payload = [
      {
        id: 'event-1',
        applicationId: 'application/1',
        previousStatus: null,
        newStatus: 'SAVED',
        occurredAt: '2026-10-01T08:00:00Z',
      },
    ]
    const fetchMock = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify(payload), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await expect(getApplicationHistory('application/1')).resolves.toEqual(payload)
    expect(fetchMock).toHaveBeenCalledWith('/api/applications/application%2F1/history')
  })

  it('surfaces the documented error envelope and safe fallback for malformed errors', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(
          JSON.stringify({ error: { code: 'NOT_FOUND', message: 'Application not found.' } }),
          { status: 404 },
        ),
      )
      .mockResolvedValueOnce(new Response('not-json', { status: 500 }))
    vi.stubGlobal('fetch', fetchMock)

    const documented = await getApplicationHistory('missing').catch((error: unknown) => error)
    expect(documented).toBeInstanceOf(ApplicationApiError)
    expect(documented).toMatchObject({
      message: 'Application not found.',
      status: 404,
      code: 'NOT_FOUND',
    })
    await expect(getApplicationHistory('broken')).rejects.toMatchObject({
      message: 'Could not load application activity.',
      status: 500,
    })
  })
})
