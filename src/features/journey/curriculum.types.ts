export interface LessonStepItem {
  id: string
  lessonId?: string
  type: 'note' | 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer' | 'code_prompt'
  title?: string
  prompt: string
  options?: unknown[]
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

export interface Lesson {
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
  isAhaLesson: boolean
  gradingMode?: 'stdout' | 'function'
  orderIndex: number
  difficulty: string
  estimatedTime?: number
  estimated_time?: number
  // Data-driven debug schema
  debugStarterCode?: string
  debugTaskDescription?: string
  debugHint?: string
  steps?: LessonStepItem[]
  lessonSteps?: LessonStepItem[]
}

export interface Chapter {
  id: string
  languageId: string
  chapterNumber: number
  title: string
  description: string
  orderIndex: number
}

export interface Curriculum {
  chapters: Chapter[]
  lessons: Lesson[]
}
