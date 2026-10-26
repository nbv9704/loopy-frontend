import { z } from 'zod'
import apiClient from '../../services/admin/apiClient'
import { adminData, adminRead } from '../../services/admin/response'
import { ADMIN_PAGE_SIZE } from '../../lib/adminPagination'

const submission = z.object({
  id: z.string().min(1),
  lesson_id: z.string(),
  user_id: z.string().nullish(),
  code: z.string().nullable(),
  is_correct: z.boolean().nullable(),
  execution_time: z.number().nonnegative().nullish(),
  test_score: z.number().nullish(),
  final_score: z.number().nullish(),
  feedback: z.string().nullish(),
  submitted_at: z.string().nullish(),
  lessons: z
    .object({
      id: z.string(),
      title: z.string().nullish(),
      lesson_id: z.string().nullish(),
      chapters: z
        .object({ id: z.string(), language_id: z.string().nullish(), title: z.string().nullish() })
        .nullish(),
    })
    .nullish(),
})
export type AdminSubmission = z.output<typeof submission>
export type SubmissionStatus = 'all' | 'pass' | 'fail'
export const submissionsService = {
  async list(status: SubmissionStatus, offset: number, signal: AbortSignal) {
    const page = adminData(
      z.object({
        items: z.array(submission).max(ADMIN_PAGE_SIZE),
        total: z.number().int().nonnegative(),
        limit: z.literal(ADMIN_PAGE_SIZE),
        offset: z.number().int().nonnegative(),
      }),
      await adminRead(
        apiClient.get('/api/admin/submissions', {
          params: { status, limit: ADMIN_PAGE_SIZE, offset },
          signal,
        })
      )
    )
    if (
      page.offset !== offset ||
      page.items.length !== Math.min(ADMIN_PAGE_SIZE, Math.max(0, page.total - offset)) ||
      new Set(page.items.map(item => item.id)).size !== page.items.length ||
      page.items.some(item => status !== 'all' && item.is_correct !== (status === 'pass'))
    )
      throw new Error('Bài nộp không khớp bộ lọc. Hãy tải lại.')
    return page
  },
}
