/**
 * API Client for Loopy Backend
 *
 * Centralized API calls to backend server
 */

import toast from 'react-hot-toast'
import type { GradingResult } from '../types/grading.types'

const API_URL = import.meta.env.PROD && !import.meta.env.VITE_API_URL 
  ? (() => { throw new Error('VITE_API_URL is missing in production environment') })() 
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000')

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

interface ApiRequestOptions extends RequestInit {
  suppressAuthToast?: boolean
}

export interface ExecutionResult {
  output: string
  executionTime: number
  error: string | null
}

export interface LessonCheckResult {
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
  runner: 'local' | 'piston'
  requiresRunner: boolean
  reason: string | null
}

export interface CapabilitiesResult {
  capabilities: Record<string, CapabilityInfo | boolean>
}

class ApiClient {
  private baseUrl: string
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  public async request<T>(endpoint: string, options: ApiRequestOptions = {}): Promise<ApiResponse<T>> {
    const { suppressAuthToast, ...fetchOptions } = options
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

      // Handle HTTP errors with interceptor logic
      if (!response.ok) {
        await this.handleHttpError(response, endpoint, Boolean(suppressAuthToast))
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      // Distinguish HTTP errors (thrown by handleHttpError) from true network failures
      const isHttpError = error.message && error.message.startsWith('HTTP ')
      return {
        success: false,
        error: {
          code: isHttpError ? error.message.split(' ')[0] + '_' + error.message.split(' ')[1] : 'NETWORK_ERROR',
          message: error.message || 'Network error occurred',
          details: error.status ? { status: error.status } : undefined,
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
    suppressAuthToast: boolean
  ): Promise<void> {
    const status = response.status
    const isAdminRoute = typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')
    const isAuthBootstrap = endpoint === '/api/auth/me' || endpoint === '/api/auth/refresh'

    switch (status) {
      case 401:
        // Unauthorized - only show error message, don't redirect
        // Let individual components handle auth requirements
        if (!suppressAuthToast && !isAdminRoute && !isAuthBootstrap) {
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
    throw new Error(errorData.message || `HTTP ${status} error`)
  }

  // Authentication
  async signup(email: string, password: string, displayName?: string) {
    return this.request('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    })
  }

  async login(email: string, password: string) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
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
    // New: Refresh token is in httpOnly cookie (no need to send in body)
    // Legacy: Accept refreshToken parameter for backward compatibility
    return this.request('/api/auth/refresh', {
      method: 'POST',
      body: refreshToken ? JSON.stringify({ refreshToken }) : JSON.stringify({}),
      suppressAuthToast: true,
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
  async getCurriculum(languageId: string) {
    return this.request(`/api/languages/${languageId}/curriculum`)
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
  async getPathsByGoal(goalId: string) {
    return this.request(`/api/paths/goal/${goalId}`)
  }

  // Progress (requires auth)
  async getUserProgress() {
    return this.request('/api/progress/me')
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

  async completeLesson(lessonId: string) {
    return this.request(`/api/progress/me/${lessonId}/complete`, {
      method: 'PUT',
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

  async checkLesson(lessonId: string, code: string, language: string): Promise<ApiResponse<LessonCheckResult>> {
    return this.request(`/api/lessons/${lessonId}/check`, {
      method: 'POST',
      body: JSON.stringify({ code, language }),
    })
  }

  async getCapabilities(): Promise<ApiResponse<CapabilitiesResult>> {
    return this.request('/api/execute/capabilities')
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

  async getAIHint(exerciseId: string, code: string, language: string, context?: {
    starterCode?: string
    lessonTitle?: string
    lessonDescription?: string
    outputLogs?: string[]
  }): Promise<ApiResponse<{ hint: string }>> {
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
}

export const api = new ApiClient(API_URL)
export default api
