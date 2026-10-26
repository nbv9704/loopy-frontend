import { useCallback } from 'react'
import { useAsyncResource } from '../../hooks/useAsyncResource'
import { profileService } from './profile.service'

export function useProfileOverview(userId?: string) {
  const load = useCallback((signal: AbortSignal) => profileService.getStats(signal), [])
  return useAsyncResource(userId ? `profile-progress:${userId}` : null, load)
}
