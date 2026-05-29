import axios from 'axios'

const API_URL = import.meta.env.PROD && !import.meta.env.VITE_API_URL 
  ? (() => { throw new Error('VITE_API_URL is missing in production environment') })() 
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000')

export interface ImportHistoryRecord {
  id: string
  admin_id: string
  chapter_id: string
  file_name: string
  file_size?: number
  lessons_count: number
  test_cases_count: number
  errors_count: number
  status: 'success' | 'partial' | 'failed'
  error_message?: string
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
  chapters?: {
    id: string
    title: string
    language_id: string
  }
}

export interface ImportHistoryResponse {
  imports: ImportHistoryRecord[]
  total: number
  limit: number
  offset: number
}

export interface ImportStats {
  totalImports: number
  successfulImports: number
  failedImports: number
  totalLessonsImported: number
  totalTestCasesImported: number
}

export const importHistoryService = {
  /**
   * Get import history with optional filters
   */
  async getHistory(options?: {
    chapterId?: string
    status?: string
    limit?: number
    offset?: number
  }): Promise<ImportHistoryResponse> {
    const params = new URLSearchParams()
    if (options?.chapterId) params.append('chapterId', options.chapterId)
    if (options?.status) params.append('status', options.status)
    if (options?.limit) params.append('limit', String(options.limit))
    if (options?.offset) params.append('offset', String(options.offset))

    const response = await axios.get(`${API_URL}/api/admin/import-history?${params.toString()}`, {
      withCredentials: true,
    })
    return response.data.data
  },

  /**
   * Get import statistics
   */
  async getStats(): Promise<ImportStats> {
    const response = await axios.get(`${API_URL}/api/admin/import-history/stats`, {
      withCredentials: true,
    })
    return response.data.data
  },
}
