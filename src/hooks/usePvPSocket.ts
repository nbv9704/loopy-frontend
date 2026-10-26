/**
 * PvP Socket Hook
 * Real-time WebSocket connection for PvP matches
 *
 * SECURITY UPDATE: Authentication via httpOnly cookies
 * - No longer reads tokens from localStorage
 * - Socket.io automatically sends cookies with connection
 * - Backend validates token from cookie
 */

import { useLayoutEffect, useRef, useState, useCallback, useMemo } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../contexts/AuthContext'
import { API_ORIGIN as SOCKET_URL } from '../config/api'
import { subscribePvP } from '../features/pvp/socketSubscriptions'
import type { PvPSocketEvent, PvPSocketPayload } from '../features/pvp/socketEvents'
import type {
  PvPMatch,
  PvPParticipant,
  PvPSubmission,
  PvPReaction,
  MatchUpdatedPayload,
  QuestionChangedPayload,
  MatchCompletedPayload,
  SubmissionRankedPayload,
  TypingPayload,
  ErrorPayload,
  CooldownPayload,
  MatchPausedPayload,
  MatchResumedPayload,
  MatchForfeitPayload,
} from '../types/pvp.types'

export interface UsePvPSocketReturn {
  socket: Socket | null
  isConnected: boolean
  error: string | null
  reconnect: () => void

  // Actions
  joinMatch: (matchId: string) => void
  leaveMatch: (matchId: string) => void
  markReady: (matchId: string) => boolean
  submitAnswer: (matchId: string, questionId: string, answer: string, timeTaken: number) => boolean
  submitCode: (matchId: string, questionId: string, code: string, timeTaken: number) => boolean
  sendReaction: (matchId: string, emoji: string, targetUserId?: string) => void
  startTyping: (matchId: string) => void
  stopTyping: (matchId: string) => void

  // Event listeners
  onMatchUpdated: (callback: (payload: MatchUpdatedPayload) => void) => () => void
  onMatchStarted: (callback: (match: PvPMatch) => void) => () => void
  onQuestionChanged: (callback: (payload: QuestionChangedPayload) => void) => () => void
  onMatchCompleted: (callback: (payload: MatchCompletedPayload) => void) => () => void
  onParticipantJoined: (callback: (participant: PvPParticipant) => void) => () => void
  onParticipantLeft: (
    callback: (participant: Pick<PvPParticipant, 'user_id'>) => void
  ) => () => void
  onParticipantReady: (callback: (participant: PvPParticipant) => void) => () => void
  onParticipantDisconnected: (callback: (userId: string) => void) => () => void
  onParticipantReconnected: (callback: (userId: string) => void) => () => void
  onSubmissionReceived: (callback: (submission: PvPSubmission) => void) => () => void
  onSubmissionRanked: (callback: (payload: SubmissionRankedPayload) => void) => () => void
  onSubmissionFeedback: (
    callback: (payload: { questionId: string; correctAnswerId?: string }) => void
  ) => () => void
  onReactionReceived: (callback: (reaction: PvPReaction) => void) => () => void
  onTypingStarted: (callback: (payload: TypingPayload) => void) => () => void
  onTypingStopped: (callback: (payload: TypingPayload) => void) => () => void
  onError: (callback: (error: ErrorPayload) => void) => () => void
  onCooldown: (callback: (payload: CooldownPayload) => void) => () => void
  onMatchPaused: (callback: (payload: MatchPausedPayload) => void) => () => void
  onMatchResumed: (callback: (payload: MatchResumedPayload) => void) => () => void
  onMatchForfeit: (callback: (payload: MatchForfeitPayload) => void) => () => void
}

