// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useDebouncedValue } from './useDebouncedValue'

beforeEach(() => vi.useFakeTimers())
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})
it('settles once after a burst of input changes', () => {
  const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value), {
    initialProps: { value: '' },
  })
  rerender({ value: 'h' })
  act(() => vi.advanceTimersByTime(200))
  rerender({ value: 'hero' })
  act(() => vi.advanceTimersByTime(299))
  expect(result.current).toBe('')
  act(() => vi.advanceTimersByTime(1))
  expect(result.current).toBe('hero')
})
it('cleans up the pending timer on unmount', () => {
  const { rerender, unmount } = renderHook(({ value }) => useDebouncedValue(value), {
    initialProps: { value: '' },
  })
  rerender({ value: 'pending' })
  unmount()
  expect(vi.getTimerCount()).toBe(0)
})
it('uses a changed delay without applying the earlier timer', () => {
  const { result, rerender } = renderHook(({ value, delay }) => useDebouncedValue(value, delay), {
    initialProps: { value: '', delay: 300 },
  })
  rerender({ value: 'new', delay: 100 })
  act(() => vi.advanceTimersByTime(100))
  expect(result.current).toBe('new')
})
