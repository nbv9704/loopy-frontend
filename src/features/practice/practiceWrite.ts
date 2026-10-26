import { z } from 'zod'

const difficulty = z.enum(['easy', 'medium', 'hard'])
const visibility = z.enum(['public', 'private', 'unlisted', 'official'])
const status = z.enum(['draft', 'published', 'archived'])
const type = z.enum(['true_false', 'multiple_choice', 'multiple_select', 'fill_blank'])
const requirement = z
  .object({
    type: z.literal('completed_lessons_count').optional(),
    languageId: z.string().trim().min(1).optional(),
    count: z.number().int().min(1).max(999).optional(),
  })
  .strict()
  .refine(
    value => !Object.keys(value).length || Boolean(value.type && value.languageId && value.count),
    'Điều kiện mở khóa cần đủ ngôn ngữ và số bài học.'
  )
const inputQuestion = z.object({
  type,
  title: z.string().trim().max(200).optional(),
  prompt: z.string().trim().min(1).max(5000),
  options: z.array(z.string().trim().min(1)).optional(),
  correctAnswer: z.string().trim().min(1),
  explanation: z.string().max(5000).optional(),
  points: z.number().int().min(1).max(100).default(10),
  orderIndex: z.number().int().nonnegative().optional(),
})
const input = z.object({
  title: z.string().trim().min(1).max(160),
  description: z.string().trim().max(2000).optional(),
  topic: z.string().trim().max(120).optional(),
  languageId: z.string().trim().min(1).optional(),
  difficulty: difficulty.default('easy'),
  visibility: visibility.default('private'),
  status: status.default('draft'),
  requirements: requirement.default({}),
  questions: z.array(inputQuestion).min(1).max(30),
})
export type PracticeWritePayload = z.input<typeof input>
export type NormalizedPracticeWrite = z.output<typeof input>

export function normalizePracticeWrite(value: unknown): NormalizedPracticeWrite {
  const result = input.safeParse(value)
  if (!result.success)
    throw new Error(
      'Thông tin bộ bài hoặc câu hỏi không hợp lệ. Kiểm tra tiêu đề, đáp án, điểm và điều kiện mở khóa.'
    )
  const data = result.data
  const orders = new Set<number>()
  for (const [index, question] of data.questions.entries()) {
    const order = question.orderIndex ?? index
    if (orders.has(order))
      throw new Error('Thứ tự câu hỏi bị trùng. Hãy sắp xếp lại trước khi lưu.')
    orders.add(order)
    question.orderIndex = order
    if (!question.title) delete question.title
    if (question.type === 'true_false' && !['true', 'false'].includes(question.correctAnswer))
      throw new Error('Chọn đúng hoặc sai cho đáp án.')
    if (question.type === 'multiple_choice' || question.type === 'multiple_select') {
      const options = question.options || []
      if (options.length < 2 || options.length > 4 || new Set(options).size !== options.length)
        throw new Error('Cần 2–4 lựa chọn khác nhau cho mỗi câu hỏi.')
      if (question.type === 'multiple_choice' && !options.includes(question.correctAnswer))
        throw new Error('Đáp án cần khớp một lựa chọn.')
      if (question.type === 'multiple_select') {
        let values: unknown
        try {
          values = JSON.parse(question.correctAnswer)
        } catch {
          values = question.correctAnswer.split('|').map(item => item.trim())
        }
        if (
          !Array.isArray(values) ||
          values.length < 2 ||
          values.some(answer => typeof answer !== 'string' || !options.includes(answer.trim())) ||
          new Set(values.map(answer => (typeof answer === 'string' ? answer.trim() : answer)))
            .size !== values.length
        )
          throw new Error('Cần ít nhất hai đáp án khác nhau và khớp các lựa chọn.')
      }
    }
  }
  return data
}

