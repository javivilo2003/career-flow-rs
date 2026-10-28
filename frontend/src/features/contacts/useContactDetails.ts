import { useCallback, useEffect, useState } from 'react'

import { getCompany } from '../../apis/companies'
import { getContact } from '../../apis/contacts'
import type { Company, Contact } from '../../types/api'

export type ContactDetails = { contact: Contact; company: Company }

export default function useContactDetails(contactId: string | undefined) {
  const [details, setDetails] = useState<ContactDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const retry = useCallback(() => setRevision((value) => value + 1), [])

  useEffect(() => {
    let cancelled = false
    if (!contactId) {
      return
    }
    void getContact(contactId)
      .then(async (contact) => ({ contact, company: await getCompany(contact.companyId) }))
      .then((value) => {
        if (!cancelled) {
          setDetails(value)
        }
      })
      .catch((reason) => {
        if (!cancelled) {
          setError(reason instanceof Error ? reason.message : 'Could not load contact.')
        }
      })
      .finally(() => {
        if (!cancelled) {
          setIsLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [contactId, revision])

  const synchronize = useCallback(
    (contact: Contact, company: Company) => setDetails({ contact, company }),
    [],
  )
  return {
    details,
    isLoading: contactId ? isLoading : false,
    error: contactId ? error : 'Contact not found.',
    retry,
    synchronize,
  }
}
