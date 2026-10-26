import { beforeEach, expect, it, vi } from 'vitest'
import apiClient from '../../services/admin/apiClient'
import { lessonCatalogService } from './catalog.service'
import { contentService } from '../../services/admin/content.service'
vi.mock('../../services/admin/apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
}))
beforeEach(() => vi.resetAllMocks())
it('rejects lessons for the previous chapter or unknown test case counts', async () => {
  const row = {
    id: 'lesson',
    chapter_id: 'other',
    status: 'draft',
    order_index: 0,
    test_case_count: 2,
  }
  vi.mocked(apiClient.get).mockResolvedValue({ data: { success: true, data: [row] } })
  await expect(
    lessonCatalogService.lessons('selected', 'active', new AbortController().signal)
  ).rejects.toThrow('không khớp')
  vi.mocked(apiClient.get).mockResolvedValue({
    data: { success: true, data: [{ ...row, test_case_count: undefined }] },
  })
  await expect(
    lessonCatalogService.lessons('all', 'active', new AbortController().signal)
  ).rejects.toThrow('chưa được xác nhận')
})
it('does not accept a detail saved for another parent', async () => {
  vi.mocked(apiClient.post).mockResolvedValue({
    data: {
      success: true,
      data: { id: 'step', lesson_id: 'other', type: 'note', prompt: 'Question', order_index: 0 },
    },
  })
  await expect(
    contentService.upsertLessonStep('target', {
      id: 'step',
      type: 'note',
      prompt: 'Question',
      order_index: 0,
    })
  ).rejects.toThrow('thuộc lesson')
})
it('preserves false and 0 in a confirmed test case', async () => {
  vi.mocked(apiClient.post).mockResolvedValue({
    data: {
      success: true,
      data: {
        id: 'case',
        lesson_id: 'target',
        description: 'Output',
        input: [0],
        expected_output: false,
        order_index: 0,
      },
    },
  })
  await expect(
    contentService.upsertLessonTestCase('target', {
      description: 'Output',
      input: [0],
      expected_output: false,
      order_index: 0,
    })
  ).resolves.toMatchObject({ expected_output: false, order_index: 0 })
})
it('a child delete and lesson archive require the selected ID', async () => {
  vi.mocked(apiClient.delete).mockResolvedValue({
    data: { success: true, data: { id: 'other', archived: true } },
  })
  await expect(contentService.deleteLessonStep('step')).rejects.toThrow('đúng step')
  await expect(lessonCatalogService.archive('lesson')).rejects.toThrow('đúng lesson')
})
