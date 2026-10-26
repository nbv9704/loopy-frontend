import { z } from 'zod'
import apiClient from '../../services/admin/apiClient'
import { adminData, adminRead } from '../../services/admin/response'
import { readPracticeAuthoring, type NormalizedPracticeWrite } from '../practice/practiceWrite'

export const adminPracticeEditorService = {
  async get(id: string, signal?: AbortSignal) {
    const data = adminData(
      z.unknown(),
      await adminRead(
        apiClient.get(`/api/admin/practice/sets/${encodeURIComponent(id)}`, { signal })
      )
    )
    return readPracticeAuthoring(data, id)
  },
  async save(payload: NormalizedPracticeWrite, id?: string) {
    const response = id
      ? await apiClient.put(`/api/admin/practice/sets/${encodeURIComponent(id)}`, payload)
      : await apiClient.post('/api/admin/practice/sets', payload)
    return adminData(z.unknown(), response)
  },
}
