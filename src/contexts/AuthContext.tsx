import {
  profileToUser as mapProfileToUser,
  mergeProfileSnapshot,
  type AuthUser as User,
} from '../features/auth/userProfile'
import { readAuthIdentity } from '../features/auth/authResponse'
/**
 * Authentication Context
 *
 * Manages user authentication state across the app using backend API
 *
 * SECURITY UPDATE: Tokens are now stored in httpOnly cookies (backend-managed)
 * - No more localStorage token storage (XSS protection)
 * - Cookies are automatically sent with every request
 * - Backend sets/clears cookies on login/logout
 */

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import InterfaceLoadingScreen from '../features/interface-preparation/InterfaceLoadingScreen'
import { interfaceLanguage } from '../i18n/language'
import { isUserProfileSnapshot, type UserProfileSnapshot } from '../features/auth/profileSnapshot'

interface AuthContextType {
  user: User | null
  loading: boolean
  authError: string | null
  retryAuth: () => void
  signUp: (email: string, password: string, displayName?: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<{ warning?: string }>
  refreshUser: (confirmedProfile?: UserProfileSnapshot) => Promise<void>
}

// REMOVED: parseJwt function (no longer needed - tokens in httpOnly cookies)
// REMOVED: scheduleTokenRefresh function (backend handles token refresh)
// REMOVED: refreshAuthToken function (backend handles token refresh)

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const { i18n } = useTranslation()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [authError, setAuthError] = useState<string | null>(null)
  const [bootstrapAttempt, setBootstrapAttempt] = useState(0)
  const logoutRequest = useRef<Promise<{ warning?: string }> | null>(null)
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const authEpoch = useRef(0)
  const bootstrapRequest = useRef<{
    epoch: number
    promise: ReturnType<typeof api.getCurrentUser>
  } | null>(null)

