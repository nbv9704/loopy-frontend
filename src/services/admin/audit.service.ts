import { z } from 'zod'
import apiClient from './apiClient'
import { adminData, adminRead } from './response'

const logSchema = z.object({
  id: z.string(),
  admin_id: z.string(),
  action: z.string(),
  resource_type: z.string(),
  resource_id: z.string().nullish(),
  resource_name: z.string().nullish(),
  changes: z.record(z.string(), z.unknown()).nullish(),
  metadata: z.record(z.string(), z.unknown()).nullish(),
  ip_address: z.string().nullish(),
  user_agent: z.string().nullish(),
  created_at: z.string(),
})
const pageSchema = z.object({
  logs: z.array(logSchema),
  total: z.number().int().nonnegative(),
  limit: z.number().int().positive(),
  offset: z.number().int().nonnegative(),
})
export type AuditLog = z.output<typeof logSchema>
export type AuditLogsResponse = z.output<typeof pageSchema>
export const auditService = {
  async getLogs(
    options: { action?: string; resourceType?: string; limit?: number; offset?: number } = {},
    signal?: AbortSignal
  ): Promise<AuditLogsResponse> {
    const page = adminData(
      pageSchema,
      await adminRead(apiClient.get('/api/admin/audit-logs', { params: options, signal }))
    )
    const limit = options.limit ?? 50,
      offset = options.offset ?? 0
    if (
      page.limit !== limit ||
      page.offset !== offset ||
      page.logs.length !== Math.min(limit, Math.max(0, page.total - offset)) ||
      new Set(page.logs.map(row => row.id)).size !== page.logs.length
    )
      throw new Error('Nhật ký chưa đầy đủ. Vui lòng tải lại.')
    return page
  },
}
