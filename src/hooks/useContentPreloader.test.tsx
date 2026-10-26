// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useContentPreloader } from './useContentPreloader'
import { api } from '../lib/api'
import { clearContentCache, getContentCacheRevision } from '../lib/contentCache'
import { loadContentKeys } from '../lib/contentRequests'

const i18n = vi.hoisted(() => ({ language: 'vi', t: vi.fn() }))
vi.mock('react-i18next', () => ({ useTranslation: () => ({ i18n }) }))
vi.mock('../lib/api', () => ({ api: { request: vi.fn() } }))
beforeEach(() => {
  vi.resetAllMocks()
  clearContentCache()
})

afterEach(cleanup)

it('renders prepared page text synchronously without a second loading state or HTTP request', async () => {
  vi.mocked(api.request).mockResolvedValue({
    success: true,
    data: { items: { title: 'Already prepared' } },
  })
  await loadContentKeys(['title'], 'en', getContentCacheRevision())
  const { result } = renderHook(() => useContentPreloader(['title'], 'en'))
  expect(result.current.loading).toBe(false)
  expect(result.current.initialLoading).toBe(false)
  expect(result.current.content.title).toBe('Already prepared')
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(1))
})

it('reloads mounted public content after a confirmed CMS cache invalidation', async () => {
  vi.mocked(api.request)
    .mockResolvedValueOnce({ success: true, data: { items: { title: 'Before' } } })
    .mockResolvedValue({ success: true, data: { items: { title: 'After' } } })
  const { result } = renderHook(() => useContentPreloader(['title'], 'vi'))
  await waitFor(() => expect(result.current.content.title).toBe('Before'))
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(1))
  act(clearContentCache)
  await waitFor(() => expect(result.current.content.title).toBe('After'))
})

it('ignores a pre-invalidation response that arrives after the fresh CMS value', async () => {
  let finish!: (response: Awaited<ReturnType<typeof api.request>>) => void
  vi.mocked(api.request)
    .mockReturnValueOnce(
      new Promise(resolve => {
        finish = resolve
      })
    )
    .mockResolvedValue({ success: true, data: { items: { title: 'Fresh' } } })
  const { result } = renderHook(() => useContentPreloader(['title'], 'vi'))
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(1))
  act(clearContentCache)
  await waitFor(() => expect(result.current.content.title).toBe('Fresh'))
  await act(async () => finish({ success: true, data: { items: { title: 'Stale' } } }))
  expect(result.current.content.title).toBe('Fresh')
})

it('ignores an older CMS response after the user changes language', async () => {
  let resolve!: (response: Awaited<ReturnType<typeof api.request>>) => void
  vi.mocked(api.request)
    .mockReturnValueOnce(
      new Promise(done => {
        resolve = done
      })
    )
    .mockResolvedValue({ success: true, data: { items: { title: 'English' }, missingKeys: [] } })
  const { result, rerender } = renderHook(
    ({ language }) => useContentPreloader(['title'], language),
    { initialProps: { language: 'vi' } }
  )
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(1))
  rerender({ language: 'en' })
  await waitFor(() => expect(result.current.content.title).toBe('English'))
  await act(async () => {
    resolve({ success: true, data: { items: { title: 'Tiếng Việt' }, missingKeys: [] } })
  })
  expect(result.current.content.title).toBe('English')
})

it('hides content from the previous key/language while the next request is pending', async () => {
  vi.mocked(api.request)
    .mockResolvedValueOnce({ success: true, data: { items: { title: 'Old' }, missingKeys: [] } })
    .mockImplementation(() => new Promise(() => {}))
  const { result, rerender } = renderHook(
    ({ language }) => useContentPreloader(['title'], language),
    { initialProps: { language: 'vi' } }
  )
  await waitFor(() => expect(result.current.content.title).toBe('Old'))
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(1))
  rerender({ language: 'en' })
  expect(result.current.loading).toBe(true)
  expect(result.current.content).toEqual({})
})

