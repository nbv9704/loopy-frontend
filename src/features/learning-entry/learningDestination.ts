import type { AuthUser } from '../auth/userProfile'

export function learningDestination(user: AuthUser | null): string {
  return user?.onboardingCompleted && user.preferredLanguage
    ? `/library/${encodeURIComponent(user.preferredLanguage)}`
    : '/onboarding'
}
