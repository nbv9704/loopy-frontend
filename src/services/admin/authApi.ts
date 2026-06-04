import apiClient from './apiClient'
import type { LoginCredentials, AuthResponse } from '../../types/admin'

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<AuthResponse> => {
    const { data } = await apiClient.post<AuthResponse>('/api/admin-auth/login', credentials)
    return data
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/api/admin-auth/logout')
  },

  checkAuth: async (): Promise<AuthResponse> => {
    const { data } = await apiClient.get<AuthResponse>('/api/admin-auth/me')
    return data
  },
}
