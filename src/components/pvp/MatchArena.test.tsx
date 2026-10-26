// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import MatchArena from './MatchArena'
import type { UsePvPSocketReturn } from '../../hooks/usePvPSocket'
import type { PvPSubmission } from '../../types/pvp.types'
import { pvpMatch, pvpQuestion, pvpSubmission, pvpActor } from '../../test-utils/pvp'
import toast from 'react-hot-toast'

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('react-hot-toast', () => ({ default: { success: vi.fn(), error: vi.fn() } }))
vi.mock('@uiw/react-codemirror', () => ({ default: () => null }))
afterEach(() => {
  cleanup()
  vi.clearAllMocks()
})

it('restores an acknowledged submission after reload without another success toast', () => {
  const socket = {
    socket: {},
    isConnected: true,
    onError: () => () => {},
    onSubmissionReceived: () => () => {},
    onSubmissionRanked: () => () => {},
    onReactionReceived: () => () => {},
  } as unknown as UsePvPSocketReturn
  const match = pvpMatch({ question_ids: ['one'] })
  const question = pvpQuestion({ id: 'one', options: [{ id: 'A', text: 'Answer' }] })
  render(
    <MatchArena
      match={match}
      question={question}
      timeRemaining={30}
      socket={socket}
      currentUserId={pvpActor}
      pauseCountdown={0}
      initialSubmission={pvpSubmission({ question_id: 'one', points_earned: 60 })}
    />
  )
  expect((screen.getByRole('button', { name: 'Đã gửi' }) as HTMLButtonElement).disabled).toBe(true)
  expect(toast.success).not.toHaveBeenCalled()
})

it('ignores old-question acknowledgements and resubscribes after changing questions', () => {
  let receive!: (submission: PvPSubmission) => void
  const unsubscribe = vi.fn()
  const socket = {
    socket: {},
    isConnected: true,
    onError: () => () => {},
    onSubmissionReceived: vi.fn(callback => {
      receive = callback
      return unsubscribe
    }),
    onSubmissionRanked: () => () => {},
    onReactionReceived: () => () => {},
    submitAnswer: vi.fn(),
  } as unknown as UsePvPSocketReturn
  const match = pvpMatch({ question_ids: ['one', 'two'] })
  const question = pvpQuestion({ id: 'one', options: [{ id: 'A', text: 'Answer' }] })
  const props = {
    match,
    question,
    timeRemaining: 50,
    currentUserId: pvpActor,
    socket,
    pauseCountdown: 0,
  }
  const { rerender } = render(<MatchArena {...props} />)
  fireEvent.click(screen.getByRole('button', { name: 'A. Answer' }))
  act(() => receive(pvpSubmission({ question_id: 'one', points_earned: 60 })))
  expect(screen.getByRole('button', { name: 'Đã gửi' })).toBeTruthy()
  rerender(<MatchArena {...props} question={{ ...question, id: 'two' }} />)
  expect(unsubscribe).toHaveBeenCalledOnce()
  expect(socket.onSubmissionReceived).toHaveBeenCalledTimes(2)
  act(() => receive(pvpSubmission({ question_id: 'one', points_earned: 60 })))
  expect(screen.queryByRole('button', { name: 'Đã gửi' })).toBeNull()
  fireEvent.click(screen.getByRole('button', { name: 'A. Answer' }))
  expect((screen.getByRole('button', { name: 'Gửi đáp án' }) as HTMLButtonElement).disabled).toBe(
    false
  )
  act(() => receive(pvpSubmission({ question_id: 'two', points_earned: 50 })))
  expect(screen.getByRole('button', { name: 'Đã gửi' })).toBeTruthy()
  expect(toast.success).toHaveBeenCalledTimes(2)
})
