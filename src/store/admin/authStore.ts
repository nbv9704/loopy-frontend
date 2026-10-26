import { create } from 'zustand'
import type { User, LoginCredentials } from '../../types/admin'
import { authApi } from '../../services/admin/authApi'
import { getAdminErrorMessage, getHttpStatus } from '../../services/admin/errors'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  error: string | null
  sessionRevision: number
  setAuth: (user: User) => void
  clearAuth: () => void
  login: (credentials: LoginCredentials) => Promise<void>
  logout: () => Promise<void>
  checkAuth: () => Promise<void>
}

export const useAuthStore = create<AuthState>()((set, get) => {
  let changingSession = false
  let checking: { revision: number; promise: Promise<void> } | null = null
  const signedOut = { user: null, isAuthenticated: false, isLoading: false, error: null }

  return {
    ...signedOut,
    isLoading: true,
    sessionRevision: 0,
    setAuth: user => {
      changingSession = false
      checking = null
      set({
        user,
        isAuthenticated: true,
        isLoading: false,
        error: null,
        sessionRevision: get().sessionRevision + 1,
      })
    },
    clearAuth: () => {
      changingSession = false
      checking = null
      set({ ...signedOut, sessionRevision: get().sessionRevision + 1 })
    },
    login: async credentials => {
      if (changingSession) throw new Error('Đang xử lý phiên đăng nhập. Vui lòng chờ.')
      const revision = get().sessionRevision + 1
      changingSession = true
      checking = null
      set({ ...signedOut, isLoading: true, sessionRevision: revision })
      try {
        const response = await authApi.login(credentials)
        if (get().sessionRevision !== revision)
          throw new Error('Yêu cầu đăng nhập đã hết hiệu lực.')
        if (!response.success || !response.user)
          throw new Error(response.message || 'Đăng nhập thất bại.')
        set({ user: response.user, isAuthenticated: true, isLoading: false, error: null })
      } catch (error) {
        const message = getAdminErrorMessage(error, 'Không đăng nhập được. Vui lòng thử lại.')
        if (get().sessionRevision === revision) set({ ...signedOut, error: message })
        throw new Error(message)
      } finally {
        if (get().sessionRevision === revision) changingSession = false
      }
    },
    logout: async () => {
      const revision = get().sessionRevision + 1
      changingSession = true
      checking = null
      // Invalidate pending checks immediately, even if the logout request fails.
      set({ ...signedOut, sessionRevision: revision })
      try {
        await authApi.logout()
      } catch {
        /* The local session is already cleared. */
      } finally {
        if (get().sessionRevision === revision) changingSession = false
      }
    },
    checkAuth: () => {
      const revision = get().sessionRevision
      if (changingSession) return Promise.resolve()
      if (checking?.revision === revision) return checking.promise
      if (!get().isAuthenticated) set({ isLoading: true, error: null })
      const pending = (async () => {
        try {
          const response = await authApi.checkAuth()
          if (get().sessionRevision !== revision) return
          if (!response.success || !response.user) {
            get().clearAuth()
            return
          }
          if (get().user && get().user?.id !== response.user.id) {
            get().setAuth(response.user)
            return
          }
          set({ user: response.user, isAuthenticated: true, isLoading: false, error: null })
        } catch (error) {
          if (get().sessionRevision !== revision) return
          if ([401, 403].includes(getHttpStatus(error) || 0)) {
            get().clearAuth()
            return
          }
          // A network/server failure does not prove that the cookie session expired.
          set({
            isLoading: false,
            error: getAdminErrorMessage(error, 'Không kiểm tra được phiên đăng nhập.'),
          })
        }
      })()
      checking = { revision, promise: pending }
      void pending.finally(() => {
        if (checking?.promise === pending) checking = null
      })
      return pending
    },
  }
})
