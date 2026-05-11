import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export interface BulkImportPayload {
  chapter_id: string
  lessons: Array<{
    lesson_id: string
    title: string
    description?: string
    code?: string
    insight?: string
    order_index: number
    exercises?: Array<{
      title: string
      description: string
      starter_code?: string
      difficulty?: 'easy' | 'medium' | 'hard'
      test_cases?: Array<{
        input: unknown
        expected_output: unknown
        weight?: number
        timeout?: number
        description: string
        is_hidden?: boolean
      }>
    }>
  }>
}

export interface BulkImportResult {
  lessonsCreated: number
  exercisesCreated: number
  testCasesCreated: number
  errors: string[]
}

export const contentService = {
  /**
   * Bulk import lessons, exercises, and test cases
   */
  async bulkImport(payload: BulkImportPayload): Promise<BulkImportResult> {
    const response = await axios.post(`${API_URL}/api/admin/import`, payload, {
      withCredentials: true,
    })
    return response.data.data
  },
}
