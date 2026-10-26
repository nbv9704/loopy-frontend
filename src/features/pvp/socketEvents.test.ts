import { expect, it, vi } from 'vitest'
import { pvpMatch, pvpPlayer, pvpQuestion, pvpSubmission } from '../../test-utils/pvp'
import { pvpMatchSchema } from './pvpContracts'
import { pvpSocketEvents } from './socketEvents'
import { subscribePvP } from './socketSubscriptions'
import type { Socket } from 'socket.io-client'
import { finalScoresForMatch } from './finalScores'

it.each([
  pvpMatch({ question_ids: [] }),
  pvpMatch({ question_ids: ['a', 'a'] }),
  pvpMatch({ current_question_index: 1 }),
  pvpMatch({ participants: [pvpPlayer(), pvpPlayer()] }),
  pvpMatch({ participants: [pvpPlayer({ match_id: 'foreign' })] }),
  pvpMatch({ participants: [pvpPlayer({ correct_answers: 2, questions_answered: 1 })] }),
])('rejects inconsistent match identities and counts %#', value => {
  expect(pvpMatchSchema.safeParse(value).success).toBe(false)
})
it('requires the question and restored submission to match the active server round', () => {
  const value = {
    match: pvpMatch(),
    question: pvpQuestion(),
    timeRemaining: 30,
    submission: pvpSubmission(),
  }
  expect(pvpSocketEvents['match:question_changed'].safeParse(value).success).toBe(true)
  for (const invalid of [
    { ...value, timeRemaining: -1 },
    { ...value, timeRemaining: 61 },
    { ...value, question: pvpQuestion({ id: 'foreign' }) },
    { ...value, submission: pvpSubmission({ match_id: 'foreign' }) },
    { ...value, question: { ...pvpQuestion(), options: { A: 'First' } } },
  ])
    expect(pvpSocketEvents['match:question_changed'].safeParse(invalid).success).toBe(false)
})
it('does not accept invented final scores or a premature completed event', () => {
  const match = pvpMatch({
    status: 'completed',
    participants: [pvpPlayer({ total_score: 10, final_rank: 1 })],
  })
  const value = {
    match,
    finalScores: [
      { userId: match.participants![0].user_id, displayName: 'Learner', score: 10, rank: 1 },
    ],
  }
  expect(pvpSocketEvents['match:completed'].safeParse(value).success).toBe(true)
  expect(
    pvpSocketEvents['match:completed'].safeParse({
      ...value,
      match: { ...match, status: 'cancelled' },
    }).success
  ).toBe(true)
  expect(
    pvpSocketEvents['match:completed'].safeParse({
      ...value,
      match: { ...match, status: 'in_progress' },
    }).success
  ).toBe(false)
  expect(
    pvpSocketEvents['match:completed'].safeParse({
      ...value,
      finalScores: [{ ...value.finalScores[0], score: 999 }],
    }).success
  ).toBe(false)
})

it('does not fabricate first place when a completed legacy match has no persisted ranks', () => {
  expect(finalScoresForMatch(pvpMatch({ status: 'completed' }))).toBeNull()
  expect(
    finalScoresForMatch(
      pvpMatch({
        status: 'completed',
        participants: [pvpPlayer({ total_score: 0, final_rank: 2 })],
      })
    )?.[0]
  ).toMatchObject({ score: 0, rank: 2 })
})

it('counts active capacity separately from historical departed players', () => {
  const players = [
    pvpPlayer(),
    pvpPlayer({ id: 'second', user_id: 'second' }),
    pvpPlayer({ id: 'departed', user_id: 'departed', left_at: '2026-10-24T00:00:00Z' }),
  ]
  expect(pvpMatchSchema.safeParse(pvpMatch({ participants: players })).success).toBe(true)
  expect(
    pvpMatchSchema.safeParse(
      pvpMatch({ participants: players.map(player => ({ ...player, left_at: undefined })) })
    ).success
  ).toBe(false)
})
it('drops malformed/foreign packets and removes private fields before notifying the UI', () => {
  let receive!: (value: unknown) => void
  const socket = {
    on: vi.fn((_event, callback) => {
      receive = callback
    }),
    off: vi.fn(),
  } as unknown as Socket
  const callback = vi.fn(),
    invalid = vi.fn()
  const match = pvpMatch()
  const unsubscribe = subscribePvP(socket, 'match:updated', callback, {
    current: () => true,
    room: () => match.id,
    userId: () => 'actor',
    invalid,
  })
  receive({ match: { participants: {} } })
  receive({ match: pvpMatch({ id: 'foreign', participants: [] }) })
  expect(callback).not.toHaveBeenCalled()
  expect(invalid).toHaveBeenCalledOnce()
  receive({ match: { ...match, private_answer: 'secret' } })
  expect(callback).toHaveBeenCalledOnce()
  expect(JSON.stringify(callback.mock.calls)).not.toContain('secret')
  unsubscribe()
  receive({ match })
  expect(callback).toHaveBeenCalledOnce()
  expect(socket.off).toHaveBeenCalledWith('match:updated', receive)
})
