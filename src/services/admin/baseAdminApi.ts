/**
 * Base Admin API Service
 *
 * Provides shared request handling and authentication for admin API services
 */

import { ApiResponse } from '../../types/content.types'

const API_URL = import.meta.env.PROD && !import.meta.env.VITE_API_URL 
  ? (() => { throw new Error('VITE_API_URL is missing in production environment') })() 
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000')

export class BaseAdminApiService {
  protected baseUrl: string
  constructor(baseUrl: string = API_URL) {
    this.baseUrl = baseUrl
  }

  protected async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    }

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        headers,
        credentials: 'include',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || `HTTP error! status: ${response.status}`)
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return undefined as T
      }

      const result: ApiResponse<T> = await response.json()

      if (!result.success) {
        throw new Error('API request failed')
      }

      return result.data
    } catch (error: any) {
      console.error(`Admin API Error [${endpoint}]:`, error)
      throw error
    }
  }

  protected async requestBlob(endpoint: string): Promise<Blob> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      credentials: 'include',
    })

    if (!response.ok) {
      throw new Error(`Request failed! status: ${response.status}`)
    }

    return response.blob()
  }
}
