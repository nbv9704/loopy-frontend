import { executeProgram } from '../execution/execution.service'
import { api, type ExecutionResult, type LessonCheckResult } from '../../lib/api'

export class LessonActionError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message)
  }
}

export async function executeLessonCode(language: string, code: string): Promise<ExecutionResult> {
  return executeProgram(language, code)
}

export async function checkLessonAnswer(
  lessonId: string,
  answer: string,
  language: string
): Promise<LessonCheckResult> {
  const response = await api.checkLesson(lessonId, answer, language)
  if (!response.success || !response.data)
    throw new LessonActionError(
      response.error?.message || 'Không thể kiểm tra bài. Vui lòng thử lại.',
      response.error?.code
    )
  const result = response.data
  if (
    typeof result.passed !== 'boolean' ||
    !Number.isFinite(result.score) ||
    !Array.isArray(result.checks) ||
    typeof result.output !== 'string' ||
    (result.passed && (typeof result.submissionId !== 'string' || !result.submissionId.trim()))
  )
    throw new Error('Chưa nhận được kết quả kiểm tra hợp lệ. Vui lòng thử lại.')
  return result
}

export async function saveLessonCompletion(lessonId: string, submissionId: string | null) {
  if (!submissionId) throw new Error('Cần kiểm tra lại bài trước khi lưu tiến độ.')
  const response = await api.completeLesson(lessonId, submissionId)
  if (!response.success)
    throw new LessonActionError(
      response.error?.message || 'Chưa lưu được tiến độ. Vui lòng thử lại.',
      response.error?.code
    )
  const progress = (
    response.data as { progress?: { status?: string; lessonId?: string } } | undefined
  )?.progress
  if (progress?.status !== 'completed' || (progress.lessonId && progress.lessonId !== lessonId))
    throw new Error('Chưa nhận được xác nhận hoàn thành. Vui lòng thử lại.')
}
