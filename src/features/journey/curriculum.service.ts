import { api } from '../../lib/api'
import { readCurriculum } from './curriculumResponse'
import { readProgressSnapshot } from '../progress/progressResponse'

export function selectedCurriculumPath(
  user: { preferredLanguage?: string; currentPathId?: string } | null,
  language: string
) {
  return user?.preferredLanguage === language ? user.currentPathId : undefined
}

export async function loadLearningJourney(
  language: string,
  pathId: string | undefined,
  userId: string | undefined,
  signal: AbortSignal
) {
  const [catalog, progress] = await Promise.all([
    api.getCurriculum(language, pathId, signal),
    userId ? api.getUserProgress(signal) : Promise.resolve(null),
  ])
  if (!catalog.success || !catalog.data)
    throw new Error(catalog.error?.message || 'Không tải được bài học. Vui lòng thử lại.')
  const data = readCurriculum(catalog.data, language)
  if (progress && !progress.success)
    throw new Error(progress.error?.message || 'Không tải được tiến độ. Vui lòng thử lại.')
  const records = progress ? readProgressSnapshot(progress.data, true).progress : []

  const chapters = [...data.chapters].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
  const lessons = chapters.flatMap(chapter =>
    data.lessons
      .filter(lesson => lesson.chapterId === chapter.id)
      .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))
      .map(lesson => ({
        ...lesson,
        lessonId: lesson.lessonId || lesson.id,
        steps: [...(lesson.steps || lesson.lessonSteps || [])].sort(
          (a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0)
        ),
      }))
  )
  const lessonIds = new Set(lessons.map(lesson => lesson.id))
  const completedLessons = new Set(
    records
      .filter(record => record.status === 'completed' && lessonIds.has(record.lessonId!))
      .map(record => record.lessonId!)
  )
  return { chapters, lessons, completedLessons }
}
