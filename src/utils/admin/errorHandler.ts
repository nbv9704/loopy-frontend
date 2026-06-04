import { AxiosError } from 'axios'
import toast from 'react-hot-toast'

interface ApiErrorResponse {
  message?: string
  error?: string
  errors?: Record<string, string[]>
}

/**
 * Extract error message from various error response formats
 */
export function getErrorMessage(error: unknown): string {
  if (!error) {
    return 'An unexpected error occurred'
  }

  // Handle AxiosError
  if (error instanceof Error && 'isAxiosError' in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>

    // Network error (no response from server)
    if (!axiosError.response) {
      if (axiosError.code === 'ERR_NETWORK') {
        return 'Network error. Please check your internet connection and try again.'
      }
      if (axiosError.code === 'ECONNABORTED') {
        return 'Request timeout. Please try again.'
      }
      return 'Unable to connect to the server. Please try again later.'
    }

    const { status, data } = axiosError.response

    // Handle specific HTTP status codes
    switch (status) {
      case 400:
        // Bad Request - show validation errors if available
        if (data?.errors) {
          const errorMessages = Object.entries(data.errors)
            .map(([field, messages]) => `${field}: ${messages.join(', ')}`)
            .join('; ')
          return `Validation error: ${errorMessages}`
        }
        return data?.message || data?.error || 'Invalid request. Please check your input.'

      case 401:
        // Unauthorized - handled by interceptor (redirect to login)
        return 'Your session has expired. Please log in again.'

      case 403:
        // Forbidden
        return 'You do not have permission to perform this action.'

      case 404:
        // Not Found
        return data?.message || 'The requested resource was not found.'

      case 409:
        // Conflict
        return data?.message || 'This operation conflicts with existing data.'

      case 422:
        // Unprocessable Entity
        return data?.message || 'The data provided could not be processed.'

      case 500:
        // Internal Server Error
        return 'A server error occurred. Please try again later.'

      case 502:
        // Bad Gateway
        return 'The server is temporarily unavailable. Please try again later.'

      case 503:
        // Service Unavailable
        return 'The service is temporarily unavailable. Please try again later.'

      default:
        // Use backend message if available, otherwise generic message
        return data?.message || data?.error || `An error occurred (${status})`
    }
  }

  // Handle standard Error objects
  if (error instanceof Error) {
    return error.message
  }

  // Handle string errors
  if (typeof error === 'string') {
    return error
  }

  // Fallback for unknown error types
  return 'An unexpected error occurred'
}

/**
 * Handle API errors with toast notifications
 */
export function handleApiError(error: unknown, context?: string): void {
  const message = getErrorMessage(error)
  const fullMessage = context ? `${context}: ${message}` : message

  toast.error(fullMessage, {
    duration: 5000,
    position: 'top-right',
  })
}

/**
 * Handle API success with toast notification
 */
export function handleApiSuccess(message: string): void {
  toast.success(message, {
    duration: 4000,
    position: 'top-right',
  })
}

/**
 * Wrap an async operation with error handling
 */
export async function withErrorHandling<T>(
  operation: () => Promise<T>,
  options?: {
    successMessage?: string
    errorContext?: string
    onSuccess?: (result: T) => void
    onError?: (error: unknown) => void
  }
): Promise<T | null> {
  try {
    const result = await operation()

    if (options?.successMessage) {
      handleApiSuccess(options.successMessage)
    }

    if (options?.onSuccess) {
      options.onSuccess(result)
    }

    return result
  } catch (error) {
    handleApiError(error, options?.errorContext)

    if (options?.onError) {
      options.onError(error)
    }

    return null
  }
}

/**
 * Check if error is a network error
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof Error && 'isAxiosError' in error) {
    const axiosError = error as AxiosError
    return (
      !axiosError.response &&
      (axiosError.code === 'ERR_NETWORK' ||
        axiosError.code === 'ECONNABORTED' ||
        axiosError.message.includes('Network Error'))
    )
  }
  return false
}

/**
 * Check if error is a specific HTTP status code
 */
export function isHttpError(error: unknown, statusCode: number): boolean {
  if (error instanceof Error && 'isAxiosError' in error) {
    const axiosError = error as AxiosError
    return axiosError.response?.status === statusCode
  }
  return false
}
