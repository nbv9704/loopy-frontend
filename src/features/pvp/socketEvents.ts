import { z } from 'zod'
import { pvpMatchSchema, pvpParticipantSchema } from './pvpContracts'

const id = z.string().min(1)
const count = z.number().int().nonnegative().safe()
const optionalText = z
  .string()
  .nullish()
  .transform(value => value ?? undefined)
export const pvpQuestionSchema = z
  .object({
    id,
    type: z.enum(['multiple_choice', 'true_false', 'code_challenge']),
    language_id: z.string().nullable(),
    difficulty: z.enum(['easy', 'medium', 'hard']),
    question_text: z.string().optional(),
    options: z.array(z.object({ id, text: z.string() })).optional(),
    problem_title: z.string().optional(),
    problem_description: z.string().optional(),
    starterCode: z.string().optional(),
    time_limit: count.positive(),
    points: count,
    tags: z.array(z.string()),
    created_at: id,
    updated_at: id,
  })
  .superRefine((question, ctx) => {
    const options = question.options || []
    if (
      question.type !== 'code_challenge' &&
      (!question.question_text?.trim() ||
        options.length < 2 ||
        new Set(options.map(option => option.id)).size !== options.length)
    )
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid question options' })
    if (
      question.type === 'true_false' &&
      (options.length !== 2 ||
        !['true', 'false'].every(value => options.some(option => option.id === value)))
    )
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Invalid boolean options' })
    if (question.type === 'code_challenge' && !question.problem_description?.trim())
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Missing code challenge' })
  })
export const pvpSubmissionSchema = z.object({
  id,
  match_id: id,
  user_id: id,
  question_id: id,
  submission_type: z.enum(['multiple_choice', 'true_false', 'code_challenge']),
  is_correct: z.boolean(),
  points_earned: count,
  time_taken: count,
  submission_rank: count.nullish().transform(value => value ?? undefined),
  submitted_at: id,
})
const questionChanged = z
  .object({
    match: pvpMatchSchema,
    question: pvpQuestionSchema,
    timeRemaining: count,
    submission: pvpSubmissionSchema.optional(),
  })
  .superRefine((payload, ctx) => {
    if (
      payload.match.status !== 'in_progress' ||
      payload.match.question_ids[payload.match.current_question_index] !== payload.question.id ||
      payload.timeRemaining > payload.match.time_per_question ||
      (payload.submission &&
        (payload.submission.match_id !== payload.match.id ||
          payload.submission.question_id !== payload.question.id))
    )
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Mismatched question snapshot' })
  })
const completed = z
  .object({
    match: pvpMatchSchema,
    finalScores: z.array(
      z.object({ userId: id, displayName: z.string(), score: count, rank: count.positive() })
    ),
  })
  .superRefine((payload, ctx) => {
    const players = payload.match.participants || []
    if (
      !['completed', 'cancelled'].includes(payload.match.status) ||
      payload.finalScores.length !== players.length ||
      new Set(payload.finalScores.map(score => score.userId)).size !== payload.finalScores.length ||
      payload.finalScores.some(
        score =>
          !players.some(
            player =>
              player.user_id === score.userId &&
              player.total_score === score.score &&
              player.final_rank === score.rank
          )
      )
    )
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Unconfirmed final scores' })
  })
const typing = z.object({ userId: id, displayName: z.string().optional() })
const userNotice = z.object({ reconnectedUserId: id, displayName: z.string() })
export const pvpSocketEvents = {
  'match:updated': z.object({ match: pvpMatchSchema }),
  'match:started': pvpMatchSchema,
  'match:question_changed': questionChanged,
  'match:completed': completed,
  'participant:joined': pvpParticipantSchema,
  'participant:left': z.object({ user_id: id }),
  'participant:ready': pvpParticipantSchema,
  'participant:disconnected': id,
  'participant:reconnected': id,
  'submission:received': pvpSubmissionSchema,
  'submission:ranked': z.object({
    userId: id,
    questionId: id,
    rank: count.positive(),
    pointsEarned: count,
  }),
  'submission:feedback': z.object({ questionId: id, correctAnswerId: z.string().optional() }),
  'reaction:received': z.object({
    id,
    match_id: id,
    user_id: id,
    emoji: z.string().min(1).max(10),
    target_user_id: optionalText,
    created_at: id,
    display_name: optionalText,
  }),
  'typing:user_started': typing,
  'typing:user_stopped': typing,
  error: z.object({ message: z.string().min(1), code: z.string().optional() }),
  'match:cooldown': z.object({
    duration: count.max(60),
    isMatchOver: z.boolean(),
    nextQuestionIndex: count.optional(),
  }),
  'match:paused': z.object({
    disconnectedUserId: id,
    displayName: z.string(),
    timeoutSeconds: count.max(300),
  }),
  'match:resumed': userNotice,
  'match:forfeit': z.object({
    forfeitUserId: id,
    displayName: z.string(),
    reason: z.literal('disconnect_timeout'),
  }),
}
export type PvPSocketEvent = keyof typeof pvpSocketEvents
export type PvPSocketPayload<K extends PvPSocketEvent> = z.infer<(typeof pvpSocketEvents)[K]>

/** Returns false for another room. Legacy notices without room identity use the active subscription. */
export function belongsToRoom(value: unknown, room: string | null) {
  if (!room) return false
  if (!value || typeof value !== 'object') return true
  const payload = value as {
    match?: { id: string; room_code: string }
    match_id?: string
    id?: string
    room_code?: string
  }
  const match =
    payload.match || (payload.room_code ? (payload as { id: string; room_code: string }) : null)
  return match
    ? match.id === room || match.room_code === room.toUpperCase()
    : !payload.match_id || payload.match_id === room
}
