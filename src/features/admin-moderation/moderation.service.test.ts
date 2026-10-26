import { beforeEach, expect, it, vi } from 'vitest'
import apiClient from '../../services/admin/apiClient'
import { moderationService } from './moderation.service'

vi.mock('../../services/admin/apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))
const row = {
  id: '11111111-1111-4111-8111-111111111111',
  keyword: 'blocked',
  category: 'general',
  language: 'all' as const,
  is_active: true,
  created_at: null,
}
beforeEach(() => vi.resetAllMocks())
it('does not interpret an HTTP 200 failure envelope as a successful create', async () => {
  vi.mocked(apiClient.post).mockResolvedValue({ data: { success: false, data: row } })
  await expect(
    moderationService.create({ keyword: 'blocked', category: 'general', language: 'all' })
  ).rejects.toThrow('chưa được xác nhận')
})
it('requires the created row to match the normalized draft', async () => {
  vi.mocked(apiClient.post).mockResolvedValue({
    data: { success: true, data: { ...row, language: 'vi' } },
  })
  await expect(
    moderationService.create({ keyword: ' Blocked ', category: 'general', language: 'all' })
  ).rejects.toThrow('đúng từ khóa')
})
it('sends expectedActive and requires the exact new state', async () => {
  vi.mocked(apiClient.put).mockResolvedValue({
    data: { success: true, data: { ...row, is_active: false } },
  })
  await expect(moderationService.toggle(row)).resolves.toMatchObject({ is_active: false })
  expect(apiClient.put).toHaveBeenCalledWith(`/api/admin/moderation/keywords/${row.id}`, {
    is_active: false,
    expectedActive: true,
  })
  vi.mocked(apiClient.put).mockResolvedValue({ data: { success: true, data: row } })
  await expect(moderationService.toggle(row)).rejects.toThrow('trạng thái mới')
})
it('requires a delete acknowledgement for the selected row', async () => {
  vi.mocked(apiClient.delete).mockResolvedValue({ data: { success: true } })
  await expect(moderationService.remove(row)).rejects.toThrow('chưa được xác nhận')
})
it('forwards cancellation and rejects malformed list responses', async () => {
  const signal = new AbortController().signal
  vi.mocked(apiClient.get).mockResolvedValue({ data: { success: true, data: {} } })
  await expect(moderationService.list(signal)).rejects.toThrow('chưa được xác nhận')
  expect(apiClient.get).toHaveBeenCalledWith('/api/admin/moderation/keywords', { signal })
})
