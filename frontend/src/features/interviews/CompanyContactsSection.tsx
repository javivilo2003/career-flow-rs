import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { getContacts } from '../../apis/contacts'
import Button from '../../components/Button'
import type { Company, Contact } from '../../types/api'
import CompanyContactsSummary from '../contacts/CompanyContactsSummary'

export type CompanyContactsSectionProps = { company: Company }

export default function CompanyContactsSection({ company }: CompanyContactsSectionProps) {
  const navigate = useNavigate()
  const [contacts, setContacts] = useState<Contact[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const request = useRef(0)

  const load = useCallback(async () => {
    await Promise.resolve()
    const token = ++request.current
    setIsLoading(true)
    try {
      const page = await getContacts({
        companyId: company.id,
        size: 100,
        sort: 'name',
        direction: 'ASC',
      })
      if (request.current === token) {
        setContacts(page.content)
        setError(null)
      }
    } catch (reason) {
      if (request.current === token) {
        setError(reason instanceof Error ? reason.message : 'Could not load company contacts.')
      }
    } finally {
      if (request.current === token) {
        setIsLoading(false)
      }
    }
  }, [company.id])

  useEffect(() => {
    const timeout = window.setTimeout(() => void load(), 0)
    return () => {
      window.clearTimeout(timeout)
      request.current += 1
    }
  }, [load])

  const contactsPath = `/contacts?companyId=${encodeURIComponent(company.id)}`
  if (isLoading && contacts.length === 0) {
    return (
      <p role="status" className="m-0 rounded-[24px] bg-surface p-6 text-sm">
        Loading company contacts…
      </p>
    )
  }
  if (error) {
    return (
      <div role="alert" className="rounded-[24px] bg-danger-surface p-6 text-sm text-danger">
        <p className="m-0">{error}</p>
        <Button variant="secondary" className="mt-3" onClick={() => void load()}>
          Retry
        </Button>
      </div>
    )
  }
  return (
    <div>
      {isLoading && (
        <p role="status" className="mb-3 text-sm text-body">
          Refreshing company contacts…
        </p>
      )}
      <CompanyContactsSummary
        company={company}
        contacts={contacts}
        viewAllPath={contactsPath}
        onAddContact={() => void navigate(contactsPath)}
      />
    </div>
  )
}
