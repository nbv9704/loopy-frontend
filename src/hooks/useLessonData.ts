import { useState, useEffect, useRef } from 'react'
import { api } from '../lib/api'

interface LessonStepItem {
  id: string
  lessonId?: string
  type: 'note' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer' | 'code_prompt'
  title?: string
  prompt: string
  options?: unknown[]
  correctAnswer?: unknown
  explanation?: string
  hint?: string
  isRequired?: boolean
  orderIndex: number
}

type LessonInteractionType =
  | 'concept'
  | 'true_false'
  | 'multiple_choice'
  | 'fill_blank'
  | 'short_answer'
  | 'code_fix'
  | 'code_output'
  | 'code_build'

interface Lesson {
  id: string
  chapterId: string
  lessonId: string
  title: string
  description: string
  code?: string
  insight?: string
  lessonType?: LessonInteractionType
  starterCode: string
  taskDescription: string
  hint: string
  hintLevel1?: string
  hintLevel2?: string
  hintLevel3?: string
  commonMistakes: string
  solutionCode: string
  isAhaLesson: boolean
  validationType?: string
  validationRules?: Record<string, unknown>
  successOutput?: string
  failureHint?: string
  gradingMode?: 'stdout' | 'function'
  orderIndex: number
  difficulty: string
  estimated_time: number
  // Data-driven debug schema
  debugStarterCode?: string
  debugTaskDescription?: string
  debugValidationRules?: Record<string, unknown>
  debugHint?: string
  steps?: LessonStepItem[]
  lessonSteps?: LessonStepItem[]
  createdAt: string
  updatedAt: string
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
        const allLessons: Lesson[] = (data.lessons || []).map(lesson => {
          const steps = (lesson.steps || lesson.lessonSteps || []).sort(
            (a, b) => (a.orderIndex || 0) - (b.orderIndex || 0)
          )
          return { ...lesson, steps }
        })

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
