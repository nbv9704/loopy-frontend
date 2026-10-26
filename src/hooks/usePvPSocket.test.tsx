// @vitest-environment jsdom
import { act, cleanup, renderHook } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { io } from 'socket.io-client'
import { usePvPSocket } from './usePvPSocket'

const auth = vi.hoisted(() => ({ user: { id: 'alice' } as { id: string } | null }))
vi.mock('../contexts/AuthContext', () => ({ useAuth: () => auth }))
vi.mock('socket.io-client', () => ({ io: vi.fn() }))
const makeSocket = () => {
  const handlers = new Map<string, (...args: any[]) => void>()
  return {
    connected: false,
    emit: vi.fn(),
    off: vi.fn(),
    disconnect: vi.fn(),
    connect: vi.fn(),
    removeAllListeners: vi.fn(),
    on: vi.fn((event: string, callback: (...args: any[]) => void) => handlers.set(event, callback)),
    receive: (event: string, value?: unknown) => handlers.get(event)?.(value),
  }
}
beforeEach(() => {
  vi.resetAllMocks()
  auth.user = { id: 'alice' }
})
afterEach(cleanup)

it('does not disconnect an active match when the same user profile is refreshed', () => {
  const socket = makeSocket()
  vi.mocked(io).mockReturnValue(socket as never)
  const { rerender } = renderHook(usePvPSocket)
  auth.user = { id: 'alice' }
  rerender()
  expect(io).toHaveBeenCalledOnce()
  expect(socket.disconnect).not.toHaveBeenCalled()
})

it('cleans a subscription from its original socket after an account switch', () => {
  const first = makeSocket(),
    second = makeSocket()
  vi.mocked(io)
    .mockReturnValueOnce(first as never)
    .mockReturnValueOnce(second as never)
  const { result, rerender } = renderHook(usePvPSocket)
  act(() => {
    first.connected = true
    first.receive('connect')
  })
  const callback = vi.fn()
  const unsubscribe = result.current.onMatchUpdated(callback)
  auth.user = { id: 'bob' }
  rerender()
  act(() => {
    second.connected = true
    second.receive('connect')
  })
  unsubscribe()
  expect(first.off).toHaveBeenCalledWith('match:updated', expect.any(Function))
  expect(second.off).not.toHaveBeenCalled()
  expect(first.disconnect).toHaveBeenCalledOnce()
  expect(result.current.socket).toBe(second)
})

it('never queues offline game commands for replay on reconnect', () => {
  const socket = makeSocket()
  vi.mocked(io).mockReturnValue(socket as never)
  const { result } = renderHook(usePvPSocket)
  act(() => result.current.joinMatch('match'))
  act(() => {
    expect(result.current.markReady('match')).toBe(false)
    expect(result.current.submitAnswer('match', 'question', 'A', 5)).toBe(false)
    expect(result.current.submitCode('match', 'question', 'code', 5)).toBe(false)
    result.current.sendReaction('match', '🙂')
    result.current.startTyping('match')
    result.current.stopTyping('match')
  })
  expect(socket.emit).not.toHaveBeenCalled()
  act(() => {
    socket.connected = true
    socket.receive('connect')
  })
  expect(socket.emit.mock.calls).toEqual([['match:join', 'match']])
})

it('blocks captured commands from the previous account and does not leave the wrong desired room', () => {
  const first = makeSocket(),
    second = makeSocket()
  vi.mocked(io)
    .mockReturnValueOnce(first as never)
    .mockReturnValueOnce(second as never)
  const { result, rerender } = renderHook(usePvPSocket)
  const oldJoin = result.current.joinMatch,
    oldSubmit = result.current.submitAnswer
  auth.user = { id: 'bob' }
  rerender()
  act(() => {
    second.connected = true
    second.receive('connect')
    result.current.joinMatch('new')
    oldJoin('old')
    oldSubmit('new', 'question', 'A', 1)
    result.current.leaveMatch('old')
    result.current.markReady('new')
  })
  expect(second.emit.mock.calls).toEqual([
    ['match:join', 'new'],
    ['match:ready', 'new'],
  ])
})

it('caps automatic reconnects and retries explicitly on the existing transport', () => {
  const socket = makeSocket()
  vi.mocked(io).mockReturnValue(socket as never)
  const { result } = renderHook(usePvPSocket)
  expect(io).toHaveBeenCalledWith(
    expect.any(String),
    expect.objectContaining({ reconnectionAttempts: 5 })
  )
  act(() => socket.receive('connect_error', new Error('private provider details')))
  expect(result.current.error).toContain('Không kết nối được')
  expect(result.current.error).not.toContain('private')
  act(() => result.current.reconnect())
  expect(socket.connect).toHaveBeenCalledOnce()
  expect(io).toHaveBeenCalledOnce()
})

it('rejoins the desired room on reconnect and clears it when leaving', () => {
  const socket = makeSocket()
  vi.mocked(io).mockReturnValue(socket as never)
  const { result } = renderHook(usePvPSocket)
  act(() => result.current.joinMatch('match'))
  expect(socket.emit).not.toHaveBeenCalled()
  act(() => {
    socket.connected = true
    socket.receive('connect')
  })
  expect(socket.emit).toHaveBeenCalledWith('match:join', 'match')
  act(() => {
    socket.connected = false
    socket.receive('disconnect')
  })
  act(() => {
    socket.connected = true
    socket.receive('connect')
  })
  expect(socket.emit.mock.calls.filter(([event]) => event === 'match:join')).toHaveLength(2)
  act(() => result.current.leaveMatch('match'))
  act(() => {
    socket.connected = false
    socket.receive('disconnect')
    socket.connected = true
    socket.receive('connect')
  })
  expect(socket.emit.mock.calls.filter(([event]) => event === 'match:join')).toHaveLength(2)
})
