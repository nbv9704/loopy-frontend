// @vitest-environment jsdom
import { Suspense } from 'react'
import { act, cleanup, render, renderHook } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import type { UsePvPSocketReturn } from '../../hooks/usePvPSocket'
import type { PvPSubmission } from '../../types/pvp.types'
import { pvpActor, pvpMatchId, pvpQuestionId, pvpSubmission } from '../../test-utils/pvp'
import { usePvPSubmission } from './usePvPSubmission'

function fixture() {
  const submissions = new Set<(value: PvPSubmission) => void>()
  const errors = new Set<(value: { message: string }) => void>()
  const socket = {
    socket: {},
    isConnected: true,
    joinMatch: vi.fn(),
    onSubmissionReceived: (callback: (value: PvPSubmission) => void) => {
      submissions.add(callback)
      return () => {
        submissions.delete(callback)
      }
    },
    onError: (callback: (value: { message: string }) => void) => {
      errors.add(callback)
      return () => {
        errors.delete(callback)
      }
    },
  } as unknown as UsePvPSocketReturn
  const onConfirmed = vi.fn()
  const props = {
    socket,
    matchId: pvpMatchId,
    questionId: pvpQuestionId,
    userId: pvpActor,
    onConfirmed,
  }
  return {
    socket,
    props,
    onConfirmed,
    receive: (value: PvPSubmission) => submissions.forEach(callback => callback(value)),
    fail: () => errors.forEach(callback => callback({ message: 'Save failed' })),
  }
}
afterEach(() => {
  cleanup()
  vi.useRealTimers()
})

it('locks same-turn duplicates and only confirms matching saved submissions once', async () => {
  const state = fixture()
  const { result } = renderHook(() => usePvPSubmission(state.props))
  const send = vi.fn(() => true)
  act(() => {
    void result.current.request(send)
    void result.current.request(send)
  })
  expect(send).toHaveBeenCalledOnce()
  expect(result.current.pending).toBe(true)
  act(() => state.receive(pvpSubmission({ match_id: 'foreign' })))
  expect(result.current.pending).toBe(true)
  expect(state.onConfirmed).not.toHaveBeenCalled()
  await act(async () => {
    state.receive(pvpSubmission())
  })
  expect(result.current.pending).toBe(false)
  expect(result.current.saved?.points_earned).toBe(10)
  act(() => state.receive(pvpSubmission()))
  expect(state.onConfirmed).toHaveBeenCalledOnce()
})

it('times out with one resync and no automatic submission retry', async () => {
  vi.useFakeTimers()
  const state = fixture()
  const { result } = renderHook(() => usePvPSubmission(state.props))
  const send = vi.fn(() => true)
  act(() => {
    void result.current.request(send)
  })
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10000)
  })
  expect(result.current.pending).toBe(false)
  expect(result.current.saved).toBeNull()
  expect(result.current.error).toContain('Chưa xác nhận')
  expect(state.socket.joinMatch).toHaveBeenCalledOnce()
  await act(async () => {
    await vi.advanceTimersByTimeAsync(60000)
  })
  expect(send).toHaveBeenCalledOnce()
  expect(state.socket.joinMatch).toHaveBeenCalledOnce()
})

it('unlocks after a server error and allows retry without a success acknowledgement', async () => {
  const state = fixture()
  const { result } = renderHook(() => usePvPSubmission(state.props))
  const send = vi.fn(() => true)
  act(() => {
    void result.current.request(send)
  })
  await act(async () => {
    state.fail()
  })
  expect(result.current.error).toBe('Save failed')
  expect(result.current.pending).toBe(false)
  act(() => {
    void result.current.request(send)
  })
  await act(async () => {
    state.receive(pvpSubmission())
  })
  expect(send).toHaveBeenCalledTimes(2)
  expect(state.onConfirmed).toHaveBeenCalledOnce()
})

it('restores a committed result after connection loss without a new success toast', async () => {
  const state = fixture()
  const { result, rerender } = renderHook(
    ({ connected, initial }) =>
      usePvPSubmission({
        ...state.props,
        socket: { ...state.socket, isConnected: connected },
        initial,
      }),
    { initialProps: { connected: true, initial: null as PvPSubmission | null } }
  )
  act(() => {
    void result.current.request(() => true)
  })
  await act(async () => {
    rerender({ connected: false, initial: null })
  })
  expect(result.current.pending).toBe(false)
  rerender({ connected: true, initial: pvpSubmission() })
  expect(result.current.saved?.id).toBe('saved')
  expect(state.onConfirmed).not.toHaveBeenCalled()
})

it('rejects an emit blocked by a transport race and does not pretend it was sent', async () => {
  const state = fixture()
  const { result } = renderHook(() => usePvPSubmission(state.props))
  await act(async () => {
    await result.current.request(() => false)
  })
  expect(result.current.pending).toBe(false)
  expect(result.current.saved).toBeNull()
  expect(result.current.error).toContain('Kết nối đã mất')
})

it('cancels a pending confirmation when Suspense hides the form and permits another request on reveal', async () => {
  vi.useFakeTimers()
  const state = fixture()
  const gate = new Promise<never>(() => {})
  let session!: ReturnType<typeof usePvPSubmission>
  function Form({ hidden }: { hidden: boolean }) {
    session = usePvPSubmission(state.props)
    if (hidden) throw gate
    return <p>Question</p>
  }
  const view = (hidden: boolean) => (
    <Suspense fallback={<p>Hidden</p>}>
      <Form hidden={hidden} />
    </Suspense>
  )
  const { rerender } = render(view(false))
  act(() => {
    void session.request(() => true)
  })
  rerender(view(true))
  await act(async () => {
    await vi.advanceTimersByTimeAsync(10000)
    state.receive(pvpSubmission())
  })
  expect(state.socket.joinMatch).not.toHaveBeenCalled()
  expect(state.onConfirmed).not.toHaveBeenCalled()
  rerender(view(false))
  expect(session.pending).toBe(false)
  act(() => {
    void session.request(() => true)
  })
  await act(async () => {
    state.receive(pvpSubmission())
  })
  expect(session.saved?.id).toBe('saved')
})
