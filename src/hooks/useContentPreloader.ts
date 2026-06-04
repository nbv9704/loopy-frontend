/**
 * useContentPreloader Hook - Fetch multiple content keys at once
 *
 * Fetches multiple content items in parallel with:
 * - Batch loading for better UX
 * - localStorage caching (5 minute TTL)
 * - Fallback to i18n keys when content not found
 * - Error handling and loading states
 *
 * Prevents fallback text flash by loading all content before rendering
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'
import { getCachedContent, getCacheKey } from './useContent'

export interface ContentMap {
  [key: string]: string | null
}

export interface UseContentPreloaderState {
  content: ContentMap
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

/**
 * useContentPreloader Hook
 *
 * Fetches multiple content items in parallel with loading state.
 * Prevents UI from rendering until all content is ready.
 *
 * @param keys - Array of content keys to fetch
 * @param language - Optional language ('vi' or 'en'), defaults to current i18n language
 * @returns Object with content map, loading state, error, and refetch function
 *
 * @example
 * const { content, loading } = useContentPreloader([
 *   'landing.hero.title',
 *   'landing.hero.subtitle',
 *   'landing.cta.primary'
 * ], 'vi')
 *
 * if (loading) return <LoadingScreen />
 * return <h1>{content['landing.hero.title']}</h1>
 */
export function useContentPreloader(
  keys: string[],
  language?: string
): UseContentPreloaderState {
  const { i18n } = useTranslation()
  const [content, setContent] = useState<ContentMap>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const lang = language || i18n.language
  const cacheKey = getCacheKey(undefined, lang)
  const keysString = keys.join(',') // Stringify keys to prevent infinite loop

  const fetchContent = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Try to get all content from cache first
      const cachedContent = getCachedContent(cacheKey)
      const contentMap: ContentMap = {}
      const keysToFetch: string[] = []

      // Check which keys are in cache
      if (cachedContent) {
        keys.forEach(key => {
          const item = cachedContent.find(c => c.key === key)
          if (item) {
            contentMap[key] = item.value
          } else {
            keysToFetch.push(key)
          }
        })
      } else {
        keysToFetch.push(...keys)
      }

      // If all keys are cached, return immediately
      if (keysToFetch.length === 0) {
        setContent(contentMap)
        setLoading(false)
        return
      }

      const resolveWithI18nFallback = (key: string): string | null => {
        const i18nValue = i18n.t(key, { defaultValue: null })
        return i18nValue && i18nValue !== key ? i18nValue : null
      }

      const fetchSingleKeyFallback = async (key: string): Promise<{ key: string; value: string | null }> => {
        try {
          const params = new URLSearchParams()
          params.append('language', lang as string)

          const response = await api.request<any>(
            `/api/content/${key}?${params.toString()}`,
            { suppressAuthToast: true }
          )

          if (response.success && response.data) {
            return { key, value: response.data.value }
          }
        } catch {
          // Fall through to i18n fallback below.
        }

        return { key, value: resolveWithI18nFallback(key) }
      }

      try {
        const response = await api.request<{
          items: Record<string, string>
          missingKeys: string[]
        }>('/api/content/batch', {
          method: 'POST',
          body: JSON.stringify({
            keys: keysToFetch,
            language: lang,
          }),
          suppressAuthToast: true,
        })

        if (response.success && response.data) {
          keysToFetch.forEach(key => {
            const value = response.data?.items[key]
            contentMap[key] = value ?? resolveWithI18nFallback(key)
          })
        } else {
          const results = await Promise.all(keysToFetch.map(fetchSingleKeyFallback))
          results.forEach(({ key, value }) => {
            contentMap[key] = value
          })
        }
      } catch {
        const results = await Promise.all(keysToFetch.map(fetchSingleKeyFallback))
        results.forEach(({ key, value }) => {
          contentMap[key] = value
        })
      }

      setContent(contentMap)
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch content'
      setError(errorMsg)
      setContent({})
    } finally {
      setLoading(false)
    }
  }, [keysString, lang, cacheKey, i18n])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  return {
    content,
    loading,
    error,
    refetch: fetchContent,
  }
}
