import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import CompanyCombobox from '../../src/features/companies/CompanyCombobox'

const companies = [
  { id: 'company-1', companyName: 'Acme', companyAddress: null, bio: null, websiteUrl: null },
  { id: 'company-2', companyName: 'Beta Labs', companyAddress: null, bio: null, websiteUrl: null },
]

describe('CompanyCombobox', () => {
  it('supports keyboard selection and exposes the active option', async () => {
    const user = userEvent.setup()
    const onSelect = vi.fn()
    render(
      <CompanyCombobox
        companies={companies}
        query=""
        selectedCompanyId=""
        onQueryChange={vi.fn()}
        onSelect={onSelect}
        onCreate={vi.fn()}
      />,
    )
    const input = screen.getByRole('combobox', { name: 'Company *' })

    await user.click(input)
    await user.keyboard('{ArrowDown}{ArrowDown}')
    expect(input).toHaveAttribute('aria-activedescendant', expect.stringContaining('option-1'))
    await user.keyboard('{Enter}')

    expect(onSelect).toHaveBeenCalledWith(companies[1])
    expect(input).toHaveAttribute('aria-expanded', 'false')
  })

  it('does not offer duplicate creation for an exact case-insensitive match', async () => {
    const user = userEvent.setup()
    render(
      <CompanyCombobox
        companies={companies}
        query="acme"
        selectedCompanyId=""
        onQueryChange={vi.fn()}
        onSelect={vi.fn()}
        onCreate={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('combobox', { name: 'Company *' }))
    expect(screen.queryByRole('option', { name: /create company/i })).not.toBeInTheDocument()
    expect(screen.getByText(/select the existing company/i)).toBeInTheDocument()
  })
})
