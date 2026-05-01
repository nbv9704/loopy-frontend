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
      } catch (error) {
        console.error('Error parsing user data:', error)
        localStorage.removeItem('auth_token')
        localStorage.removeItem('user_data')
      }
    }

    setLoading(false)
  }, [])

  const signUp = async (email: string, password: string, displayName?: string) => {
    const response = await api.signup(email, password, displayName)

    if (!response.success) {
      throw new Error(response.error?.message || 'Đăng ký thất bại')
    }

    const { user: userData, session } = response.data as any
    const token = session?.access_token

    if (!token) {
      throw new Error('No access token received')
    }

    const newUser: User = {
      id: userData.id,
      email: userData.email,
      displayName: displayName || userData.email?.split('@')[0],
    }

    setUser(newUser)
    api.setToken(token)
    localStorage.setItem('auth_token', token)
    localStorage.setItem('user_data', JSON.stringify(newUser))

    return response
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
    localStorage.setItem('user_data', JSON.stringify(newUser))

    return response
  }

  const signOut = async () => {
    await api.logout()
    setUser(null)
    api.setToken(null)
    localStorage.removeItem('auth_token')
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
