import { useState } from 'react'
import { ADMIN_PAGE_SIZE } from '../../lib/adminPagination'

/** Local pages are bounded synchronously when filtering or reloading reduces the collection. */
export function useCatalogPage<T>(items: T[], scope: string, size = ADMIN_PAGE_SIZE) {
  const [selection, setSelection] = useState({ scope, page: 0 })
  const page = Math.min(
    selection.scope === scope ? selection.page : 0,
    Math.max(0, Math.ceil(items.length / size) - 1)
  )
  return {
    page,
    visible: items.slice(page * size, (page + 1) * size),
    setPage: (next: number) => setSelection({ scope, page: Math.max(0, next) }),
  }
}
