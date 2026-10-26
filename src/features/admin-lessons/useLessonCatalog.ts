import { useCallback, useState } from 'react'
import { useAsyncResource } from '../../hooks/useAsyncResource'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { getAdminErrorMessage } from '../../services/admin/errors'
import { AdminLesson, LessonStatus, lessonCatalogService } from './catalog.service'

export function useLessonCatalog(initialStatus: LessonStatus) {
  const [chapterId, setChapterId] = useState('all')
  const [status, setStatus] = useState(initialStatus)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const chapters = useAsyncResource(
    'chapters',
    useCallback((signal: AbortSignal) => lessonCatalogService.chapters(signal), [])
  )
  const load = useCallback(
    (signal: AbortSignal) => lessonCatalogService.lessons(chapterId, status, signal),
    [chapterId, status]
  )
  const lessons = useAsyncResource(chapters.data ? JSON.stringify([chapterId, status]) : null, load)
  const action = useAsyncAction()
  const archive = (item: AdminLesson) => {
    if (!window.confirm(`Lưu trữ lesson “${item.title || item.id}”? Lịch sử học vẫn được giữ.`))
      return
    setError(null)
    setMessage(null)
    void action.run(() => lessonCatalogService.archive(item.id), {
      onSuccess: () => {
        setMessage('Đã lưu trữ lesson.')
        lessons.retry()
      },
      onError: cause =>
        setError(getAdminErrorMessage(cause, 'Chưa xác nhận được lưu trữ. Hãy tải lại.')),
    })
  }
  return {
    chapters,
    lessons,
    chapterId,
    setChapterId,
    status,
    setStatus,
    action,
    archive,
    error,
    message,
  }
}
