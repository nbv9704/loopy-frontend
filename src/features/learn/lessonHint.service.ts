import { api } from '../../lib/api'

export interface LessonHintInput {
  lessonId: string
  code: string
  language: string
  outputLogs: string[]
}

export async function requestLessonHint(input: LessonHintInput): Promise<string> {
  const response = await api.requestLessonHint(input.lessonId, input.code, input.language, {
    outputLogs: input.outputLogs.slice(-20).map(line => line.slice(0, 5000)),
  })
  const hint = response.data?.hint
  if (!response.success)
    throw new Error('Hiện tại chưa lấy được gợi ý. Bạn có thể thử lại hoặc đọc các gợi ý có sẵn.')
  if (typeof hint !== 'string' || !hint.trim() || hint.length > 2000)
    throw new Error('Gợi ý trả về chưa hợp lệ. Bạn có thể thử lại.')
  return hint.trim()
}
