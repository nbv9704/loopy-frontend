import { expect, it } from 'vitest'
import {
  practiceAttempt,
  practiceQuestion,
  practiceSet,
  practiceSubmission,
} from '../../test-utils/practice'
import {
  readPracticePage,
  readPracticeSet,
  readStartedAttempt,
  readSubmittedAnswer,
} from './practiceResponse'

it('accepts confirmed empty pages and real zero values', () => {
  expect(readPracticePage({ items: [], total: 0, limit: 20, offset: 0 }, {}).items).toEqual([])
  expect(
    readStartedAttempt(
      practiceAttempt({ maxScore: 0, questions: [practiceQuestion({ points: 0 })] }),
      'set-one',
      'learner'
    ).maxScore
  ).toBe(0)
})

it('normalizes repeated legacy option text without changing answer values', () => {
  const value = readPracticeSet(
    practiceSet({
      questions: [
        practiceQuestion({ type: 'multiple_choice', options: ['a', 'b', 'a'], correctAnswer: 'a' }),
      ],
    }),
    'set-one',
    true
  )
  expect(value.questions?.[0].options).toEqual(['a', 'b'])
  expect(value.questions?.[0].correctAnswer).toBe('a')
})
it.each([
  { items: {}, total: 1, limit: 20, offset: 0 },
  { items: [], total: 1, limit: 20, offset: 0 },
  { items: [], total: 0, limit: 20, offset: 20 },
  { items: [], total: -1, limit: 20, offset: 0 },
  { items: [practiceSet(), practiceSet()], total: 2, limit: 20, offset: 0 },
])('rejects malformed or mismatched catalog pages %#', value => {
  expect(() => readPracticePage(value, {})).toThrow('Practice')
})
it.each([
  practiceSet({ id: 'another' }),
  practiceSet({ questions: [practiceQuestion({ setId: 'foreign' })] }),
  practiceSet({ questions: [practiceQuestion(), practiceQuestion()], questionCount: 2 }),
  practiceSet({ questions: [practiceQuestion({ points: Number.NaN })] }),
  practiceSet({ questions: [practiceQuestion({ type: 'multiple_choice', options: ['a', 'a'] })] }),
  practiceSet({ questionCount: 2 }),
])('rejects invalid identity, count, references and question values %#', value => {
  expect(() => readPracticeSet(value, 'set-one', true)).toThrow('Practice')
})
it.each([
  practiceAttempt({ userId: 'other' }),
  practiceAttempt({ setId: 'other' }),
  practiceAttempt({ questions: [] }),
  practiceAttempt({ maxScore: 100 }),
  practiceAttempt({ score: 1 }),
])('requires a start acknowledgement for this account and complete question snapshot %#', value => {
  expect(() => readStartedAttempt(value, 'set-one', 'learner')).toThrow('Practice')
})
it('rejects a foreign or malformed submission instead of declaring completion', () => {
  const saved = practiceSubmission()
  const previous = practiceAttempt()
  for (const value of [
    { ...saved, submission: { ...saved.submission, questionId: 'foreign' } },
    { ...saved, submission: { ...saved.submission, isCorrect: 'false' } },
    { ...saved, submission: { ...saved.submission, pointsEarned: 11 } },
    { ...saved, submission: { ...saved.submission, isCorrect: false } },
    { ...saved, attempt: { ...saved.attempt, userId: 'foreign' } },
    { ...saved, attempt: { ...saved.attempt, score: -1 } },
    { ...saved, attempt: { ...saved.attempt, maxScore: 100 } },
  ])
    expect(() => readSubmittedAnswer(value, previous, practiceQuestion())).toThrow('Practice')
  expect(readSubmittedAnswer(saved, previous, practiceQuestion()).attempt.status).toBe('completed')
})