const text = z.string().nullish()
const snapshot = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  difficulty,
  visibility,
  status,
  description: text,
  topic: text,
  languageId: text,
  requirements: z.record(z.string(), z.unknown()).nullish(),
  questions: z
    .array(
      z.object({
        id: z.string().optional(),
        setId: z.string().optional(),
        type,
        title: text,
        prompt: z.string().min(1),
        options: z.array(z.string()).nullish(),
        correctAnswer: text,
        correct_answer: text,
        explanation: text,
        points: z.number().int().nonnegative().safe(),
        orderIndex: z.number().int().nonnegative().optional(),
      })
    )
    .max(30),
})
export function readPracticeAuthoring(value: unknown, expectedId?: string) {
  const result = snapshot.safeParse(value)
  if (!result.success || (expectedId && result.data.id !== expectedId))
    throw new Error('Không xác nhận được dữ liệu bộ bài đang chỉnh sửa. Hãy tải lại.')
  const data = result.data
  if (
    ['description', 'topic', 'languageId', 'requirements'].some(
      key => !Object.prototype.hasOwnProperty.call(value, key)
    )
  )
    throw new Error('Thiếu thông tin bộ bài. Hãy tải lại để tránh ghi đè dữ liệu chưa được đọc.')
  if (
    data.questions.some(
      question =>
        (question.setId && question.setId !== data.id) ||
        (question.correctAnswer != null &&
          question.correct_answer != null &&
          question.correctAnswer !== question.correct_answer)
    )
  )
    throw new Error('Câu hỏi không khớp bộ bài đang sửa.')
  return {
    ...data,
    questions: data.questions.map(question => ({
      ...question,
      correctAnswer: question.correctAnswer ?? question.correct_answer ?? '',
    })),
  }
}
export function confirmPracticeWrite(
  value: unknown,
  expected: NormalizedPracticeWrite,
  expectedId?: string
) {
  const saved = readPracticeAuthoring(value, expectedId)
  const savedRequirements = requirement.safeParse(saved.requirements ?? {})
  const sameText = (a: string | null | undefined, b: string | undefined) => (a ?? '') === (b ?? '')
  if (
    !sameText(saved.title, expected.title) ||
    !sameText(saved.description, expected.description) ||
    !sameText(saved.topic, expected.topic) ||
    !sameText(saved.languageId, expected.languageId) ||
    saved.status !== expected.status ||
    saved.visibility !== expected.visibility ||
    saved.difficulty !== expected.difficulty ||
    !savedRequirements.success ||
    savedRequirements.data.type !== expected.requirements.type ||
    savedRequirements.data.languageId !== expected.requirements.languageId ||
    savedRequirements.data.count !== expected.requirements.count ||
    saved.questions.length !== expected.questions.length
  )
    throw new Error(
      'Kết quả trả về chưa khớp bản nháp đã gửi. Hãy tải lại kết quả trước khi thử lưu tiếp.'
    )
  const wanted = [...expected.questions].sort((a, b) => a.orderIndex! - b.orderIndex!)
  for (const [index, actual] of saved.questions.entries()) {
    const question = wanted[index]
    if (
      actual.type !== question.type ||
      !sameText(actual.title, question.title) ||
      actual.prompt !== question.prompt ||
      actual.correctAnswer !== question.correctAnswer ||
      !sameText(actual.explanation, question.explanation) ||
      actual.points !== question.points ||
      (actual.orderIndex !== undefined && actual.orderIndex !== question.orderIndex) ||
      JSON.stringify(actual.options ?? []) !== JSON.stringify(question.options ?? [])
    )
      throw new Error(
        'Câu hỏi đã lưu chưa khớp bản nháp. Hãy kiểm tra lại kết quả trước khi thử lưu tiếp.'
      )
  }
  return saved
}

/** Recover only a known commit or an uncertain saved response with a valid resource reference. */
export function practiceRecoveryReference(
  error: unknown,
  expectedId?: string
): { id: string; committed: boolean } | null {
  const failure = error as {
    code?: unknown
    details?: unknown
    response?: { data?: { error?: { code?: unknown; details?: unknown } } }
  } | null
  const envelope = failure?.response?.data?.error ?? failure
  if (!['PRACTICE_SAVED_READ_FAILED', 'PRACTICE_SAVE_UNCONFIRMED'].includes(String(envelope?.code)))
    return null
  const parsed = z.object({ setId: z.guid() }).safeParse(envelope?.details)
  return parsed.success && (!expectedId || parsed.data.setId === expectedId)
    ? { id: parsed.data.setId, committed: envelope?.code === 'PRACTICE_SAVED_READ_FAILED' }
    : null
}

export function unconfirmedPracticeId(value: unknown, expectedId?: string): string | null {
  const parsed = z.object({ id: z.guid() }).safeParse(value)
  return parsed.success && (!expectedId || parsed.data.id === expectedId) ? parsed.data.id : null
}

export function practiceRequirementCount(value: string): number | undefined {
  const trimmed = value.trim()
  if (!trimmed) return undefined
  if (!/^[1-9]\d{0,2}$/.test(trimmed))
    throw new Error('Số bài học yêu cầu phải là số nguyên từ 1 đến 999.')
  return Number(trimmed)
}
