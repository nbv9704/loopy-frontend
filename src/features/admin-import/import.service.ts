import apiClient from '../../services/admin/apiClient'
import { bulkImportPayloadSchema } from './importContract'
import { confirmedImportResult, type ImportResult } from './importPreview'

export const bulkImportService = {
  /**
   * Import lessons through the atomic backend boundary
   */
  async bulkImport(input: unknown): Promise<ImportResult> {
    const payload = bulkImportPayloadSchema.parse(input)
    const response = await apiClient.post('/api/admin/import', payload)
    if (response.data?.success !== true)
      throw new Error(
        'Chưa xác nhận được kết quả import. Kiểm tra nội dung chapter trước khi gửi lại.'
      )
    return confirmedImportResult(response.data.data, payload)
  },
}
