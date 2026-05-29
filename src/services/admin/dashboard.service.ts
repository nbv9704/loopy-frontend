import axios from 'axios'

const API_URL = import.meta.env.PROD && !import.meta.env.VITE_API_URL 
  ? (() => { throw new Error('VITE_API_URL is missing in production environment') })() 
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000')

export interface DashboardStats {
  totalUsers: number
  totalLessons: number
  totalLessonsAll?: number
  draftLessons?: number
  archivedLessons?: number
  totalSubmissions: number
  submissionsToday: number
  submissionsThisWeek: number
  completionRate: number
  totalPvPMatches: number
  averageExecutionTime: number
  averageAIScore: number
  contentQuality: {
    lessonsMissingRequiredFields: number
    lessonsWithoutHint: number
    lessonsWithoutTestCases: number
  }
  recentLessons: Array<{
    id: string
    title: string
    lesson_id: string
    chapter_id: string
    updated_at: string
  }>
  recentFailedSubmissions: Array<{
    id: string
    user_id: string
    lesson_id: string
    submitted_at: string
    lessons?: {
      title: string
    }
  }>
}

export const dashboardService = {
  /**
   * Get dashboard overview statistics
   */
  async getStats(): Promise<DashboardStats> {
    const response = await axios.get(`${API_URL}/api/admin/stats/overview`, {
      withCredentials: true,
    })
    return response.data.data
  },
}
