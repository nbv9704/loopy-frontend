import apiClient from './apiClient'

export type LessonStepType = 'note' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer' | 'code_prompt'

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

export interface BulkImportLessonStep {
  type: LessonStepType
  title?: string
  prompt: string
  options?: any[]
  correctAnswer?: any
  correct_answer?: any
  explanation?: string
  hint?: string
  isRequired?: boolean
  is_required?: boolean
  orderIndex?: number
  order_index?: number
}

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
    hint?: string // Legacy/general help
    hintLevel1?: string // Progressive hint level 1
    hint_level_1?: string
    hintLevel2?: string // Progressive hint level 2
    hint_level_2?: string
    hintLevel3?: string // Progressive hint level 3
    hint_level_3?: string
    commonMistakes?: string // Fix common errors
    common_mistakes?: string
    solutionCode?: string // Build result
    solution_code?: string
    isAhaLesson?: boolean
    is_aha_lesson?: boolean
    difficulty?: 'beginner' | 'intermediate' | 'advanced' | 'easy' | 'medium' | 'hard'
    gradingMode?: 'stdout' | 'function'
    grading_mode?: 'stdout' | 'function'
    status?: 'draft' | 'published' | 'archived'
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
    steps?: BulkImportLessonStep[]
    lessonSteps?: BulkImportLessonStep[]
  }>
}

export interface BulkImportResult {
  lessonsCreated: number
  testCasesCreated: number
  testCasesReplaced?: number
  stepsCreated?: number
  stepsReplaced?: number
  errors: string[]
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

export interface AdminSubmission {
  id: string
  user_id?: string | null
  lesson_id: string
  code: string
  is_correct: boolean
  test_score?: number | null
  final_score?: number | null
  grade_level?: string | null
  feedback?: string | null
  execution_time?: number | null
  submitted_at?: string
  lessons?: {
    id: string
    lesson_id?: string
    title?: string
    chapters?: {
      id: string
      language_id?: string
      title?: string
    } | null
  } | null
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
    hintLevel1: lesson.hintLevel1 || lesson.hint_level_1,
    hintLevel2: lesson.hintLevel2 || lesson.hint_level_2,
    hintLevel3: lesson.hintLevel3 || lesson.hint_level_3,
    commonMistakes: lesson.commonMistakes || lesson.common_mistakes,
    solutionCode: lesson.solutionCode || lesson.solution_code,
    isAhaLesson: lesson.isAhaLesson || lesson.is_aha_lesson,
    difficulty: lesson.difficulty,
    status: lesson.status,
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
    steps: lesson.steps?.map(step => ({
      type: step.type,
      title: step.title,
      prompt: step.prompt,
      options: step.options,
      correctAnswer: step.correctAnswer ?? step.correct_answer,
      explanation: step.explanation,
      hint: step.hint,
      isRequired: step.isRequired ?? step.is_required,
      orderIndex: step.orderIndex ?? step.order_index,
    })) || lesson.lessonSteps,
  })),
})

