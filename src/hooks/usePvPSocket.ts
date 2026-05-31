/**
 * PvP Socket Hook
 * Real-time WebSocket connection for PvP matches
 *
 * SECURITY UPDATE: Authentication via httpOnly cookies
 * - No longer reads tokens from localStorage
 * - Socket.io automatically sends cookies with connection
 * - Backend validates token from cookie
 */

import { useEffect, useRef, useState, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'
import { useAuth } from '../contexts/AuthContext'
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

const SOCKET_URL = import.meta.env.PROD && !import.meta.env.VITE_API_URL 
  ? (() => { throw new Error('VITE_API_URL is missing in production environment') })() 
  : (import.meta.env.VITE_API_URL || 'http://localhost:3000')

export interface UsePvPSocketReturn {
  socket: Socket | null
  isConnected: boolean
  error: string | null

  // Actions
  joinMatch: (matchId: string) => void
  leaveMatch: (matchId: string) => void
  markReady: (matchId: string) => void
  submitAnswer: (matchId: string, questionId: string, answer: string, timeTaken: number) => void
  submitCode: (matchId: string, questionId: string, code: string, timeTaken: number) => void
  sendReaction: (matchId: string, emoji: string, targetUserId?: string) => void
  startTyping: (matchId: string) => void
  stopTyping: (matchId: string) => void

  // Event listeners
  onMatchUpdated: (callback: (payload: MatchUpdatedPayload) => void) => () => void
  onMatchStarted: (callback: (match: PvPMatch) => void) => () => void
  onQuestionChanged: (callback: (payload: QuestionChangedPayload) => void) => () => void
  onMatchCompleted: (callback: (payload: MatchCompletedPayload) => void) => () => void
  onParticipantJoined: (callback: (participant: PvPParticipant) => void) => () => void
  onParticipantLeft: (callback: (participant: PvPParticipant) => void) => () => void
  onParticipantReady: (callback: (participant: PvPParticipant) => void) => () => void
  onParticipantDisconnected: (callback: (userId: string) => void) => () => void
  onParticipantReconnected: (callback: (userId: string) => void) => () => void
  onSubmissionReceived: (callback: (submission: PvPSubmission) => void) => () => void
  onSubmissionRanked: (callback: (payload: SubmissionRankedPayload) => void) => () => void
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
  const socketRef = useRef<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Initialize socket connection
  useEffect(() => {
    if (!user) return

    // Tokens are now in httpOnly cookies
    // Socket.io will automatically send cookies with connection
    const socket = io(SOCKET_URL, {
      auth: {
        // Backend will read token from cookie
        // No need to send token explicitly
      },
      transports: ['websocket', 'polling'],
      withCredentials: true, // CRITICAL: Send cookies
    })

    socket.on('connect', () => {
      setIsConnected(true)
      setError(null)
    })

    socket.on('disconnect', () => {
      setIsConnected(false)
    })

    socket.on('connect_error', err => {
      console.error('Socket connection error:', err)
      setError(err.message)
      setIsConnected(false)
    })

    socketRef.current = socket

    // Note: Token refresh events are no longer needed
    // Backend manages token refresh via cookies automatically

    return () => {
      socket.disconnect()
      socketRef.current = null
    }
  }, [user])

  // Actions
  const joinMatch = useCallback((matchId: string) => {
    socketRef.current?.emit('match:join', matchId)
  }, [])

  const leaveMatch = useCallback((matchId: string) => {
    socketRef.current?.emit('match:leave', matchId)
  }, [])

  const markReady = useCallback((matchId: string) => {
    socketRef.current?.emit('match:ready', matchId)
  }, [])

  const submitAnswer = useCallback(
    (matchId: string, questionId: string, answer: string, timeTaken: number) => {
      socketRef.current?.emit('submission:answer', { matchId, questionId, answer, timeTaken })
    },
    []
  )

  const submitCode = useCallback(
    (matchId: string, questionId: string, code: string, timeTaken: number) => {
      socketRef.current?.emit('submission:code', { matchId, questionId, code, timeTaken })
    },
    []
  )

  const sendReaction = useCallback((matchId: string, emoji: string, targetUserId?: string) => {
    socketRef.current?.emit('reaction:send', { matchId, emoji, targetUserId })
  }, [])

  const startTyping = useCallback((matchId: string) => {
    socketRef.current?.emit('typing:start', matchId)
  }, [])

  const stopTyping = useCallback((matchId: string) => {
    socketRef.current?.emit('typing:stop', matchId)
  }, [])

  // Event listeners
  const onMatchUpdated = useCallback((callback: (payload: MatchUpdatedPayload) => void) => {
    socketRef.current?.on('match:updated', callback)
    return () => {
      socketRef.current?.off('match:updated', callback)
    }
  }, [])

  const onMatchStarted = useCallback((callback: (match: PvPMatch) => void) => {
    socketRef.current?.on('match:started', callback)
    return () => {
      socketRef.current?.off('match:started', callback)
    }
  }, [])

  const onQuestionChanged = useCallback((callback: (payload: QuestionChangedPayload) => void) => {
    socketRef.current?.on('match:question_changed', callback)
    return () => {
      socketRef.current?.off('match:question_changed', callback)
    }
  }, [])

  const onMatchCompleted = useCallback((callback: (payload: MatchCompletedPayload) => void) => {
    socketRef.current?.on('match:completed', callback)
    return () => {
      socketRef.current?.off('match:completed', callback)
    }
  }, [])

  const onParticipantJoined = useCallback((callback: (participant: PvPParticipant) => void) => {
    socketRef.current?.on('participant:joined', callback)
    return () => {
      socketRef.current?.off('participant:joined', callback)
    }
  }, [])

  const onParticipantLeft = useCallback((callback: (participant: PvPParticipant) => void) => {
    socketRef.current?.on('participant:left', callback)
    return () => {
      socketRef.current?.off('participant:left', callback)
    }
  }, [])

  const onParticipantReady = useCallback((callback: (participant: PvPParticipant) => void) => {
    socketRef.current?.on('participant:ready', callback)
    return () => {
      socketRef.current?.off('participant:ready', callback)
    }
  }, [])

  const onParticipantDisconnected = useCallback((callback: (userId: string) => void) => {
    socketRef.current?.on('participant:disconnected', callback)
    return () => {
      socketRef.current?.off('participant:disconnected', callback)
    }
  }, [])

  const onParticipantReconnected = useCallback((callback: (userId: string) => void) => {
    socketRef.current?.on('participant:reconnected', callback)
    return () => {
      socketRef.current?.off('participant:reconnected', callback)
    }
  }, [])

  const onSubmissionReceived = useCallback((callback: (submission: PvPSubmission) => void) => {
    socketRef.current?.on('submission:received', callback)
    return () => {
      socketRef.current?.off('submission:received', callback)
    }
  }, [])

  const onSubmissionRanked = useCallback((callback: (payload: SubmissionRankedPayload) => void) => {
    socketRef.current?.on('submission:ranked', callback)
    return () => {
      socketRef.current?.off('submission:ranked', callback)
    }
  }, [])

  const onReactionReceived = useCallback((callback: (reaction: PvPReaction) => void) => {
    socketRef.current?.on('reaction:received', callback)
    return () => {
      socketRef.current?.off('reaction:received', callback)
    }
  }, [])

  const onTypingStarted = useCallback((callback: (payload: TypingPayload) => void) => {
    socketRef.current?.on('typing:user_started', callback)
    return () => {
      socketRef.current?.off('typing:user_started', callback)
    }
  }, [])

  const onTypingStopped = useCallback((callback: (payload: TypingPayload) => void) => {
    socketRef.current?.on('typing:user_stopped', callback)
    return () => {
      socketRef.current?.off('typing:user_stopped', callback)
    }
  }, [])

  const onError = useCallback((callback: (error: ErrorPayload) => void) => {
    socketRef.current?.on('error', callback)
    return () => {
      socketRef.current?.off('error', callback)
    }
  }, [])

  const onCooldown = useCallback((callback: (payload: CooldownPayload) => void) => {
    socketRef.current?.on('match:cooldown', callback)
    return () => {
      socketRef.current?.off('match:cooldown', callback)
    }
  }, [])

  const onMatchPaused = useCallback((callback: (payload: MatchPausedPayload) => void) => {
    socketRef.current?.on('match:paused', callback)
    return () => {
      socketRef.current?.off('match:paused', callback)
    }
  }, [])

  const onMatchResumed = useCallback((callback: (payload: MatchResumedPayload) => void) => {
    socketRef.current?.on('match:resumed', callback)
    return () => {
      socketRef.current?.off('match:resumed', callback)
    }
  }, [])

  const onMatchForfeit = useCallback((callback: (payload: MatchForfeitPayload) => void) => {
    socketRef.current?.on('match:forfeit', callback)
    return () => {
      socketRef.current?.off('match:forfeit', callback)
    }
  }, [])

  return {
    socket: socketRef.current,
    isConnected,
    error,

    // Actions
    joinMatch,
    leaveMatch,
    markReady,
    submitAnswer,
    submitCode,
    sendReaction,
    startTyping,
    stopTyping,

    // Event listeners
    onMatchUpdated,
    onMatchStarted,
    onQuestionChanged,
    onMatchCompleted,
    onParticipantJoined,
    onParticipantLeft,
    onParticipantReady,
    onParticipantDisconnected,
    onParticipantReconnected,
    onSubmissionReceived,
    onSubmissionRanked,
    onReactionReceived,
    onTypingStarted,
    onTypingStopped,
    onError,
    onCooldown,
    onMatchPaused,
    onMatchResumed,
    onMatchForfeit,
  }
}
