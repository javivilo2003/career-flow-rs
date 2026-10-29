import { afterEach, describe, expect, it, vi } from 'vitest'

import { AnalyticsApiError, getProgressAnalytics } from '../../src/apis/analytics'

describe('progress analytics API', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('sends no query for all history and exact inclusive date strings when supplied', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ period: {} }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ period: {} }), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    await getProgressAnalytics()
    await getProgressAnalytics({ from: '2026-08-01', to: '2026-08-31' })

    expect(fetchMock).toHaveBeenNthCalledWith(1, '/api/analytics/progress')
    expect(fetchMock).toHaveBeenNthCalledWith(
      2,
      '/api/analytics/progress?from=2026-08-01&to=2026-08-31',
    )
  })

  it('uses the shared server message and a stable fallback for malformed error bodies', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValueOnce(
          new Response(
            JSON.stringify({ error: { code: 'INVALID_REQUEST', message: 'Invalid range.' } }),
            { status: 400 },
          ),
        )
        .mockResolvedValueOnce(new Response('not-json', { status: 503 })),
    )

    await expect(getProgressAnalytics()).rejects.toEqual(
      expect.objectContaining<Partial<AnalyticsApiError>>({
        message: 'Invalid range.',
        status: 400,
      }),
    )
    await expect(getProgressAnalytics()).rejects.toEqual(
      expect.objectContaining<Partial<AnalyticsApiError>>({
        message: 'Could not load historical analysis.',
        status: 503,
      }),
    )
  })
})
