import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'

interface Lesson {
  id: string
  chapter_id: string
  lesson_id: string
  title: string
  description: string
  content: string
  code: string
  insight: string
  order_index: number
  created_at: string
  updated_at: string
}

interface Chapter {
  id: string
  language_id: string
  chapter_number: number
  title: string
  description: string
  order_index: number
}

export const useLessonData = (language: string, initialLessonId?: string, userId?: string) => {
  const [lessons, setLessons] = useState<Lesson[]>([])
  const [chapters, setChapters] = useState<Chapter[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('')
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set())

  // Track if curriculum has been loaded to avoid re-fetching
  const curriculumLoaded = useRef(false)
  const initialLessonSet = useRef(false)

  // Effect 1: Load curriculum (chapters + lessons) — only depends on language
  useEffect(() => {
    curriculumLoaded.current = false
    initialLessonSet.current = false
    
    const loadCurriculum = async () => {
      setLoading(true)
      try {
        const curriculumResponse = await api.getCurriculum(language)

        if (!curriculumResponse.success || !curriculumResponse.data) {
          setLoading(false)
          return
        }

        const data = curriculumResponse.data as any
        const chaptersData = data.chapters || []
        const allLessons: Lesson[] = data.lessons || []

        setChapters(chaptersData)
        setLessons(allLessons)
        curriculumLoaded.current = true
      } catch (error) {
        console.error('Error loading lessons:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCurriculum()
  }, [language]) // Only depend on language, not initialLessonId

  // Effect 2: Set initial active lesson when lessons are loaded
  useEffect(() => {
    if (!curriculumLoaded.current || initialLessonSet.current || lessons.length === 0) return

    let initialLesson = lessons[0]
    if (initialLessonId) {
      const foundLesson = lessons.find(l => l.lesson_id === initialLessonId)
      if (foundLesson) {
        initialLesson = foundLesson
      }
    }

    if (initialLesson) {
      setActiveTab(initialLesson.id)
      initialLessonSet.current = true
    }
  }, [lessons, initialLessonId])

  // Effect 3: Load user progress silently — does NOT reset loading spinner
  useEffect(() => {
    if (!userId || !curriculumLoaded.current) return

    const loadProgress = async () => {
      try {
        const progressResponse = await api.getUserProgress()
        if (progressResponse.success && progressResponse.data) {
          const progress = (progressResponse.data as any).progress || []
          const completed = new Set<string>(
            progress.filter((p: any) => p.status === 'completed').map((p: any) => p.lesson_id)
          )
          setCompletedLessons(completed)
        }
      } catch (error) {
        console.error('Error loading progress:', error)
      }
    }

    loadProgress()
  }, [userId])

  return {
    lessons,
    chapters,
    loading,
    activeTab,
    setActiveTab,
    completedLessons,
    setCompletedLessons,
  }
}
