import { useSyncExternalStore } from 'react'
import {
  getContentCacheRevision,
  getServerContentCacheRevision,
  subscribeContentCache,
} from '../lib/contentCache'

export function useContentCacheRevision() {
  return useSyncExternalStore(
    subscribeContentCache,
    getContentCacheRevision,
    getServerContentCacheRevision
  )
}
