type SelectionKind = 'goal' | 'language' | 'experience'
type SelectionText = (key: string, fallback: string) => string

const definitions: Record<SelectionKind, { prefix: string; labels: Record<string, string> }> = {
  goal: {
    prefix: 'profile.goal',
    labels: {
      first_steps: 'First steps in programming',
      school_foundation: 'Build a foundation for school',
      project_starter: 'Build your first project',
      logic_builder: 'Develop logical thinking',
      start_from_zero: 'Start from zero',
      build_web: 'Build web apps',
      school_work: 'School work',
      explore: 'Explore coding',
    },
  },
  language: {
    prefix: 'profile.settings.language',
    labels: { javascript: 'JavaScript', python: 'Python', cpp: 'C++' },
  },
  experience: {
    prefix: 'profile.experience',
    labels: {
      first_steps: 'Just getting started',
      school_foundation: 'Building the fundamentals',
      project_starter: 'Getting started with projects',
      logic_builder: 'Practicing logical thinking',
      beginner: 'Beginner',
      intermediate: 'Intermediate',
      advanced: 'Advanced',
    },
  },
}

export const selectionLabelContentKeys = [
  ...Object.values(definitions).flatMap(({ prefix, labels }) =>
    Object.keys(labels).map(id => `${prefix}.${id}`)
  ),
  'profile.goals.selection_empty',
  'profile.goals.selection_unknown',
]

/** Presentation only: stored IDs are never transformed or written back as labels. */
export function selectionLabel(kind: SelectionKind, id: string | undefined, text: SelectionText): string {
  if (!id) return text('profile.goals.selection_empty', 'Not selected')
  const { prefix, labels } = definitions[kind]
  const fallback = labels[id]
  if (typeof fallback === 'string') return text(`${prefix}.${id}`, fallback)
  // Older onboarding versions also stored the goal ID in experienceLevel.
  if (kind === 'experience' && typeof definitions.goal.labels[id] === 'string')
    return selectionLabel('goal', id, text)
  return text('profile.goals.selection_unknown', 'Learning path needs updating')
}
