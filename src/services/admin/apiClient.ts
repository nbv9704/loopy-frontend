import axios, { AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios'
import { useAuthStore } from '../../store/admin/authStore'
import { errorLogger } from '../ErrorLogger'
import type { ApiError, RequestContext } from '../../types/logger.types'
import { API_ORIGIN as API_BASE_URL } from '../../config/api'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for session cookies
})

type TrackedRequest = AxiosRequestConfig & {
  requestStartTime?: number
  adminSessionRevision?: number
}

/**
 * Request Interceptor
 * Simply logs duration starting point
 */
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const requestStartTime = Date.now()
    // Store start time for duration tracking
    const tracked = config as TrackedRequest
    tracked.requestStartTime = requestStartTime
    tracked.adminSessionRevision = useAuthStore.getState().sessionRevision
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
 * Invalidates only the session that owned an unauthorized request.
 */
apiClient.interceptors.response.use(
  response => response,
  async error => {
    const originalRequest = (error.config || {}) as TrackedRequest
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

    // ProtectedRoute handles navigation after invalidating the current session.
    if (error.response?.status === 401) {
      errorLogger.logApiError(apiError, requestContext)

      // Prevent infinite redirect loops if we are already trying to authenticate
      if (
        originalRequest.adminSessionRevision === useAuthStore.getState().sessionRevision &&
        !originalRequest.url?.startsWith('/api/admin-auth/')
      ) {
        useAuthStore.getState().clearAuth()
      }
      return Promise.reject(error)
    }

    // For other errors, log and reject
    errorLogger.logApiError(apiError, requestContext)
    return Promise.reject(error)
  }
)

export default apiClient
