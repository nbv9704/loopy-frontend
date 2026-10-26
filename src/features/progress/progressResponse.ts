import { z } from 'zod'

const count = z.number().int().nonnegative().safe()
const record = z
  .object({
    id: z.string().trim().min(1).optional(),
    lessonId: z.string().trim().min(1).optional(),
    status: z.enum(['not_started', 'in_progress', 'completed']),
    completedAt: z.string().nullable().optional(),
    completed_at: z.string().nullable().optional(),
  })
  .passthrough()
const snapshot = z
  .object({
    progress: z.array(record),
    completedLessons: count.optional(),
    completed_lessons: count.optional(),
    totalLessons: count.optional(),
    total_lessons: count.optional(),
    currentStreak: count.optional(),
    current_streak: count.optional(),
    totalPoints: count.optional(),
    total_points: count.optional(),
  })
  .passthrough()

export function readProgressSnapshot(value: unknown, requireLessonIds = false) {
  const parsed = snapshot.safeParse(value)
  if (!parsed.success) throw new Error('Không tải được tiến độ hợp lệ. Vui lòng thử lại.')
  const ids = new Set<string>()
  for (const item of parsed.data.progress) {
    if ((requireLessonIds && !item.lessonId) || (item.lessonId && ids.has(item.lessonId)))
      throw new Error('Không tải được tiến độ hợp lệ. Vui lòng thử lại.')
    if (item.lessonId) ids.add(item.lessonId)
  }
  return parsed.data
}
