export interface OnboardingLanguage {
  id: string
  name: string
  displayName?: string
  display_name?: string
  canRunInBrowser?: boolean
  can_run_in_browser?: boolean
}

export interface LearningPath {
  id: string
  languageId?: string
  language_id?: string
  title: string
  description?: string
  goalId?: string
  goal_id?: string
}

export interface PathChapter {
  id: string
  title: string
  description?: string
  lessonCount?: number
  lesson_count?: number
}

export interface OnboardingSelection {
  preferredLanguage: string
  learningGoal: string
  experienceLevel: string
  currentPathId: string
}

export function getOnboardingDraft(value: unknown): OnboardingSelection | undefined {
  if (typeof value !== 'object' || value === null) return undefined
  const draft = value as Record<string, unknown>
  if (
    ['preferredLanguage', 'learningGoal', 'experienceLevel', 'currentPathId'].some(
      key => typeof draft[key] !== 'string' || !draft[key]
    )
  )
    return undefined
  return {
    preferredLanguage: draft.preferredLanguage as string,
    learningGoal: draft.learningGoal as string,
    experienceLevel: draft.experienceLevel as string,
    currentPathId: draft.currentPathId as string,
  }
}