export const contentService = {
  /**
   * Bulk import lessons, exercises, and test cases
   */
  async bulkImport(payload: BulkImportPayload): Promise<BulkImportResult> {
    const response = await apiClient.post('/api/admin/import', toApiPayload(payload))
    return response.data.data
  },

  /**
   * Get all chapters
   */
  async getChapters(): Promise<any[]> {
    const response = await apiClient.get('/api/admin/chapters')
    return response.data.data
  },

  /**
   * Get lessons by chapter (or all if chapterId is 'all')
   */
  async getLessons(chapterId?: string): Promise<any[]> {
    const params = chapterId ? { chapter_id: chapterId } : undefined
    const response = await apiClient.get(`/api/admin/lessons`, { params })
    return response.data.data
  },

  /**
   * Get a lesson by ID
   */
  async getLessonById(lessonId: string): Promise<any> {
    const response = await apiClient.get(`/api/admin/lessons/${lessonId}`)
    return response.data.data
  },

  async getLessonTestCases(lessonId: string): Promise<LessonTestCase[]> {
    const response = await apiClient.get(`/api/admin/lessons/${lessonId}/test-cases`)
    return response.data.data
  },

  async upsertLessonTestCase(lessonId: string, testCase: LessonTestCase): Promise<LessonTestCase> {
    const response = await apiClient.post(`/api/admin/lessons/${lessonId}/test-cases`, testCase)
    return response.data.data
  },

  async deleteLessonTestCase(testCaseId: string): Promise<void> {
    await apiClient.delete(`/api/admin/test-cases/${testCaseId}`)
  },

  async getLessonSteps(lessonId: string): Promise<LessonStep[]> {
    const response = await apiClient.get(`/api/admin/lessons/${lessonId}/steps`)
    return response.data.data
  },

  async upsertLessonStep(lessonId: string, step: LessonStep): Promise<LessonStep> {
    const response = await apiClient.post(`/api/admin/lessons/${lessonId}/steps`, step)
    return response.data.data
  },

  async deleteLessonStep(stepId: string): Promise<void> {
    await apiClient.delete(`/api/admin/lesson-steps/${stepId}`)
  },

  async getSubmissions(params?: { status?: 'all' | 'pass' | 'fail'; limit?: number }): Promise<AdminSubmission[]> {
    const response = await apiClient.get('/api/admin/submissions', { params })
    return response.data.data
  },

  /**
   * Create or update a lesson
   */
  async upsertLesson(lesson: any): Promise<any> {
    const response = await apiClient.post('/api/admin/lessons', lesson)
    return response.data.data
  },

  /**
   * Delete a lesson
   */
  async deleteLesson(lessonId: string): Promise<void> {
    await apiClient.delete(`/api/admin/lessons/${lessonId}`)
  },

  // ============================================================================
  // Content Management API
  // ============================================================================

  /**
   * Get content items with optional filtering and pagination
   */
  async getContentItems(
    category?: string,
    language?: 'vi' | 'en',
    search?: string,
    limit?: number,
    offset?: number
  ): Promise<{ items: any[]; total: number; limit: number; offset: number }> {
    const params: any = {}
    if (category) params.category = category
    if (language) params.language = language
    if (search) params.search = search
    if (limit) params.limit = limit
    if (offset !== undefined) params.offset = offset

    const response = await apiClient.get('/api/admin/content', { params })
    return response.data.data
  },

  /**
   * Get all content categories
   */
  async getContentCategories(): Promise<any[]> {
    const response = await apiClient.get('/api/admin/content/categories')
    return response.data.data
  },

  /**
   * Create a new content item
   */
  async createContentItem(data: {
    categoryId: string
    key: string
    language: 'vi' | 'en'
    value: string
    description?: string
    type?: 'text' | 'markdown' | 'html'
  }): Promise<any> {
    const response = await apiClient.post('/api/admin/content', data)
    return response.data.data
  },

  /**
   * Update a content item
   */
  async updateContentItem(
    id: string,
    data: {
      value: string
      description?: string
      type?: 'text' | 'markdown' | 'html'
    }
  ): Promise<any> {
    const response = await apiClient.put(`/api/admin/content/${id}`, data)
    return response.data.data
  },

  /**
   * Delete a content item
   */
  async deleteContentItem(id: string): Promise<void> {
    await apiClient.delete(`/api/admin/content/${id}`)
  },

  /**
   * Export content items for a specific language
   */
  async exportContent(language: 'vi' | 'en'): Promise<Blob> {
    const response = await apiClient.get(`/api/admin/content/export?language=${language}`, {
      responseType: 'blob',
    })
    return response.data
  },

  /**
   * Import content items from a JSON file
   */
  async importContent(file: File): Promise<{ imported: number; errors: string[] }> {
    const reader = new FileReader()

    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        try {
          const content = JSON.parse(e.target?.result as string)
          const response = await apiClient.post('/api/admin/content/import', content)
          resolve(response.data.data)
        } catch (error) {
          reject(error)
        }
      }
      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }
      reader.readAsText(file)
    })
  },
}
