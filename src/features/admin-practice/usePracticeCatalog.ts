import { useCallback, useState } from 'react'
import { useAsyncResource } from '../../hooks/useAsyncResource'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { getAdminErrorMessage } from '../../services/admin/errors'
import { AdminPracticeSet, PracticeFilters, practiceCatalogService } from './catalog.service'

export function usePracticeCatalog() {
  const [filters, setFilters] = useState<PracticeFilters>({
    status: 'active',
    visibility: 'all',
    difficulty: 'all',
  })
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const load = useCallback(
    (signal: AbortSignal) => practiceCatalogService.list(filters, signal),
    [filters]
  )
  const list = useAsyncResource(JSON.stringify(filters), load)
  const stats = useAsyncResource(
    'stats',
    useCallback((signal: AbortSignal) => practiceCatalogService.stats(signal), [])
  )
  const action = useAsyncAction()
  const perform = (write: () => Promise<unknown>, message: string) => {
    setError(null)
    setMessage(null)
    void action.run(write, {
      onSuccess: () => {
        setMessage(message)
        list.retry()
        stats.retry()
      },
      onError: cause =>
        setError(getAdminErrorMessage(cause, 'Chưa xác nhận được thay đổi. Hãy tải lại.')),
    })
  }
  const archive = (item: AdminPracticeSet) => {
    if (
      !window.confirm(`Lưu trữ practice set “${item.title}”? Attempts và submissions vẫn được giữ.`)
    )
      return
    perform(() => practiceCatalogService.archive(item), 'Đã lưu trữ practice set.')
  }
  return { filters, setFilters, list, stats, action, error, message, perform, archive }
}
