import { z } from 'zod'

const count = z.number().int().nonnegative().safe()
export const historyRecordSchema = z.object({
  id: z.string().min(1),
  admin_id: z.string(),
  chapter_id: z.string(),
  file_name: z.string(),
  file_size: count.nullish(),
  lessons_count: count,
  test_cases_count: count,
  errors_count: count,
  status: z.enum(['success', 'partial', 'failed']),
  error_message: z.string().nullish(),
  created_at: z
    .string()
    .refine(value => Number.isFinite(Date.parse(value)), 'Thời gian import không hợp lệ.'),
  chapters: z
    .object({ id: z.string(), title: z.string(), language_id: z.string().nullish() })
    .nullish(),
})
export const historyPageSchema = z
  .object({
    imports: z.array(historyRecordSchema),
    total: count,
    limit: z.number().int().positive().max(100),
    offset: count,
  })
  .refine(
    value => value.imports.length <= value.limit && value.imports.length <= value.total,
    'Trang lịch sử import không đầy đủ hoặc không hợp lệ.'
  )
export const importStatsSchema = z
  .object({
    totalImports: count,
    successfulImports: count,
    failedImports: count,
    totalLessonsImported: count,
    totalTestCasesImported: count,
  })
  .refine(
    value => value.successfulImports + value.failedImports === value.totalImports,
    'Thống kê import không nhất quán.'
  )
