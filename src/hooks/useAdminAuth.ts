/**
 * Admin Authentication Hook
 *
 * Provides authentication state management for admin users
 * Uses Zustand for state persistence
 *
 * - Manages authentication state (user, isAuthenticated)
 * - Provides login function
 * - Provides logout function
 * - Uses Zustand for state persistence
 * - Integrates with existing auth API
 */

import { useAuthStore } from '../store/admin/authStore'
import type { LoginCredentials } from '../types/admin'

/**
 * Hook to manage admin authentication state
 *
 * @returns Authentication state and functions
 * - user: Current authenticated user or null
 * - isAuthenticated: Whether user is authenticated
 * - isAdmin: Whether user has admin role
 * - isLoading: Whether auth operation is in progress
 * - error: Error message if auth operation failed
 * - login: Function to log in with credentials
 * - logout: Function to log out
 * - checkAuth: Function to verify current auth status
 */
export const useAdminAuth = () => {
  const { user, isAuthenticated, isLoading, error, login, logout, checkAuth } =
    useAuthStore()

  // Check if user has admin role - check both role field and is_admin flag
  const isAdmin = user?.role === 'admin' || user?.is_admin === true

  return {
    user,
    isAuthenticated,
    isAdmin,
    isLoading,
    error,
    login: async (credentials: LoginCredentials) => {
      await login(credentials)
    },
    logout: async () => {
      await logout()
    },
    checkAuth: async () => {
      await checkAuth()
    },
  }
}
