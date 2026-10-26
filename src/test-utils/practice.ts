import type { PracticeAttempt, PracticeQuestion, PracticeSet } from '../types/practice.types'
import type { PracticeWritePayload } from '../features/practice/practiceWrite'

const timestamp = '2026-10-24T00:00:00Z'
export const practiceQuestion = (overrides: Partial<PracticeQuestion> = {}): PracticeQuestion => ({
  id: 'question-one',
  setId: 'set-one',
  type: 'fill_blank',
  prompt: 'Type hello',
  points: 10,
  orderIndex: 0,
  ...overrides,
})
export const practiceSet = (overrides: Partial<PracticeSet> = {}): PracticeSet => ({
  id: 'set-one',
  description: null,
  topic: null,
  languageId: null,
  ownerType: 'user',
  createdBy: 'learner',
  title: 'Practice one',
  difficulty: 'easy',
  visibility: 'public',
  status: 'published',
  requirements: {},
  createdAt: timestamp,
  updatedAt: timestamp,
  questionCount: 1,
  questions: [practiceQuestion()],
  ...overrides,
})
export const practiceAttempt = (overrides: Partial<PracticeAttempt> = {}): PracticeAttempt => ({
  id: 'attempt-one',
  setId: 'set-one',
  userId: 'learner',
  status: 'in_progress',
  score: 0,
  maxScore: 10,
  startedAt: timestamp,
  questions: [practiceQuestion()],
  ...overrides,
})
export const practiceSubmission = () => ({
  submission: {
    id: 'submission',
    attemptId: 'attempt-one',
    questionId: 'question-one',
    isCorrect: true,
    pointsEarned: 10,
    submittedAt: timestamp,
  },
  attempt: practiceAttempt({
    status: 'completed',
    score: 10,
    completedAt: timestamp,
    questions: undefined,
  }),
})

export function practiceSavedFromPayload(
  value: Record<string, unknown>,
  id = 'set-one'
): PracticeSet {
  const payload = value as unknown as PracticeWritePayload
  return practiceSet({
    id,
    title: payload.title,
    description: payload.description ?? null,
    topic: payload.topic ?? null,
    languageId: payload.languageId ?? null,
    difficulty: payload.difficulty ?? 'easy',
    visibility: payload.visibility ?? 'private',
    status: payload.status ?? 'draft',
    requirements: payload.requirements ?? {},
    questionCount: payload.questions.length,
    questions: payload.questions.map((question, index) =>
      practiceQuestion({
        ...question,
        id: `${id}-q-${index}`,
        setId: id,
        orderIndex: question.orderIndex ?? index,
        points: question.points ?? 10,
      })
    ),
  })
}
