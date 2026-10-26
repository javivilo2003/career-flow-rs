import { useState } from 'react'

import { createCompany } from '../apis/companies'
import AddCompanyModal, { type CompanyDraft } from '../components/AddCompanyModal'
import Button from '../components/Button'
import CompanyCard from '../components/CompanyCard'
import Icon from '../components/Icon'
import EmptyCompanies from '../features/companies/EmptyCompanies'
import useCompaniesData from '../features/companies/useCompaniesData'
import type { Company } from '../types/api'

type CompaniesContentProps = {
  companies: Company[]
  isLoading: boolean
  error: string | null
  openAddCompanyModal: () => void
  addCompanyModal: React.ReactNode
}

function isReady(isLoading: boolean, error: string | null) {
  return !isLoading && error === null
}

function CompaniesList({
  companies,
  isLoading,
  error,
}: Pick<CompaniesContentProps, 'companies' | 'isLoading' | 'error'>) {
  if (isLoading) {
    return <p className="m-0">Loading companies...</p>
  }
  if (error) {
    return (
      <p role="alert" className="m-0">
        {error}
      </p>
    )
  }

  return (
    <ul className="m-0 grid list-none grid-cols-[repeat(auto-fill,minmax(min(410px,100%),410px))] gap-6 p-0">
      {companies.map((company) => (
        <li key={company.id} className="min-w-0">
          <CompanyCard company={company} detailsPath={`/companies/${company.id}`} />
        </li>
      ))}
    </ul>
  )
}

function CompaniesContent({
  companies,
  isLoading,
  error,
  openAddCompanyModal,
  addCompanyModal,
}: CompaniesContentProps) {
  if (isReady(isLoading, error) && companies.length === 0) {
    return (
      <EmptyCompanies openAddCompanyModal={openAddCompanyModal}>{addCompanyModal}</EmptyCompanies>
    )
  }

  return (
    <main className="p-6 text-left sm:p-12">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="m-0 font-bold text-accent">Companies</p>
          <h1 className="m-0 mt-8 mb-2 font-heading text-5xl font-medium text-heading">
            Companies
          </h1>
          <p className="m-0">Keep your company research and opportunities organized.</p>
        </div>
        {isReady(isLoading, error) && (
          <Button variant="primary" className="gap-2" onClick={openAddCompanyModal}>
            <Icon name="button-add" />
            Add company
          </Button>
        )}
      </header>

      <CompaniesList companies={companies} isLoading={isLoading} error={error} />

      {addCompanyModal}
    </main>
  )
}

export default function CompaniesPage() {
  const { companies, isLoading, error, refresh } = useCompaniesData()
  const [isAddCompanyModalOpen, setIsAddCompanyModalOpen] = useState(false)

  async function handleCreateCompany(draft: CompanyDraft) {
    await createCompany({
      companyName: draft.companyName,
      companyAddress: draft.companyAddress || null,
      bio: draft.bio || null,
      websiteUrl: draft.websiteUrl || null,
    })
    await refresh()
    setIsAddCompanyModalOpen(false)
  }

  const addCompanyModal = (
    <AddCompanyModal
      open={isAddCompanyModalOpen}
      onClose={() => setIsAddCompanyModalOpen(false)}
      onSubmit={handleCreateCompany}
    />
  )

  return (
    <CompaniesContent
      companies={companies}
      isLoading={isLoading}
      error={error}
      openAddCompanyModal={() => setIsAddCompanyModalOpen(true)}
      addCompanyModal={addCompanyModal}
    />
  )
}
