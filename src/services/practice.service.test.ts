import { beforeEach, expect, it, vi } from 'vitest'
import { api } from '../lib/api'
import { practiceService } from './practice.service'
import {
  practiceAttempt,
  practiceQuestion,
  practiceSet,
  practiceSubmission,
} from '../test-utils/practice'

vi.mock('../lib/api', () => ({ api: { request: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())

it.each([{}, { id: 'other', status: 'archived' }, { id: 'set-one', status: 'published' }])(
  'does not accept an incomplete or foreign archive acknowledgement %#',
  async data => {
    vi.mocked(api.request).mockResolvedValue({ success: true, data })
    await expect(practiceService.deleteSet('set-one', 'published')).rejects.toThrow('lưu trữ')
    expect(api.request).toHaveBeenCalledWith(
      '/api/practice/sets/set-one?expectedStatus=published',
      expect.objectContaining({ method: 'DELETE' })
    )
  }
)

it('does not send invalid authoring data or silently truncate its requirement', async () => {
  await expect(
    practiceService.createSet({
      title: 'Quiz',
      requirements: { type: 'completed_lessons_count', languageId: 'python', count: 1.5 },
      questions: [{ type: 'fill_blank', prompt: 'Hello', correctAnswer: 'hello' }],
    })
  ).rejects.toThrow()
  expect(api.request).not.toHaveBeenCalled()
})

it('finds a matching question after the first twenty questions instead of returning unrelated earlier ones', async () => {
  const questions = Array.from({ length: 30 }, (_, i) =>
    practiceQuestion({
      id: `q-${i}`,
      orderIndex: i,
      prompt: i === 29 ? 'Unique needle' : 'Unrelated',
    })
  )
  vi.mocked(api.request).mockResolvedValue({
    success: true,
    data: {
      items: [practiceSet({ questionCount: 30, questions })],
      total: 1,
      limit: 20,
      offset: 0,
    },
  })
  const result = await practiceService.searchQuestions('needle')
  expect(result.map(item => item.question.id)).toEqual(['q-29'])
})
it('passes AbortSignal to set reads and rejects another set identity', async () => {
  vi.mocked(api.request).mockResolvedValue({ success: true, data: practiceSet({ id: 'other' }) })
  const controller = new AbortController()
  await expect(practiceService.getSet('set-one', controller.signal)).rejects.toThrow('Practice')
  expect(api.request).toHaveBeenCalledWith('/api/practice/sets/set-one', {
    signal: controller.signal,
  })
})
it('preserves a typed 404 instead of converting it into malformed data', async () => {
  vi.mocked(api.request).mockResolvedValue({
    success: false,
    error: { code: 'NOT_FOUND', message: 'Absent', status: 404 },
  })
  await expect(practiceService.getSet('set-one')).rejects.toMatchObject({
    status: 404,
    code: 'NOT_FOUND',
  })
})
it('rejects success envelopes with no valid start and no valid submission', async () => {
  vi.mocked(api.request).mockResolvedValue({ success: true, data: {} })
  await expect(practiceService.startAttempt('set-one', 'learner')).rejects.toThrow('Practice')
  await expect(
    practiceService.submitAnswer(
      'attempt-one',
      'question-one',
      { selectedAnswer: 'hello' },
      { attempt: practiceAttempt(), question: practiceQuestion() }
    )
  ).rejects.toThrow('Practice')
})
it('does not send a submit when question and attempt belong to different sets', async () => {
  await expect(
    practiceService.submitAnswer(
      'attempt-one',
      'question-one',
      { selectedAnswer: 'hello' },
      { attempt: practiceAttempt(), question: practiceQuestion({ setId: 'foreign' }) }
    )
  ).rejects.toThrow('thay đổi')
  expect(api.request).not.toHaveBeenCalled()
})
it('requires full set acknowledgements after create and the correct identity after update', async () => {
  vi.mocked(api.request).mockResolvedValue({ success: true, data: { id: 'set-one' } })
  const payload = {
    title: 'Set',
    questions: [{ type: 'fill_blank' as const, prompt: 'Hello', correctAnswer: 'hello' }],
  }
  await expect(practiceService.createSet(payload)).rejects.toThrow('Practice')
  vi.mocked(api.request).mockResolvedValue({ success: true, data: practiceSet({ id: 'foreign' }) })
  await expect(practiceService.updateSet('set-one', payload)).rejects.toThrow('Practice')
})
it('accepts a confirmed completion without issuing a follow-up GET', async () => {
  vi.mocked(api.request).mockResolvedValue({ success: true, data: practiceSubmission() })
  const saved = await practiceService.submitAnswer(
    'attempt-one',
    'question-one',
    { selectedAnswer: 'hello' },
    { attempt: practiceAttempt(), question: practiceQuestion() }
  )
  expect(saved.attempt.status).toBe('completed')
  expect(api.request).toHaveBeenCalledOnce()
})
