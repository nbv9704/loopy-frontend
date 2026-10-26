import { useCallback } from 'react'
import { useContentPreloader } from './useContentPreloader'
import { api } from '../lib/api'
import {
  clearContentCache,
  getCachedContent,
  getCacheKey,
  getContentCacheRevision,
  setCachedContent,
  type ContentItem,
} from '../lib/contentCache'
import { useContentCacheRevision } from './useContentCacheRevision'
import { useAsyncResource } from './useAsyncResource'
export {
  clearContentCache,
  getCachedContent,
  getCacheKey,
  setCachedContent,
} from '../lib/contentCache'
export type { ContentItem } from '../lib/contentCache'
export interface UseContentState {
  content: ContentItem[]
  loading: boolean
  error: string | null
  refetch: () => void
}

export function useContent(category?: string, language?: string): UseContentState {
  const revision = useContentCacheRevision()
  const load = useCallback(
    async (signal: AbortSignal) => {
      const key = getCacheKey(category, language)
      const cached = getCachedContent(key)
      if (cached) return cached
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (language) params.set('language', language)
      // Read all pages rather than storing an incomplete first page as the category cache.
      const rows: ContentItem[] = []
      let total: number | null = null
      for (let offset = 0; ;) {
        params.set('limit', '100')
        params.set('offset', String(offset))
        const result = await api.request<{ items: ContentItem[]; total: number }>(
          `/api/content?${params}`,
          { signal }
        )
        if (signal.aborted || getContentCacheRevision() !== revision)
          throw new DOMException('Aborted', 'AbortError')
        if (
          !result.success ||
          !result.data ||
          !Array.isArray(result.data.items) ||
          !Number.isSafeInteger(result.data.total) ||
          result.data.total < 0 ||
          (total !== null && total !== result.data.total)
        )
          throw new Error(result.error?.message || 'Không tải được nội dung CMS đầy đủ.')
        total = result.data.total
        rows.push(...result.data.items)
        offset += result.data.items.length
        if (offset === total) {
          setCachedContent(key, rows, revision)
          return rows
        }
        if (!result.data.items.length || offset > total)
          throw new Error('Nội dung CMS thay đổi trong lúc tải. Vui lòng thử lại.')
      }
    },
    [category, language, revision]
  )
  const resource = useAsyncResource(JSON.stringify([category, language, revision]), load)
  return {
    content: resource.data ?? [],
    loading: resource.loading,
    error: resource.error,
    refetch: clearContentCache,
  }
}

export function useContentByKey(key: string, language?: string) {
  const { content, loading, error, refetch } = useContentPreloader([key], language)
  return { value: content[key] ?? null, loading, error, refetch }
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
