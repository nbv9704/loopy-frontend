import apiClient from './apiClient'

import { z } from 'zod'
import {
  historyPageSchema,
  historyRecordSchema,
  importStatsSchema,
} from '../../features/admin-import/historyContract'

export type ImportHistoryRecord = z.output<typeof historyRecordSchema>
export type ImportHistoryResponse = z.output<typeof historyPageSchema>
export type ImportStats = z.output<typeof importStatsSchema>

export const importHistoryService = {
  /**
   * Get import history with optional filters
   */
  async getHistory(
    options?: {
      chapterId?: string
      status?: string
      limit?: number
      offset?: number
    },
    signal?: AbortSignal
  ): Promise<ImportHistoryResponse> {
    const response = await apiClient.get('/api/admin/import-history', { params: options, signal })
    const result = historyPageSchema.safeParse(response.data?.data)
    if (
      response.data?.success !== true ||
      !result.success ||
      result.data.limit !== (options?.limit ?? 50) ||
      result.data.offset !== (options?.offset ?? 0) ||
      (options?.status && result.data.imports.some(item => item.status !== options.status))
    ) {
      throw new Error('Không xác nhận được dữ liệu lịch sử import. Vui lòng tải lại.')
    }
    return result.data
  },

  /**
   * Get import statistics
   */
  async getStats(signal?: AbortSignal): Promise<ImportStats> {
    const response = await apiClient.get('/api/admin/import-history/stats', { signal })
    const result = importStatsSchema.safeParse(response.data?.data)
    if (response.data?.success !== true || !result.success)
      throw new Error('Không xác nhận được thống kê import. Vui lòng tải lại.')
    return result.data
  },
}
