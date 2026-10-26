/**
 * API Client for Loopy Backend
 *
 * Centralized API calls to backend server
 */

import toast from 'react-hot-toast'
import type { GradingResult } from '../types/grading.types'
import { API_ORIGIN as API_URL } from '../config/api'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
    status?: number
  }
}

interface ApiRequestOptions extends RequestInit {
  suppressAuthToast?: boolean
  suppressErrorToast?: boolean
  skipAuthRefresh?: boolean
}

class ApiHttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown
  ) {
    super(message)
    this.name = 'ApiHttpError'
  }
}

export interface ExecutionResult {
  output: string
  executionTime: number
  error: string | null
}

export interface LessonCheckResult {
  submissionId?: string
  passed: boolean
  score: number
  output: string
  hint: string | null
  validationType?: string
  gradingMode?: string
  checks: Array<{
    label: string
    passed: boolean
    message?: string
  }>
}

export interface CapabilityInfo {
  supported: boolean
  runner: 'local' | 'piston' | 'glot' | null
  requiresRunner: boolean
  reason: string | null
}

export interface CapabilitiesResult {
  capabilities: Record<string, CapabilityInfo | boolean>
}

class ApiClient {
  private baseUrl: string
  private refreshPromise: Promise<ApiResponse<unknown>> | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  public async request<T>(
    endpoint: string,
    options: ApiRequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const { suppressAuthToast, suppressErrorToast, skipAuthRefresh, ...fetchOptions } = options
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(fetchOptions.headers as Record<string, string>),
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...fetchOptions,
        headers,
        credentials: 'include', // CRITICAL: Send cookies with every request
      })
      if (fetchOptions.signal?.aborted) throw new DOMException('Aborted', 'AbortError')

      if (response.status === 401 && !skipAuthRefresh && this.shouldAttemptAuthRefresh(endpoint)) {
        const refreshed = await this.refreshSessionForRetry()
        if (fetchOptions.signal?.aborted) throw new DOMException('Aborted', 'AbortError')
        if (!refreshed.success && refreshed.error?.status !== 401) {
          return { success: false, error: refreshed.error }
        }
        if (refreshed.success) {
          const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
            ...fetchOptions,
            headers,
            credentials: 'include',
          })

          if (!retryResponse.ok) {
            await this.handleHttpError(
              retryResponse,
              endpoint,
              Boolean(suppressAuthToast),
              fetchOptions.method,
              Boolean(suppressErrorToast)
            )
          }

          return await retryResponse.json()
        }
      }

      // Handle HTTP errors with interceptor logic
      if (!response.ok) {
        await this.handleHttpError(
          response,
          endpoint,
          Boolean(suppressAuthToast),
          fetchOptions.method,
          Boolean(suppressErrorToast)
        )
      }

      const data = await response.json()
      return data
    } catch (error: unknown) {
      if (error instanceof ApiHttpError) {
        return {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
            status: error.status,
          },
        }
      }
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error occurred',
        },
      }
    }
  }

  /**
   * HTTP Error Interceptor
   * Handles common HTTP errors globally with appropriate user feedback
   */
  private async handleHttpError(
    response: Response,
    endpoint: string,
    suppressAuthToast: boolean,
    method?: string,
    suppressErrorToast = false
  ): Promise<void> {
    const status = response.status
    const isAdminRoute =
      typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
    const isAuthBootstrap = endpoint === '/api/auth/me' || endpoint === '/api/auth/refresh'

    if (!suppressErrorToast)
      switch (status) {
        case 401:
          // Unauthorized - only show error message, don't redirect
          // Let individual components handle auth requirements
          if (
            !suppressAuthToast &&
            !isAdminRoute &&
            !isAuthBootstrap &&
            this.shouldShowAuthToast(method)
          ) {
            toast.error('Phiên đăng nhập đã hết hạn', { id: 'session-expired-toast' })
          }
          break

        case 403:
          // Forbidden - show access denied message
          toast.error('Bạn không có quyền truy cập')
          break

        case 404:
          // Not Found - show resource not found message
          toast.error('Không tìm thấy tài nguyên')
          break

        default:
          // Server errors (500+)
          if (status >= 500) {
            toast.error('Lỗi máy chủ. Vui lòng thử lại sau')
          }
          break
      }

    // Throw error to maintain existing error handling flow
    const errorData = await response.json().catch(() => ({}))
    throw new ApiHttpError(
      status,
      errorData?.error?.code || `HTTP_${status}`,
      errorData?.error?.message || errorData?.message || `HTTP ${status} error`,
      errorData?.error?.details
    )
  }

  private shouldAttemptAuthRefresh(endpoint: string): boolean {
    return ![
      '/api/auth/login',
      '/api/auth/signup',
      '/api/auth/logout',
      '/api/auth/refresh',
    ].includes(endpoint)
  }

  private shouldShowAuthToast(method?: string): boolean {
    return (method || 'GET').toUpperCase() !== 'GET'
  }

  private async refreshSessionForRetry(): Promise<ApiResponse<unknown>> {
    if (!this.refreshPromise) {
      this.refreshPromise = this.request('/api/auth/refresh', {
        method: 'POST',
        body: JSON.stringify({}),
        skipAuthRefresh: true,
        suppressAuthToast: true,
        suppressErrorToast: true,
      })
        .then(response => {
          if (response?.success === true || (response?.success === false && response.error))
            return response
          return {
            success: false,
            error: {
              code: 'AUTH_INVALID_RESPONSE',
              status: 502,
              message: 'Phản hồi gia hạn phiên không hợp lệ. Vui lòng thử lại.',
            },
          }
        })
        .finally(() => {
          this.refreshPromise = null
        })
    }
    return this.refreshPromise
  }

  // Authentication
  async signup(email: string, password: string, displayName?: string) {
    const normalizedEmail = email.trim().toLowerCase()
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email: normalizedEmail, password, displayName }),
    })
  }

  async login(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase()
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email: normalizedEmail, password }),
    })
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    })
  }

  async getCurrentUser() {
    return this.request('/api/auth/me', { suppressAuthToast: true })
  }

  async refreshToken(refreshToken?: string) {
    if (!refreshToken) return this.refreshSessionForRetry()
    // New: Refresh token is in httpOnly cookie (no need to send in body)
    // Legacy: Accept refreshToken parameter for backward compatibility
    return this.request('/api/auth/refresh', {
      method: 'POST',
      body: refreshToken ? JSON.stringify({ refreshToken }) : JSON.stringify({}),
      suppressAuthToast: true,
      skipAuthRefresh: true,
    })
  }

  // Languages
  async getLanguages() {
    return this.request('/api/languages')
  }

  async getLanguage(id: string) {
    return this.request(`/api/languages/${id}`)
  }

  async getChaptersByLanguage(languageId: string) {
    return this.request(`/api/languages/${languageId}/chapters`)
  }

  /** Batch: chapters + lessons in one call (eliminates N+1) */
  async getCurriculum(languageId: string, pathId?: string, signal?: AbortSignal) {
    const query = pathId ? `?pathId=${encodeURIComponent(pathId)}` : ''
    return this.request(`/api/languages/${encodeURIComponent(languageId)}/curriculum${query}`, {
      signal,
    })
  }

  /** Batch: chapters + lessons filtered by learning path */
  async getCurriculumByPath(languageId: string, learningPath: string) {
    return this.request(`/api/languages/${languageId}/path/${learningPath}/curriculum`)
  }

  // Chapters
  async getChapter(id: string) {
    return this.request(`/api/chapters/${id}`)
  }

  async getLessonsByChapter(chapterId: string) {
    return this.request(`/api/chapters/${chapterId}/lessons`)
  }

  // Lessons
  async getLesson(id: string) {
    return this.request(`/api/lessons/${id}`)
  }

  async getExercisesByLesson(lessonId: string) {
    return this.request(`/api/lessons/${lessonId}/exercises`)
  }

  // Public
  async getSampleLesson() {
    return this.request('/api/public/sample-lesson')
  }

  // Learning paths
  async getPaths(params?: { languageId?: string; goalId?: string }) {
    const searchParams = new URLSearchParams()
    if (params?.languageId) searchParams.set('languageId', params.languageId)
    if (params?.goalId) searchParams.set('goalId', params.goalId)
    const query = searchParams.toString()
    return this.request(`/api/paths${query ? `?${query}` : ''}`)
  }

  async getPath(pathId: string) {
    return this.request(`/api/paths/${pathId}`)
  }

  async getPathsByGoal(goalId: string) {
    return this.request(`/api/paths/goal/${goalId}`)
  }

  // Progress (requires auth)
  async getUserProgress(signal?: AbortSignal) {
    return this.request('/api/progress/me', { signal })
  }

  async getLessonProgress(lessonId: string) {
    return this.request(`/api/progress/me/${lessonId}`)
  }

  async updateProgress(lessonId: string, status: string, timeSpent?: number) {
    return this.request(`/api/progress/me/${lessonId}`, {
      method: 'POST',
      body: JSON.stringify({ status, timeSpent }),
    })
  }

  async completeLesson(lessonId: string, submissionId: string) {
    return this.request(`/api/progress/me/${lessonId}/complete`, {
      method: 'PUT',
      body: JSON.stringify({ submissionId }),
    })
  }

  // Exercises (requires auth)
  async submitExercise(exerciseId: string, code: string) {
    return this.request(`/api/exercises/${exerciseId}/submit`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    })
  }

  async getExerciseSubmissions(exerciseId: string) {
    return this.request(`/api/exercises/${exerciseId}/submissions`)
  }

  // Code Execution
  async executeCode(language: string, code: string): Promise<ApiResponse<ExecutionResult>> {
    return this.request('/api/execute', {
      method: 'POST',
      body: JSON.stringify({ language, code }),
    })
  }

  async validateCode(exerciseId: string, code: string) {
    return this.request('/api/execute/validate', {
      method: 'POST',
      body: JSON.stringify({ exerciseId, code }),
    })
  }

  async checkLesson(
    lessonId: string,
    code: string,
    language: string
  ): Promise<ApiResponse<LessonCheckResult>> {
    return this.request(`/api/lessons/${lessonId}/check`, {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    })
  }

  async checkLessonStep(
    lessonId: string,
    stepId: string,
    answer?: string
  ): Promise<ApiResponse<{ passed: boolean; message: string }>> {
    return this.request(`/api/lessons/${lessonId}/steps/${stepId}/check`, {
      method: 'POST',
      body: JSON.stringify({ answer }),
    })
  }

  async getCapabilities(signal?: AbortSignal): Promise<ApiResponse<CapabilitiesResult>> {
    return this.request('/api/execute/capabilities', { signal })
  }

  // Grading System
  async submitForGrading(
    exerciseId: string,
    code: string,
    language: string = 'javascript',
    gradingMethod: 'test' | 'ai' | 'both' = 'both',
    lessonContext?: {
      starterCode?: string
      lessonTitle?: string
      lessonDescription?: string
      lessonInsight?: string
      gradingDepth?: string
    }
  ): Promise<ApiResponse<GradingResult>> {
    return this.request('/api/grading/exercises/' + exerciseId + '/submit', {
      method: 'POST',
      body: JSON.stringify({
        code,
        language,
        gradingMethod,
        ...(lessonContext || {}),
      }),
    })
  }

  async requestHint(
    exerciseId: string,
    code: string,
    language: string = 'javascript',
    lessonContext?: {
      starterCode?: string
      lessonTitle?: string
      lessonDescription?: string
      lessonInsight?: string
      outputLogs?: string[]
    }
  ) {
    return this.request('/api/grading/exercises/' + exerciseId + '/hint', {
      method: 'POST',
      body: JSON.stringify({
        code,
        language,
        ...(lessonContext || {}),
      }),
    })
  }

  async getGradedSubmissions(exerciseId: string, page: number = 1, limit: number = 10) {
    return this.request(
      `/api/grading/exercises/${exerciseId}/submissions?page=${page}&limit=${limit}`
    )
  }

  async getGradedSubmissionDetail(exerciseId: string, submissionId: string) {
    return this.request(`/api/grading/exercises/${exerciseId}/submissions/${submissionId}`)
  }

  async requestLessonHint(
    lessonId: string,
    code: string,
    language: string,
    context?: {
      starterCode?: string
      lessonTitle?: string
      lessonDescription?: string
      outputLogs?: string[]
    }
  ): Promise<ApiResponse<{ hint: string }>> {
    return this.request(`/api/lessons/${lessonId}/hint`, {
      method: 'POST',
      body: JSON.stringify({
        code,
        language,
        ...(context || {}),
      }),
    })
  }

  async getAIHint(
    exerciseId: string,
    code: string,
    language: string,
    context?: {
      starterCode?: string
      lessonTitle?: string
      lessonDescription?: string
      outputLogs?: string[]
    }
  ): Promise<ApiResponse<{ hint: string }>> {
    return this.request(`/api/grading/exercises/${exerciseId}/hint`, {
      method: 'POST',
      body: JSON.stringify({
        code,
        language,
        ...(context || {}),
      }),
    })
  }

  // Profile (requires auth)
  async getMyProfile() {
    return this.request('/api/profile/me')
  }

  async updateProfile(data: {
    displayName?: string
    avatarUrl?: string
    bio?: string
    preferredLanguage?: string
    learningPath?: string
    learningGoal?: string
    onboardingCompleted?: boolean
    experienceLevel?: string
    currentPathId?: string
  }) {
    return this.request('/api/profile/me', {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async getPublicProfile(userId: string) {
    return this.request(`/api/profile/${userId}`)
  }

  // Moderation
  async getPublicModerationKeywords() {
    return this.request<string[]>('/api/moderation/keywords', { suppressAuthToast: true })
  }
}

export const api = new ApiClient(API_URL)
export default api
