import { useCallback } from 'react'
import { practiceService, type ListPracticeSetsParams } from '../services/practice.service'
import { useAsyncResource } from './useAsyncResource'

export function usePracticeSets(
  params: ListPracticeSetsParams,
  identity = 'guest',
  enabled = true
) {
  // These request parameters contain scalar values only; avoid a fetch on each object render.
  const requestKey = JSON.stringify(params)
  const load = useCallback(
    (signal: AbortSignal) => practiceService.listSets(JSON.parse(requestKey), signal),
    [requestKey]
  )
  const resource = useAsyncResource(enabled ? JSON.stringify([requestKey, identity]) : null, load)
  return {
    sets: resource.data?.items || [],
    setsLoading: resource.loading,
    setsError: resource.error,
    retrySets: resource.retry,
  }
}
