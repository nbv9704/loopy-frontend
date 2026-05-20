import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../../store/admin/authStore'
import { errorLogger } from '../ErrorLogger'
import type { ApiError, RequestContext } from '../../types/logger.types'

// Use VITE_API_URL environment variable with fallback to localhost:3000 in development
const API_BASE_URL = import.meta.env.PROD && !import.meta.env.VITE_API_URL 
  ? (() => { throw new Error('VITE_API_URL is missing in production environment') })() 
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000')

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session cookies
})

/**
 * Request Interceptor
 * Simply logs duration starting point
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const requestStartTime = Date.now()
    // Store start time for duration tracking
    ;(config as { requestStartTime?: number }).requestStartTime = requestStartTime
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
 * Handles 401 errors by redirecting to login
 */
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = error.config as AxiosRequestConfig
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

    // Handle 401 Unauthorized - clear auth state and redirect to login page
    if (error.response?.status === 401) {
      errorLogger.logApiError(apiError, requestContext)
      
      // Prevent infinite redirect loops if we are already trying to authenticate
      if (!originalRequest.url?.includes('/login') && !originalRequest.url?.includes('/me')) {
        useAuthStore.getState().clearAuth()
        window.location.href = '/admin/login'
      }
      return Promise.reject(error)
    }

    // For other errors, log and reject
    errorLogger.logApiError(apiError, requestContext)
    return Promise.reject(error)
  }
)

export default apiClient
