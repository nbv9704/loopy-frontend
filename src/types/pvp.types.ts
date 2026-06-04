/**
 * PvP System Type Definitions
 * Frontend types for real-time competitive coding
 */

export type MatchStatus = 'waiting' | 'starting' | 'in_progress' | 'completed' | 'cancelled'
export type QuestionType = 'multiple_choice' | 'code_challenge' | 'true_false'
export type MatchMode = '1v1' | 'battle_royale'

export interface PvPQuestion {
  id: string
  type: QuestionType
  language_id: string | null
  difficulty: 'easy' | 'medium' | 'hard'

  // Multiple choice fields
  question_text?: string
  options?: Array<{ id: string; text: string }>

  // Code challenge fields
  problem_title?: string
  problem_description?: string
  starterCode?: string

  // Metadata
  time_limit: number
  points: number
  tags: string[]

  created_at: string
  updated_at: string
}

export interface PvPMatch {
  id: string
  mode: MatchMode
  status: MatchStatus
  language_id: string | null
  difficulty?: 'easy' | 'medium' | 'hard'
  room_code: string

  // Questions
  question_ids: string[]
  current_question_index: number

  // Configuration
  max_players: number
  time_per_question: number

  // Timing
  started_at?: string
  ended_at?: string

  // Winner
  winner_id?: string

  created_at: string
  updated_at: string

  // Joined data
  participants?: PvPParticipant[]
}

export interface PvPParticipant {
  id: string
  match_id: string
  user_id: string

  // Status
  is_ready: boolean
  is_connected: boolean

  // Score
  total_score: number
  questions_answered: number
  correct_answers: number

  // Placement
  final_rank?: number

  // Timing
  joined_at: string
  left_at?: string

  // User info
  display_name?: string
  avatar_url?: string
}

export interface PvPSubmission {
  id: string
  match_id: string
  user_id: string
  question_id: string

  // Submission content
  submission_type: QuestionType

  // Evaluation
  is_correct: boolean
  points_earned: number
  time_taken: number

  // Ranking
  submission_rank?: number

  submitted_at: string
}

export interface PvPReaction {
  id: string
  match_id: string
  user_id: string
  emoji: string
  target_user_id?: string
  created_at: string
  display_name?: string
}

export interface PvPUserStats {
  user_id: string

  // Match stats
  total_matches: number
  matches_won: number
  matches_lost: number

  // Performance
  total_score: number
  average_rank?: number
  best_rank?: number

  // Question stats
  total_questions_answered: number
  correct_answers: number
  accuracy_rate?: number

  // Timing
  average_answer_time?: number
  fastest_answer_time?: number

  // Streaks
  current_win_streak: number
  longest_win_streak: number

  // Rating
  rating: number
  peak_rating: number

  updated_at: string
}

export interface FinalScore {
  userId: string
  displayName: string
  score: number
  rank: number
}

// Socket event payloads
export interface MatchUpdatedPayload {
  match: PvPMatch
}

export interface QuestionChangedPayload {
  match: PvPMatch
  question: PvPQuestion
  timeRemaining: number
}

export interface MatchCompletedPayload {
  match: PvPMatch
  finalScores: FinalScore[]
}

export interface SubmissionRankedPayload {
  userId: string
  questionId: string
  rank: number
  pointsEarned: number
}

export interface TypingPayload {
  userId: string
  displayName?: string
}

export interface ErrorPayload {
  message: string
  code?: string
}

export interface CooldownPayload {
  duration: number
  isMatchOver: boolean
  nextQuestionIndex?: number
}

export interface MatchPausedPayload {
  disconnectedUserId: string
  displayName: string
  timeoutSeconds: number
}

export interface MatchResumedPayload {
  reconnectedUserId: string
  displayName: string
}

export interface MatchForfeitPayload {
  forfeitUserId: string
  displayName: string
  reason: 'disconnect_timeout'
}
