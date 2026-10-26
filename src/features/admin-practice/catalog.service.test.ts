import { beforeEach, expect, it, vi } from 'vitest'
import apiClient from '../../services/admin/apiClient'
import { practiceCatalogService } from './catalog.service'
vi.mock('../../services/admin/apiClient', () => ({
  default: { get: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const row = {
  id: 'set',
  title: 'Set',
  status: 'draft' as const,
  visibility: 'public' as const,
  difficulty: 'easy' as const,
  questionCount: 0,
}
const filters = {
  status: 'active' as const,
  visibility: 'all' as const,
  difficulty: 'all' as const,
}
const response = (items: unknown[], total: number, offset: number) => ({
  data: { success: true, data: { items, total, offset, limit: 50 } },
})
beforeEach(() => vi.resetAllMocks())
it('loads beyond a lower API row cap using actual row counts before exposing a searchable catalog', async () => {
  vi.mocked(apiClient.get)
    .mockResolvedValueOnce(response([row], 2, 0))
    .mockResolvedValueOnce(response([{ ...row, id: 'set2' }], 2, 1))
  const signal = new AbortController().signal
  await expect(practiceCatalogService.list(filters, signal)).resolves.toHaveLength(2)
  expect(apiClient.get).toHaveBeenLastCalledWith('/api/admin/practice/sets', {
    params: {
      status: 'active',
      visibility: undefined,
      difficulty: undefined,
      limit: 50,
      offset: 1,
    },
    signal,
  })
})
it.each(['count', 'duplicate', 'empty', 'filter'])(
  'does not expose a partial catalog after %s corruption',
  async variant => {
    vi.mocked(apiClient.get)
      .mockResolvedValueOnce(response([row], 2, 0))
      .mockResolvedValueOnce(
        response(
          variant === 'empty'
            ? []
            : [
                {
                  ...row,
                  id: variant === 'duplicate' ? 'set' : 'set2',
                  status: variant === 'filter' ? 'archived' : 'draft',
                },
              ],
          variant === 'count' ? 3 : 2,
          1
        )
      )
    await expect(
      practiceCatalogService.list(filters, new AbortController().signal)
    ).rejects.toThrow()
  }
)
it('quick status writes send the displayed state and require the acknowledged new state', async () => {
  vi.mocked(apiClient.put).mockResolvedValue({
    data: { success: true, data: { id: 'set', status: 'draft' } },
  })
  await expect(practiceCatalogService.status(row, 'published')).rejects.toThrow('Chưa xác nhận')
  expect(apiClient.put).toHaveBeenCalledWith('/api/admin/practice/sets/set/status', {
    status: 'published',
    expectedStatus: 'draft',
  })
})
it('archive requires an exact row acknowledgement, not an HTTP success alone', async () => {
  vi.mocked(apiClient.delete).mockResolvedValue({ data: { success: true } })
  await expect(practiceCatalogService.archive(row)).rejects.toThrow('chưa được xác nhận')
  expect(apiClient.delete).toHaveBeenCalledWith('/api/admin/practice/sets/set', {
    params: { expectedStatus: 'draft' },
  })
})
