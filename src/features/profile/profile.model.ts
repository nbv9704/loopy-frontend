import { getStudyDateKey } from '../../utils/studyDate'
import type { ProfileDraft, ProfileStats } from './profile.types'

export const emptyProfile: ProfileDraft = { displayName: '', bio: '', avatarUrl: '' }
export const emptyStats: ProfileStats = {
  completedLessons: 0,
  currentStreak: 0,
  totalPoints: 0,
  hasProgressData: false,
  completedToday: 0,
}

type ProgressItem = { status?: string; completedAt?: string | null; completed_at?: string | null }
export interface ProfileProgress {
  progress: ProgressItem[]
  completedLessons?: number
  completed_lessons?: number
  currentStreak?: number
  current_streak?: number
  totalPoints?: number
  total_points?: number
}

export function toProfileStats(data: ProfileProgress, now = new Date()): ProfileStats {
  const completed = data.progress.filter(item => item.status === 'completed')
  const today = getStudyDateKey(now)
  return {
    completedLessons: data.completedLessons ?? data.completed_lessons ?? completed.length,
    currentStreak: data.currentStreak ?? data.current_streak ?? 0,
    totalPoints: data.totalPoints ?? data.total_points ?? 0,
    hasProgressData: data.progress.length > 0,
    completedToday: completed.filter(item => {
      const date = item.completedAt ?? item.completed_at
      return Boolean(date && getStudyDateKey(date) === today)
    }).length,
  }
}
