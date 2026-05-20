import axios from 'axios'

const API_URL = import.meta.env.PROD && !import.meta.env.VITE_API_URL 
  ? (() => { throw new Error('VITE_API_URL is missing in production environment') })() 
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000')

export interface BulkImportPayload {
  chapterId?: string
  chapter_id?: string
  lessons: Array<{
    lessonId?: string
    lesson_id?: string
    title: string
    description?: string // See explanation
    starterCode?: string // See code
    starter_code?: string
    taskDescription?: string // Change instruction
    task_description?: string
    hint?: string // Fix help
    commonMistakes?: string // Fix common errors
    common_mistakes?: string
    solutionCode?: string // Build result
    solution_code?: string
    isAhaLesson?: boolean
    is_aha_lesson?: boolean
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'easy' | 'medium' | 'hard'
    gradingMode?: 'stdout' | 'function'
    grading_mode?: 'stdout' | 'function'
    orderIndex?: number
    order_index?: number
    testCases?: Array<{
      orderIndex: number
      description: string
      input?: any
      expectedOutput: any
      weight?: number
      timeout?: number
      isHidden?: boolean
    }>
    test_cases?: Array<{
      order_index: number
      description: string
      input?: any
      expected_output: any
      weight?: number
      timeout?: number
      is_hidden?: boolean
    }>
  }>
}

export interface BulkImportResult {
  lessonsCreated: number
  testCasesCreated: number
  errors: string[]
}

const toApiPayload = (payload: BulkImportPayload) => ({
  chapterId: payload.chapterId || payload.chapter_id,
  lessons: payload.lessons.map(lesson => ({
    lessonId: lesson.lessonId || lesson.lesson_id,
    title: lesson.title,
    description: lesson.description,
    starterCode: lesson.starterCode || lesson.starter_code,
    taskDescription: lesson.taskDescription || lesson.task_description,
    hint: lesson.hint,
    commonMistakes: lesson.commonMistakes || lesson.common_mistakes,
    solutionCode: lesson.solutionCode || lesson.solution_code,
    isAhaLesson: lesson.isAhaLesson || lesson.is_aha_lesson,
    difficulty: lesson.difficulty,
    gradingMode: lesson.gradingMode || lesson.grading_mode,
    orderIndex: lesson.orderIndex ?? lesson.order_index,
    testCases: lesson.testCases?.map(tc => ({
      order_index: tc.orderIndex,
      description: tc.description,
      input: tc.input,
      expected_output: tc.expectedOutput,
      weight: tc.weight,
      timeout: tc.timeout,
      is_hidden: tc.isHidden,
    })) || lesson.test_cases,
  })),
})

export const contentService = {
  /**
   * Bulk import lessons, exercises, and test cases
   */
  async bulkImport(payload: BulkImportPayload): Promise<BulkImportResult> {
    const response = await axios.post(`${API_URL}/api/admin/import`, toApiPayload(payload), {
      withCredentials: true,
    })
    return response.data.data
  },

  /**
   * Get all chapters
   */
  async getChapters(): Promise<any[]> {
    const response = await axios.get(`${API_URL}/api/admin/chapters`, {
      withCredentials: true,
    })
    return response.data.data
  },

  /**
   * Get lessons by chapter
   */
  async getLessons(chapterId: string): Promise<any[]> {
    const response = await axios.get(`${API_URL}/api/admin/chapters/${chapterId}/lessons`, {
      withCredentials: true,
    })
    return response.data.data
  },

  /**
   * Get a lesson by ID
   */
  async getLessonById(lessonId: string): Promise<any> {
    const response = await axios.get(`${API_URL}/api/admin/lessons/${lessonId}`, {
      withCredentials: true,
    })
    return response.data.data
  },

  /**
   * Create or update a lesson
   */
  async upsertLesson(lesson: any): Promise<any> {
    const response = await axios.post(`${API_URL}/api/admin/lessons`, lesson, {
      withCredentials: true,
    })
    return response.data.data
  },

  /**
   * Delete a lesson
   */
  async deleteLesson(lessonId: string): Promise<void> {
    await axios.delete(`${API_URL}/api/admin/lessons/${lessonId}`, {
      withCredentials: true,
    })
  },
}
