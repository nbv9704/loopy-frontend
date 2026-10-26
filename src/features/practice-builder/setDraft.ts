import type { PracticeSet } from '../../types/practice.types'

export interface PracticeSetDraft {
  title: string
  description: string
  topic: string
  languageId: string
  difficulty: PracticeSet['difficulty']
  visibility: PracticeSet['visibility']
  status: PracticeSet['status']
  requirementCount: string
}

export function createPracticeSetDraft(set?: PracticeSet): PracticeSetDraft {
  return {
    title: set?.title || 'Untitled Quiz',
    description: set?.description || '',
    topic: set?.topic || '',
    languageId: set?.languageId || 'javascript',
    difficulty: set?.difficulty || 'easy',
    visibility: set?.visibility || 'public',
    status: set?.status || 'published',
    requirementCount: set?.requirements?.count?.toString() || '',
  }
}