export const usePvPSocket = (): UsePvPSocketReturn => {
  const { user } = useAuth()
  const userId = user?.id
  const owner = useRef(userId)
  const socketRef = useRef<Socket | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const activeMatchRef = useRef<string | null>(null)

  useLayoutEffect(() => {
    owner.current = userId
    activeMatchRef.current = null
    setIsConnected(false)
    setError(null)
    if (!userId) {
      setSocket(null)
      return
    }
    const transport = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      withCredentials: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
    })
    socketRef.current = transport
    setSocket(transport)
    const current = () => socketRef.current === transport
    transport.on('connect', () => {
      if (!current()) return
      setIsConnected(true)
      setError(null)
      if (activeMatchRef.current) transport.emit('match:join', activeMatchRef.current)
    })
    transport.on('disconnect', () => {
      if (current()) setIsConnected(false)
    })
    transport.on('connect_error', () => {
      if (!current()) return
      setIsConnected(false)
      setError('Không kết nối được phòng PvP. Bạn có thể thử kết nối lại.')
    })
    return () => {
      // Invalidate callbacks before disconnect can synchronously emit another event.
      if (socketRef.current === transport) socketRef.current = null
      transport.removeAllListeners()
      transport.disconnect()
    }
  }, [userId])

  const reconnect = useCallback(() => {
    if (owner.current === userId) socketRef.current?.connect()
  }, [userId])
  const joinMatch = useCallback(
    (matchId: string) => {
      if (owner.current !== userId || !socketRef.current) return
      activeMatchRef.current = matchId
      if (socketRef.current.connected) socketRef.current.emit('match:join', matchId)
    },
    [userId]
  )
  const leaveMatch = useCallback(
    (matchId: string) => {
      if (owner.current !== userId || activeMatchRef.current !== matchId) return
      activeMatchRef.current = null
      if (socketRef.current?.connected) socketRef.current.emit('match:leave', matchId)
    },
    [userId]
  )
  const emit = useCallback(
    (matchId: string, event: string, payload: unknown) => {
      const current = socketRef.current
      // Never add an offline command to Socket.IO's replay buffer.
      if (owner.current !== userId || !current?.connected || activeMatchRef.current !== matchId)
        return false
      current.emit(event, payload)
      return true
    },
    [userId]
  )
  const markReady = useCallback((matchId: string) => emit(matchId, 'match:ready', matchId), [emit])
  const submitAnswer = useCallback(
    (matchId: string, questionId: string, answer: string, timeTaken: number) =>
      emit(matchId, 'submission:answer', { matchId, questionId, answer, timeTaken }),
    [emit]
  )
  const submitCode = useCallback(
    (matchId: string, questionId: string, code: string, timeTaken: number) =>
      emit(matchId, 'submission:code', { matchId, questionId, code, timeTaken }),
    [emit]
  )
  const sendReaction = useCallback(
    (matchId: string, emoji: string, targetUserId?: string) => {
      emit(matchId, 'reaction:send', { matchId, emoji, targetUserId })
    },
    [emit]
  )
  const startTyping = useCallback(
    (matchId: string) => {
      emit(matchId, 'typing:start', matchId)
    },
    [emit]
  )
  const stopTyping = useCallback(
    (matchId: string) => {
      emit(matchId, 'typing:stop', matchId)
    },
    [emit]
  )

  const listeners = useMemo(() => {
    function subscribe<K extends PvPSocketEvent>(
      event: K,
      callback: (value: PvPSocketPayload<K>) => void
    ) {
      const subscribed = socketRef.current
      return subscribePvP(subscribed, event, callback, {
        current: () => socketRef.current === subscribed && owner.current === userId,
        room: () => activeMatchRef.current,
        userId: () => owner.current,
        invalid: () => setError('Không đọc được dữ liệu realtime PvP. Hãy đồng bộ lại phòng.'),
        accepted: () => setError(null),
      })
    }
    return {
      onMatchUpdated: (callback: (value: PvPSocketPayload<'match:updated'>) => void) =>
        subscribe('match:updated', callback),
      onMatchStarted: (callback: (value: PvPSocketPayload<'match:started'>) => void) =>
        subscribe('match:started', callback),
      onQuestionChanged: (callback: (value: PvPSocketPayload<'match:question_changed'>) => void) =>
        subscribe('match:question_changed', callback),
      onMatchCompleted: (callback: (value: PvPSocketPayload<'match:completed'>) => void) =>
        subscribe('match:completed', callback),
      onParticipantJoined: (callback: (value: PvPSocketPayload<'participant:joined'>) => void) =>
        subscribe('participant:joined', callback),
      onParticipantLeft: (callback: (value: PvPSocketPayload<'participant:left'>) => void) =>
        subscribe('participant:left', callback),
      onParticipantReady: (callback: (value: PvPSocketPayload<'participant:ready'>) => void) =>
        subscribe('participant:ready', callback),
      onParticipantDisconnected: (callback: (value: string) => void) =>
        subscribe('participant:disconnected', callback),
      onParticipantReconnected: (callback: (value: string) => void) =>
        subscribe('participant:reconnected', callback),
      onSubmissionReceived: (callback: (value: PvPSocketPayload<'submission:received'>) => void) =>
        subscribe('submission:received', callback),
      onSubmissionRanked: (callback: (value: PvPSocketPayload<'submission:ranked'>) => void) =>
        subscribe('submission:ranked', callback),
      onSubmissionFeedback: (callback: (value: PvPSocketPayload<'submission:feedback'>) => void) =>
        subscribe('submission:feedback', callback),
      onReactionReceived: (callback: (value: PvPSocketPayload<'reaction:received'>) => void) =>
        subscribe('reaction:received', callback),
      onTypingStarted: (callback: (value: PvPSocketPayload<'typing:user_started'>) => void) =>
        subscribe('typing:user_started', callback),
      onTypingStopped: (callback: (value: PvPSocketPayload<'typing:user_stopped'>) => void) =>
        subscribe('typing:user_stopped', callback),
      onError: (callback: (value: PvPSocketPayload<'error'>) => void) =>
        subscribe('error', callback),
      onCooldown: (callback: (value: PvPSocketPayload<'match:cooldown'>) => void) =>
        subscribe('match:cooldown', callback),
      onMatchPaused: (callback: (value: PvPSocketPayload<'match:paused'>) => void) =>
        subscribe('match:paused', callback),
      onMatchResumed: (callback: (value: PvPSocketPayload<'match:resumed'>) => void) =>
        subscribe('match:resumed', callback),
      onMatchForfeit: (callback: (value: PvPSocketPayload<'match:forfeit'>) => void) =>
        subscribe('match:forfeit', callback),
    }
  }, [userId])
  return {
    socket,
    isConnected,
    error,
    reconnect,
    joinMatch,
    leaveMatch,
    markReady,
    submitAnswer,
    submitCode,
    sendReaction,
    startTyping,
    stopTyping,
    ...listeners,
  }
}
