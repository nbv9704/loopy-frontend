// @vitest-environment jsdom
import { Suspense } from 'react'
import { act, cleanup, render, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { practiceQuestion, practiceSet } from '../../test-utils/practice'
import { normalizePracticeWrite } from './practiceWrite'
import { usePracticeWrite } from './usePracticeWrite'
const id = '11111111-1111-4111-8111-111111111111'
const expected = normalizePracticeWrite({
  title: 'Practice one',
  difficulty: 'easy',
  status: 'published',
  visibility: 'public',
  questions: [{ type: 'fill_blank', prompt: 'Type hello', correctAnswer: 'hello', points: 10 }],
})
const saved = () =>
  practiceSet({ id, questions: [practiceQuestion({ setId: id, correctAnswer: 'hello' })] })
afterEach(cleanup)
it('locks a known commit into read-only recovery and never sends create again', async () => {
  const write = vi
    .fn()
    .mockRejectedValue({ code: 'PRACTICE_SAVED_READ_FAILED', details: { setId: id } })
  const confirmed = vi.fn(),
    error = vi.fn()
  const { result } = renderHook(() => usePracticeWrite('actor:new'))
  const capturedSave = result.current.save
  await act(async () => {
    await result.current.save(write, expected, undefined, confirmed, error)
  })
  expect(result.current.blocked).toBe(true)
  expect(result.current.recovery?.id).toBe(id)
  await act(async () => {
    await result.current.save(write, expected, undefined, confirmed, error)
  })
  expect(write).toHaveBeenCalledOnce()
  await act(async () => {
    await capturedSave(write, expected, undefined, confirmed, error)
  })
  expect(write).toHaveBeenCalledOnce()
  const read = vi.fn().mockResolvedValue(saved())
  await act(async () => {
    await result.current.recover(read, confirmed)
  })
  expect(read).toHaveBeenCalledWith(id)
  expect(confirmed).toHaveBeenCalledWith(id)
  expect(result.current.recovery).toBeNull()
})
it('keeps the draft blocked after a failed or stale recovery without rewriting', async () => {
  const write = vi
    .fn()
    .mockRejectedValue({ code: 'PRACTICE_SAVED_READ_FAILED', details: { setId: id } })
  const confirmed = vi.fn(),
    error = vi.fn()
  const { result } = renderHook(() => usePracticeWrite('actor:new'))
  await act(async () => {
    await result.current.save(write, expected, undefined, confirmed, error)
  })
  await act(async () => {
    await result.current.recover(async () => ({ ...saved(), title: 'old' }), confirmed)
  })
  expect(confirmed).not.toHaveBeenCalled()
  expect(result.current.recovery?.message).toContain('bản nháp')
  expect(write).toHaveBeenCalledOnce()
})
it('does not claim a malformed success with a recoverable ID is committed', async () => {
  const { result } = renderHook(() => usePracticeWrite('actor:new'))
  await act(async () => {
    await result.current.save(async () => ({ id }), expected, undefined, vi.fn(), vi.fn())
  })
  expect(result.current.recovery?.message).toContain('Chưa xác nhận')
  expect(result.current.recovery?.message).not.toContain('đã được lưu')
})
it('suppresses a late committed-read failure after switching scope', async () => {
  let reject!: (error: unknown) => void
  const { result, rerender } = renderHook(({ scope }) => usePracticeWrite(scope), {
    initialProps: { scope: 'alice' },
  })
  act(() => {
    void result.current.save(
      () =>
        new Promise((_resolve, failed) => {
          reject = failed
        }),
      expected,
      undefined,
      vi.fn(),
      vi.fn()
    )
  })
  rerender({ scope: 'bob' })
  await act(async () => {
    reject({ code: 'PRACTICE_SAVED_READ_FAILED', details: { setId: id } })
  })
  expect(result.current.recovery).toBeNull()
})
it('suppresses recovery navigation when Suspense hides the form', async () => {
  const gate = new Promise<never>(() => {})
  let session!: ReturnType<typeof usePracticeWrite>
  function Form({ hidden }: { hidden: boolean }) {
    session = usePracticeWrite('actor')
    if (hidden) throw gate
    return <p>Draft</p>
  }
  const view = (hidden: boolean) => (
    <Suspense fallback={<p>Hidden</p>}>
      <Form hidden={hidden} />
    </Suspense>
  )
  const { rerender } = render(view(false))
  await act(async () => {
    await session.save(
      async () => {
        throw { code: 'PRACTICE_SAVED_READ_FAILED', details: { setId: id } }
      },
      expected,
      undefined,
      vi.fn(),
      vi.fn()
    )
  })
  let resolve!: (value: unknown) => void
  const confirmed = vi.fn()
  act(() => {
    void session.recover(
      () =>
        new Promise(done => {
          resolve = done
        }),
      confirmed
    )
  })
  rerender(view(true))
  await act(async () => {
    resolve(saved())
  })
  expect(confirmed).not.toHaveBeenCalled()
  rerender(view(false))
  expect(session.recovery?.id).toBe(id)
  expect(session.pending).toBe(false)
})
