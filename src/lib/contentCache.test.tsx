// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it } from 'vitest'
import {
  clearContentCache,
  getCachedContent,
  getCacheKey,
  getContentCacheRevision,
  setCachedContent,
} from './contentCache'
import { useContentCacheRevision } from '../hooks/useContentCacheRevision'

beforeEach(() => localStorage.clear())
afterEach(cleanup)
const key = getCacheKey(undefined, 'vi')
const row = {
  id: 'item',
  categoryId: 'header',
  key: 'title',
  language: 'vi' as const,
  value: 'Title',
  type: 'text' as const,
  createdAt: '2026-01-01',
  updatedAt: '2026-01-01',
}
it.each([
  { timestamp: Date.now(), data: {} },
  { timestamp: 'invalid', data: [row] },
  { timestamp: Date.now() + 60000, data: [row] },
  { timestamp: Date.now(), data: [null] },
])('ignores malformed cache %j', cached => {
  localStorage.setItem(key, JSON.stringify(cached))
  expect(getCachedContent(key)).toBeNull()
})
it('prevents an older request from repopulating the cache after an admin change', () => {
  const owner = getContentCacheRevision()
  setCachedContent(key, [row], owner)
  localStorage.setItem('other-user-preference', 'keep')
  clearContentCache()
  setCachedContent(key, [row], owner)
  expect(getCachedContent(key)).toBeNull()
  expect(localStorage.getItem('other-user-preference')).toBe('keep')
})
it('notifies mounted consumers locally and across tabs', () => {
  const { result } = renderHook(() => useContentCacheRevision())
  const initial = result.current
  act(clearContentCache)
  expect(result.current).toBeGreaterThan(initial)
  const local = result.current
  act(() =>
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'loopy_content_revision', newValue: 'changed elsewhere' })
    )
  )
  expect(result.current).toBeGreaterThan(local)
})
it('does not refetch for each cache fill/removal in another tab', () => {
  const { result } = renderHook(() => useContentCacheRevision())
  const initial = result.current
  act(() => {
    for (let index = 0; index < 20; index++)
      window.dispatchEvent(new StorageEvent('storage', { key: `loopy_content_cache_${index}` }))
  })
  expect(result.current).toBe(initial)
  act(() =>
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'loopy_content_revision', newValue: 'one edit' })
    )
  )
  expect(result.current).toBe(initial + 1)
})
it('records cross-tab invalidation even between mounted consumers', () => {
  const { unmount } = renderHook(() => useContentCacheRevision())
  unmount()
  const before = getContentCacheRevision()
  window.dispatchEvent(
    new StorageEvent('storage', { key: 'loopy_content_revision', newValue: 'saved elsewhere' })
  )
  expect(getContentCacheRevision()).toBe(before + 1)
})
