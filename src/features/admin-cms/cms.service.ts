import { z } from 'zod'
import { ADMIN_PAGE_SIZE } from '../../lib/adminPagination'
import apiClient from '../../services/admin/apiClient'
import { getAdminErrorMessage } from '../../services/admin/errors'
import { clearContentCache } from '../../lib/contentCache'
import {
  cmsExportSchema,
  cmsLanguage,
  cmsTransferSchema,
  cmsType,
  createCmsItem,
  flattenCmsTransfer,
  updateCmsItem,
} from './cmsContract'

export const itemSchema = z.object({
  id: z.guid(),
  categoryId: z.guid(),
  key: z.string(),
  language: cmsLanguage,
  value: z.string(),
  description: z.string().nullish(),
  type: cmsType,
  revision: z.number().int().nonnegative(),
  createdAt: z
    .string()
    .refine(value => Number.isFinite(Date.parse(value)))
    .nullable(),
  updatedAt: z
    .string()
    .refine(value => Number.isFinite(Date.parse(value)))
    .nullable(),
})
const categorySchema = z.object({
  id: z.guid(),
  name: z.string(),
  description: z.string().nullish(),
  displayOrder: z.number().int(),
})
const pageSchema = z.object({
  items: z.array(itemSchema.extend({ revision: itemSchema.shape.revision.nullable() })),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
  readOnly: z.boolean().optional().default(false),
})
export type CmsItem = z.output<typeof itemSchema>
export type CmsListItem = z.output<typeof pageSchema>['items'][number]
export function isWritableCmsItem(item: CmsListItem): item is CmsItem {
  return item.revision !== null
}
export type CmsCategory = z.output<typeof categorySchema>
export type CmsDraft = z.input<typeof createCmsItem>
export type CmsUpdate = z.input<typeof updateCmsItem>
export interface CmsQuery {
  category: string
  language: 'vi' | 'en'
  search: string
  offset: number
}

const confirmed = <T extends z.ZodTypeAny>(
  schema: T,
  response: { data?: { success?: boolean; data?: unknown } }
): z.output<T> => {
  const parsed = schema.safeParse(response.data?.data)
  if (response.data?.success !== true || !parsed.success)
    throw new Error('CMS trả dữ liệu chưa được xác nhận. Vui lòng tải lại để kiểm tra.')
  return parsed.data
}
function checkFields(item: CmsItem, fields: Partial<CmsItem>) {
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined && item[key as keyof CmsItem] !== value)
      throw new Error(
        'CMS chưa xác nhận đúng nội dung vừa lưu. Tải lại để kiểm tra trước khi gửi lại.'
      )
  }
  clearContentCache()
  return item
}

const read = <T>(request: Promise<T>) =>
  request.catch(cause => {
    throw new Error(getAdminErrorMessage(cause, 'Không tải được CMS.'))
  })

export const cmsService = {
  async categories(signal: AbortSignal): Promise<CmsCategory[]> {
    return confirmed(
      z.array(categorySchema),
      await read(apiClient.get('/api/admin/content/categories', { signal }))
    )
  },
  async list(query: CmsQuery, signal: AbortSignal) {
    const page = confirmed(
      pageSchema,
      await read(
        apiClient.get('/api/admin/content', {
          params: {
            ...query,
            category: query.category || undefined,
            search: query.search || undefined,
            limit: ADMIN_PAGE_SIZE,
          },
          signal,
        })
      )
    )
    if (
      page.limit !== ADMIN_PAGE_SIZE ||
      page.offset !== query.offset ||
      page.items.length > ADMIN_PAGE_SIZE ||
      page.items.length > page.total ||
      page.items.some(
        item =>
          (!!query.category && item.categoryId !== query.category) ||
          item.language !== query.language
      )
    )
      throw new Error('CMS trả sai bộ lọc hoặc trang dữ liệu. Vui lòng tải lại.')
    return { ...page, readOnly: page.readOnly || page.items.some(item => !isWritableCmsItem(item)) }
  },
  async get(id: string, signal: AbortSignal) {
    const item = confirmed(
      itemSchema,
      await read(apiClient.get(`/api/admin/content/${id}`, { signal }))
    )
    if (item.id !== id) throw new Error('CMS trả sai item. Vui lòng tải lại.')
    return item
  },
  async create(input: CmsDraft) {
    const data = createCmsItem.parse(input)
    return checkFields(
      confirmed(itemSchema, await apiClient.post('/api/admin/content', data)),
      data
    )
  },
  async update(item: CmsItem, input: Omit<CmsUpdate, 'expectedRevision'>) {
    const data = updateCmsItem.parse({ ...input, expectedRevision: item.revision })
    return checkFields(
      confirmed(itemSchema, await apiClient.put(`/api/admin/content/${item.id}`, data)),
      {
        id: item.id,
        value: data.value,
        description: data.description,
        type: data.type,
        revision: item.revision + 1,
      }
    )
  },
  async remove(item: CmsItem) {
    const data = confirmed(
      z.object({ id: z.literal(item.id), deleted: z.literal(true) }),
      await apiClient.delete(`/api/admin/content/${item.id}`, {
        params: { revision: item.revision },
      })
    )
    clearContentCache()
    return data
  },
  async export(language: 'vi' | 'en') {
    const response = await apiClient.get('/api/admin/content/export', { params: { language } })
    const parsed = cmsExportSchema.safeParse(response.data)
    if (!parsed.success || parsed.data.language !== language)
      throw new Error('File export CMS không hợp lệ hoặc chưa đầy đủ.')
    return new Blob([JSON.stringify(parsed.data, null, 2)], { type: 'application/json' })
  },
  async import(input: unknown) {
    const payload = cmsTransferSchema.parse(input)
    const count = flattenCmsTransfer(payload).length
    const result = confirmed(
      z.object({ imported: z.literal(count), errors: z.array(z.string()).length(0) }),
      await apiClient.post('/api/admin/content/import', payload)
    )
    clearContentCache()
    return result
  },
}
