import { beforeEach, expect, it, vi } from 'vitest'
import apiClient from '../../services/admin/apiClient'
import { submissionsService } from './submissions.service'
vi.mock('../../services/admin/apiClient', () => ({ default: { get: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())
const page = (items: unknown[]) => ({ items, total: items.length, limit: 20, offset: 0 })
it('does not display a response for the old pass/fail filter', async () => {
  vi.mocked(apiClient.get).mockResolvedValue({
    data: {
      success: true,
      data: page([{ id: 'submission', lesson_id: 'lesson', code: 'code', is_correct: false }]),
    },
  })
  await expect(submissionsService.list('pass', 0, new AbortController().signal)).rejects.toThrow(
    'không khớp'
  )
})
it('preserves unknown outcomes and missing timing, including an actual 0ms sample', async () => {
  vi.mocked(apiClient.get).mockResolvedValue({
    data: {
      success: true,
      data: page([
        { id: 'unknown', lesson_id: 'lesson', code: null, is_correct: null, execution_time: null },
        { id: 'zero', lesson_id: 'lesson', code: '', is_correct: true, execution_time: 0 },
      ]),
    },
  })
  await expect(
    submissionsService.list('all', 0, new AbortController().signal)
  ).resolves.toMatchObject({
    items: [
      { execution_time: null, is_correct: null },
      { execution_time: 0, is_correct: true },
    ],
  })
})
it('a malformed success envelope is not a confirmed empty result', async () => {
  vi.mocked(apiClient.get).mockResolvedValue({ data: { success: true, data: {} } })
  await expect(submissionsService.list('all', 0, new AbortController().signal)).rejects.toThrow(
    'chưa được xác nhận'
  )
})

it('requests the whole filtered collection by offset, 20 records per page', async () => {
  const signal = new AbortController().signal
  vi.mocked(apiClient.get).mockResolvedValue({
    data: { success: true, data: { items: [], total: 3, limit: 20, offset: 80 } },
  })
  await expect(submissionsService.list('all', 80, signal)).resolves.toMatchObject({
    total: 3,
    offset: 80,
  })
  expect(apiClient.get).toHaveBeenCalledWith('/api/admin/submissions', {
    params: { status: 'all', offset: 80, limit: 20 },
    signal,
  })
})

it.each([
  { items: [], total: 21, limit: 20, offset: 0 },
  { items: [], total: 0, limit: 20, offset: 20 },
])('rejects a truncated or foreign page instead of presenting it as empty', async data => {
  vi.mocked(apiClient.get).mockResolvedValue({ data: { success: true, data } })
  await expect(submissionsService.list('all', 0, new AbortController().signal)).rejects.toThrow(
    'không khớp'
  )
})
