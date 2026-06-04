import { create } from 'zustand'
import type { User, LoginCredentials } from '../../types/admin'
import { authApi } from '../../services/admin/authApi'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  setAuth: (user: User) => void
  clearAuth: () => void
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set, get) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  error: null,

  setAuth: user =>
    set({
      user,
      isAuthenticated: true,
      error: null,
    }),

  clearAuth: () =>
    set({
      user: null,
      isAuthenticated: false,
      error: null,
    }),

  login: async (credentials: LoginCredentials) => {
    set({ isLoading: true, error: null })
    try {
      const response = await authApi.login(credentials)

      if (response.success && response.user) {
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
      } else {
        throw new Error(response.message || 'Login failed')
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed'
      set({
        isLoading: false,
        error: errorMessage,
        isAuthenticated: false,
        user: null,
      })
      throw error
    }
  },

  logout: async () => {
    set({ isLoading: true, error: null })
    try {
      await authApi.logout()
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    } catch (error) {
      // Even if logout API fails, clear local state
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  },

  checkAuth: async () => {
    // Only show loading state if we are not already authenticated
    // This prevents background polling from unmounting the UI (e.g. LessonEditor)
    if (!get().isAuthenticated) {
      set({ isLoading: true, error: null })
    }
    
    try {
      const response = await authApi.checkAuth()

      if (response.success && response.user) {
        set({
          user: response.user,
          isAuthenticated: true,
          isLoading: false,
          error: null,
        })
      } else {
        set({
          user: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        })
      }
    } catch (error) {
      set({
        user: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      })
    }
  },
}))

// Automatically trigger initial auth check on bundle load to bootstrap session
useAuthStore.getState().checkAuth().catch(err => {
  console.warn('Initial session bootstrap failed:', err)
})
