import { useCallback } from 'react'
import { useLocation } from 'react-router-dom'
import { dashboardService } from '../../services/admin/dashboard.service'
import { useAuthStore } from '../../store/admin/authStore'
import { useAsyncResource } from '../useAsyncResource'

export function useDashboardStats() {
  const revision = useAuthStore(state => state.sessionRevision)
  const location = useLocation()
  const load = useCallback((signal: AbortSignal) => dashboardService.getStats(signal), [])
  const resource = useAsyncResource(JSON.stringify([revision, location.key]), load)
  return {
    data: resource.data,
    error: resource.error,
    isLoading: resource.loading,
    isFetching: resource.loading,
    refresh: resource.retry,
  }
}
