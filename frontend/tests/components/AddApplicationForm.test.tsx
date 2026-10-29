import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { AddApplicationForm, type ApplicationDraft } from '../../src/components/AddApplicationModal'
import type { Company } from '../../src/types/api'

const acme: Company = {
  id: 'company-1',
  companyName: 'Acme',
  companyAddress: null,
  bio: null,
  websiteUrl: null,
}

describe('AddApplicationForm', () => {
  it('validates required fields without submitting', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<AddApplicationForm companies={[]} onSubmit={onSubmit} onClose={vi.fn()} />)

    await user.click(screen.getByRole('button', { name: 'Save application' }))

    expect(screen.getByText('Enter a role to continue.')).toBeInTheDocument()
    expect(
      screen.getByText(/select a company or create a new one to continue/i),
    ).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('preserves the application draft across failed company creation and selects a successful retry', async () => {
    const user = userEvent.setup()
    const created: Company = { ...acme, id: 'company-new', companyName: 'Nova' }
    const createCompany = vi
      .fn<() => Promise<Company>>()
      .mockRejectedValueOnce(new Error('Temporary company failure'))
      .mockResolvedValueOnce(created)
    const onSubmit = vi.fn<(draft: ApplicationDraft) => Promise<void>>().mockResolvedValue()
    render(
      <AddApplicationForm
        companies={[]}
        onSubmit={onSubmit}
        onClose={vi.fn()}
        onCreateCompany={createCompany}
      />,
    )

    await user.type(screen.getByRole('textbox', { name: 'Role *' }), '  Platform Engineer  ')
    const company = screen.getByRole('combobox', { name: 'Company *' })
    await user.type(company, 'Nova')
    await user.click(screen.getByRole('option', { name: 'Create company “Nova”' }))
    await user.click(screen.getByRole('button', { name: 'Create and select' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Temporary company failure')
    expect(screen.getByRole('textbox', { name: 'Role *' })).toHaveValue('  Platform Engineer  ')

    await user.click(screen.getByRole('button', { name: 'Create and select' }))
    expect(company).toHaveValue('Nova')
    await user.click(screen.getByRole('button', { name: 'Save application' }))

    expect(createCompany).toHaveBeenCalledTimes(2)
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        role: 'Platform Engineer',
        companyId: 'company-new',
      }),
    )
  })

  it('blocks duplicate application submissions while the first request is pending', async () => {
    const user = userEvent.setup()
    let resolveSubmit: (() => void) | undefined
    const onSubmit = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveSubmit = resolve
        }),
    )
    render(
      <AddApplicationForm
        companies={[acme]}
        initialValues={{ companyId: acme.id }}
        onSubmit={onSubmit}
        onClose={vi.fn()}
      />,
    )
    await user.type(screen.getByRole('textbox', { name: 'Role *' }), 'Engineer')
    const save = screen.getByRole('button', { name: 'Save application' })

    await user.dblClick(save)

    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(screen.getByRole('button', { name: 'Saving…' })).toBeDisabled()
    resolveSubmit?.()
  })
})
