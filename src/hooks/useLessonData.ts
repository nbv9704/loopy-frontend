import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'

interface Lesson {
  id: string
  chapterId: string
  lessonId: string
  title: string
  description: string
  starterCode: string
  taskDescription: string
  hint: string
  commonMistakes: string
  solutionCode: string
  isAhaLesson: boolean
  orderIndex: number
  difficulty: string
  estimated_time: number
  // Data-driven debug schema
  debug_starter_code?: string
  debug_task_description?: string
  debug_validation_rules?: Array<{
    type: 'rule' | 'exact' | 'regex' | 'stdout'
    value: string
    description?: string
  }>
  debug_hint?: string
  created_at: string
  updated_at: string
}

interface Chapter {
  id: string
  languageId: string
  chapterNumber: number
  title: string
  description: string
  orderIndex: number
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

        const data = curriculumResponse.data as { lessons: Lesson[]; chapters?: unknown[] }
        const chaptersData = (data.chapters as Chapter[]) || []
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
      const foundLesson = lessons.find(l => l.lessonId === initialLessonId)
      if (foundLesson) {
        initialLesson = foundLesson
      }
    }

    if (initialLesson) {
      setActiveTab(initialLesson.id)
      initialLessonSet.current = true
    }
  }, [lessons, initialLessonId])

  // Effect 3: Load user progress silently after curriculum is ready.
  useEffect(() => {
    if (!userId || !curriculumLoaded.current) return

    const loadProgress = async () => {
      try {
        const progressResponse = await api.getUserProgress()
        if (progressResponse.success && progressResponse.data) {
          const progress =
            (progressResponse.data as { progress: { status: string; lessonId: string }[] })
              .progress || []
          const completed = new Set<string>(
            progress.filter(p => p.status === 'completed').map(p => p.lessonId)
          )
          setCompletedLessons(completed)
        }
      } catch (error) {
        console.error('Error loading progress:', error)
      }
    }

    loadProgress()
  }, [userId, language, lessons.length])

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
