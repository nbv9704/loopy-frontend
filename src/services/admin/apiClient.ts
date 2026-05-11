import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../../store/admin/authStore'
import { tokenRefreshService } from '../TokenRefreshService'
import { isTokenExpiringSoon } from '../../utils/tokenUtils'
import { errorLogger } from '../ErrorLogger'
import type { ApiError, RequestContext } from '../../types/logger.types'

// Use VITE_API_URL environment variable with fallback to localhost:3000 in development
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session cookies
})

/**
 * Request Interceptor
 * Checks token expiry before each request and refreshes if needed
 * Automatically adds Authorization header with current token
 *
 * **Validates: Requirements 4.3, 4.6, 8.1**
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const requestStartTime = Date.now()
    // Store start time for duration tracking
    ;(config as { requestStartTime?: number }).requestStartTime = requestStartTime

    const token = useAuthStore.getState().token

    // Skip token refresh for login/auth endpoints
    if (config.url?.includes('/login') || config.url?.includes('/auth/check')) {
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    }

    // Check if token is expiring soon and refresh if needed
    if (token && isTokenExpiringSoon(token)) {
      try {
        await tokenRefreshService.refreshToken()
        const newToken = useAuthStore.getState().token
        if (newToken) {
          config.headers.Authorization = `Bearer ${newToken}`
        }
      } catch (error) {
        console.error('Token refresh failed in request interceptor:', error)

        // Log the error with context
        const apiError = error as ApiError
        apiError.status = apiError.status || 0
        apiError.endpoint = config.url
        apiError.method = config.method?.toUpperCase()

        const requestContext: RequestContext = {
          url: config.url || '',
          method: config.method?.toUpperCase() || 'UNKNOWN',
          duration: Date.now() - requestStartTime,
        }

        errorLogger.logApiError(apiError, requestContext)

        // Continue with existing token, let response interceptor handle 401
        config.headers.Authorization = `Bearer ${token}`
      }
    } else if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  error => {
    // Log request setup errors
    const apiError = error as ApiError
    apiError.status = 0

    const requestContext: RequestContext = {
      url: error.config?.url || 'unknown',
      method: error.config?.method?.toUpperCase() || 'UNKNOWN',
    }

    errorLogger.logApiError(apiError, requestContext)

    return Promise.reject(error)
  }
)

/**
 * Response Interceptor
 * Handles 401 errors with automatic token refresh and request retry
 * Implements request queuing to prevent multiple simultaneous refresh attempts
 *
 * **Validates: Requirements 4.6, 4.7, 8.1**
 */
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }
    const requestStartTime =
      (originalRequest as { requestStartTime?: number }).requestStartTime || Date.now()
    const duration = Date.now() - requestStartTime

    // Log API errors with context
    const apiError = error as ApiError
    apiError.status = error.response?.status || 0
    apiError.endpoint = originalRequest.url
    apiError.method = originalRequest.method?.toUpperCase()

    const requestContext: RequestContext = {
      url: originalRequest.url || '',
      method: originalRequest.method?.toUpperCase() || 'UNKNOWN',
      duration,
    }

    // Handle 401 Unauthorized with token refresh and retry
    if (error.response?.status === 401 && !originalRequest._retry) {
      // Skip retry for login endpoints
      if (originalRequest.url?.includes('/login')) {
        errorLogger.logApiError(apiError, requestContext)
        return Promise.reject(error)
      }

      // Mark request as retried to prevent infinite loops
      originalRequest._retry = true

      try {
        // Attempt to refresh the token
        await tokenRefreshService.refreshToken()
        const newToken = useAuthStore.getState().token

        if (newToken) {
          // Update the Authorization header with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${newToken}`
          }

          // Retry the original request with new token
          return apiClient.request(originalRequest)
        } else {
          throw new Error('No token available after refresh')
        }
      } catch (refreshError) {
        // Token refresh failed - clear auth and redirect to login
        console.error('Token refresh failed in response interceptor:', refreshError)

        // Log the refresh failure
        errorLogger.logApiError(apiError, requestContext)

        useAuthStore.getState().clearAuth()
        window.location.href = '/admin/login'
        return Promise.reject(refreshError)
      }
    }

    // For other errors, log and reject
    errorLogger.logApiError(apiError, requestContext)
    return Promise.reject(error)
  }
)

export default apiClient
