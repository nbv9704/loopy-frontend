import { beforeEach, expect, it, vi } from 'vitest'
import apiClient from '../../services/admin/apiClient'
import { bulkImportService } from './import.service'
import { importHistoryService } from '../../services/admin/import-history.service'

vi.mock('../../services/admin/apiClient', () => ({ default: { post: vi.fn(), get: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())
const payload = {
  chapterId: '11111111-1111-4111-8111-111111111111',
  lessons: [{ lessonId: 'intro', title: 'Intro', lessonType: 'concept', orderIndex: 0 }],
}
const result = {
  lessonsCreated: 1,
  testCasesCreated: 0,
  testCasesReplaced: 0,
  stepsCreated: 0,
  stepsReplaced: 0,
  errors: [],
}

it('normalizes before sending and accepts only a successful matching acknowledgement', async () => {
  vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: true, data: result } })
  await expect(bulkImportService.bulkImport(payload)).resolves.toEqual(result)
  expect(apiClient.post).toHaveBeenCalledWith(
    '/api/admin/import',
    expect.objectContaining({
      chapter_id: payload.chapterId,
      lessons: [expect.objectContaining({ lesson_type: 'concept', order_index: 0 })],
    })
  )
  vi.mocked(apiClient.post).mockResolvedValueOnce({ data: { success: false, data: result } })
  await expect(bulkImportService.bulkImport(payload)).rejects.toThrow('Chưa xác nhận')
})
it('rejects malformed input without any request', async () => {
  await expect(bulkImportService.bulkImport({ lessons: [] })).rejects.toThrow()
  expect(apiClient.post).not.toHaveBeenCalled()
})
it('does not automatically retry an uncertain write', async () => {
  vi.mocked(apiClient.post).mockRejectedValueOnce(new Error('Connection lost'))
  await expect(bulkImportService.bulkImport(payload)).rejects.toThrow('Connection lost')
  expect(apiClient.post).toHaveBeenCalledTimes(1)
})
it('uses the admin client and abort signal for history reads and rejects a foreign filter/page', async () => {
  const controller = new AbortController()
  vi.mocked(apiClient.get).mockResolvedValueOnce({
    data: { success: true, data: { imports: [], total: 0, limit: 50, offset: 0 } },
  })
  await expect(
    importHistoryService.getHistory({ status: 'failed', limit: 50, offset: 0 }, controller.signal)
  ).resolves.toMatchObject({ total: 0 })
  expect(apiClient.get).toHaveBeenCalledWith('/api/admin/import-history', {
    params: { status: 'failed', limit: 50, offset: 0 },
    signal: controller.signal,
  })
  vi.mocked(apiClient.get).mockResolvedValueOnce({
    data: { success: true, data: { imports: [], total: 0, limit: 50, offset: 50 } },
  })
  await expect(importHistoryService.getHistory()).rejects.toThrow('Không xác nhận')
})
it('rejects absent or inconsistent statistics instead of rendering invented zeros', async () => {
  vi.mocked(apiClient.get).mockResolvedValueOnce({ data: { success: true, data: {} } })
  await expect(importHistoryService.getStats()).rejects.toThrow('Không xác nhận')
  vi.mocked(apiClient.get).mockResolvedValueOnce({
    data: {
      success: true,
      data: {
        totalImports: 10,
        successfulImports: 1,
        failedImports: 0,
        totalLessonsImported: 2,
        totalTestCasesImported: 3,
      },
    },
  })
  await expect(importHistoryService.getStats()).rejects.toThrow('Không xác nhận')
})
