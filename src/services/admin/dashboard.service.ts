import { z } from 'zod'
import apiClient from './apiClient'
import { adminData, adminRead } from './response'

const count = z.number().int().nonnegative()
const statsSchema = z.object({
  totalUsers: count,
  totalLessons: count,
  totalLessonsAll: count,
  draftLessons: count,
  archivedLessons: count,
  totalSubmissions: count,
  submissionsToday: count,
  submissionsThisWeek: count,
  completionRate: z.number().min(0).max(100).nullable(),
  totalPvPMatches: count,
  averageExecutionTime: z.number().nonnegative().nullable(),
  executionSamples: count,
  generatedAt: z.string().datetime(),
  timeZone: z.literal('Asia/Ho_Chi_Minh'),
  contentQuality: z.object({
    lessonsMissingRequiredFields: count,
    lessonsWithoutHint: count,
    lessonsWithoutTestCases: count,
  }),
  recentLessons: z.array(
    z.object({
      id: z.string(),
      title: z.string(),
      lesson_id: z.string(),
      chapter_id: z.string(),
      updated_at: z.string().nullable(),
    })
  ),
  recentFailedSubmissions: z.array(
    z.object({
      id: z.string(),
      user_id: z.string(),
      lesson_id: z.string(),
      submitted_at: z.string(),
      lessons: z.object({ title: z.string().nullable() }),
    })
  ),
})
export type DashboardStats = z.output<typeof statsSchema>
export const dashboardService = {
  async getStats(signal?: AbortSignal): Promise<DashboardStats> {
    return adminData(
      statsSchema,
      await adminRead(apiClient.get('/api/admin/stats/overview', { signal }))
    )
  },
}
