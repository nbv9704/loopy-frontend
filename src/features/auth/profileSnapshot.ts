export interface UserProfileSnapshot extends Record<string, unknown> {
  id: string
  displayName?: string | null
  avatarUrl?: string | null
  bio?: string | null
  learningGoal?: string | null
  learningPath?: string | null
  experienceLevel?: string | null
  currentPathId?: string | null
  preferredLanguage?: string | null
  onboardingCompleted?: boolean | null
  isAdmin?: boolean | null
  points?: number | null
  currentStreak?: number | null
}

export function isUserProfileSnapshot(value: unknown): value is UserProfileSnapshot {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false
  const profile = value as Record<string, unknown>
  if (typeof profile.id !== 'string' || !profile.id.trim()) return false
  const strings = [
    'displayName',
    'avatarUrl',
    'bio',
    'learningGoal',
    'learningPath',
    'experienceLevel',
    'currentPathId',
    'preferredLanguage',
  ]
  if (strings.some(key => profile[key] != null && typeof profile[key] !== 'string')) return false
  if (
    ['onboardingCompleted', 'isAdmin'].some(
      key => profile[key] != null && typeof profile[key] !== 'boolean'
    )
  )
    return false
  return !['points', 'currentStreak'].some(
    key =>
      profile[key] != null &&
      (typeof profile[key] !== 'number' ||
        !Number.isSafeInteger(profile[key]) ||
        (profile[key] as number) < 0)
  )
}
