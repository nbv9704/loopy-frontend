import { z } from 'zod'
import apiClient from '../../services/admin/apiClient'
import { adminData, adminRead } from '../../services/admin/response'

const chapter = z.object({
  id: z.string().min(1),
  title: z.string().nullish(),
  language_id: z.string().nullish(),
  order_index: z.number().nullish(),
})
const lesson = z.object({
  id: z.string().min(1),
  chapter_id: z.string().min(1),
  lesson_id: z.string().nullish(),
  title: z.string().nullish(),
  lesson_type: z.string().nullish(),
  description: z.string().nullish(),
  starter_code: z.string().nullish(),
  task_description: z.string().nullish(),
  solution_code: z.string().nullish(),
  hint: z.string().nullish(),
  grading_mode: z.string().nullish(),
  validation_type: z.string().nullish(),
  difficulty: z.string().nullish(),
  status: z.enum(['draft', 'published', 'archived']),
  order_index: z.number().int().nonnegative(),
  test_case_count: z.number().int().nonnegative(),
})
export type AdminChapter = z.output<typeof chapter>
export type AdminLesson = z.output<typeof lesson>
export type LessonStatus = 'active' | 'all' | 'draft' | 'published' | 'archived'
export function missingCodeFields(item: AdminLesson) {
  const fields = ['title', 'starter_code', 'task_description', 'solution_code'] as const
  return fields.filter(key => !item[key]?.trim())
}
export const lessonCatalogService = {
  async chapters(signal: AbortSignal) {
    return adminData(
      z.array(chapter),
      await adminRead(apiClient.get('/api/admin/chapters', { signal }))
    )
  },
  async lessons(chapterId: string, status: LessonStatus, signal: AbortSignal) {
    const items = adminData(
      z.array(lesson),
      await adminRead(
        apiClient.get('/api/admin/lessons', {
          params: { chapter_id: chapterId, status },
          signal,
        })
      )
    )
    if (
      new Set(items.map(item => item.id)).size !== items.length ||
      items.some(
        item =>
          (chapterId !== 'all' && item.chapter_id !== chapterId) ||
          (status === 'active'
            ? item.status === 'archived'
            : status !== 'all' && item.status !== status)
      )
    )
      throw new Error('Danh sách lesson không khớp bộ lọc. Hãy tải lại.')
    return items
  },
  async archive(id: string) {
    const result = adminData(
      z.object({ id: z.string(), archived: z.literal(true) }),
      await apiClient.delete(`/api/admin/lessons/${id}`)
    )
    if (result.id !== id) throw new Error('Chưa xác nhận đúng lesson đã lưu trữ. Hãy tải lại.')
  },
}
