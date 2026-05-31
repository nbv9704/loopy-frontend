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
import { LoadingScreen } from '../components/v2/LoadingScreen'

interface User {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
  learningGoal?: string
  onboardingCompleted?: boolean
  experienceLevel?: string
  currentPathId?: string
  points?: number
  currentStreak?: number
  preferredLanguage?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, displayName?: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
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
  const { t } = useTranslation()
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const refreshIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      try {
        const response = await api.refreshToken()
        if (!response.success) {
          // Refresh failed, logout user
          console.warn('Token refresh failed, logging out')
          setUser(null)
          stopAutoRefresh()
        }
      } catch (error) {
        // Network error or server error, logout user
        console.error('Token refresh error:', error)
        setUser(null)
        stopAutoRefresh()
      }
    }, REFRESH_INTERVAL)
  }

  useEffect(() => {
    // Check if user is logged in by calling /api/auth/me
    // Tokens are now in httpOnly cookies, so we can't read them directly
    const checkAuth = async () => {
      try {
        const response = await api.getCurrentUser()
        if (response.success && response.data) {
          const userData = (
            response.data as {
              user: User & { profile?: { avatarUrl?: string; displayName?: string; learningGoal?: string; onboardingCompleted?: boolean; experienceLevel?: string; currentPathId?: string; points?: number; currentStreak?: number; preferredLanguage?: string; } }
            }
          ).user
          const newUser: User = {
            id: userData.id,
            email: userData.email,
            displayName: userData.profile?.displayName || userData.email?.split('@')[0],
            avatarUrl: userData.profile?.avatarUrl,
            learningGoal: userData.profile?.learningGoal,
            onboardingCompleted: userData.profile?.onboardingCompleted,
            experienceLevel: userData.profile?.experienceLevel,
            currentPathId: userData.profile?.currentPathId,
            points: userData.profile?.points,
            currentStreak: userData.profile?.currentStreak,
            preferredLanguage: userData.profile?.preferredLanguage,
          }
          setUser(newUser)
          // Start auto-refresh when user is authenticated
          startAutoRefresh()
        }
      } catch (error) {
        // Not authenticated or token expired
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    checkAuth()

    // Cleanup interval on unmount
    return () => {
      stopAutoRefresh()
    }
  }, [])

  const signUp = async (email: string, password: string, displayName?: string) => {
    const response = await api.signup(email, password, displayName)

    if (!response.success) {
      throw new Error(response.error?.message || 'Đăng ký thất bại')
    }

    const { user: userData, message, requiresEmailConfirmation } = response.data as { user: User; message: string; requiresEmailConfirmation?: boolean }

    // Check if email confirmation is required
    if (requiresEmailConfirmation || !userData) {
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

    setUser(newUser)

    return {
      success: true,
      requiresEmailConfirmation: false,
      message: message || 'Đăng ký thành công',
    }
  }

  const signIn = async (email: string, password: string) => {
    const response = await api.login(email, password)

    if (!response.success) {
      throw new Error(response.error?.message || 'Đăng nhập thất bại')
    }

    const { user: userData } = response.data as { user: User }

    // Set basic user first (tokens are now in httpOnly cookies set by backend)
    const newUser: User = {
      id: userData.id,
      email: userData.email,
      displayName: userData.email?.split('@')[0],
    }

    setUser(newUser)
    // Start auto-refresh after successful login
    startAutoRefresh()

    // Immediately fetch full profile to get onboarding fields
    try {
      const profileRes = await api.getMyProfile()
      if (profileRes.success && profileRes.data) {
        const profileData = (profileRes.data as { profile: Record<string, any> }).profile
        const updatedUser = {
          id: profileData.id,
          email: userData.email,
          displayName: profileData.displayName || userData.email?.split('@')[0],
          avatarUrl: profileData.avatarUrl,
          learningGoal: profileData.learningGoal,
          onboardingCompleted: profileData.onboardingCompleted,
          experienceLevel: profileData.experienceLevel,
          currentPathId: profileData.currentPathId,
          points: profileData.points,
          currentStreak: profileData.currentStreak,
          preferredLanguage: profileData.preferredLanguage,
        }
        setUser(updatedUser)
        return { ...response, user: updatedUser }
      }
    } catch {
      // Profile fetch failed — user still logged in with basic info
    }

    return { ...response, user: newUser }
  }

  const signOut = async () => {
    await api.logout()
    setUser(null)
    stopAutoRefresh()
    // Cookies are cleared by backend
  }

  const refreshUser = async () => {
    const response = await api.getMyProfile()
    if (response.success && response.data) {
      const profileData = (
        response.data as { profile: Record<string, any> }
      ).profile
      const newUser: User = {
        id: profileData.id,
        email: user?.email || '',
        displayName: profileData.displayName,
        avatarUrl: profileData.avatarUrl,
        learningGoal: profileData.learningGoal,
        onboardingCompleted: profileData.onboardingCompleted,
        experienceLevel: profileData.experienceLevel,
        currentPathId: profileData.currentPathId,
        points: profileData.points,
        currentStreak: profileData.currentStreak,
        preferredLanguage: profileData.preferredLanguage,
      }
      setUser(newUser)
    }
  }

  const value = {
    user,
    loading,
    signUp,
    signIn,
    signOut,
    refreshUser,
  }

  if (loading) {
    return <LoadingScreen message={t('common.initializing')} />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
