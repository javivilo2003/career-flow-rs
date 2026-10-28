import { useCallback, useEffect, useRef, useState } from 'react'

import { getContacts } from '../../apis/contacts'
import type { Contact, Page } from '../../types/api'

export default function useContactsData(name: string, companyId: string, page: number, size = 12) {
  const [result, setResult] = useState<Page<Contact> | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [revision, setRevision] = useState(0)
  const request = useRef(0)

  useEffect(() => {
    const requestId = ++request.current
    const timer = window.setTimeout(
      () => {
        setIsLoading(true)
        setError(null)
        void getContacts({ name, companyId: companyId || undefined, page, size })
          .then((data) => {
            if (request.current === requestId) {
              setResult(data)
            }
          })
          .catch((reason) => {
            if (request.current === requestId) {
              setError(reason instanceof Error ? reason.message : 'Could not load contacts.')
            }
          })
          .finally(() => {
            if (request.current === requestId) {
              setIsLoading(false)
            }
          })
      },
      name ? 250 : 0,
    )
    return () => window.clearTimeout(timer)
  }, [companyId, name, page, revision, size])

  const refresh = useCallback(() => setRevision((value) => value + 1), [])

  return { contacts: result?.content ?? [], result, isLoading, error, retry: refresh, refresh }
}
