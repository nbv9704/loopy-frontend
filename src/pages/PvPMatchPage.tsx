/**
 * PvP Match Page
 * Real-time match interface
 */

import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { usePvPSocket } from '../hooks/usePvPSocket'
import { pvpService } from '../services/pvp.service'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import type { PvPMatch, PvPQuestion, FinalScore, MatchPausedPayload } from '../types/pvp.types'

// Components
import MatchLobby from '../components/pvp/MatchLobby'
import MatchArena from '../components/pvp/MatchArena'
import MatchResults from '../components/pvp/MatchResults'
import LoadingSpinner from '../components/common/LoadingSpinner'

const PvPMatchPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t } = useTranslation()

  const [match, setMatch] = useState<PvPMatch | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<PvPQuestion | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [finalScores, setFinalScores] = useState<FinalScore[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isCooldown, setIsCooldown] = useState(false)
  const [isMatchOverCooldown, setIsMatchOverCooldown] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [pauseInfo, setPauseInfo] = useState<MatchPausedPayload | null>(null)
  const [pauseCountdown, setPauseCountdown] = useState(0)

  const socket = usePvPSocket()

  // Load match data
  useEffect(() => {
    if (!roomCode || !user) return

    // Don't reload if already have match data
    if (match && match.room_code === roomCode) {
      return
    }

    const loadMatch = async (retryCount = 0) => {
      try {
        // Small delay to ensure participant is inserted
        if (retryCount === 0) {
          await new Promise(resolve => setTimeout(resolve, 500))
        }

        const matchData = await pvpService.joinMatch(roomCode)

        setMatch(matchData)
        setIsLoading(false)

        // Join match via socket
        socket.joinMatch(roomCode)
      } catch (error: any) {
        // Retry once if first attempt fails
        if (retryCount === 0) {
          setTimeout(() => loadMatch(1), 1000)
          return
        }

        const errorMessage =
          error.response?.data?.error?.message ||
          error.response?.data?.message ||
          error.message ||
          'Failed to load match'

        toast.error(errorMessage)
        setIsLoading(false)

        // Navigate away after showing error
        setTimeout(() => {
          navigate('/pvp')
        }, 2000)
      }
    }

    loadMatch()

    return () => {
      // Only leave match on unmount, don't reset state
      if (roomCode) {
        socket.leaveMatch(roomCode)
      }
    }
  }, [roomCode, user, navigate]) // Removed socket and match from dependencies

  // Socket event listeners
  useEffect(() => {
    if (!socket.socket || !roomCode) {
      return
    }

    // Match updated
    const cleanupUpdated = socket.onMatchUpdated(payload => {
      setMatch(payload.match)
    })

    // Match started
    const cleanupStarted = socket.onMatchStarted(updatedMatch => {
      setMatch(updatedMatch)
      toast.success(t('pvp.match.started'))
    })

    // Question changed
    const cleanupQuestion = socket.onQuestionChanged(payload => {
      setMatch(payload.match)
      setCurrentQuestion(payload.question)
      setTimeRemaining(payload.timeRemaining)
      setIsCooldown(false) // Reset cooldown
      toast(t('pvp.match.newQuestion'), { icon: '❓' })
    })

    // Match completed
    const cleanupCompleted = socket.onMatchCompleted(payload => {
      setMatch(payload.match)
      setFinalScores(payload.finalScores)
      setIsCooldown(false) // Reset cooldown
      toast.success(t('pvp.match.completed'))
    })

    // Cooldown
    const cleanupCooldown = socket.onCooldown(payload => {
      setIsCooldown(true)
      setIsMatchOverCooldown(payload.isMatchOver)
    })

    // Participant events
    const cleanupJoined = socket.onParticipantJoined(participant => {
      toast.success(t('pvp.match.playerJoined', { name: participant.display_name || 'Player' }))
      setMatch(prev => {
        if (!prev) return prev
        const existingParticipants = prev.participants || []
        const index = existingParticipants.findIndex(p => p.user_id === participant.user_id)
        
        let newParticipants
        if (index >= 0) {
          // Update existing, preserving fields not sent by server if any
          newParticipants = [...existingParticipants]
          newParticipants[index] = { ...newParticipants[index], ...participant }
        } else {
          // Add new
          newParticipants = [...existingParticipants, participant]
        }

        return { ...prev, participants: newParticipants }
      })
    })

    const cleanupLeft = socket.onParticipantLeft(data => {
      // Data might be { user_id } or full participant
      const leftUserId = (data as any).user_id || (data as any).id
      
      setMatch(prev => {
        if (!prev) return prev
        const player = prev.participants?.find(p => p.user_id === leftUserId)
        if (player) {
          toast(t('pvp.match.playerLeft', { name: player.display_name || 'Player' }), { icon: '👋' })
        }
        return {
          ...prev,
          participants: prev.participants?.filter(p => p.user_id !== leftUserId) || [],
        }
      })
    })

    const cleanupDisc = socket.onParticipantDisconnected(userId => {
      setMatch(prev => {
        if (!prev) return prev
        return {
          ...prev,
          participants: prev.participants?.map(p => 
            p.user_id === userId ? { ...p, is_connected: false } : p
          ) || [],
        }
      })
    })

    const cleanupReconn = socket.onParticipantReconnected(userId => {
      setMatch(prev => {
        if (!prev) return prev
        return {
          ...prev,
          participants: prev.participants?.map(p => 
            p.user_id === userId ? { ...p, is_connected: true } : p
          ) || [],
        }
      })
    })

    const cleanupReady = socket.onParticipantReady(participant => {
      toast(t('pvp.match.playerReady', { name: participant.display_name || 'Player' }), { icon: '✅' })
      setMatch(prev => {
        if (!prev) return prev
        return {
          ...prev,
          participants: prev.participants?.map(p => 
            p.user_id === participant.user_id ? { ...p, ...participant, is_ready: true } : p
          ),
        }
      })
    })

    // Error handling
    const cleanupError = socket.onError(error => {
      toast.error(error.message)
    })

    // --- Disconnect Grace Period events ---
    const cleanupPaused = socket.onMatchPaused(payload => {
      setIsPaused(true)
      setPauseInfo(payload)
      setPauseCountdown(payload.timeoutSeconds)
      toast(t('pvp.match.paused', { name: payload.displayName, seconds: payload.timeoutSeconds }), {
        duration: 5000,
        id: 'match-paused',
      })
    })

    const cleanupResumed = socket.onMatchResumed(payload => {
      setIsPaused(false)
      setPauseInfo(null)
      setPauseCountdown(0)
      toast.success(t('pvp.match.resumed', { name: payload.displayName }), {
        id: 'match-resumed',
      })
    })

    const cleanupForfeit = socket.onMatchForfeit(payload => {
      setIsPaused(false)
      setPauseInfo(null)
      setPauseCountdown(0)
      toast(t('pvp.match.forfeit', { name: payload.displayName }), {
        duration: 5000,
        icon: '⚠️',
        id: 'match-forfeit',
      })
    })

    // Cleanup function
    return () => {
      if (typeof cleanupUpdated === 'function') cleanupUpdated()
      if (typeof cleanupStarted === 'function') cleanupStarted()
      if (typeof cleanupQuestion === 'function') cleanupQuestion()
      if (typeof cleanupCompleted === 'function') cleanupCompleted()
      if (typeof cleanupCooldown === 'function') cleanupCooldown()
      if (typeof cleanupJoined === 'function') cleanupJoined()
      if (typeof cleanupLeft === 'function') cleanupLeft()
      if (typeof cleanupDisc === 'function') cleanupDisc()
      if (typeof cleanupReconn === 'function') cleanupReconn()
      if (typeof cleanupReady === 'function') cleanupReady()
      if (typeof cleanupError === 'function') cleanupError()
      if (typeof cleanupPaused === 'function') cleanupPaused()
      if (typeof cleanupResumed === 'function') cleanupResumed()
      if (typeof cleanupForfeit === 'function') cleanupForfeit()
    }
  }, [socket.socket, roomCode]) // Depend on both socket.socket and roomCode

  // Timer countdown (pauses when match is paused)
  useEffect(() => {
    if (timeRemaining <= 0 || match?.status !== 'in_progress' || isPaused) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [timeRemaining, match?.status, isPaused])

  // Pause grace period countdown
  useEffect(() => {
    if (!isPaused || pauseCountdown <= 0) return

    const timer = setInterval(() => {
      setPauseCountdown(prev => Math.max(0, prev - 1))
    }, 1000)

    return () => clearInterval(timer)
  }, [isPaused, pauseCountdown])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!match) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col items-center justify-center gap-4">
        <p className="text-white text-2xl font-black">Không tìm thấy phòng đấu</p>
        <p className="text-slate-400 text-sm max-w-md text-center">Phòng có thể đã kết thúc hoặc mã phòng không đúng. Hãy quay lại Challenge Hub để tạo trận mới.</p>
        <button
          onClick={() => navigate('/pvp')}
          className="px-4 py-2 bg-brand-teal text-[#0a0e1a] rounded-lg hover:bg-brand-cyan transition-colors"
        >
          {t('pvp.match.backToLobby')}
        </button>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#0a0e1a] relative overflow-hidden">
      {/* Ambient background */}
      <div className="absolute inset-0 pointer-events-none opacity-30">
        <div className="absolute top-0 left-1/4 w-[400px] h-[400px] bg-brand-teal/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-brand-cyan/10 rounded-full blur-[100px]" />
      </div>

      <AnimatePresence mode="wait">
        {match.status === 'waiting' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MatchLobby
              match={match}
              onReady={() => socket.markReady(match.id)}
              currentUserId={user?.id || ''}
            />
          </motion.div>
        )}

        {(match.status === 'starting' || match.status === 'in_progress') && currentQuestion && (
          <motion.div
            key="arena"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MatchArena
              match={match}
              question={currentQuestion}
              timeRemaining={timeRemaining}
              socket={socket}
              currentUserId={user?.id || ''}
              isCooldown={isCooldown}
              isMatchOverCooldown={isMatchOverCooldown}
              isPaused={isPaused}
              pauseInfo={pauseInfo}
              pauseCountdown={pauseCountdown}
            />
          </motion.div>
        )}

        {match.status === 'completed' && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MatchResults match={match} finalScores={finalScores} currentUserId={user?.id || ''} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default PvPMatchPage
