import { beforeEach, expect, it, vi } from 'vitest'
import { api } from '../../lib/api'
import { checkLessonAnswer, executeLessonCode, saveLessonCompletion } from './lessonActions.service'

vi.mock('../../lib/api', () => ({
  api: { checkLesson: vi.fn(), executeCode: vi.fn(), completeLesson: vi.fn() },
}))
beforeEach(() => vi.resetAllMocks())

it.each(['check', 'execute', 'save'] as const)(
  'preserves the %s service error instead of reporting an incorrect answer',
  async action => {
    const failure = { success: false, error: { message: 'Service unavailable' } }
    vi.mocked(api.checkLesson).mockResolvedValue(failure as never)
    vi.mocked(api.executeCode).mockResolvedValue(failure as never)
    vi.mocked(api.completeLesson).mockResolvedValue(failure as never)
    const request =
      action === 'check'
        ? checkLessonAnswer('lesson', 'code', 'javascript')
        : action === 'execute'
          ? executeLessonCode('javascript', 'code')
          : saveLessonCompletion('lesson', 'check-id')
    await expect(request).rejects.toThrow('Service unavailable')
  }
)

it.each([
  undefined,
  {},
  { passed: 'true', score: 100, checks: [], output: '' },
  { passed: true, score: 100, output: '' },
])('rejects an incomplete checker response (%j)', async data => {
  vi.mocked(api.checkLesson).mockResolvedValue({ success: true, data } as never)
  await expect(checkLessonAnswer('lesson', 'code', 'javascript')).rejects.toThrow()
})

it('keeps a failed deterministic check distinct from a transport failure', async () => {
  const result = { passed: false, score: 0, checks: [], output: '', hint: 'Try again' }
  vi.mocked(api.checkLesson).mockResolvedValue({ success: true, data: result } as never)
  await expect(checkLessonAnswer('lesson', 'code', 'javascript')).resolves.toEqual(result)
})

it.each([
  {},
  { progress: { status: 'in_progress' } },
  { progress: { status: 'completed', lessonId: 'other' } },
])('requires a committed completion acknowledgement (%j)', async data => {
  vi.mocked(api.completeLesson).mockResolvedValue({ success: true, data } as never)
  await expect(saveLessonCompletion('lesson', 'check-id')).rejects.toThrow(
    'Chưa nhận được xác nhận hoàn thành'
  )
})

it('accepts the completion shape returned by the atomic progress RPC', async () => {
  vi.mocked(api.completeLesson).mockResolvedValue({
    success: true,
    data: { progress: { id: 'progress-id', status: 'completed', wasFirstCompletion: true } },
  } as never)
  await expect(saveLessonCompletion('lesson', 'check-id')).resolves.toBeUndefined()
})

it('does not send completion without a saved check receipt', async () => {
  await expect(saveLessonCompletion('lesson', null)).rejects.toThrow('Cần kiểm tra lại')
  expect(api.completeLesson).not.toHaveBeenCalled()
})
it('sends the exact receipt and preserves stale-check errors for recovery', async () => {
  vi.mocked(api.completeLesson).mockResolvedValue({
    success: false,
    error: { code: 'LESSON_CHECK_STALE', message: 'Check again' },
  } as never)
  await expect(saveLessonCompletion('lesson', 'final-check')).rejects.toMatchObject({
    code: 'LESSON_CHECK_STALE',
  })
  expect(api.completeLesson).toHaveBeenCalledWith('lesson', 'final-check')
})
it('does not advance on a passing response without a committed receipt', async () => {
  vi.mocked(api.checkLesson).mockResolvedValue({
    success: true,
    data: { passed: true, score: 100, checks: [], output: '' },
  } as never)
  await expect(checkLessonAnswer('lesson', 'code', 'javascript')).rejects.toThrow(
    'kết quả kiểm tra hợp lệ'
  )
})
