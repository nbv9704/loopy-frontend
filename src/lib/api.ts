/**
 * API Client for Loopy Backend
 *
 * Centralized API calls to backend server
 */

import toast from 'react-hot-toast'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

class ApiClient {
  private baseUrl: string
  private token: string | null = null

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl
  }

  setToken(token: string | null) {
    this.token = token
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
      })

      // Handle HTTP errors with interceptor logic
      if (!response.ok) {
        await this.handleHttpError(response)
      }

      const data = await response.json()
      return data
    } catch (error: any) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error.message || 'Network error occurred',
        },
      }
    }
  }

  /**
   * HTTP Error Interceptor
   * Handles common HTTP errors globally with appropriate user feedback
   */
  private async handleHttpError(response: Response): Promise<void> {
    const status = response.status

    switch (status) {
      case 401:
        // Unauthorized - only show error message, don't redirect
        // Let individual components handle auth requirements
        toast.error('Phiên đăng nhập đã hết hạn')
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
    return this.request('/api/auth/me')
  }

  async refreshToken(refreshToken: string) {
    return this.request('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
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
  async executeCode(language: string, code: string) {
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
  ) {
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

  async getGradedSubmissions(exerciseId: string, page: number = 1, limit: number = 10) {
    return this.request(
      `/api/grading/exercises/${exerciseId}/submissions?page=${page}&limit=${limit}`
    )
  }

  async getGradedSubmissionDetail(exerciseId: string, submissionId: string) {
    return this.request(
      `/api/grading/exercises/${exerciseId}/submissions/${submissionId}`
    )
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
