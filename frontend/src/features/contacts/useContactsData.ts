import { useEffect, useState } from 'react'

import { getCompanies } from '../../apis/companies'
import { getContacts } from '../../apis/contacts'
import { loadAllPages } from '../../apis/pagination'
import type { Contact } from '../../types/api'

type ContactsDataState = {
  contacts: Contact[]
  companyNames: Map<string, string>
  isLoading: boolean
  error: string | null
}

export default function useContactsData(): ContactsDataState {
  const [contacts, setContacts] = useState<Contact[]>([])
  const [companyNames, setCompanyNames] = useState<Map<string, string>>(new Map())
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function load() {
      try {
        const [loadedContacts, companies] = await Promise.all([
          loadAllPages((page) => getContacts({ page, size: 100 })),
          loadAllPages((page) => getCompanies({ page, size: 100 })),
        ])

        if (!isCancelled) {
          setContacts(loadedContacts)
          setCompanyNames(new Map(companies.map((company) => [company.id, company.companyName])))
          setError(null)
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(
            requestError instanceof Error ? requestError.message : 'Could not load contacts.',
          )
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false)
        }
      }
    }

    void load()
    return () => {
      isCancelled = true
    }
  }, [])

  return { contacts, companyNames, isLoading, error }
}
