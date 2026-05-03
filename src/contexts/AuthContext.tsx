/**
 * Authentication Context
 *
 * Manages user authentication state across the app using backend API
 */

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import FullscreenLoader from '../components/common/FullscreenLoader'

interface User {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
}

interface AuthContextType {
  user: User | null
  loading: boolean
  signUp: (email: string, password: string, displayName?: string) => Promise<any>
  signIn: (email: string, password: string) => Promise<any>
  signOut: () => Promise<void>
  refreshUser: () => Promise<void>
}

const parseJwt = (token: string) => {
  try {
    return JSON.parse(atob(token.split('.')[1]))
  } catch (e) {
    return null
  }
}

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

  useEffect(() => {
    // Check if user is logged in from localStorage
    const token = localStorage.getItem('auth_token')
    const userData = localStorage.getItem('user_data')

    if (token && userData) {
      try {
        const parsedUser = JSON.parse(userData)
        setUser(parsedUser)
        api.setToken(token)
        scheduleTokenRefresh(token)
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
        localStorage.removeItem('refresh_token')
      }
    }

    setLoading(false)
  }, [])

  const scheduleTokenRefresh = (token: string) => {
    const decoded = parseJwt(token)
    if (!decoded || !decoded.exp) return

    // Calculate time until expiry in milliseconds
    const timeUntilExpiry = decoded.exp * 1000 - Date.now()
    
    // Refresh 5 minutes before expiry
    const refreshTime = timeUntilExpiry - 5 * 60 * 1000

    if (refreshTime <= 0) {
      refreshAuthToken()
    } else {
      setTimeout(() => {
        refreshAuthToken()
      }, refreshTime)
    }
  }

  const refreshAuthToken = async () => {
    const refreshToken = localStorage.getItem('refresh_token')
    if (!refreshToken) return

    try {
      const response = await api.refreshToken(refreshToken)
      if (response.success && (response.data as any)?.session) {
        const { access_token, refresh_token: new_refresh_token } = (response.data as any).session
        
        api.setToken(access_token)
        localStorage.setItem('auth_token', access_token)
        if (new_refresh_token) {
          localStorage.setItem('refresh_token', new_refresh_token)
        }
        
        // Dispatch event for other listeners (like PvP Socket)
        window.dispatchEvent(
          new CustomEvent('auth:token_refreshed', { detail: { token: access_token } })
        )

        scheduleTokenRefresh(access_token)
      } else {
        signOut()
      }
    } catch (error) {
      console.error('Failed to refresh token:', error)
      signOut()
    }
  }

  const signUp = async (email: string, password: string, displayName?: string) => {
    const response = await api.signup(email, password, displayName)

    if (!response.success) {
      throw new Error(response.error?.message || 'Đăng ký thất bại')
    }

    const { user: userData, session, message } = response.data as any
    const token = session?.access_token

    // Production mode: No session returned (email confirmation required)
    if (!token) {
      // Return success message without logging in
      return {
        success: true,
        requiresEmailConfirmation: true,
        message: message || 'Vui lòng kiểm tra email để xác nhận tài khoản',
      }
    }

    // Development mode: Session returned, auto login
    const newUser: User = {
      id: userData.id,
      email: userData.email,
      displayName: displayName || userData.email?.split('@')[0],
    }

    setUser(newUser)
    api.setToken(token)
    localStorage.setItem('auth_token', token)
    if (session?.refresh_token) {
      localStorage.setItem('refresh_token', session.refresh_token)
    }
    localStorage.setItem('user_data', JSON.stringify(newUser))
    scheduleTokenRefresh(token)

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

    const { user: userData, session } = response.data as any
    const token = session?.access_token

    if (!token) {
      throw new Error('No access token received')
    }

    const newUser: User = {
      id: userData.id,
      email: userData.email,
      displayName: userData.email?.split('@')[0],
    }

    setUser(newUser)
    api.setToken(token)
    localStorage.setItem('auth_token', token)
    if (session?.refresh_token) {
      localStorage.setItem('refresh_token', session.refresh_token)
    }
    localStorage.setItem('user_data', JSON.stringify(newUser))
    scheduleTokenRefresh(token)

    return response
  }

  const signOut = async () => {
    await api.logout()
    setUser(null)
    api.setToken(null)
    localStorage.removeItem('auth_token')
    localStorage.removeItem('refresh_token')
    localStorage.removeItem('user_data')
  }

  const refreshUser = async () => {
    const response = await api.getMyProfile()
    if (response.success && response.data) {
      const profileData = (response.data as any).profile
      const newUser: User = {
        id: profileData.id,
        email: user?.email || '',
        displayName: profileData.display_name,
        avatarUrl: profileData.avatar_url,
      }
      setUser(newUser)
      localStorage.setItem('user_data', JSON.stringify(newUser))
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
    return <FullscreenLoader message={t('common.initializing')} />
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
