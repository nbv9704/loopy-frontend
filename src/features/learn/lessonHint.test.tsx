// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { api } from '../../lib/api'
import { requestLessonHint, type LessonHintInput } from './lessonHint.service'
import { useLessonHint } from './useLessonHint'

vi.mock('../../lib/api', () => ({ api: { requestLessonHint: vi.fn() } }))
const input: LessonHintInput = {
  lessonId: 'lesson',
  code: 'source',
  language: 'javascript',
  outputLogs: ['log'],
}
beforeEach(() => vi.resetAllMocks())
afterEach(cleanup)

it.each([{}, { hint: '' }, { hint: ' ' }, { hint: false }, { hint: 'x'.repeat(2001) }])(
  'rejects malformed hints instead of displaying them as successful feedback (%j)',
  async data => {
    vi.mocked(api.requestLessonHint).mockResolvedValue({ success: true, data } as never)
    await expect(requestLessonHint(input)).rejects.toThrow('chưa hợp lệ')
  }
)
it('sends only bounded runtime evidence, without copying exercise metadata from the browser', async () => {
  vi.mocked(api.requestLessonHint).mockResolvedValue({
    success: true,
    data: { hint: '  Think?  ' },
  })
  await expect(
    requestLessonHint({ ...input, outputLogs: Array(25).fill('x'.repeat(6000)) })
  ).resolves.toBe('Think?')
  expect(api.requestLessonHint).toHaveBeenCalledWith('lesson', 'source', 'javascript', {
    outputLogs: Array(20).fill('x'.repeat(5000)),
  })
})
it('keeps an error distinct from a hint and allows a successful retry', async () => {
  vi.mocked(api.requestLessonHint)
    .mockResolvedValueOnce({ success: false })
    .mockResolvedValue({ success: true, data: { hint: 'Try this?' } })
  const { result } = renderHook(() => useLessonHint('account', input))
  await act(async () => {
    await result.current.ask()
  })
  expect(result.current.error).toContain('chưa lấy được')
  expect(result.current.hint).toBeUndefined()
  await act(async () => {
    await result.current.ask()
  })
  expect(result.current.hint).toBe('Try this?')
  expect(result.current.error).toBeUndefined()
})
it('locks duplicate clicks synchronously and discards responses after editing code', async () => {
  let release!: (value: any) => void
  vi.mocked(api.requestLessonHint).mockReturnValue(
    new Promise(resolve => {
      release = resolve
    })
  )
  const { result, rerender } = renderHook(
    ({ code }) => useLessonHint('account', { ...input, code }),
    { initialProps: { code: 'old' } }
  )
  act(() => {
    void result.current.ask()
    void result.current.ask()
  })
  expect(api.requestLessonHint).toHaveBeenCalledTimes(1)
  rerender({ code: 'new' })
  await act(async () => release({ success: true, data: { hint: 'Old' } }))
  expect(result.current.hint).toBeUndefined()
  expect(result.current.error).toBeUndefined()
  expect(result.current.pending).toBe(false)
})
it('hides a previously successful hint after runtime output or account changes', async () => {
  vi.mocked(api.requestLessonHint).mockResolvedValue({ success: true, data: { hint: 'Think?' } })
  const { result, rerender } = renderHook(
    ({ scope, logs }) => useLessonHint(scope, { ...input, outputLogs: logs }),
    {
      initialProps: { scope: 'account', logs: ['old'] },
    }
  )
  await act(async () => {
    await result.current.ask()
  })
  await waitFor(() => expect(result.current.hint).toBe('Think?'))
  rerender({ scope: 'account', logs: ['new'] })
  expect(result.current.hint).toBeUndefined()
  await act(async () => {
    await result.current.ask()
  })
  rerender({ scope: 'another account', logs: ['new'] })
  expect(result.current.hint).toBeUndefined()
})
