/**
 * Admin Authentication Manager
 *
 * Manages periodic session validation for admin authentication
 * Performs regular background checks to verify cookie session state is alive.
 */

import { useEffect } from 'react'
import { useAuthStore } from '../../../store/admin/authStore'

export default function AdminAuthManager() {
  const { isAuthenticated, checkAuth } = useAuthStore()

  useEffect(() => {
    if (!isAuthenticated) return

    // Run a background session health check every 2 minutes
    const interval = setInterval(() => {
      checkAuth().catch(err => {
        console.warn('Admin session health check failed:', err)
      })
    }, 2 * 60 * 1000)

    return () => clearInterval(interval)
  }, [isAuthenticated, checkAuth])

  // This component doesn't render anything
  return null
}
