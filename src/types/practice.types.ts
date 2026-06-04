export type PracticeDifficulty = 'easy' | 'medium' | 'hard'
export type PracticeQuestionType = 'true_false' | 'multiple_choice' | 'multiple_select' | 'fill_blank'

export interface PracticeRequirement {
  type?: 'completed_lessons_count'
  languageId?: string
  count?: number
}

export interface PracticeSet {
  id: string
  ownerType: 'official' | 'user'
  createdBy?: string | null
  title: string
  description?: string | null
  topic?: string | null
  languageId?: string | null
  difficulty: PracticeDifficulty
  visibility: 'public' | 'private' | 'unlisted'
  status: 'draft' | 'published' | 'archived'
  requirements: PracticeRequirement
  questionCount?: number
  questions?: PracticeQuestion[]
  createdAt: string
  updatedAt: string
}

export interface PracticeQuestion {
  id: string
  setId: string
  type: PracticeQuestionType
  title?: string | null
  prompt: string
  options?: string[] | null
  correctAnswer?: string | null
  starterCode?: string | null
  explanation?: string | null
  points: number
  orderIndex: number
}

export interface PracticeAttempt {
  id: string
  setId: string
  userId: string
  status: 'in_progress' | 'completed'
  score: number
  maxScore: number
  startedAt: string
  completedAt?: string | null
  questions?: PracticeQuestion[]
}

export interface PracticeSubmissionResult {
  submission: {
    id: string
    attemptId: string
    questionId: string
    isCorrect: boolean
    pointsEarned: number
    testResults?: unknown
    submittedAt: string
  }
  attempt: PracticeAttempt
}
