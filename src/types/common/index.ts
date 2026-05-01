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
  display_name: string
  icon: string
  can_run_in_browser: boolean
  created_at: string
}

export interface Chapter {
  id: string
  language_id: string
  chapter_number: number
  title: string
  description: string
  order_index: number
  created_at: string
  updated_at: string
}

export interface Lesson {
  id: string
  chapter_id: string
  lesson_id: string
  title: string
  description: string
  content: string
  code: string
  insight: string
  order_index: number
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  estimated_time?: number
  created_at: string
  updated_at: string
}

export interface Exercise {
  id: string
  lesson_id: string
  exercise_number: number
  question: string
  hint?: string
  solution: string
  test_cases?: any
  difficulty?: 'easy' | 'medium' | 'hard'
  order_index: number
  created_at: string
}

export interface UserProgress {
  id: string
  user_id: string
  lesson_id: string
  status: 'not_started' | 'in_progress' | 'completed'
  completed_at?: string
  time_spent: number
  created_at: string
  updated_at: string
}

export interface ProgressStats {
  completedLessons: number
  totalLessons: number
  currentStreak: number
  longestStreak: number
}
