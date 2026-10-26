import type { UserProfileSnapshot } from '../auth/profileSnapshot'
export interface ProfileDraft {
  displayName: string
  bio: string
  avatarUrl: string
}

export interface AccountProfile extends ProfileDraft {
  id: string
  snapshot?: UserProfileSnapshot
}

export interface ProfileStats {
  completedLessons: number
  currentStreak: number
  totalPoints: number
  hasProgressData: boolean
  completedToday: number
}

export type ProfileText = (key: string, fallback: string) => string
