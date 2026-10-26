import apiClient from './apiClient'
import { adminData } from './response'
import { z } from 'zod'
import { lessonCatalogService } from '../../features/admin-lessons/catalog.service'

const detailAck = z.object({
  id: z.string().min(1),
  lesson_id: z.string(),
  order_index: z.number().int().nonnegative(),
})
const testCaseAck = detailAck
  .extend({ description: z.string(), expected_output: z.unknown() })
  .passthrough()
  .refine(
    value => Object.prototype.hasOwnProperty.call(value, 'expected_output'),
    'Thiếu expected_output đã lưu'
  )
const stepAck = detailAck
  .extend({
    type: z.enum([
      'note',
      'multiple_choice',
      'true_false',
      'fill_blank',
      'short_answer',
      'code_prompt',
    ]),
    prompt: z.string(),
  })
  .passthrough()

export type LessonType =
  | 'concept'
  | 'true_false'
  | 'multiple_choice'
  | 'fill_blank'
  | 'short_answer'
  | 'code_fix'
  | 'code_output'
  | 'code_build'

export type ValidationType = 'rule' | 'exact' | 'regex' | 'stdout' | 'function'

export type LessonStepType =
  'note' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer' | 'code_prompt'

export interface LessonStep {
  id?: string
  lesson_id?: string
  type: LessonStepType
  title?: string
  prompt: string
  options?: any[]
  correct_answer?: any
  explanation?: string
  hint?: string
  is_required?: boolean
  order_index: number
}

export interface LessonTestCase {
  id?: string
  lesson_id?: string
  description: string
  input?: any
  expected_output: any
  weight?: number
  timeout?: number
  is_hidden?: boolean
  order_index: number
}

export const contentService = {
  /**
   * Get all chapters
   */
  async getChapters(signal?: AbortSignal): Promise<any[]> {
    const response = await apiClient.get('/api/admin/chapters', { signal })
    return response.data.data
  },

  /**
   * Get lessons by chapter (or all if chapterId is 'all')
   */
  async getLessons(
    chapterId?: string,
    status: 'active' | 'draft' | 'published' | 'archived' | 'all' = 'active'
  ): Promise<any[]> {
    const params: Record<string, string> = { status }
    if (chapterId) params.chapter_id = chapterId
    const response = await apiClient.get(`/api/admin/lessons`, { params })
    return response.data.data
  },

  /**
   * Get a lesson by ID
   */
  async getLessonById(lessonId: string, signal?: AbortSignal): Promise<any> {
    const response = await apiClient.get(`/api/admin/lessons/${lessonId}`, { signal })
    return response.data.data
  },

  async getLessonTestCases(lessonId: string, signal?: AbortSignal): Promise<LessonTestCase[]> {
    const response = await apiClient.get(`/api/admin/lessons/${lessonId}/test-cases`, { signal })
    return response.data.data
  },

  async upsertLessonTestCase(lessonId: string, testCase: LessonTestCase): Promise<LessonTestCase> {
    const response = await apiClient.post(`/api/admin/lessons/${lessonId}/test-cases`, testCase)
    const saved = confirmDetail(testCaseAck, response, lessonId, testCase.id)
    return { ...saved, expected_output: saved.expected_output }
  },

  async deleteLessonTestCase(testCaseId: string): Promise<void> {
    const ack = adminData(
      z.object({ id: z.string() }),
      await apiClient.delete(`/api/admin/test-cases/${testCaseId}`)
    )
    if (ack.id !== testCaseId) throw new Error('Chưa xác nhận đúng test case đã xóa. Hãy tải lại.')
  },

  async getLessonSteps(lessonId: string, signal?: AbortSignal): Promise<LessonStep[]> {
    const response = await apiClient.get(`/api/admin/lessons/${lessonId}/steps`, { signal })
    return response.data.data
  },

  async upsertLessonStep(lessonId: string, step: LessonStep): Promise<LessonStep> {
    const response = await apiClient.post(`/api/admin/lessons/${lessonId}/steps`, step)
    return confirmDetail(stepAck, response, lessonId, step.id)
  },

  async deleteLessonStep(stepId: string): Promise<void> {
    const ack = adminData(
      z.object({ id: z.string() }),
      await apiClient.delete(`/api/admin/lesson-steps/${stepId}`)
    )
    if (ack.id !== stepId) throw new Error('Chưa xác nhận đúng step đã xóa. Hãy tải lại.')
  },

  /**
   * Create or update a lesson
   */
  async upsertLesson(lesson: any): Promise<any> {
    const response = await apiClient.post('/api/admin/lessons', lesson)
    return response.data.data
  },

  /**
   * Archive a lesson. The backend keeps progress/submission history intact.
   */
  async deleteLesson(lessonId: string): Promise<void> {
    await lessonCatalogService.archive(lessonId)
  },
}

function confirmDetail<T extends { lesson_id: string; id: string }>(
  schema: z.ZodType<T>,
  response: { data?: { success?: boolean; data?: unknown } },
  lessonId: string,
  id?: string
): T {
  const item = adminData(schema, response)
  if (item.lesson_id !== lessonId || (id && item.id !== id))
    throw new Error('Chưa xác nhận đúng chi tiết thuộc lesson đang sửa. Hãy tải lại.')
  return item
}
