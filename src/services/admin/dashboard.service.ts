import axios from 'axios'

const API_URL = import.meta.env.PROD && !import.meta.env.VITE_API_URL 
  ? (() => { throw new Error('VITE_API_URL is missing in production environment') })() 
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000')

export interface DashboardStats {
  totalUsers: number
  totalLessons: number
  totalSubmissions: number
  submissionsToday: number
  submissionsThisWeek: number
  completionRate: number
  totalPvPMatches: number
  averageAIScore: number
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
