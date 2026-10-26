import { z } from 'zod'
import { bulkImportPayloadSchema } from './importContract'

export type ImportPayload = z.output<typeof bulkImportPayloadSchema>
export interface ImportPreview {
  payload: ImportPayload | null
  issues: string[]
}

export function previewImport(text: string): ImportPreview {
  if (!text.trim()) return { payload: null, issues: [] }
  let value: unknown
  try {
    value = JSON.parse(text)
  } catch {
    return { payload: null, issues: ['JSON không hợp lệ. Kiểm tra dấu ngoặc và dấu phẩy.'] }
  }
  const result = bulkImportPayloadSchema.safeParse(value)
  if (!result.success)
    return {
      payload: null,
      issues: result.error.issues.map(
        issue => `${issue.path.join('.') || 'payload'}: ${issue.message}`
      ),
    }
  return { payload: result.data, issues: [] }
}

export function importSummary(payload: ImportPayload) {
  return {
    lessons: payload.lessons.length,
    testCases: payload.lessons.reduce((n, item) => n + (item.test_cases?.length ?? 0), 0),
    steps: payload.lessons.reduce((n, item) => n + (item.steps?.length ?? 0), 0),
    published: payload.lessons.filter(item => item.status === 'published').length,
    replacedTests: payload.lessons.filter(item => item.test_cases !== undefined).length,
    replacedSteps: payload.lessons.filter(item => item.steps !== undefined).length,
  }
}

const count = z.number().int().nonnegative()
const resultSchema = z.object({
  lessonsCreated: count,
  testCasesCreated: count,
  testCasesReplaced: count,
  stepsCreated: count,
  stepsReplaced: count,
  errors: z.array(z.string()).length(0),
})
export type ImportResult = z.output<typeof resultSchema>

export function confirmedImportResult(value: unknown, payload: ImportPayload): ImportResult {
  const result = resultSchema.safeParse(value)
  const summary = importSummary(payload)
  if (
    !result.success ||
    result.data.lessonsCreated !== summary.lessons ||
    result.data.testCasesCreated !== summary.testCases ||
    result.data.stepsCreated !== summary.steps
  ) {
    throw new Error(
      'Chưa xác nhận được kết quả import. Kiểm tra nội dung chapter trước khi gửi lại.'
    )
  }
  return result.data
}
