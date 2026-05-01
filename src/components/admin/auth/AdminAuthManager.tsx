/**
 * Admin Authentication Manager
 *
 * Manages TokenRefreshService lifecycle for admin authentication
 * Initializes service when admin is authenticated and cleans up on unmount
 *
 * **Validates: Requirements 4.4, 4.5**
 */

import { useEffect, useRef } from 'react'
import { useAuthStore } from '../../../store/admin/authStore'
import { TokenRefreshService } from '../../../services/TokenRefreshService'

export default function AdminAuthManager() {
  const { isAuthenticated } = useAuthStore()
  const tokenRefreshServiceRef = useRef<TokenRefreshService | null>(null)

  useEffect(() => {
    // Initialize token refresh service when user is authenticated
    if (isAuthenticated && !tokenRefreshServiceRef.current) {
      tokenRefreshServiceRef.current = new TokenRefreshService()
      console.info('TokenRefreshService initialized for admin session')
    }

    // Cleanup token refresh service when user logs out
    if (!isAuthenticated && tokenRefreshServiceRef.current) {
      tokenRefreshServiceRef.current.destroy()
      tokenRefreshServiceRef.current = null
      console.info('TokenRefreshService destroyed - admin logged out')
    }
  }, [isAuthenticated])

  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (tokenRefreshServiceRef.current) {
        tokenRefreshServiceRef.current.destroy()
        tokenRefreshServiceRef.current = null
        console.info('TokenRefreshService destroyed - component unmounted')
      }
    }
  }, [])

  // This component doesn't render anything
  return null
}
