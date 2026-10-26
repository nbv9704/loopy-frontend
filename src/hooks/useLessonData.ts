import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react'
import { useAsyncResource } from './useAsyncResource'
import { loadLearningJourney } from '../features/journey/curriculum.service'

export const useLessonData = (
  language: string,
  initialLessonId?: string,
  userId?: string,
  pathId?: string
) => {
  const load = useCallback(
    (signal: AbortSignal) => loadLearningJourney(language, pathId, userId, signal),
    [language, pathId, userId]
  )
  const resource = useAsyncResource(JSON.stringify([language, pathId, userId]), load)
  const { data } = resource
  const currentData = useRef(data)
  currentData.current = data
  const [selection, setSelection] = useState<{ source: typeof data; id: string } | null>(null)
  const [saved, setSaved] = useState<{ source: typeof data; ids: Set<string> } | null>(null)
  const completedLessons = data
    ? saved?.source === data
      ? saved.ids
      : data.completedLessons
    : new Set<string>()
  const requested = data?.lessons.find(
    lesson => lesson.lessonId === initialLessonId || lesson.id === initialLessonId
  )
  const activeTab =
    data && (!initialLessonId || requested)
      ? selection?.source === data
        ? selection.id
        : requested?.id ||
          data.lessons.find(lesson => !completedLessons.has(lesson.id))?.id ||
          data.lessons[0]?.id ||
          ''
      : ''
  const setActiveTab = useCallback(
    (id: string) => {
      if (data && currentData.current === data) setSelection({ source: data, id })
    },
    [data]
  )
  const setCompletedLessons = useCallback(
    (update: SetStateAction<Set<string>>) => {
      if (!data || currentData.current !== data) return
      setSaved(current => {
        const previous = current?.source === data ? current.ids : data.completedLessons
        return { source: data, ids: typeof update === 'function' ? update(previous) : update }
      })
    },
    [data]
  )

  // Browser navigation can request another lesson without remounting the viewer.
  useEffect(() => {
    if (requested)
      setSelection(current =>
        current?.source === data && current.id === requested.id
          ? current
          : { source: data, id: requested.id }
      )
  }, [data, requested])

  return {
    lessons: data?.lessons || [],
    chapters: data?.chapters || [],
    loading: resource.loading,
    error:
      resource.error ||
      (data && initialLessonId && !requested
        ? 'Bài học này không có trong lộ trình hiện tại.'
        : null),
    retry: resource.retry,
    activeTab,
    setActiveTab,
    completedLessons,
    setCompletedLessons,
  }
}
