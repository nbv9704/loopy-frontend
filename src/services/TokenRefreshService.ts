/**
 * Token Refresh Service — Manages automatic JWT token refresh for admin sessions.
 *
 * SECURITY UPDATE: Tokens are now in httpOnly cookies (backend-managed)
 * - No longer reads/stores tokens in localStorage
 * - Backend automatically refreshes tokens via cookies
 * - This service now only triggers refresh requests
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
    try {
      // Tokens are in httpOnly cookies - backend handles refresh automatically
      const response = await fetch(`${API_BASE_URL}/api/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include', // CRITICAL: Send cookies
      })

      if (!response.ok) {
        throw new Error(`Refresh failed: ${response.status}`)
      }

      const data = await response.json()

      // Backend sets new cookies automatically
      // Just verify success
      if (!data.success) {
        throw new Error('Token refresh failed')
      }

      // Note: We don't update store with tokens anymore
      // Tokens are in httpOnly cookies (backend-managed)
    } catch (error) {
      console.error('Token refresh failed:', error)
      const { clearAuth } = useAuthStore.getState()
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
