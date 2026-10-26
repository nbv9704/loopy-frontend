import { z } from 'zod'

export const roomCodeSchema = z
  .string()
  .trim()
  .toUpperCase()
  .regex(/^[A-Z0-9]{6}$/)
export const matchReferenceSchema = z.union([z.guid(), roomCodeSchema])
const id = z.string().min(1)
const count = z.number().int().nonnegative().safe()
const optionalText = z
  .string()
  .nullish()
  .transform(value => value ?? undefined)
export const pvpParticipantSchema = z.object({
  id,
  match_id: id,
  user_id: id,
  is_ready: z.boolean(),
  is_connected: z.boolean(),
  total_score: count,
  questions_answered: count,
  correct_answers: count,
  final_rank: count.nullish().transform(value => value ?? undefined),
  joined_at: id,
  left_at: optionalText,
  display_name: optionalText,
  avatar_url: optionalText,
})
export const pvpMatchSchema = z
  .object({
    id,
    mode: z.enum(['1v1', 'battle_royale']),
    status: z.enum(['waiting', 'starting', 'in_progress', 'completed', 'cancelled']),
    language_id: z.string().nullable(),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional(),
    room_code: roomCodeSchema,
    question_ids: z.array(id).min(1),
    current_question_index: count,
    max_players: z.number().int().min(2).max(10),
    time_per_question: z.number().int().positive(),
    started_at: optionalText,
    ended_at: optionalText,
    winner_id: optionalText,
    created_at: id,
    updated_at: id,
    participants: z.array(pvpParticipantSchema).optional(),
  })
  .superRefine((match, ctx) => {
    const players = match.participants || []
    if (
      new Set(match.question_ids).size !== match.question_ids.length ||
      match.current_question_index >= match.question_ids.length ||
      players.filter(player => !player.left_at).length > match.max_players ||
      new Set(players.map(player => player.user_id)).size !== players.length ||
      new Set(players.map(player => player.id)).size !== players.length ||
      players.some(
        player => player.match_id !== match.id || player.correct_answers > player.questions_answered
      )
    )
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Inconsistent match snapshot' })
  })
export const pvpEligibilitySchema = z
  .object({
    eligible: z.boolean(),
    onboardingCompleted: z.boolean(),
    hasCompletedLesson: z.boolean(),
  })
  .refine(value => value.eligible === (value.onboardingCompleted && value.hasCompletedLesson))

export class PvPRequestError extends Error {
  constructor(
    message: string,
    readonly code?: string
  ) {
    super(message)
  }
}
