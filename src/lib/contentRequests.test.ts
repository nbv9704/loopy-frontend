// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { api } from './api'
import { clearContentCache, getContentCacheRevision } from './contentCache'
import { loadContentKeys, readContentKeys, retainPreparedContent } from './contentRequests'

vi.mock('./api', () => ({ api: { request: vi.fn() } }))
const load = (keys: string[], language = 'vi') =>
  loadContentKeys(keys, language, getContentCacheRevision())
beforeEach(() => {
  vi.resetAllMocks()
  clearContentCache()
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.useRealTimers()
})

it('coalesces overlapping consumers and caches both values and confirmed missing keys', async () => {
  vi.mocked(api.request).mockResolvedValue({
    success: true,
    data: { items: { title: 'CMS', empty: '' } },
  })
  const [one, two] = await Promise.all([load(['title', 'missing']), load(['title', 'empty'])])
  expect(one.items).toEqual({ title: 'CMS', missing: null })
  expect(two.items).toEqual({ title: 'CMS', empty: '' })
  expect(api.request).toHaveBeenCalledTimes(1)
  expect(JSON.parse(vi.mocked(api.request).mock.calls[0][1]?.body as string).keys.sort()).toEqual([
    'empty',
    'missing',
    'title',
  ])
  await load(['missing', 'title', 'empty'])
  expect(api.request).toHaveBeenCalledTimes(1)
})
it.each([500, 403, 404, 429])(
  'does not fan out or immediately retry after HTTP %i',
  async status => {
    vi.mocked(api.request).mockResolvedValue({
      success: false,
      error: { code: 'CMS_UNAVAILABLE', status, message: 'Unavailable' },
    })
    const keys = Array.from({ length: 60 }, (_, i) => `key${i}`)
    expect((await load(keys)).error).toBe('Unavailable')
    await load(['different page', ...keys])
    expect(api.request).toHaveBeenCalledTimes(1)
    expect(vi.mocked(api.request).mock.calls[0][0]).toBe('/api/content/batch')
  }
)
it('permits retry after a failure cooldown and an immediate explicit invalidation', async () => {
  let now = Date.now()
  vi.spyOn(Date, 'now').mockImplementation(() => now)
  vi.mocked(api.request)
    .mockResolvedValueOnce({ success: false, error: { code: 'DOWN', message: 'Down' } })
    .mockResolvedValue({ success: true, data: { items: { title: 'Recovered' } } })
  await load(['title'])
  await load(['title'])
  expect(api.request).toHaveBeenCalledTimes(1)
  now += 30001
  expect((await load(['title'])).items.title).toBe('Recovered')
  clearContentCache()
  await load(['title'])
  expect(api.request).toHaveBeenCalledTimes(3)
})
it('shares an already running batch without aborting it for a departing consumer', async () => {
  let finish!: (value: any) => void
  vi.mocked(api.request).mockImplementation(
    () =>
      new Promise(resolve => {
        finish = resolve
      })
  )
  const first = load(['title'])
  await Promise.resolve()
  const second = load(['title'])
  finish({ success: true, data: { items: { title: 'Shared' } } })
  expect((await first).items.title).toBe('Shared')
  expect((await second).items.title).toBe('Shared')
  expect(api.request).toHaveBeenCalledTimes(1)
})
it('never stores an ambiguous value even if an inconsistent server includes it', async () => {
  vi.mocked(api.request).mockResolvedValue({
    success: true,
    data: { items: { title: 'Do not choose', subtitle: 'Safe' }, ambiguousKeys: ['title'] },
  })
  const result = await load(['title', 'subtitle'])
  expect(result.items).toEqual({ title: null, subtitle: 'Safe' })
  expect(result.error).toContain('key trùng')
  await load(['title'])
  expect(api.request).toHaveBeenCalledTimes(1)
})

it.each(['nav.logout', 'NAV.LOGOUT VI', 'NAV.LOGOUT EN'])(
  'omits untranslated CMS text %s without another request or losing valid text',
  async value => {
    vi.mocked(api.request).mockResolvedValue({
      success: true,
      data: { items: { 'nav.logout': value, title: 'Published copy', blank: '' } },
    })
    const result = await load(['nav.logout', 'title', 'blank'])
    expect(result.items).toEqual({ 'nav.logout': null, title: 'Published copy', blank: '' })
    expect(result.error).toContain('nội dung mẫu')
    await load(['nav.logout', 'title'])
    expect(api.request).toHaveBeenCalledTimes(1)
  }
)
it('expires missing keys too, so newly published CMS text can appear', async () => {
  let now = Date.now()
  vi.spyOn(Date, 'now').mockImplementation(() => now)
  vi.mocked(api.request)
    .mockResolvedValueOnce({ success: true, data: { items: {} } })
    .mockResolvedValue({ success: true, data: { items: { title: 'Published' } } })
  expect((await load(['title'])).items.title).toBeNull()
  now += 300001
  expect((await load(['title'])).items.title).toBe('Published')
  expect(api.request).toHaveBeenCalledTimes(2)
})
it('keeps a prepared locale ready beyond page TTL and refreshes after a CMS revision', async () => {
  let now = Date.now()
  vi.spyOn(Date, 'now').mockImplementation(() => now)
  vi.mocked(api.request).mockResolvedValue({
    success: true,
    data: { items: { title: 'Prepared' } },
  })
  await load(['title', 'missing'])
  retainPreparedContent(['title', 'missing'], 'vi', getContentCacheRevision())
  now += 6 * 60 * 1000
  expect(readContentKeys(['title', 'missing'], 'vi', getContentCacheRevision())?.items.title).toBe(
    'Prepared'
  )
  await load(['title', 'missing'])
  expect(api.request).toHaveBeenCalledTimes(1)
  clearContentCache()
  expect(readContentKeys(['title'], 'vi', getContentCacheRevision())).toBeNull()
  await load(['title'])
  expect(api.request).toHaveBeenCalledTimes(2)
})
it('splits large pages at the API limit without repeating keys', async () => {
  vi.mocked(api.request).mockResolvedValue({ success: true, data: { items: {} } })
  const keys = Array.from({ length: 450 }, (_, i) => `key${i}`)
  await load(keys)
  const batches = vi
    .mocked(api.request)
    .mock.calls.map(([, options]) => JSON.parse(options?.body as string).keys)
  expect(batches.map(batch => batch.length)).toEqual([200, 200, 50])
  expect(batches.flat()).toEqual(keys)
})
it('does not confuse prototype properties with actual CMS values', async () => {
  vi.mocked(api.request).mockResolvedValue({ success: true, data: { items: {} } })
  expect((await load(['constructor', 'toString', '__proto__'])).items).toEqual({
    constructor: null,
    toString: null,
    ['__proto__']: null,
  })
})
it('bounds a stalled background request and uses the same cooldown afterward', async () => {
  vi.useFakeTimers()
  vi.mocked(api.request).mockImplementation(
    (_url, options) =>
      new Promise(resolve => {
        options?.signal?.addEventListener('abort', () =>
          resolve({ success: false, error: { code: 'NETWORK_ERROR', message: 'Aborted' } })
        )
      })
  )
  const pending = load(['title'])
  await vi.advanceTimersByTimeAsync(15000)
  expect((await pending).items.title).toBeNull()
  await load(['title', 'new key'])
  expect(api.request).toHaveBeenCalledTimes(1)
})
