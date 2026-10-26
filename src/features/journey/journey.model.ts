import type { Curriculum } from './curriculum.types'

export type LessonState = 'done' | 'current' | 'next' | 'locked'
export interface JourneyLesson {
  id: string
  title: string
  minutes?: number
  state: LessonState
}
export interface JourneyChapter {
  id: string
  title: string
  description: string
  lessons: JourneyLesson[]
}

export function buildJourney(curriculum: Curriculum, completed: Set<string>) {
  const incomplete = curriculum.lessons.filter(lesson => !completed.has(lesson.id))
  const chapters: JourneyChapter[] = curriculum.chapters.map(chapter => ({
    id: chapter.id,
    title: chapter.title,
    description: chapter.description,
    lessons: curriculum.lessons
      .filter(lesson => lesson.chapterId === chapter.id)
      .map(lesson => ({
        id: lesson.lessonId,
        title: lesson.title,
        minutes: lesson.estimatedTime ?? lesson.estimated_time,
        state: completed.has(lesson.id)
          ? 'done'
          : lesson === incomplete[0]
            ? 'current'
            : lesson === incomplete[1]
              ? 'next'
              : 'locked',
      })),
  }))
  const total = curriculum.lessons.length
  const done = curriculum.lessons.filter(lesson => completed.has(lesson.id)).length
  return {
    chapters,
    progress: total ? Math.round((done / total) * 100) : 0,
    complete: total > 0 && total === done,
  }
}
