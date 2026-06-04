/**
 * Custom hooks for API calls
 *
 * Provides React hooks for common API operations with loading and error states
 */

import { useState, useEffect } from 'react'
import { api } from '../lib/api'

interface UseApiState<T> {
  data: T | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useLanguages(): UseApiState<unknown[]> {
  const [data, setData] = useState<unknown[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    const response = await api.getLanguages()

    if (response.success && response.data) {
      setData((response.data as { languages: unknown[] }).languages)
    } else {
      setError(response.error?.message || 'Failed to fetch languages')
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { data, loading, error, refetch: fetchData }
}

export function useChapters(languageId: string | null): UseApiState<unknown[]> {
  const [data, setData] = useState<unknown[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!languageId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const response = await api.getChaptersByLanguage(languageId)

    if (response.success && response.data) {
      setData((response.data as { chapters: unknown[] }).chapters)
    } else {
      setError(response.error?.message || 'Failed to fetch chapters')
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [languageId])

  return { data, loading, error, refetch: fetchData }
}

export function useLessons(chapterId: string | null): UseApiState<unknown[]> {
  const [data, setData] = useState<unknown[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!chapterId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const response = await api.getLessonsByChapter(chapterId)

    if (response.success && response.data) {
      setData((response.data as { lessons: unknown[] }).lessons)
    } else {
      setError(response.error?.message || 'Failed to fetch lessons')
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [chapterId])

  return { data, loading, error, refetch: fetchData }
}

export function useLesson(lessonId: string | null): UseApiState<unknown> {
  const [data, setData] = useState<unknown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    if (!lessonId) {
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const response = await api.getLesson(lessonId)

    if (response.success && response.data) {
      setData((response.data as { lesson: unknown }).lesson)
    } else {
      setError(response.error?.message || 'Failed to fetch lesson')
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [lessonId])

  return { data, loading, error, refetch: fetchData }
}

export function useUserProgress(): UseApiState<unknown> {
  const [data, setData] = useState<unknown | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)

    const response = await api.getUserProgress()

    if (response.success && response.data) {
      setData(response.data)
    } else {
      setError(response.error?.message || 'Failed to fetch progress')
    }

    setLoading(false)
  }

  useEffect(() => {
    fetchData()
  }, [])

  return { data, loading, error, refetch: fetchData }
}
