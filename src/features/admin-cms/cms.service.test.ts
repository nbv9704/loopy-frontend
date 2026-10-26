import { beforeEach, expect, it, vi } from 'vitest'
import apiClient from '../../services/admin/apiClient'
import { cmsService } from './cms.service'
import { clearContentCache } from '../../lib/contentCache'
import { cmsTransferSchema, flattenCmsTransfer } from './cmsContract'

vi.mock('../../services/admin/apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
vi.mock('../../lib/contentCache', () => ({ clearContentCache: vi.fn() }))
const row = {
  id: '11111111-1111-4111-8111-111111111111',
  categoryId: '22222222-2222-4222-8222-222222222222',
  key: 'title',
  language: 'vi' as const,
  value: 'Old',
  type: 'text' as const,
  revision: 7,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-01-02T00:00:00Z',
}
beforeEach(() => vi.resetAllMocks())

it('sends the revision and validates fields and next revision before invalidating caches', async () => {
  vi.mocked(apiClient.put).mockResolvedValueOnce({
    data: { success: true, data: { ...row, value: 'New', revision: 8 } },
  })
  await expect(cmsService.update(row, { value: 'New' })).resolves.toMatchObject({ revision: 8 })
  expect(apiClient.put).toHaveBeenCalledWith(`/api/admin/content/${row.id}`, {
    value: 'New',
    expectedRevision: 7,
  })
  expect(clearContentCache).toHaveBeenCalledTimes(1)
})
it.each([
  { ...row, revision: 8 },
  { ...row, value: 'New', revision: 7 },
  { ...row, value: 'New', revision: 8, id: row.categoryId },
])('rejects a mismatched saved acknowledgement', async saved => {
  vi.mocked(apiClient.put).mockResolvedValueOnce({ data: { success: true, data: saved } })
  await expect(cmsService.update(row, { value: 'New' })).rejects.toThrow('chưa xác nhận')
  expect(clearContentCache).not.toHaveBeenCalled()
})
it('requires a confirmed delete for the selected item and sends its revision', async () => {
  vi.mocked(apiClient.delete).mockResolvedValueOnce({
    data: { success: true, data: { deleted: true } },
  })
  await expect(cmsService.remove(row)).rejects.toThrow('chưa được xác nhận')
  expect(apiClient.delete).toHaveBeenCalledWith(`/api/admin/content/${row.id}`, {
    params: { revision: 7 },
  })
})
it('rejects a foreign list filter and forwards cancellation', async () => {
  const signal = new AbortController().signal
  vi.mocked(apiClient.get).mockResolvedValueOnce({
    data: {
      success: true,
      data: { items: [{ ...row, language: 'en' }], total: 1, limit: 20, offset: 0 },
    },
  })
  await expect(
    cmsService.list({ category: row.categoryId, language: 'vi', search: '', offset: 0 }, signal)
  ).rejects.toThrow('sai bộ lọc')
  expect(apiClient.get).toHaveBeenCalledWith(
    '/api/admin/content',
    expect.objectContaining({ signal })
  )
})
it('accepts a read-only legacy page without inventing a writable item version', async () => {
  vi.mocked(apiClient.get).mockResolvedValueOnce({
    data: {
      success: true,
      data: {
        items: [{ ...row, revision: null }],
        total: 1,
        limit: 20,
        offset: 0,
        readOnly: true,
      },
    },
  })
  const page = await cmsService.list(
    { category: row.categoryId, language: 'vi', search: '', offset: 0 },
    new AbortController().signal
  )
  expect(page.readOnly).toBe(true)
  expect(page.items[0].revision).toBeNull()
  expect(apiClient.put).not.toHaveBeenCalled()
})
it('omits the category filter for All and accepts rows from different categories', async () => {
  const signal = new AbortController().signal
  vi.mocked(apiClient.get).mockResolvedValueOnce({
    data: {
      success: true,
      data: {
        items: [row, { ...row, id: row.categoryId, categoryId: row.id }],
        total: 2,
        limit: 20,
        offset: 0,
      },
    },
  })
  const page = await cmsService.list(
    { category: '', language: 'vi', search: 'title', offset: 0 },
    signal
  )
  expect(page.items).toHaveLength(2)
  expect(apiClient.get).toHaveBeenCalledWith('/api/admin/content', {
    params: { category: undefined, language: 'vi', search: 'title', offset: 0, limit: 20 },
    signal,
  })
})
it('still rejects the wrong language when All categories are selected', async () => {
  vi.mocked(apiClient.get).mockResolvedValueOnce({
    data: {
      success: true,
      data: { items: [{ ...row, language: 'en' }], total: 1, limit: 20, offset: 0 },
    },
  })
  await expect(
    cmsService.list(
      { category: '', language: 'vi', search: '', offset: 0 },
      new AbortController().signal
    )
  ).rejects.toThrow('sai bộ lọc')
})
it('does not trust writable metadata when an item lacks a revision', async () => {
  vi.mocked(apiClient.get).mockResolvedValueOnce({
    data: {
      success: true,
      data: {
        items: [{ ...row, revision: null }],
        total: 1,
        limit: 20,
        offset: 0,
        readOnly: false,
      },
    },
  })
  expect(
    (
      await cmsService.list(
        { category: row.categoryId, language: 'vi', search: '', offset: 0 },
        new AbortController().signal
      )
    ).readOnly
  ).toBe(true)
})
it('accepts v1 and v2 without losing metadata and rejects invalid/unknown versions', () => {
  expect(
    flattenCmsTransfer(
      cmsTransferSchema.parse({
        version: '1.0',
        language: 'vi',
        categories: { header: { title: 'Title' } },
      })
    )
  ).toEqual([{ category: 'header', key: 'title', value: 'Title' }])
  const rich = {
    version: '2.0',
    language: 'en',
    categories: { header: { title: { value: '# Title', type: 'markdown', description: null } } },
  }
  expect(cmsTransferSchema.parse(rich)).toEqual(rich)
  expect(cmsTransferSchema.safeParse({ ...rich, version: 'future' }).success).toBe(false)
})
it('does not report success for a partial CMS import acknowledgement or retry it automatically', async () => {
  vi.mocked(apiClient.post).mockResolvedValueOnce({
    data: { success: true, data: { imported: 0, errors: ['partial'] } },
  })
  await expect(
    cmsService.import({
      version: '1.0',
      language: 'vi',
      categories: { header: { title: 'Title' } },
    })
  ).rejects.toThrow('chưa được xác nhận')
  expect(apiClient.post).toHaveBeenCalledTimes(1)
  expect(clearContentCache).not.toHaveBeenCalled()
})
it.each(['1.0', '2.0'])('does not send a duplicate key import in version %s', async version => {
  const value = version === '1.0' ? 'Logout' : { value: 'Logout', type: 'text', description: null }
  await expect(
    cmsService.import({
      version,
      language: 'vi',
      categories: {
        nav: { 'nav.logout': value },
        common: { 'nav.logout': value },
      },
    })
  ).rejects.toThrow('bị trùng')
  expect(apiClient.post).not.toHaveBeenCalled()
  expect(clearContentCache).not.toHaveBeenCalled()
})
