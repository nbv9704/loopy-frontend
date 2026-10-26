import { expect, it } from 'vitest'
import { answerOptions, selectPrimaryAnswerStep } from './answerQuestion'

it('chooses the first public question using step order and a deterministic tie break', () => {
  const steps = [
    { id: 'note', type: 'note', orderIndex: 0 },
    { id: 'b', type: 'short_answer', orderIndex: 1 },
    { id: 'a', type: 'short_answer', orderIndex: 1 },
  ]
  expect(selectPrimaryAnswerStep(steps, 'short_answer')?.id).toBe('a')
  expect(steps[1].id).toBe('b')
})

it('provides canonical default booleans without inventing choices for multiple choice questions', () => {
  expect(answerOptions('true_false')).toEqual([
    { value: 'true', label: 'Đúng' },
    { value: 'false', label: 'Sai' },
  ])
  expect(answerOptions('multiple_choice')).toEqual([])
  expect(answerOptions('multiple_choice', ['A', 'B']).map(option => option.value)).toEqual([
    'A',
    'B',
  ])
})

it('uses a code prompt for output prediction without turning it into a question for other lesson types', () => {
  const steps = [
    { id: 'note', type: 'note' },
    { id: 'output', type: 'code_prompt' },
  ]
  expect(selectPrimaryAnswerStep(steps, 'code_output')?.id).toBe('output')
  expect(selectPrimaryAnswerStep(steps, 'short_answer')).toBeUndefined()
})
