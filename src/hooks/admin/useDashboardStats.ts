import { useQuery } from '@tanstack/react-query'
import { dashboardService } from '../../services/admin/dashboard.service'

export function useDashboardStats() {
  return useQuery({
    queryKey: ['admin', 'dashboard', 'stats'],
    queryFn: () => dashboardService.getStats(),
    refetchInterval: 30000,
    refetchOnWindowFocus: false,
    placeholderData: previousData => previousData,
  })
}
