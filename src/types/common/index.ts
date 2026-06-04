/**
 * Common types used across the application
 */

export interface User {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
}

export interface Language {
  id: string
  name: string
  displayName: string
  icon: string
  canRunInBrowser: boolean
  createdAt: string
}

export interface Chapter {
  id: string
  languageId: string
  chapterNumber: number
  title: string
  description: string
  orderIndex: number
  createdAt: string
  updatedAt: string
}

export interface Lesson {
  id: string
  chapterId: string
  lessonId: string
  title: string
  description: string
  starterCode?: string
  taskDescription?: string
  hint?: string
  commonMistakes?: string
  solutionCode?: string
  isAhaLesson?: boolean
  orderIndex: number
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  estimatedTime?: number
  // Data-driven debug schema
  debug_starter_code?: string
  debug_task_description?: string
  debug_validation_rules?: Array<{
    type: 'rule' | 'exact' | 'regex' | 'stdout'
    value: string
    description?: string
  }>
  debug_hint?: string
  createdAt: string
  updatedAt: string
}

export interface Exercise {
  id: string
  lessonId: string
  exerciseNumber: number
  question: string
  hint?: string
  solution: string
  testCases?: any
  difficulty?: 'easy' | 'medium' | 'hard'
  orderIndex: number
  createdAt: string
}

export interface UserProgress {
  id: string
  userId: string
  lessonId: string
  status: 'not_started' | 'in_progress' | 'completed'
  completedAt?: string
  timeSpent: number
  createdAt: string
  updatedAt: string
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  requirementType: string
  requirementValue?: number
  createdAt: string
}

export interface ProgressStats {
  completedLessons: number
  totalLessons: number
  currentStreak: number
  longestStreak: number
  totalPoints: number
  badges: Badge[]
}

