import { beforeEach, expect, it, vi } from 'vitest'
import apiClient from './apiClient'
import { auditService } from './audit.service'
import { dashboardService } from './dashboard.service'
vi.mock('./apiClient', () => ({ default: { get: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())
it('rejects a truncated audit page and a response for a different offset', async () => {
  for (const page of [
    { logs: [], total: 10, limit: 50, offset: 0 },
    { logs: [], total: 0, limit: 50, offset: 50 },
  ]) {
    vi.mocked(apiClient.get).mockResolvedValue({ data: { success: true, data: page } })
    await expect(auditService.getLogs()).rejects.toThrow('chưa đầy đủ')
  }
})
it('allows a confirmed empty audit page, retaining the signal and filters', async () => {
  const signal = new AbortController().signal
  vi.mocked(apiClient.get).mockResolvedValue({
    data: { success: true, data: { logs: [], total: 0, limit: 50, offset: 0 } },
  })
  await expect(
    auditService.getLogs({ resourceType: 'content_item' }, signal)
  ).resolves.toMatchObject({ total: 0 })
  expect(apiClient.get).toHaveBeenCalledWith('/api/admin/audit-logs', {
    params: { resourceType: 'content_item' },
    signal,
  })
})
it('does not render a partial dashboard as zero metrics', async () => {
  vi.mocked(apiClient.get).mockResolvedValue({ data: { success: true, data: { totalUsers: 0 } } })
  await expect(dashboardService.getStats()).rejects.toThrow('chưa được xác nhận')
})
it('surfaces the server read error instead of replacing it with an empty collection', async () => {
  vi.mocked(apiClient.get).mockRejectedValue({
    response: { data: { error: { message: 'Database unavailable' } } },
  })
  await expect(auditService.getLogs()).rejects.toThrow('Database unavailable')
})
