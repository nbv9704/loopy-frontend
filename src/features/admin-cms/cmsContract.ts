import { z } from 'zod'

export const cmsLanguage = z.enum(['vi', 'en'])
export const cmsType = z.enum(['text', 'markdown', 'html'])
export const cmsKey = z.string().trim().min(1).max(255)
const value = z
  .string()
  .min(1, 'Nội dung không được để trống')
  .max(5000)
  .refine(text => !!text.trim(), 'Nội dung không được chỉ có khoảng trắng.')
export const createCmsItem = z
  .object({
    categoryId: z.guid(),
    key: cmsKey,
    language: cmsLanguage,
    value,
    description: z.string().max(2000).optional(),
    type: cmsType.default('text'),
  })
  .strict()
export const updateCmsItem = z
  .object({
    value,
    description: z.string().max(2000).optional(),
    type: cmsType.optional(),
    expectedRevision: z.number().int().nonnegative(),
  })
  .strict()
const richValue = z
  .object({ value, type: cmsType, description: z.string().max(2000).nullable() })
  .strict()
const categoryName = z
  .string()
  .min(1)
  .max(100)
  .refine(name => name === name.trim(), 'Tên category không được có khoảng trắng ở hai đầu.')
const recordKey = z
  .string()
  .min(1)
  .max(255)
  .refine(key => key === key.trim(), 'Key không được có khoảng trắng ở hai đầu.')
const categories = <T extends z.ZodTypeAny>(item: T) =>
  z.record(categoryName, z.record(recordKey, item))
const transfer = z.discriminatedUnion('version', [
  z
    .object({
      version: z.literal('1.0'),
      language: cmsLanguage,
      exportedAt: z.string().optional(),
      categories: categories(value),
    })
    .strict(),
  z
    .object({
      version: z.literal('2.0'),
      language: cmsLanguage,
      exportedAt: z.string().optional(),
      categories: categories(richValue),
    })
    .strict(),
])
// z.record cannot represent __proto__; reject it explicitly rather than silently dropping content.
export const cmsExportSchema = z
  .unknown()
  .superRefine((input, ctx) => {
    if (!input || typeof input !== 'object') return
    const groups = (input as { categories?: unknown }).categories
    if (!groups || typeof groups !== 'object') return
    for (const [name, items] of Object.entries(groups)) {
      if (
        name === '__proto__' ||
        (items &&
          typeof items === 'object' &&
          Object.prototype.hasOwnProperty.call(items, '__proto__'))
      ) {
        ctx.addIssue({ code: 'custom', message: 'Tên __proto__ không được hỗ trợ trong file CMS.' })
      }
    }
  })
  .pipe(transfer)

export const cmsFileSchema = cmsExportSchema.superRefine((data, ctx) => {
  const groups = Object.entries(data.categories)
  const count = groups.reduce((n, [, items]) => n + Object.keys(items).length, 0)
  if (
    count > 5000 ||
    groups.length > 100 ||
    groups.some(([, items]) => Object.keys(items).length === 0)
  ) {
    ctx.addIssue({
      code: 'custom',
      message: 'File cần 1–5000 items trong tối đa100 categories không rỗng.',
    })
  }
})

export const cmsTransferSchema = cmsFileSchema
  .refine(
    data => Object.values(data.categories).some(items => Object.keys(items).length > 0),
    'File import phải có nội dung.'
  )
  .superRefine((data, ctx) => {
    const owners = new Map<string, string>()
    for (const [category, items] of Object.entries(data.categories)) {
      for (const key of Object.keys(items)) {
        const owner = owners.get(key)
        if (owner !== undefined)
          ctx.addIssue({
            code: 'custom',
            path: ['categories', category, key],
            message: `Key ${key} bị trùng giữa ${owner} và ${category}. Mỗi key/ngôn ngữ chỉ dùng một category.`,
          })
        else owners.set(key, category)
      }
    }
  })
export type CmsTransfer = z.output<typeof cmsTransferSchema>
export function flattenCmsTransfer(data: CmsTransfer): Array<{
  category: string
  key: string
  value: string
  type?: 'text' | 'markdown' | 'html'
  description?: string | null
}> {
  if (data.version === '1.0')
    return Object.entries(data.categories).flatMap(([category, items]) =>
      Object.entries(items).map(([key, value]) => ({ category, key, value }))
    )
  return Object.entries(data.categories).flatMap(([category, items]) =>
    Object.entries(items).map(([key, entry]) => ({ category, key, ...entry }))
  )
}
