import { z } from 'zod'
import type { PracticeAttempt, PracticeQuestion, PracticeSet } from '../../types/practice.types'

const id = z.string().min(1)
const count = z.number().int().nonnegative().safe()
const text = z.string().nullish()
const question = z
  .object({
    id,
    setId: id,
    type: z.enum(['true_false', 'multiple_choice', 'multiple_select', 'fill_blank']),
    title: text,
    prompt: z.string().min(1),
    options: z.array(z.string()).nullish(),
    correctAnswer: text,
    starterCode: text,
    explanation: text,
    points: count,
    orderIndex: count,
  })
  // Older sets contain repeated option text. The stored answer is the text itself,
  // so one choice per distinct value preserves grading and avoids duplicate UI keys.
  .transform(value => ({
    ...value,
    options: value.options ? [...new Set(value.options)] : value.options,
  }))
  .superRefine((value, ctx) => {
    if (
      ['multiple_choice', 'multiple_select'].includes(value.type) &&
      (!value.options || value.options.length < 2)
    )
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid question options' })
  })
const set = z.object({
  id,
  ownerType: z.enum(['official', 'user']),
  createdBy: text,
  title: z.string().min(1),
  description: text,
  topic: text,
  languageId: text,
  difficulty: z.enum(['easy', 'medium', 'hard']),
  visibility: z.enum(['public', 'private', 'unlisted', 'official']),
  status: z.enum(['draft', 'published', 'archived']),
  requirements: z.object({
    type: z.literal('completed_lessons_count').optional(),
    languageId: id.optional(),
    count: count.optional(),
  }),
  questionCount: count.optional(),
  questions: z.array(question).max(30).optional(),
  createdAt: id,
  updatedAt: id,
})
const attempt = z
  .object({
    id,
    setId: id,
    userId: id,
    status: z.enum(['in_progress', 'completed']),
    score: count,
    maxScore: count,
    startedAt: id,
    completedAt: text,
    questions: z.array(question).max(30).optional(),
  })
  .refine(value => value.score <= value.maxScore)
const invalid = () =>
  new Error('Không xác nhận được dữ liệu Practice. Vui lòng tải lại hoặc thử lại.')
const validQuestions = (rows: PracticeQuestion[], setId: string) =>
  new Set(rows.map(row => row.id)).size === rows.length && rows.every(row => row.setId === setId)

export function readPracticeSet(
  value: unknown,
  expectedId?: string,
  requireQuestions = false
): PracticeSet {
  const result = set.safeParse(value)
  if (!result.success || (expectedId && result.data.id !== expectedId)) throw invalid()
  const data = result.data
  if (
    (requireQuestions && !data.questions) ||
    (data.questions &&
      (!validQuestions(data.questions, data.id) ||
        (data.questionCount !== undefined && data.questionCount !== data.questions.length)))
  )
    throw invalid()
  return data
}

export function readPracticePage(
  value: unknown,
  expected: { offset?: number; limit?: number; includeQuestions?: boolean }
) {
  const result = z
    .object({ items: z.array(z.unknown()), total: count, limit: count.positive(), offset: count })
    .safeParse(value)
  if (!result.success) throw invalid()
  const data = result.data
  if (
    data.offset !== (expected.offset ?? 0) ||
    data.limit !== (expected.limit ?? 20) ||
    data.items.length > Math.min(data.limit, Math.max(0, data.total - data.offset)) ||
    (!data.items.length && data.offset < data.total)
  )
    throw invalid()
  const items = data.items.map(row => readPracticeSet(row, undefined, expected.includeQuestions))
  if (new Set(items.map(row => row.id)).size !== items.length) throw invalid()
  return { ...data, items }
}

export function readStartedAttempt(value: unknown, setId: string, userId: string): PracticeAttempt {
  const result = attempt.safeParse(value)
  if (!result.success) throw invalid()
  const data = result.data
  if (
    data.setId !== setId ||
    data.userId !== userId ||
    data.status !== 'in_progress' ||
    data.score !== 0 ||
    !data.questions?.length ||
    !validQuestions(data.questions, setId) ||
    data.questions.reduce((sum, row) => sum + row.points, 0) !== data.maxScore
  )
    throw invalid()
  return data
}

export function readSubmittedAnswer(
  value: unknown,
  previous: PracticeAttempt,
  submitted: PracticeQuestion
) {
  const result = z
    .object({
      attempt,
      submission: z.object({
        id,
        attemptId: id,
        questionId: id,
        isCorrect: z.boolean(),
        pointsEarned: count,
        explanation: z.string().optional(),
        testResults: z.unknown().optional(),
        submittedAt: id,
      }),
    })
    .safeParse(value)
  if (!result.success) throw invalid()
  const data = result.data
  if (
    data.attempt.id !== previous.id ||
    data.attempt.setId !== previous.setId ||
    data.attempt.userId !== previous.userId ||
    data.attempt.maxScore !== previous.maxScore ||
    data.attempt.score < previous.score ||
    data.submission.attemptId !== previous.id ||
    data.submission.questionId !== submitted.id ||
    data.submission.pointsEarned > submitted.points ||
    data.submission.pointsEarned > data.attempt.score ||
    (!data.submission.isCorrect && data.submission.pointsEarned !== 0)
  )
    throw invalid()
  return data
}
