import type { UserProfileSnapshot } from './profileSnapshot'

export interface AuthUser {
  id: string
  email: string
  displayName?: string
  avatarUrl?: string
  learningGoal?: string
  onboardingCompleted?: boolean
  experienceLevel?: string
  currentPathId?: string
  points?: number
  currentStreak?: number
  preferredLanguage?: string
  isAdmin?: boolean
}

export function profileToUser(profile: UserProfileSnapshot, email: string): AuthUser {
  return {
    id: profile.id,
    email,
    displayName: profile.displayName || email.split('@')[0],
    avatarUrl: profile.avatarUrl ?? undefined,
    learningGoal:
      typeof profile.learningPath === 'string'
        ? profile.learningPath || undefined
        : profile.learningGoal || undefined,
    onboardingCompleted: profile.onboardingCompleted ?? undefined,
    experienceLevel: profile.experienceLevel ?? undefined,
    currentPathId: profile.currentPathId ?? undefined,
    points: profile.points ?? undefined,
    currentStreak: profile.currentStreak ?? undefined,
    preferredLanguage: profile.preferredLanguage ?? undefined,
    isAdmin: profile.isAdmin === true,
  }
}

/** A personal-profile acknowledgement may omit unrelated learning or streak fields. */
export function mergeProfileSnapshot(user: AuthUser, profile: UserProfileSnapshot): AuthUser {
  if (profile.id !== user.id) return user
  const mapped = profileToUser(profile, user.email)
  const result = { ...user }
  for (const key of [
    'displayName',
    'avatarUrl',
    'onboardingCompleted',
    'experienceLevel',
    'currentPathId',
    'points',
    'currentStreak',
    'preferredLanguage',
    'isAdmin',
  ] as const) {
    if (Object.prototype.hasOwnProperty.call(profile, key))
      Object.assign(result, { [key]: mapped[key] })
  }
  if (
    Object.prototype.hasOwnProperty.call(profile, 'learningGoal') ||
    Object.prototype.hasOwnProperty.call(profile, 'learningPath')
  )
    result.learningGoal = mapped.learningGoal
  return result
}
