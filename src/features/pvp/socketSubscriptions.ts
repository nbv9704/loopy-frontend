import type { Socket } from 'socket.io-client'
import {
  belongsToRoom,
  pvpSocketEvents,
  type PvPSocketEvent,
  type PvPSocketPayload,
} from './socketEvents'

/** Subscribe to one transport instance; discarded transports can never update the new session. */
export function subscribePvP<K extends PvPSocketEvent>(
  socket: Socket | null,
  event: K,
  callback: (value: PvPSocketPayload<K>) => void,
  context: {
    current: () => boolean
    room: () => string | null
    userId: () => string | undefined
    invalid: () => void
    accepted?: () => void
  }
) {
  if (!socket) return () => {}
  let subscribed = true
  const receive = (value: unknown) => {
    if (!subscribed || !context.current()) return
    const parsed = pvpSocketEvents[event].safeParse(value)
    if (!parsed.success) {
      context.invalid()
      return
    }
    if (event !== 'error' && !belongsToRoom(parsed.data, context.room())) return
    if (event === 'match:question_changed') {
      const payload = parsed.data as PvPSocketPayload<'match:question_changed'>
      if (payload.submission && payload.submission.user_id !== context.userId()) {
        context.invalid()
        return
      }
    }
    if (['match:updated', 'match:question_changed'].includes(event)) context.accepted?.()
    callback(parsed.data as PvPSocketPayload<K>)
  }
  socket.on(event as string, receive)
  return () => {
    subscribed = false
    socket.off(event as string, receive)
  }
}