  /**
   * Clear auto-refresh interval on unmount or logout
   */
  const stopAutoRefresh = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current)
      refreshIntervalRef.current = null
    }
  }

  /**
   * Start auto-refresh interval - refresh token every 14 minutes
   * (Access token expires in 15 minutes, so refresh 1 minute before expiry)
   */
  const startAutoRefresh = () => {
    stopAutoRefresh() // Clear any existing interval

    const REFRESH_INTERVAL = 14 * 60 * 1000 // 14 minutes

    refreshIntervalRef.current = setInterval(async () => {
      const epoch = authEpoch.current
      try {
        const response = await api.refreshToken()
        if (epoch !== authEpoch.current) return
        if (!response.success && response.error?.status === 401) {
          // Refresh failed, logout user
          console.warn('Token refresh failed, logging out')
          ++authEpoch.current
          setUser(null)
          stopAutoRefresh()
        }
      } catch (error) {
        // A transport failure does not prove that the server session expired.
        console.error('Token refresh error:', error)
      }
    }, REFRESH_INTERVAL)
  }

  useEffect(() => {
    let active = true
    const epoch = authEpoch.current
    // Check if user is logged in by calling /api/auth/me
    // Tokens are now in httpOnly cookies, so we can't read them directly
    const checkAuth = async () => {
      try {
        // StrictMode replays the mount effect; share the read within this provider only.
        if (bootstrapRequest.current?.epoch !== epoch)
          bootstrapRequest.current = { epoch, promise: api.getCurrentUser() }
        const response = await bootstrapRequest.current.promise
        if (!active || epoch !== authEpoch.current) return
        if (response.success && response.data) {
          const userData = readAuthIdentity(response.data)
          const newUser = mapProfileToUser({ ...userData.profile, id: userData.id }, userData.email)
          setAuthError(null)
          setUser(newUser)
          // Start auto-refresh when user is authenticated
          startAutoRefresh()
        } else if (response.error?.status !== 401) {
          setAuthError(
            response.error?.message || 'Chưa kiểm tra được phiên đăng nhập. Vui lòng thử lại.'
          )
        }
      } catch (error) {
        if (active && epoch === authEpoch.current) {
          setUser(null)
          setAuthError(
            error instanceof Error ? error.message : 'Chưa kiểm tra được phiên đăng nhập.'
          )
        }
      } finally {
        if (active && epoch === authEpoch.current) setLoading(false)
      }
    }

    checkAuth()

    // Cleanup interval on unmount
    return () => {
      active = false
      stopAutoRefresh()
    }
  }, [bootstrapAttempt])

  const retryAuth = () => {
    if (user || loading) return
    ++authEpoch.current
    bootstrapRequest.current = null
    setAuthError(null)
    setLoading(true)
    setBootstrapAttempt(attempt => attempt + 1)
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    const epoch = ++authEpoch.current
    const response = await api.signup(email, password, displayName)
    if (epoch !== authEpoch.current) throw new Error('Yêu cầu đăng ký đã hết hiệu lực.')

    if (!response.success) {
      throw new Error(response.error?.message || 'Đăng ký thất bại')
    }

    const userData = readAuthIdentity(response.data)
    const { message, requiresEmailConfirmation } = response.data as {
      message?: string
      requiresEmailConfirmation?: boolean
    }

    // Check if email confirmation is required
    if (requiresEmailConfirmation === true) {
      return {
        success: true,
        requiresEmailConfirmation: true,
        message: message || 'Vui lòng kiểm tra email để xác nhận tài khoản',
      }
    }

    // Development mode: Auto login (tokens are in httpOnly cookies)
    const newUser: User = {
      id: userData.id,
      email: userData.email,
      displayName: displayName || userData.email?.split('@')[0],
    }

    setAuthError(null)
    setUser(newUser)
    startAutoRefresh()

    return {
      success: true,
      requiresEmailConfirmation: false,
      message: message || 'Đăng ký thành công',
      user: newUser,
    }
  }

  const signIn = async (email: string, password: string) => {
    const epoch = ++authEpoch.current
    const response = await api.login(email, password)
    if (epoch !== authEpoch.current) throw new Error('Yêu cầu đăng nhập đã hết hiệu lực.')

    if (!response.success) {
      throw new Error(response.error?.message || 'Đăng nhập thất bại')
    }

    const userData = readAuthIdentity(response.data)

    // Set basic user first (tokens are now in httpOnly cookies set by backend)
    const newUser: User = {
      id: userData.id,
      email: userData.email,
      displayName: userData.email?.split('@')[0],
    }

    setAuthError(null)
    setUser(newUser)
    // Start auto-refresh after successful login
    startAutoRefresh()

    // Immediately fetch full profile to get onboarding fields
    try {
      const profileRes = await api.getMyProfile()
      if (epoch !== authEpoch.current) throw new Error('Yêu cầu đăng nhập đã hết hiệu lực.')
      if (profileRes.success && profileRes.data) {
        const profileData = (profileRes.data as { profile: Record<string, any> }).profile
        if (!isUserProfileSnapshot(profileData) || profileData.id !== userData.id)
          return { ...response, user: newUser }
        const updatedUser = mapProfileToUser(profileData, userData.email)
        setUser(updatedUser)
        return { ...response, user: updatedUser }
      }
    } catch {
      // Profile fetch failed — user still logged in with basic info
    }

    if (epoch !== authEpoch.current) throw new Error('Yêu cầu đăng nhập đã hết hiệu lực.')
    return { ...response, user: newUser }
  }

  const signOut = (): Promise<{ warning?: string }> => {
    if (logoutRequest.current) return logoutRequest.current
    const epoch = ++authEpoch.current
    logoutRequest.current = (async () => {
      const response = await api.logout()
      // This acknowledgement guarantees the response cleared the browser cookies,
      // although provider-side revocation may still need a retry.
      const warning =
        response.error?.code === 'AUTH_LOGOUT_FAILED' ? response.error.message : undefined
      if (!response.success && !warning)
        throw new Error(response.error?.message || 'Chưa đăng xuất được. Vui lòng thử lại.')
      if (epoch === authEpoch.current) {
        setUser(null)
        setAuthError(null)
        stopAutoRefresh()
      }
      return { warning }
    })().finally(() => {
      logoutRequest.current = null
    })
    return logoutRequest.current
  }

  // Merge confirmed fields after a successful write without a second fallible read.
  const refreshUser = async (confirmedProfile?: UserProfileSnapshot) => {
    const epoch = authEpoch.current
    let profile: unknown = confirmedProfile
    if (!profile) {
      const response = await api.getMyProfile()
      if (!response.success || !response.data) return
      profile = (response.data as { profile?: unknown }).profile
    }
    if (epoch !== authEpoch.current || !isUserProfileSnapshot(profile)) return
    const snapshot = profile
    setUser(current =>
      epoch === authEpoch.current && current?.id === snapshot.id
        ? mergeProfileSnapshot(current, snapshot)
        : current
    )
  }

  const value = {
    user,
    loading,
    authError,
    retryAuth,
    signUp,
    signIn,
    signOut,
    refreshUser,
  }

  if (loading) {
    return <InterfaceLoadingScreen language={interfaceLanguage(i18n?.language)} />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
