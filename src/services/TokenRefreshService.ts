/**
 * Token Refresh Service — Manages automatic JWT token refresh for admin sessions.
 *
 * Provides a singleton instance and class export for component lifecycle management.
 */

import { useAuthStore } from '../store/admin/authStore'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

export class TokenRefreshService {
  private refreshTimer: ReturnType<typeof setInterval> | null = null
  private isRefreshing = false
  private refreshPromise: Promise<void> | null = null

  /** Refresh interval: 4 minutes (tokens typically expire in 5-15 min) */
  private readonly REFRESH_INTERVAL = 4 * 60 * 1000

  constructor() {
    this.startAutoRefresh()
  }

  /**
   * Start the automatic refresh timer.
   */
  private startAutoRefresh(): void {
    this.stopAutoRefresh()
    this.refreshTimer = setInterval(() => {
      const { isAuthenticated } = useAuthStore.getState()
      if (isAuthenticated) {
        this.refreshToken().catch(err => {
          console.warn('Auto token refresh failed:', err)
        })
      }
    }, this.REFRESH_INTERVAL)
  }

  /**
   * Stop the automatic refresh timer.
   */
  private stopAutoRefresh(): void {
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer)
      this.refreshTimer = null
    }
  }

  /**
   * Refresh the auth token. Returns a shared promise if already refreshing
   * to prevent concurrent refresh requests.
   */
  async refreshToken(): Promise<void> {
    if (this.isRefreshing && this.refreshPromise) {
      return this.refreshPromise
    }

    this.isRefreshing = true
    this.refreshPromise = this._doRefresh()

    try {
      await this.refreshPromise
    } finally {
      this.isRefreshing = false
      this.refreshPromise = null
    }
  }

  private async _doRefresh(): Promise<void> {
    const { token, setAuth, clearAuth } = useAuthStore.getState()
    if (!token) {
      throw new Error('No token available for refresh')
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`)
      }

      const data = await response.json()
      if (data.token) {
        setAuth(data.token, data.user || useAuthStore.getState().user)
      } else {
        throw new Error('No token in refresh response')
      }
    } catch (error) {
      console.error('Token refresh failed:', error)
      clearAuth()
      throw error
    }
  }

  /**
   * Cleanup — stop timers and clear state.
   */
  destroy(): void {
    this.stopAutoRefresh()
    this.isRefreshing = false
    this.refreshPromise = null
  }
}

// Export singleton for use in interceptors
export const tokenRefreshService = new TokenRefreshService()
