// @vitest-environment jsdom
import { Suspense } from 'react'
import { act, cleanup, render, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { practiceService } from '../../services/practice.service'
import { practiceAttempt, practiceSubmission } from '../../test-utils/practice'
import { usePracticeAttempt } from './usePracticeAttempt'

vi.mock('../../services/practice.service', () => ({
  practiceService: { startAttempt: vi.fn(), submitAnswer: vi.fn() },
}))
beforeEach(() => vi.resetAllMocks())
afterEach(cleanup)
const callbacks = () => ({ success: vi.fn(), error: vi.fn() })

it('locks duplicate starts synchronously and permits explicit retry after failure', async () => {
  let finish!: (value: ReturnType<typeof practiceAttempt>) => void
  vi.mocked(practiceService.startAttempt)
    .mockRejectedValueOnce(new Error('offline'))
    .mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve
        })
    )
  const { result } = renderHook(() => usePracticeAttempt('set-one', 'learner'))
  const cb = callbacks()
  await act(async () => {
    await result.current.start(cb.success, cb.error)
  })
  expect(cb.error).toHaveBeenCalledOnce()
  act(() => {
    void result.current.start(cb.success, cb.error)
    void result.current.start(cb.success, cb.error)
  })
  expect(practiceService.startAttempt).toHaveBeenCalledTimes(2)
  await act(async () => {
    finish(practiceAttempt())
  })
  expect(result.current.pending).toBe(false)
  expect(result.current.attempt?.id).toBe('attempt-one')
})

it('preserves a failed answer, locks duplicate submits and navigation, then uses the confirmed result', async () => {
  vi.mocked(practiceService.startAttempt).mockResolvedValue(practiceAttempt())
  let finish!: (value: ReturnType<typeof practiceSubmission>) => void
  vi.mocked(practiceService.submitAnswer)
    .mockRejectedValueOnce(new Error('offline'))
    .mockImplementationOnce(
      () =>
        new Promise(resolve => {
          finish = resolve
        })
    )
  const { result } = renderHook(() => usePracticeAttempt('set-one', 'learner'))
  const cb = callbacks()
  await act(async () => {
    await result.current.start(cb.success, cb.error)
  })
  act(() => result.current.setAnswer('question-one', 'hello'))
  await act(async () => {
    await result.current.submit('hello', cb.success, cb.error)
  })
  expect(result.current.answers['question-one']).toBe('hello')
  act(() => {
    void result.current.submit('hello', cb.success, cb.error)
    void result.current.submit('hello', cb.success, cb.error)
  })
  expect(practiceService.submitAnswer).toHaveBeenCalledTimes(2)
  act(() => {
    result.current.setAnswer('question-one', 'changed')
    result.current.reset()
  })
  expect(result.current.attempt).not.toBeNull()
  expect(result.current.answers['question-one']).toBe('hello')
  await act(async () => {
    finish(practiceSubmission())
  })
  expect(result.current.attempt?.status).toBe('completed')
  expect(result.current.attempt?.questions).toHaveLength(1)
  expect(result.current.submissions['question-one'].pointsEarned).toBe(10)
})

it.each(['success', 'failure'])(
  'suppresses a late %s while Suspense hides the attempt and unlocks on reveal',
  async mode => {
    let settle!: () => void
    vi.mocked(practiceService.startAttempt)
      .mockImplementationOnce(
        () =>
          new Promise((resolve, reject) => {
            settle = () =>
              mode === 'success' ? resolve(practiceAttempt()) : reject(new Error('late'))
          })
      )
      .mockResolvedValue(practiceAttempt())
    const gate = new Promise<never>(() => {})
    let session!: ReturnType<typeof usePracticeAttempt>
    function Form({ hidden }: { hidden: boolean }) {
      session = usePracticeAttempt('set-one', 'learner')
      if (hidden) throw gate
      return <p>Practice</p>
    }
    const view = (hidden: boolean) => (
      <Suspense fallback={<p>Hidden</p>}>
        <Form hidden={hidden} />
      </Suspense>
    )
    const { rerender } = render(view(false))
    const cb = callbacks()
    act(() => {
      void session.start(cb.success, cb.error)
    })
    rerender(view(true))
    await act(async () => {
      settle()
    })
    expect(cb.success).not.toHaveBeenCalled()
    expect(cb.error).not.toHaveBeenCalled()
    rerender(view(false))
    expect(session.pending).toBe(false)
    await act(async () => {
      await session.start(cb.success, cb.error)
    })
    await waitFor(() => expect(session.attempt?.id).toBe('attempt-one'))
  }
)
