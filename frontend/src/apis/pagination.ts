import type { Page } from '../types/api'

export async function loadAllPages<T>(loadPage: (page: number) => Promise<Page<T>>): Promise<T[]> {
  const firstPage = await loadPage(0)

  if (firstPage.totalPages <= 1) {
    return firstPage.content
  }

  const remainingPages = await Promise.all(
    Array.from({ length: firstPage.totalPages - 1 }, (_, index) => loadPage(index + 1)),
  )

  return [firstPage, ...remainingPages].flatMap((page) => page.content)
}