it('resolves missing CMS text using the language of the request', async () => {
  vi.mocked(api.request).mockResolvedValue({
    success: true,
    data: { items: {}, missingKeys: ['title'] },
  })
  i18n.t.mockReturnValue('Fallback')
  const { result } = renderHook(() => useContentPreloader(['title'], 'en'))
  await waitFor(() => expect(result.current.loading).toBe(false))
  expect(i18n.t).toHaveBeenCalledWith('title', { lng: 'en', defaultValue: null })
})

it('uses translated fallback when CMS contains an old seed marker', async () => {
  vi.mocked(api.request).mockResolvedValue({
    success: true,
    data: { items: { 'nav.logout': 'NAV.LOGOUT VI' } },
  })
  i18n.t.mockReturnValue('Đăng xuất')
  const { result } = renderHook(() => useContentPreloader(['nav.logout'], 'vi'))
  await waitFor(() => expect(result.current.content['nav.logout']).toBe('Đăng xuất'))
  expect(result.current.error).toContain('nội dung mẫu')
})

it.each(['title', 'TITLE VI'])(
  'leaves an untranslated bundled fallback %s to the consumer instead of displaying it',
  async value => {
    vi.mocked(api.request).mockResolvedValue({ success: true, data: { items: {} } })
    i18n.t.mockReturnValue(value)
    const { result } = renderHook(() => useContentPreloader(['title'], 'vi'))
    await waitFor(() => expect(result.current.loading).toBe(false))
    expect(result.current.content.title).toBeNull()
  }
)
it('does not reload when callers only reorder or repeat the same keys', async () => {
  vi.mocked(api.request).mockResolvedValue({ success: true, data: { items: { title: 'Title' } } })
  const { result, rerender } = renderHook(({ keys }) => useContentPreloader(keys, 'vi'), {
    initialProps: { keys: ['title', 'subtitle'] },
  })
  await waitFor(() => expect(result.current.loading).toBe(false))
  rerender({ keys: ['subtitle', 'title', 'title'] })
  expect(result.current.loading).toBe(false)
  expect(api.request).toHaveBeenCalledTimes(1)
})
it('lets a remaining consumer finish a shared request when the first one unmounts', async () => {
  let finish!: (value: any) => void
  vi.mocked(api.request).mockImplementation(
    () =>
      new Promise(resolve => {
        finish = resolve
      })
  )
  const first = renderHook(() => useContentPreloader(['title'], 'vi'))
  const second = renderHook(() => useContentPreloader(['title'], 'vi'))
  await waitFor(() => expect(api.request).toHaveBeenCalledTimes(1))
  first.unmount()
  expect(vi.mocked(api.request).mock.calls[0][1]?.signal?.aborted).toBe(false)
  await act(async () => finish({ success: true, data: { items: { title: 'Shared' } } }))
  await waitFor(() => expect(second.result.current.content.title).toBe('Shared'))
})
it('exposes the batch error with fallback text and permits an explicit retry', async () => {
  i18n.t.mockReturnValue('Fallback')
  vi.mocked(api.request)
    .mockResolvedValueOnce({ success: false, error: { code: 'DOWN', message: 'CMS unavailable' } })
    .mockResolvedValue({ success: true, data: { items: { title: 'Recovered' } } })
  const { result } = renderHook(() => useContentPreloader(['title'], 'vi'))
  await waitFor(() => expect(result.current.content.title).toBe('Fallback'))
  expect(result.current.error).toBe('CMS unavailable')
  act(result.current.refetch)
  await waitFor(() => expect(result.current.content.title).toBe('Recovered'))
  expect(result.current.error).toBeNull()
  expect(api.request).toHaveBeenCalledTimes(2)
})

it('exposes initial loading separately so later language/CMS refreshes do not remove editor state', async () => {
  vi.mocked(api.request)
    .mockResolvedValueOnce({ success: true, data: { items: { title: 'Original' } } })
    .mockImplementation(() => new Promise(() => {}))
  const { result, rerender } = renderHook(
    ({ language }) => useContentPreloader(['title'], language),
    { initialProps: { language: 'vi' } }
  )
  expect(result.current.initialLoading).toBe(true)
  await waitFor(() => expect(result.current.content.title).toBe('Original'))
  rerender({ language: 'en' })
  expect(result.current.loading).toBe(true)
  expect(result.current.initialLoading).toBe(false)
  expect(result.current.content).toEqual({})
})
