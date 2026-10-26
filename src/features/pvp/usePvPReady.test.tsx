// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { usePvPReady } from './usePvPReady'

afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
it('sends once and waits for server confirmation before releasing the request', async () => {
  const send = vi.fn()
  const resync = vi.fn()
  const { result, rerender } = renderHook(
    ({ confirmed }) => usePvPReady({ scope: 'room', connected: true, confirmed, send, resync }),
    { initialProps: { confirmed: false } }
  )
  let pending!: Promise<void>
  act(() => {
    pending = result.current.request()
    void result.current.request()
  })
  expect(send).toHaveBeenCalledTimes(1)
  expect(result.current.pending).toBe(true)
  rerender({ confirmed: true })
  await act(async () => {
    await pending
  })
  expect(result.current.pending).toBe(false)
  expect(resync).not.toHaveBeenCalled()
})
it('times out into resync/retry without pretending the player is ready', async () => {
  vi.useFakeTimers()
  const resync = vi.fn()
  const { result } = renderHook(() =>
    usePvPReady({ scope: 'room', connected: true, confirmed: false, send: vi.fn(), resync })
  )
  act(() => {
    void result.current.request()
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000)
  })
  expect(resync).toHaveBeenCalledTimes(1)
  expect(result.current.pending).toBe(false)
  expect(result.current.error).toContain('Chưa nhận được xác nhận')
})
it('does not resync or update UI after the player leaves a pending request', async () => {
  vi.useFakeTimers()
  const resync = vi.fn()
  const { result, unmount } = renderHook(() =>
    usePvPReady({ scope: 'room', connected: true, confirmed: false, send: vi.fn(), resync })
  )
  act(() => {
    void result.current.request()
  })
  unmount()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(5000)
  })
  expect(resync).not.toHaveBeenCalled()
})
