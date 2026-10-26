// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useContent, useContentByKey } from './useContent'
import { api } from '../lib/api'
import { clearContentCache, getCachedContent, getCacheKey } from '../lib/contentCache'

const i18n = vi.hoisted(() => ({ language: 'vi', t: vi.fn() }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n }) }))
vi.mock('../lib/api', () => ({ api: { request: vi.fn() } }))
beforeEach(() => {
  vi.resetAllMocks()
  clearContentCache()
  i18n.t.mockImplementation((_key, options) => `${options.lng} fallback`)
})
afterEach(cleanup)
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
it('loads every public collection page before caching it', async () => {
  vi.mocked(api.request)
    .mockResolvedValueOnce({ success: true, data: { items: [row], total: 2 } })
    .mockResolvedValueOnce({
      success: true,
      data: { items: [{ ...row, id: 'two', key: 'subtitle' }], total: 2 },
    })
  const { result } = renderHook(() => useContent('header', 'vi'))
  await waitFor(() => expect(result.current.content).toHaveLength(2))
  expect(getCachedContent(getCacheKey('header', 'vi'))).toHaveLength(2)
  expect(String(vi.mocked(api.request).mock.calls[1][0])).toContain('offset=1')
})
it('never repopulates the cache with a collection response from before invalidation', async () => {
  let finish!: (response: Awaited<ReturnType<typeof api.request>>) => void
  vi.mocked(api.request)
    .mockReturnValueOnce(
      new Promise(resolve => {
        finish = resolve
      })
    )
    .mockResolvedValue({ success: true, data: { items: [{ ...row, value: 'Fresh' }], total: 1 } })
  const { result } = renderHook(() => useContent('header', 'vi'))
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(1))
  act(clearContentCache)
  await waitFor(() => expect(result.current.content[0]?.value).toBe('Fresh'))
  await act(async () =>
    finish({ success: true, data: { items: [{ ...row, value: 'Stale' }], total: 1 } })
  )
  expect(getCachedContent(getCacheKey('header', 'vi'))?.[0]?.value).toBe('Fresh')
})
it('uses the selected fallback language and ignores an old key response', async () => {
  let finish!: (response: Awaited<ReturnType<typeof api.request>>) => void
  vi.mocked(api.request)
    .mockReturnValueOnce(
      new Promise(resolve => {
        finish = resolve
      })
    )
    .mockResolvedValue({ success: false, error: { code: 'OFFLINE', message: 'Offline' } })
  const { result, rerender } = renderHook(({ language }) => useContentByKey('title', language), {
    initialProps: { language: 'vi' },
  })
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(1))
  rerender({ language: 'en' })
  await waitFor(() => expect(result.current.value).toBe('en fallback'))
  await act(async () =>
    finish({ success: true, data: { items: { title: 'Old Vietnamese value' } } })
  )
  expect(result.current.value).toBe('en fallback')
})
