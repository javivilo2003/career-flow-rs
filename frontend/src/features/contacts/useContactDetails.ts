import { useEffect, useState } from 'react'

import { getCompany } from '../../apis/companies'
import { getContact } from '../../apis/contacts'
import type { Company, Contact } from '../../types/api'

type ContactDetails = {
  contact: Contact
  company: Company
}

type ContactDetailsState = {
  details: ContactDetails | null
  isLoading: boolean
  error: string | null
}

export default function useContactDetails(contactId: string | undefined): ContactDetailsState {
  const [details, setDetails] = useState<ContactDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let isCancelled = false

    async function load() {
      if (!contactId) {
        setError('Contact not found.')
        setIsLoading(false)
        return
      }

      try {
        const contact = await getContact(contactId)
        const company = await getCompany(contact.companyId)
        if (!isCancelled) {
          setDetails({ contact, company })
          setError(null)
        }
      } catch (requestError) {
        if (!isCancelled) {
          setError(requestError instanceof Error ? requestError.message : 'Could not load contact.')
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
  }, [contactId])

  return { details, isLoading, error }
}
