import type { PvPMatch, PvPParticipant, PvPQuestion, PvPSubmission } from '../types/pvp.types'
export const pvpActor = '11111111-1111-4111-8111-111111111111'
export const pvpMatchId = '22222222-2222-4222-8222-222222222222'
export const pvpQuestionId = '33333333-3333-4333-8333-333333333333'
const timestamp = '2026-10-24T00:00:00Z'
export const pvpPlayer = (overrides: Partial<PvPParticipant> = {}): PvPParticipant => ({
  id: 'player',
  match_id: pvpMatchId,
  user_id: pvpActor,
  is_ready: false,
  is_connected: true,
  total_score: 0,
  questions_answered: 0,
  correct_answers: 0,
  joined_at: timestamp,
  ...overrides,
})
export const pvpMatch = (overrides: Partial<PvPMatch> = {}): PvPMatch => ({
  id: pvpMatchId,
  room_code: 'ROOM01',
  mode: '1v1',
  status: 'in_progress',
  language_id: 'javascript',
  difficulty: 'medium',
  question_ids: [pvpQuestionId],
  current_question_index: 0,
  max_players: 2,
  time_per_question: 60,
  created_at: timestamp,
  updated_at: timestamp,
  participants: [pvpPlayer()],
  ...overrides,
})
export const pvpQuestion = (overrides: Partial<PvPQuestion> = {}): PvPQuestion => ({
  id: pvpQuestionId,
  type: 'multiple_choice',
  language_id: 'javascript',
  difficulty: 'medium',
  question_text: 'Choose an answer',
  options: [
    { id: 'A', text: 'First' },
    { id: 'B', text: 'Second' },
  ],
  time_limit: 60,
  points: 10,
  tags: [],
  created_at: timestamp,
  updated_at: timestamp,
  ...overrides,
})
export const pvpSubmission = (overrides: Partial<PvPSubmission> = {}): PvPSubmission => ({
  id: 'saved',
  match_id: pvpMatchId,
  question_id: pvpQuestionId,
  user_id: pvpActor,
  submission_type: 'multiple_choice',
  is_correct: true,
  points_earned: 10,
  time_taken: 5,
  submission_rank: 1,
  submitted_at: timestamp,
  ...overrides,
})
