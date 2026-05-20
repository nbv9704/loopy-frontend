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
    displayName: string
    icon: string
    canRunInBrowser: boolean
    createdAt: string
  }>
}

export interface ChaptersResponse {
  chapters: Array<{
    id: string
    languageId: string
    chapterNumber: number
    title: string
    description: string
    orderIndex: number
    createdAt: string
    updatedAt: string
  }>
}

export interface LessonsResponse {
  lessons: Array<{
    id: string
    chapterId: string
    lessonId: string
    title: string
    description: string
    content: string
    code: string
    insight: string
    orderIndex: number
    createdAt: string
    updatedAt: string
  }>
}

export interface ProgressResponse {
  progress: Array<{
    id: string
    userId: string
    lessonId: string
    status: string
    completedAt?: string
    timeSpent: number
    createdAt: string
    updatedAt: string
  }>
  summary?: any
  completedLessons?: number
  totalLessons?: number
  currentStreak?: number
  longestStreak?: number
}

export interface ProfileResponse {
  profile: {
    id: string
    displayName: string
    avatarUrl: string
    bio: string
    preferredLanguage: string
    createdAt: string
    updatedAt: string
  }
}

export interface AuthResponse {
  user: {
    id: string
    email: string
  }
  session: {
    accessToken: string
    refreshToken: string
    expiresAt: number
  }
  message?: string
}

