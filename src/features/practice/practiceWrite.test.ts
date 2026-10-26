import { expect, it } from 'vitest'
import { practiceSet, practiceQuestion } from '../../test-utils/practice'
import {
  confirmPracticeWrite,
  normalizePracticeWrite,
  practiceRecoveryReference,
  practiceRequirementCount,
  readPracticeAuthoring,
} from './practiceWrite'
const payload = {
  title: 'Practice one',
  difficulty: 'easy',
  visibility: 'public',
  status: 'published',
  questions: [{ type: 'fill_blank', prompt: 'Type hello', correctAnswer: 'hello', points: 10 }],
}
const snapshot = () => practiceSet({ questions: [practiceQuestion({ correctAnswer: 'hello' })] })
it('normalizes only outgoing fields and retains a matching saved snapshot', () => {
  const expected = normalizePracticeWrite({ ...payload, title: ' Practice one ', isAdmin: true })
  expect(expected).not.toHaveProperty('isAdmin')
  expect(confirmPracticeWrite(snapshot(), expected).title).toBe('Practice one')
})
it('compares requirement values independently of JSON object key order', () => {
  const requirements = { type: 'completed_lessons_count' as const, languageId: 'python', count: 2 }
  const expected = normalizePracticeWrite({ ...payload, requirements })
  expect(
    confirmPracticeWrite(
      {
        ...snapshot(),
        requirements: { count: 2, languageId: 'python', type: 'completed_lessons_count' },
      },
      expected
    ).id
  ).toBe('set-one')
})
it.each([
  { ...payload, title: ' ' },
  { ...payload, questions: [] },
  { ...payload, requirements: { count: 2 } },
  { ...payload, questions: [{ ...payload.questions[0], points: 0 }] },
  {
    ...payload,
    questions: [
      { type: 'multiple_choice', prompt: 'Choose', options: ['a', ' a '], correctAnswer: 'a' },
    ],
  },
  {
    ...payload,
    questions: [
      {
        type: 'multiple_select',
        prompt: 'Choose',
        options: ['a', 'b'],
        correctAnswer: '["a","a"]',
      },
    ],
  },
  {
    ...payload,
    questions: [
      { ...payload.questions[0], orderIndex: 0 },
      { ...payload.questions[0], orderIndex: 0 },
    ],
  },
  {
    ...payload,
    questions: [
      {
        type: 'multiple_select',
        prompt: 'Choose',
        options: ['a', 'b'],
        correctAnswer: '["a"," a "]',
      },
    ],
  },
])('rejects invalid authoring input before a request %#', value => {
  expect(() => normalizePracticeWrite(value)).toThrow()
})
it.each(['1.5', '1e2', '12bad', '0', '-1', '1000'])(
  'does not truncate requirement input %s',
  value => {
    expect(() => practiceRequirementCount(value)).toThrow('1 đến 999')
  }
)
it('keeps an empty requirement optional and accepts a bounded integer', () => {
  expect(practiceRequirementCount('')).toBeUndefined()
  expect(practiceRequirementCount(' 999 ')).toBe(999)
})
it.each([
  { ...snapshot(), title: 'old' },
  { ...snapshot(), status: 'draft' },
  { ...snapshot(), questions: [practiceQuestion({ correctAnswer: 'old' })] },
  { ...snapshot(), questions: [practiceQuestion({ correctAnswer: 'hello', points: 1 })] },
  { ...snapshot(), questions: [practiceQuestion({ correctAnswer: 'hello', setId: 'foreign' })] },
])('does not accept an old or mismatched read-back %#', value => {
  expect(() => confirmPracticeWrite(value, normalizePracticeWrite(payload), 'set-one')).toThrow()
})
it('refuses a missing authoring field instead of opening an empty value for overwrite', () => {
  const value = snapshot()
  delete value.languageId
  expect(() => readPracticeAuthoring(value)).toThrow('Thiếu thông tin')
})
it('does not treat arbitrary errors or foreign IDs as a committed write', () => {
  const id = '11111111-1111-4111-8111-111111111111'
  expect(practiceRecoveryReference({ code: 'NETWORK_ERROR', details: { setId: id } })).toBeNull()
  expect(
    practiceRecoveryReference({ code: 'PRACTICE_SAVED_READ_FAILED', details: { setId: 'bad' } })
  ).toBeNull()
  expect(
    practiceRecoveryReference(
      { code: 'PRACTICE_SAVED_READ_FAILED', details: { setId: id } },
      'other'
    )
  ).toBeNull()
  expect(
    practiceRecoveryReference({
      response: { data: { error: { code: 'PRACTICE_SAVED_READ_FAILED', details: { setId: id } } } },
    })
  ).toEqual({ id, committed: true })
})
