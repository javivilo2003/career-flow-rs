import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { getApplicationHistory } from '../../src/apis/applications'
import useApplicationHistory from '../../src/features/applications/useApplicationHistory'
import type { ApplicationStatusEvent } from '../../src/types/api'

vi.mock('../../src/apis/applications', () => ({ getApplicationHistory: vi.fn() }))

const saved: ApplicationStatusEvent = {
  id: 'event-1',
  applicationId: 'application-1',
  previousStatus: null,
  newStatus: 'SAVED',
  occurredAt: '2026-10-01T08:00:00Z',
}

function Harness() {
  const [revision, setRevision] = useState('SAVED-')
  const history = useApplicationHistory('application-1', revision)
  return (
    <>
      <output aria-label="state">
        {history.isLoading ? 'loading' : 'idle'}|{history.error ?? 'ok'}|
        {history.events?.map((event) => event.newStatus).join(',') ?? 'none'}
      </output>
      <button onClick={() => setRevision('APPLIED-2026')}>Refresh history</button>
      <button onClick={() => void history.retry()}>Retry history</button>
    </>
  )
}

describe('useApplicationHistory', () => {
  beforeEach(() => vi.mocked(getApplicationHistory).mockReset())

  it('keeps prior events visible while independently refreshing after an application change', async () => {
    const user = userEvent.setup()
    let resolveRefresh: ((events: ApplicationStatusEvent[]) => void) | undefined
    vi.mocked(getApplicationHistory)
      .mockResolvedValueOnce([saved])
      .mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            resolveRefresh = resolve
          }),
      )
    render(<Harness />)

    expect(screen.getByLabelText('state')).toHaveTextContent('loading|ok|none')
    expect(await screen.findByText('idle|ok|SAVED')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Refresh history' }))
    expect(screen.getByLabelText('state')).toHaveTextContent('loading|ok|SAVED')

    await act(async () => {
      resolveRefresh?.([{ ...saved, newStatus: 'APPLIED' }])
      await Promise.resolve()
    })
    expect(screen.getByLabelText('state')).toHaveTextContent('idle|ok|APPLIED')
  })

  it('exposes an independent error and recovers through retry', async () => {
    const user = userEvent.setup()
    vi.mocked(getApplicationHistory)
      .mockRejectedValueOnce(new Error('History failed'))
      .mockResolvedValueOnce([saved])
    render(<Harness />)

    expect(await screen.findByText('idle|History failed|none')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Retry history' }))
    expect(await screen.findByText('idle|ok|SAVED')).toBeInTheDocument()
  })
})
