import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { loadContentKeys, readContentKeys, type ContentKeyResult } from '../lib/contentRequests'
import { clearContentCache } from '../lib/contentCache'
import { useAsyncResource } from './useAsyncResource'
import { useContentCacheRevision } from './useContentCacheRevision'
import { isUntranslatedContent } from '../i18n/contentText'

export interface ContentMap {
  [key: string]: string | null
}
export interface UseContentPreloaderState {
  content: ContentMap
  loading: boolean
  initialLoading: boolean
  error: string | null
  refetch: () => void
}

/** Public CMS text, scoped to exact keys/language; missing keys fall back to i18n. */
export function useContentPreloader(keys: string[], language?: string): UseContentPreloaderState {
  const { i18n } = useTranslation()
  const revision = useContentCacheRevision()
  const lang = language || i18n.language
  const keysKey = JSON.stringify([...new Set(keys.map(key => key.trim()).filter(Boolean))].sort())
  const fallbacks = useMemo(() => {
    const values: ContentMap = Object.create(null)
    for (const key of JSON.parse(keysKey) as string[]) {
      const value = i18n.t(key, { lng: lang, defaultValue: null })
      values[key] = typeof value === 'string' && !isUntranslatedContent(key, value) ? value : null
    }
    return values
  }, [keysKey, lang, i18n])
  const resolveContent = useCallback(
    (result: ContentKeyResult) => {
      const content: ContentMap = Object.create(null)
      for (const key of JSON.parse(keysKey) as string[]) {
        content[key] = result.items[key] ?? fallbacks[key]
      }
      return { content, error: result.error }
    },
    [keysKey, fallbacks]
  )
  const load = useCallback(
    async (signal: AbortSignal) => {
      const requestedKeys: string[] = JSON.parse(keysKey)
      const result = await loadContentKeys(requestedKeys, lang, revision)
      if (signal.aborted) throw new DOMException('Aborted', 'AbortError')
      return resolveContent(result)
    },
    [keysKey, lang, revision, resolveContent]
  )
  const resource = useAsyncResource(JSON.stringify([keysKey, lang, revision]), load)
  const cached = readContentKeys(JSON.parse(keysKey), lang, revision)
  const settled = cached ? resolveContent(cached) : resource.data
  const loading = !cached && resource.loading
  const hasSettled = useRef(false)
  useEffect(() => {
    if (!loading) hasSettled.current = true
  }, [loading])
  return {
    content: settled?.content ?? Object.create(null),
    loading,
    // Optional copy refreshes must not unmount editors, forms or pending actions.
    initialLoading: loading && !hasSettled.current,
    error: resource.error ?? settled?.error ?? null,
    refetch: clearContentCache,
  }
}
