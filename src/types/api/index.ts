/**
 * API response and request types
 */

export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
    details?: any
  }
}

export interface LanguagesResponse {
  languages: Array<{
    id: string
    name: string
    display_name: string
    icon: string
    can_run_in_browser: boolean
    created_at: string
  }>
}

export interface ChaptersResponse {
  chapters: Array<{
    id: string
    language_id: string
    chapter_number: number
    title: string
    description: string
    order_index: number
    created_at: string
    updated_at: string
  }>
}

export interface LessonsResponse {
  lessons: Array<{
    id: string
    chapter_id: string
    lesson_id: string
    title: string
    description: string
    content: string
    code: string
    insight: string
    order_index: number
    created_at: string
    updated_at: string
  }>
}

export interface ProgressResponse {
  progress: Array<{
    id: string
    user_id: string
    lesson_id: string
    status: string
    completed_at?: string
    time_spent: number
    created_at: string
    updated_at: string
  }>
  summary?: any
  completed_lessons?: number
  total_lessons?: number
  current_streak?: number
  longest_streak?: number
}

export interface ProfileResponse {
  profile: {
    id: string
    display_name: string
    avatar_url: string
    bio: string
    preferred_language: string
    created_at: string
    updated_at: string
  }
}

export interface AuthResponse {
  user: {
    id: string
    email: string
  }
  session: {
    access_token: string
    refresh_token: string
    expires_at: number
  }
  message?: string
}
