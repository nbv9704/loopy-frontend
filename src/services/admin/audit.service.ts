import axios from 'axios'

const API_URL = import.meta.env.PROD && !import.meta.env.VITE_API_URL 
  ? (() => { throw new Error('VITE_API_URL is missing in production environment') })() 
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000')

export interface AuditLog {
  id: string
  admin_id: string
  action: 'create' | 'update' | 'delete' | 'import' | 'publish' | 'archive'
  resource_type: 'lesson' | 'chapter' | 'test_case' | 'import'
  resource_id?: string
  resource_name?: string
  changes?: Record<string, any>
  metadata?: Record<string, any>
  ip_address?: string
  user_agent?: string
  created_at: string
}

export interface AuditLogsResponse {
  logs: AuditLog[]
  total: number
  limit: number
  offset: number
}

export const auditService = {
  /**
   * Get audit logs with optional filters
   */
  async getLogs(options?: {
    action?: string
    resourceType?: string
    limit?: number
    offset?: number
  }): Promise<AuditLogsResponse> {
    const params = new URLSearchParams()
    if (options?.action) params.append('action', options.action)
    if (options?.resourceType) params.append('resourceType', options.resourceType)
    if (options?.limit) params.append('limit', String(options.limit))
    if (options?.offset) params.append('offset', String(options.offset))

    const response = await axios.get(`${API_URL}/api/admin/audit-logs?${params.toString()}`, {
      withCredentials: true,
    })
    return response.data.data
  },
}
