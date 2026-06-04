/**
 * useContent Hook - Fetch content from CMS API
 *
 * Fetches content items from the backend API with:
 * - localStorage caching (5 minute TTL)
 * - Fallback to i18n keys when content not found
 * - Error handling and loading states
 *
 * Implements Requirement 3.1: Create useContent Hook
 */

import { useState, useEffect, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { api } from '../lib/api'

export interface ContentItem {
  id: string
  categoryId: string
  key: string
  language: 'vi' | 'en'
  value: string
  description?: string
  type: 'text' | 'markdown' | 'html'
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
}

export interface UseContentState {
  content: ContentItem[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

const CACHE_KEY_PREFIX = 'loopy_content_cache_'
const CACHE_TTL = 5 * 60 * 1000 // 5 minutes in milliseconds

/**
 * Get cache key for content query
 */
export function getCacheKey(category?: string, language?: string): string {
  const parts = [CACHE_KEY_PREFIX]
  if (category) parts.push(`cat_${category}`)
  if (language) parts.push(`lang_${language}`)
  return parts.join('_')
}

/**
 * Get cached content if valid
 */
export function getCachedContent(cacheKey: string): ContentItem[] | null {
  try {
    const cached = localStorage.getItem(cacheKey)
    if (!cached) return null

    const { data, timestamp } = JSON.parse(cached)
    const now = Date.now()

    // Check if cache is still valid
    if (now - timestamp > CACHE_TTL) {
      localStorage.removeItem(cacheKey)
      return null
    }

    return data
  } catch (error) {
    console.error('Error reading from cache:', error)
    return null
  }
}

/**
 * Set content in cache
 */
export function setCachedContent(cacheKey: string, data: ContentItem[]): void {
  try {
    localStorage.setItem(
      cacheKey,
      JSON.stringify({
        data,
        timestamp: Date.now(),
      })
    )
  } catch (error) {
    console.error('Error writing to cache:', error)
  }
}

export function clearContentCache(): void {
  try {
    Object.keys(localStorage)
      .filter(key => key.startsWith(CACHE_KEY_PREFIX))
      .forEach(key => localStorage.removeItem(key))
  } catch (error) {
    console.error('Error clearing content cache:', error)
  }
}

/**
 * useContent Hook
 *
 * Fetches content items from the API with caching and fallback support.
 *
 * @param category - Optional category filter (e.g., 'header', 'footer', 'landing')
 * @param language - Optional language filter ('vi' or 'en')
 * @returns Object with content items, loading state, error, and refetch function
 *
 * @example
 * const { content, loading, error, refetch } = useContent('header', 'vi')
 * if (loading) return <div>Loading...</div>
 * if (error) return <div>Error: {error}</div>
 * return <div>{content.map(item => <p key={item.id}>{item.value}</p>)}</div>
 */
export function useContent(category?: string, language?: string): UseContentState {
  const [content, setContent] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchContent = useCallback(async () => {
    const cacheKey = getCacheKey(category, language)

    // Try to get from cache first
    const cachedContent = getCachedContent(cacheKey)
    if (cachedContent) {
      setContent(cachedContent)
      setLoading(false)
      setError(null)
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (language) params.append('language', language)

      const response = await api.request<{
        items: ContentItem[]
        total: number
        limit: number
        offset: number
      }>(`/api/content?${params.toString()}`)

      if (response.success && response.data) {
        const items = response.data.items || []
        setContent(items)
        setCachedContent(cacheKey, items)
        setError(null)
      } else {
        const errorMsg = response.error?.message || 'Failed to fetch content'
        setError(errorMsg)
        setContent([])
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error occurred'
      setError(errorMsg)
      setContent([])
    } finally {
      setLoading(false)
    }
  }, [category, language])

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

/**
 * useContentByKey Hook
 *
 * Fetches a single content item by key with fallback to i18n.
 *
 * @param key - Content key (e.g., 'nav.learn', 'landing.hero.title')
 * @param language - Optional language ('vi' or 'en'), defaults to current i18n language
 * @returns Object with content value, loading state, error, and refetch function
 *
 * @example
 * const { value, loading, error } = useContentByKey('nav.learn')
 * return <span>{value || 'Fallback text'}</span>
 */
export function useContentByKey(key: string, language?: string): {
  value: string | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
} {
  const { i18n } = useTranslation()
  const [value, setValue] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const lang = language || i18n.language
  const cacheKey = getCacheKey(undefined, lang)

  const fetchContent = useCallback(async () => {
    // Try cache first
    const cachedContent = getCachedContent(cacheKey)
    if (cachedContent) {
      const item = cachedContent.find(c => c.key === key)
      if (item) {
        setValue(item.value)
        setLoading(false)
        setError(null)
        return
      }
    }

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      params.append('language', lang as string)

      const response = await api.request<ContentItem>(`/api/content/${key}?${params.toString()}`)

      if (response.success && response.data) {
        setValue(response.data.value)
        setError(null)
      } else {
        // Fallback to i18n key
        const i18nValue = i18n.t(key, { defaultValue: null })
        if (i18nValue && i18nValue !== key) {
          setValue(i18nValue)
        } else {
          setValue(null)
          setError(`Content not found for key: ${key}`)
        }
      }
    } catch (err) {
      // On error, fallback to i18n
      const i18nValue = i18n.t(key, { defaultValue: null })
      if (i18nValue && i18nValue !== key) {
        setValue(i18nValue)
        setError(null)
      } else {
        setValue(null)
        const errorMsg = err instanceof Error ? err.message : 'Failed to fetch content'
        setError(errorMsg)
      }
    } finally {
      setLoading(false)
    }
  }, [key, lang, cacheKey, i18n])

  useEffect(() => {
    fetchContent()
  }, [fetchContent])

  return {
    value,
    loading,
    error,
    refetch: fetchContent,
  }
}

/**
 * Legacy static hooks for backward compatibility
 * These are kept for existing code that uses them
 */

import { LANDING, DOCUMENTATION } from '../constants/content'
import type {
  DocumentationTechnology,
  DocumentationLink,
  LandingFeature,
  LandingStat,
  LandingLanguage,
  LandingHowItWorks,
} from '../types/content.types'

/**
 * Get documentation technologies (static)
 */
export function useDocumentationTechnologies() {
  const data: DocumentationTechnology[] = DOCUMENTATION.technologies.map(tech => ({
    id: tech.id,
    name: tech.name,
    icon: tech.icon,
    description: tech.description,
    linkCount: tech.links.length,
  }))

  return {
    data,
    isLoading: false,
    error: null,
    isError: false,
    refetch: () => {},
  }
}

/**
 * Get documentation links for a technology (static)
 */
export function useDocumentationLinks(technologyId: string) {
  const tech = DOCUMENTATION.technologies.find(t => t.id === technologyId)
  const data: DocumentationLink[] = tech
    ? tech.links.map((link, index) => ({
        id: `${technologyId}-${index}`,
        title: link.title,
        url: link.url,
      }))
    : []

  return {
    data,
    isLoading: false,
    error: null,
    isError: false,
  }
}

/**
 * Get landing page features (static)
 */
export function useLandingFeatures() {
  const data: LandingFeature[] = LANDING.features.map(feature => ({
    id: feature.id,
    icon: feature.icon,
    title: feature.title,
    description: feature.description,
    color: feature.color,
  }))

  return {
    data,
    isLoading: false,
    error: null,
    isError: false,
  }
}

/**
 * Get landing page statistics (static)
 */
export function useLandingStats() {
  const data: LandingStat[] = LANDING.stats.map(stat => ({
    id: stat.id,
    label: stat.label,
    value: stat.value,
    icon: stat.icon,
  }))

  return {
    data,
    isLoading: false,
    error: null,
    isError: false,
  }
}

/**
 * Get landing page languages (static)
 */
export function useLandingLanguages() {
  const data: LandingLanguage[] = LANDING.languages.map(lang => ({
    id: lang.id,
    name: lang.name,
    icon: lang.icon,
    description: lang.description,
    color: lang.color,
    lessonCount: lang.lessonCount,
  }))

  return {
    data,
    isLoading: false,
    error: null,
    isError: false,
  }
}

/**
 * Get how-it-works steps (static)
 */
export function useHowItWorks() {
  const data: LandingHowItWorks[] = LANDING.howItWorks.map(step => ({
    id: step.id,
    stepNumber: step.step,
    title: step.title,
    description: step.description,
    icon: step.icon,
  }))

  return {
    data,
    isLoading: false,
    error: null,
    isError: false,
  }
}
