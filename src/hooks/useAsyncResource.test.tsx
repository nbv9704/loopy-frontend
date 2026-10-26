// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useAsyncResource } from './useAsyncResource'
import { StrictMode, type ReactNode } from 'react'

afterEach(cleanup)

it('aborts a disabled request and does not reuse it when the same scope is re-enabled', async () => {
  let resolve!: (value: string) => void
  let oldSignal!: AbortSignal
  const load = vi
    .fn()
    .mockImplementationOnce((signal: AbortSignal) => {
      oldSignal = signal
      return new Promise<string>(done => {
        resolve = done
      })
    })
    .mockResolvedValue('fresh')
  const { result, rerender } = renderHook(
    ({ enabled }) => useAsyncResource(enabled ? 'account' : null, load),
    { initialProps: { enabled: true } }
  )
  await waitFor(() => expect(load).toHaveBeenCalledTimes(1))
  rerender({ enabled: false })
  expect(oldSignal.aborted).toBe(true)
  expect(result.current.loading).toBe(false)
  rerender({ enabled: true })
  await waitFor(() => expect(result.current.data).toBe('fresh'))
  await act(async () => {
    resolve('stale')
  })
  expect(result.current.data).toBe('fresh')
})

it('aborts on unmount so an abandoned result cannot update its consumer', async () => {
  let signal!: AbortSignal
  const load = vi.fn((input: AbortSignal) => {
    signal = input
    return new Promise<string>(() => {})
  })
  const { unmount } = renderHook(() => useAsyncResource('account', load))
  await waitFor(() => expect(load).toHaveBeenCalledTimes(1))
  unmount()
  expect(signal.aborted).toBe(true)
})
it('starts one read when StrictMode replays the mount effect', async () => {
  const load = vi.fn().mockResolvedValue('ready')
  const { result } = renderHook(() => useAsyncResource('account', load), {
    wrapper: ({ children }: { children: ReactNode }) => <StrictMode>{children}</StrictMode>,
  })
  await waitFor(() => expect(result.current.data).toBe('ready'))
  expect(load).toHaveBeenCalledTimes(1)
})
it('does not start a read when its consumer immediately unmounts', async () => {
  const load = vi.fn().mockResolvedValue('abandoned')
  const { unmount } = renderHook(() => useAsyncResource('account', load))
  unmount()
  await Promise.resolve()
  expect(load).not.toHaveBeenCalled()
})
