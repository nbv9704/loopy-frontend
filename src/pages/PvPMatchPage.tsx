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

        const matchData = await pvpService.getMatch(roomCode)

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
    socket.onMatchUpdated(payload => {
      setMatch(payload.match)
    })

    // Match started
    socket.onMatchStarted(updatedMatch => {
      setMatch(updatedMatch)
      toast.success('Match started!')
    })

    // Question changed
    socket.onQuestionChanged(payload => {
      setMatch(payload.match)
      setCurrentQuestion(payload.question)
      setTimeRemaining(payload.timeRemaining)
      setIsCooldown(false) // Reset cooldown
      toast('New question!', { icon: '❓' })
    })

    // Match completed
    socket.onMatchCompleted(payload => {
      setMatch(payload.match)
      setFinalScores(payload.finalScores)
      setIsCooldown(false) // Reset cooldown
      toast.success('Match completed!')
    })

    // Cooldown
    socket.onCooldown(payload => {
      setIsCooldown(true)
      setIsMatchOverCooldown(payload.isMatchOver)
    })

    // Participant events
    socket.onParticipantJoined(participant => {
      console.log('Participant joined event:', participant)
      toast.success(`${participant.display_name || 'Player'} joined!`)
      setMatch(prev => {
        if (!prev) return prev
        return {
          ...prev,
          participants: [...(prev.participants || []), participant],
        }
      })
    })

    socket.onParticipantLeft(participant => {
      toast(`${participant.display_name || 'Player'} left`, { icon: '👋' })
    })

    socket.onParticipantReady(participant => {
      toast(`${participant.display_name || 'Player'} is ready!`, { icon: '✅' })
      setMatch(prev => {
        if (!prev) {
          return prev
        }

        const updated = {
          ...prev,
          participants: prev.participants?.map(p => {
            const isMatch = p.user_id === participant.user_id
            return isMatch ? { ...p, is_ready: true } : p
          }),
        }

        return updated
      })
    })

    // Error handling
    socket.onError(error => {
      toast.error(error.message)
    })

    // --- Disconnect Grace Period events ---
    socket.onMatchPaused(payload => {
      setIsPaused(true)
      setPauseInfo(payload)
      setPauseCountdown(payload.timeoutSeconds)
      toast(`⏸️ ${payload.displayName} đã mất kết nối. Đợi ${payload.timeoutSeconds}s...`, {
        duration: 5000,
        id: 'match-paused',
      })
    })

    socket.onMatchResumed(payload => {
      setIsPaused(false)
      setPauseInfo(null)
      setPauseCountdown(0)
      toast.success(`🔄 ${payload.displayName} đã kết nối lại! Tiếp tục trận đấu.`, {
        id: 'match-resumed',
      })
    })

    socket.onMatchForfeit(payload => {
      setIsPaused(false)
      setPauseInfo(null)
      setPauseCountdown(0)
      toast(`🏳️ ${payload.displayName} đã bị xử thua do mất kết nối.`, {
        duration: 5000,
        icon: '⚠️',
        id: 'match-forfeit',
      })
    })

    // Cleanup function
    return () => {
      // Note: The socket hook's event listeners already handle cleanup
      // We don't need to manually unsubscribe here
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
        <p className="text-slate-400">Match not found</p>
        <p className="text-slate-500 text-sm">Room Code: {roomCode}</p>
        <p className="text-slate-500 text-sm">Loading: {isLoading ? 'Yes' : 'No'}</p>
        <button
          onClick={() => navigate('/pvp')}
          className="px-4 py-2 bg-brand-teal text-[#0a0e1a] rounded-lg hover:bg-brand-cyan transition-colors"
        >
          Back to Lobby
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
