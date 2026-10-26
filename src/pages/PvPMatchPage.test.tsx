// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import PvPMatchPage from './PvPMatchPage'
import { pvpService } from '../services/pvp.service'

const state = vi.hoisted(() => ({
  user: { id: 'alice' },
  handlers: new Map<string, (data: any) => void>(),
  socket: { socket: null as object | null, joinMatch: vi.fn(), leaveMatch: vi.fn() },
}))
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => ({ user: state.user }) }))
vi.mock('../hooks/usePvPSocket', () => ({
  usePvPSocket: () =>
    new Proxy(state.socket, {
      get: (target, key) =>
        typeof key === 'string' && key.startsWith('on')
          ? (callback: (data: any) => void) => {
              state.handlers.set(key, callback)
              return () => state.handlers.delete(key)
            }
          : Reflect.get(target, key),
    }),
}))
vi.mock('../services/pvp.service', () => ({
  pvpService: { getMatch: vi.fn(), joinMatch: vi.fn() },
}))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}))
vi.mock('../hooks/useContentPreloader', () => ({ useContentPreloader: () => ({ content: {} }) }))
vi.mock('../components/pvp/MatchLobby', () => ({
  default: ({ match, currentUserId }: any) => (
    <h1>
      Lobby:{match.id}:{currentUserId}
    </h1>
  ),
}))
vi.mock('../components/pvp/MatchArena', () => ({
  default: ({ question }: any) => <h1>Question:{question.id}</h1>,
}))
vi.mock('../components/pvp/MatchResults', () => ({
  default: ({ finalScores }: any) => (
    <h1>Results:{finalScores.map((score: any) => score.userId).join(',')}</h1>
  ),
}))
vi.mock('../components/LoadingScreen', () => ({ default: () => <p>Loading</p> }))
vi.mock('react-hot-toast', () => ({
  default: Object.assign(vi.fn(), { success: vi.fn(), error: vi.fn() }),
}))
const waiting = (id: string) => ({ id, room_code: id, status: 'waiting', participants: [] })
const Navigate = () => {
  const navigate = useNavigate()
  return <button onClick={() => navigate('/rooms/second')}>Switch room</button>
}
const view = () => (
  <MemoryRouter initialEntries={['/rooms/first']}>
    <Navigate />
    <Routes>
      <Route path="/rooms/:roomCode" element={<PvPMatchPage />} />
    </Routes>
  </MemoryRouter>
)
beforeEach(() => {
  vi.resetAllMocks()
  state.user = { id: 'alice' }
  state.socket.socket = null
  state.handlers.clear()
  vi.mocked(pvpService.getMatch).mockImplementation(async id => waiting(id) as never)
  vi.mocked(pvpService.joinMatch).mockImplementation(async id => waiting(id) as never)
})
afterEach(cleanup)

it('ignores a late room lookup after navigating and never starts its join', async () => {
  let resolve!: (data: any) => void
  vi.mocked(pvpService.getMatch).mockReturnValueOnce(
    new Promise(done => {
      resolve = done
    })
  )
  render(view())
  await waitFor(() => expect(pvpService.getMatch).toHaveBeenCalledTimes(1))
  fireEvent.click(screen.getByRole('button', { name: 'Switch room' }))
  await screen.findByText('Lobby:second:alice')
  await act(async () => {
    resolve(waiting('first'))
    await Promise.resolve()
  })
  expect(pvpService.joinMatch).not.toHaveBeenCalled()
  expect(state.socket.joinMatch).toHaveBeenCalledWith('second')
  expect(screen.queryByText('Lobby:first:alice')).toBeNull()
})

it('keeps the current room when the same account profile is refreshed', async () => {
  const { rerender } = render(view())
  await screen.findByText('Lobby:first:alice')
  state.user = { id: 'alice' }
  rerender(view())
  await waitFor(() => expect(state.socket.joinMatch).toHaveBeenCalledTimes(1))
  expect(state.socket.leaveMatch).not.toHaveBeenCalled()
})

it('resets the previous account match immediately while loading another account', async () => {
  const { rerender } = render(view())
  await screen.findByText('Lobby:first:alice')
  let resolve!: (data: any) => void
  vi.mocked(pvpService.getMatch).mockReturnValueOnce(
    new Promise(done => {
      resolve = done
    })
  )
  state.user = { id: 'bob' }
  rerender(view())
  expect(screen.queryByText('Lobby:first:alice')).toBeNull()
  await act(async () => {
    resolve(waiting('first'))
    await Promise.resolve()
  })
  await screen.findByText('Lobby:first:bob')
})

it('restores committed final ranks on reload without joining an ended match', async () => {
  vi.mocked(pvpService.getMatch).mockResolvedValueOnce({
    ...waiting('first'),
    status: 'completed',
    participants: [
      { user_id: 'alice', total_score: 0, final_rank: 2 },
      { user_id: 'winner', total_score: 10, final_rank: 1 },
    ],
  } as never)
  render(view())
  await screen.findByText('Results:winner,alice')
  expect(pvpService.joinMatch).not.toHaveBeenCalled()
  expect(state.socket.joinMatch).not.toHaveBeenCalled()
})

it('ignores older question events and never resurrects an already completed match', async () => {
  state.socket.socket = {}
  render(view())
  await screen.findByText('Lobby:first:alice')
  const match = {
    ...waiting('first'),
    status: 'in_progress',
    current_question_index: 1,
    question_ids: ['one', 'two'],
  }
  act(() =>
    state.handlers.get('onQuestionChanged')!({ match, question: { id: 'two' }, timeRemaining: 30 })
  )
  await screen.findByText('Question:two')
  act(() => state.handlers.get('onMatchUpdated')!({ match: { ...match, status: 'waiting' } }))
  expect(screen.queryByText('Lobby:first:alice')).toBeNull()
  act(() =>
    state.handlers.get('onQuestionChanged')!({
      match: { ...match, current_question_index: 0 },
      question: { id: 'one' },
      timeRemaining: 30,
    })
  )
  expect(screen.queryByText('Question:one')).toBeNull()
  act(() =>
    state.handlers.get('onMatchCompleted')!({
      match: { ...match, status: 'completed' },
      finalScores: [{ userId: 'alice' }],
    })
  )
  await screen.findByText('Results:alice')
  act(() =>
    state.handlers.get('onQuestionChanged')!({ match, question: { id: 'two' }, timeRemaining: 30 })
  )
  expect(screen.queryByText('Question:two')).toBeNull()
  expect(screen.getByText('Results:alice')).toBeTruthy()
})

it('keeps a failed room read on screen with explicit retry and performs no HTTP membership write', async () => {
  vi.mocked(pvpService.getMatch).mockRejectedValueOnce(new Error('Room temporarily unavailable'))
  render(view())
  await screen.findByText('Room temporarily unavailable')
  expect(pvpService.joinMatch).not.toHaveBeenCalled()
  expect(state.socket.joinMatch).not.toHaveBeenCalled()
  fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
  await screen.findByText('Lobby:first:alice')
  expect(state.socket.joinMatch).toHaveBeenCalledWith('first')
})
it('ignores snapshots from another room even if their status is newer', async () => {
  state.socket.socket = {}
  render(view())
  await screen.findByText('Lobby:first:alice')
  act(() =>
    state.handlers.get('onMatchUpdated')!({
      match: { ...waiting('second'), status: 'in_progress' },
    })
  )
  expect(screen.getByText('Lobby:first:alice')).toBeTruthy()
})
