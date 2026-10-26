import { z } from 'zod'
import apiClient from '../../services/admin/apiClient'
import { adminData, adminRead } from '../../services/admin/response'

const status = z.enum(['draft', 'published', 'archived'])
const visibility = z.enum(['public', 'private', 'unlisted', 'official'])
const itemSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  description: z.string().nullish(),
  topic: z.string().nullish(),
  languageId: z.string().nullish(),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  visibility,
  status,
  questionCount: z.number().int().nonnegative(),
})
const pageSchema = z.object({
  items: z.array(itemSchema).max(50),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
})
export type AdminPracticeSet = z.output<typeof itemSchema>
export interface PracticeFilters {
  status: 'active' | 'all' | AdminPracticeSet['status']
  visibility: 'all' | AdminPracticeSet['visibility']
  difficulty: 'all' | AdminPracticeSet['difficulty']
}
export const practiceCatalogService = {
  async list(filters: PracticeFilters, signal: AbortSignal): Promise<AdminPracticeSet[]> {
    const items: AdminPracticeSet[] = [],
      ids = new Set<string>()
    let total: number | null = null
    for (;;) {
      const page = adminData(
        pageSchema,
        await adminRead(
          apiClient.get('/api/admin/practice/sets', {
            params: {
              status: filters.status,
              visibility: filters.visibility === 'all' ? undefined : filters.visibility,
              difficulty: filters.difficulty === 'all' ? undefined : filters.difficulty,
              limit: 50,
              offset: items.length,
            },
            signal,
          })
        )
      )
      if (signal.aborted) throw new Error('Lượt tải đã hết hiệu lực.')
      if (
        page.offset !== items.length ||
        page.limit !== 50 ||
        (total !== null && page.total !== total)
      )
        throw new Error('Catalog Practice đã thay đổi trong lúc tải. Hãy tải lại.')
      total = page.total
      for (const item of page.items) {
        if (
          ids.has(item.id) ||
          (filters.status === 'active'
            ? item.status === 'archived'
            : filters.status !== 'all' && item.status !== filters.status) ||
          (filters.visibility !== 'all' && item.visibility !== filters.visibility) ||
          (filters.difficulty !== 'all' && item.difficulty !== filters.difficulty)
        )
          throw new Error('Catalog Practice không khớp bộ lọc. Hãy tải lại.')
        ids.add(item.id)
        items.push(item)
      }
      if (items.length === total) return items
      if (!page.items.length || items.length > total)
        throw new Error('Catalog Practice chưa đầy đủ. Hãy tải lại.')
    }
  },
  async stats(signal: AbortSignal) {
    const count = z.number().int().nonnegative()
    return adminData(
      z.object({
        totalSets: count,
        officialSets: count,
        publishedSets: count,
        draftSets: count,
        totalAttempts: count,
        totalSubmissions: count,
      }),
      await adminRead(apiClient.get('/api/admin/practice/stats', { signal }))
    )
  },
  async archive(item: AdminPracticeSet) {
    const saved = adminData(
      z.object({ id: z.string(), status: z.literal('archived') }),
      await apiClient.delete(`/api/admin/practice/sets/${item.id}`, {
        params: { expectedStatus: item.status },
      })
    )
    if (saved.id !== item.id)
      throw new Error('Chưa xác nhận đúng Practice set đã lưu trữ. Hãy tải lại.')
  },
  async status(item: AdminPracticeSet, next: AdminPracticeSet['status']) {
    const saved = adminData(
      z.object({ id: z.string(), status }),
      await apiClient.put(`/api/admin/practice/sets/${item.id}/status`, {
        status: next,
        expectedStatus: item.status,
      })
    )
    if (saved.id !== item.id || saved.status !== next)
      throw new Error('Chưa xác nhận đúng trạng thái. Hãy tải lại.')
  },
  async visibility(item: AdminPracticeSet, next: AdminPracticeSet['visibility']) {
    const saved = adminData(
      z.object({ id: z.string(), visibility }),
      await apiClient.put(`/api/admin/practice/sets/${item.id}/visibility`, {
        visibility: next,
        expectedVisibility: item.visibility,
      })
    )
    if (saved.id !== item.id || saved.visibility !== next)
      throw new Error('Chưa xác nhận đúng visibility. Hãy tải lại.')
  },
}
