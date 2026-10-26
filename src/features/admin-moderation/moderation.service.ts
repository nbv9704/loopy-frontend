import { z } from 'zod'
import apiClient from '../../services/admin/apiClient'
import { adminData, adminRead } from '../../services/admin/response'

const keywordSchema = z.object({
  id: z.guid(),
  keyword: z.string().min(1),
  category: z.string(),
  language: z.enum(['all', 'vi', 'en']),
  is_active: z.boolean(),
  created_at: z.string().nullable(),
})
export type Keyword = z.output<typeof keywordSchema>
export const keywordDraft = z.object({
  keyword: z.string().trim().min(1, 'Nhập từ khóa.').max(120, 'Từ khóa tối đa 120 ký tự.'),
  category: z.enum(['profanity', 'hate_speech', 'spam', 'general']),
  language: z.enum(['all', 'vi', 'en']),
})
export type KeywordDraft = z.input<typeof keywordDraft>
export const moderationService = {
  async list(signal: AbortSignal) {
    return adminData(
      z.array(keywordSchema),
      await adminRead(apiClient.get('/api/admin/moderation/keywords', { signal }))
    )
  },
  async create(draft: KeywordDraft) {
    const body = keywordDraft.parse(draft)
    const item = adminData(
      keywordSchema,
      await apiClient.post('/api/admin/moderation/keywords', body)
    )
    if (
      item.keyword !== body.keyword.toLowerCase() ||
      item.category !== body.category ||
      item.language !== body.language ||
      !item.is_active
    )
      throw new Error('Chưa xác nhận đúng từ khóa đã lưu. Hãy tải lại danh sách.')
    return item
  },
  async toggle(item: Keyword) {
    const saved = adminData(
      keywordSchema,
      await apiClient.put(`/api/admin/moderation/keywords/${item.id}`, {
        is_active: !item.is_active,
        expectedActive: item.is_active,
      })
    )
    if (saved.id !== item.id || saved.is_active !== !item.is_active)
      throw new Error('Chưa xác nhận được trạng thái mới. Hãy tải lại danh sách.')
    return saved
  },
  async remove(item: Keyword) {
    const saved = adminData(
      z.object({ id: z.guid() }),
      await apiClient.delete(`/api/admin/moderation/keywords/${item.id}`)
    )
    if (saved.id !== item.id)
      throw new Error('Chưa xác nhận được từ khóa đã xóa. Hãy tải lại danh sách.')
  },
}
