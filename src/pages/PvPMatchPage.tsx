/**
 * V2 PvP Match Page - Light Theme
 * Real-time match interface
 */

import React, { useEffect, useRef, useState } from 'react'
import { Navigate, useLocation, useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { usePvPSocket } from '../hooks/usePvPSocket'
import { usePvPMatchSnapshot } from '../features/pvp/usePvPMatchSnapshot'
import { usePvPReady } from '../features/pvp/usePvPReady'
import { finalScoresForMatch } from '../features/pvp/finalScores'
import ResourceLoadError from '../components/common/ResourceLoadError'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { useContentPreloader } from '../hooks/useContentPreloader'
import type {
  PvPMatch,
  PvPQuestion,
  PvPSubmission,
  FinalScore,
  MatchPausedPayload,
} from '../types/pvp.types'

// Components
import MatchLobby from '../components/pvp/MatchLobby'
import MatchArena from '../components/pvp/MatchArena'
import MatchResults from '../components/pvp/MatchResults'
import LoadingScreen from '../components/LoadingScreen'

const PvPMatchSession: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { t, i18n } = useTranslation()

  // Define all content keys needed for this page
  const contentKeys = [
    'pvp.match.notfound.title',
    'pvp.match.notfound.desc',
    'pvp.lobby.leave_room',
    'pvp.lobby.room_title',
    'pvp.lobby.room_code_label',
    'pvp.lobby.copy_room_code',
    'pvp.lobby.share_code_desc',
    'pvp.lobby.anonymous',
    'pvp.lobby.you_marker',
    'pvp.lobby.ready',
    'pvp.lobby.waiting',
    'pvp.lobby.waiting_players',
    'pvp.lobby.ready_button',
    'pvp.lobby.starting_match',
    'pvp.lobby.waiting_others',
    'pvp.lobby.need_more_players',
    'pvp.lobby.settings_title',
    'pvp.lobby.mode_label',
    'pvp.lobby.difficulty_label',
    'pvp.lobby.questions_label',
    'pvp.lobby.time_per_question_label',
    'pvp.lobby.language_label',
    'pvp.arena.question_label',
    'pvp.arena.players_title',
    'pvp.arena.submit_answer',
    'pvp.arena.submitted',
    'pvp.arena.your_solution',
    'pvp.arena.submit_code',
    'pvp.arena.round_over_title',
    'pvp.participant.you_marker',
    'pvp.participant.disconnected',
    'pvp.participant.score',
    'pvp.participant.correct',
    'pvp.results.win_title',
    'pvp.results.draw_title',
    'pvp.results.complete_title',
    'pvp.results.win_desc',
    'pvp.results.draw_desc',
    'pvp.results.complete_desc',
    'pvp.results.you_marker',
    'pvp.results.rank_label',
    'pvp.results.points_label',
    'pvp.results.loading',
    'pvp.results.play_again',
    'pvp.results.back_to_journey',
  ]

  // Preload all content at once
  const { content } = useContentPreloader(contentKeys, i18n.language)

  // Extract content values with fallbacks
  const pvpNotFoundTitle = content['pvp.match.notfound.title'] || 'Không tìm thấy phòng đấu'
  const pvpNotFoundDesc =
    content['pvp.match.notfound.desc'] ||
    'Phòng có thể đã kết thúc hoặc mã phòng không đúng. Hãy quay lại Challenge Hub để tạo trận mới.'

  const [match, setMatch] = useState<PvPMatch | null>(null)
  const [currentQuestion, setCurrentQuestion] = useState<PvPQuestion | null>(null)
  const [timeRemaining, setTimeRemaining] = useState<number>(0)
  const [finalScores, setFinalScores] = useState<FinalScore[]>([])
  const [isCooldown, setIsCooldown] = useState(false)
  const [isMatchOverCooldown, setIsMatchOverCooldown] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const [pauseInfo, setPauseInfo] = useState<MatchPausedPayload | null>(null)
  const [pauseCountdown, setPauseCountdown] = useState(0)

  const socket = usePvPSocket()
  const entry = usePvPMatchSnapshot(roomCode, user?.id)
  const [savedSubmission, setSavedSubmission] = useState<PvPSubmission | null>(null)
  const ready = usePvPReady({
    scope: match?.id || roomCode || '',
    confirmed: Boolean(match?.participants?.find(player => player.user_id === user?.id)?.is_ready),
    connected: socket.isConnected,
    send: () => {
      if (match) socket.markReady(match.id)
    },
    resync: () => {
      if (match) socket.joinMatch(match.id)
    },
  })
  const acceptedMatch = useRef<PvPMatch | null>(null)
  const announcedQuestion = useRef<string | null>(null)
  const acceptMatch = (next: PvPMatch): boolean => {
    if (next.id !== roomCode && next.room_code?.toUpperCase() !== roomCode?.toUpperCase())
      return false
    const previous = acceptedMatch.current
    if (previous?.id === next.id) {
      const stage = { waiting: 0, starting: 1, in_progress: 2, completed: 3, cancelled: 3 }
      if (stage[next.status] < stage[previous.status]) return false
      if (['completed', 'cancelled'].includes(previous.status) && next.status !== previous.status)
        return false
      if (next.current_question_index < previous.current_question_index) return false
    }
    acceptedMatch.current = next
    setMatch(next)
    return true
  }

  useEffect(() => {
    const snapshot = entry.data
    if (!snapshot) return
    if (!acceptMatch(snapshot)) return
    if (snapshot.status === 'completed' || snapshot.status === 'cancelled') {
      setFinalScores(finalScoresForMatch(snapshot) || [])
      return
    }
    socket.joinMatch(snapshot.id)
    return () => socket.leaveMatch(snapshot.id)
  }, [entry.data, socket.joinMatch, socket.leaveMatch])

  // Socket event listeners
  useEffect(() => {
    if (!socket.socket || !roomCode) {
      return
    }

    // Match updated
    const cleanupUpdated = socket.onMatchUpdated(payload => {
      acceptMatch(payload.match)
    })

    // Match started
    const cleanupStarted = socket.onMatchStarted(updatedMatch => {
      if (!acceptMatch(updatedMatch)) return
      toast.success(t('pvp.match.started'))
    })

    // Question changed
    const cleanupQuestion = socket.onQuestionChanged(payload => {
      if (!acceptMatch(payload.match)) return
      setCurrentQuestion(payload.question)
      setSavedSubmission(payload.submission || null)
      setTimeRemaining(payload.timeRemaining)
      setIsCooldown(false) // Reset cooldown
      if (announcedQuestion.current !== payload.question.id) {
        announcedQuestion.current = payload.question.id
        toast(t('pvp.match.newQuestion'), { icon: '❓' })
      }
    })

    // Match completed
    const cleanupCompleted = socket.onMatchCompleted(payload => {
      if (!acceptMatch(payload.match)) return
      setFinalScores(payload.finalScores)
      setIsCooldown(false) // Reset cooldown
      if (payload.match.status === 'completed') toast.success(t('pvp.match.completed'))
      else toast('Trận đấu đã hủy')
    })

    // Cooldown
    const cleanupCooldown = socket.onCooldown(payload => {
      setIsCooldown(true)
      setIsMatchOverCooldown(payload.isMatchOver)
    })

    // Participant events
    const cleanupJoined = socket.onParticipantJoined(participant => {
      toast.success(t('pvp.match.playerJoined', { name: participant.display_name || 'Player' }))
      setMatch((prev: PvPMatch | null) => {
        if (!prev) return prev
        const existingParticipants = prev.participants || []
        const index = existingParticipants.findIndex((p: any) => p.user_id === participant.user_id)

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

      setMatch((prev: PvPMatch | null) => {
        if (!prev) return prev
        const player = prev.participants?.find((p: any) => p.user_id === leftUserId)
        if (player) {
          toast(t('pvp.match.playerLeft', { name: player.display_name || 'Player' }), {
            icon: '👋',
          })
        }
        return {
          ...prev,
          participants: prev.participants?.filter((p: any) => p.user_id !== leftUserId) || [],
        }
      })
    })

    const cleanupDisc = socket.onParticipantDisconnected(userId => {
      setMatch((prev: PvPMatch | null) => {
        if (!prev) return prev
        return {
          ...prev,
          participants:
            prev.participants?.map((p: any) =>
              p.user_id === userId ? { ...p, is_connected: false } : p
            ) || [],
        }
      })
    })

    const cleanupReconn = socket.onParticipantReconnected(userId => {
      setMatch((prev: PvPMatch | null) => {
        if (!prev) return prev
        return {
          ...prev,
          participants:
            prev.participants?.map((p: any) =>
              p.user_id === userId ? { ...p, is_connected: true } : p
            ) || [],
        }
      })
    })

    const cleanupReady = socket.onParticipantReady(participant => {
      toast(t('pvp.match.playerReady', { name: participant.display_name || 'Player' }), {
        icon: '✅',
      })
      setMatch((prev: PvPMatch | null) => {
        if (!prev) return prev
        return {
          ...prev,
          participants: prev.participants?.map((p: any) =>
            p.user_id === participant.user_id ? { ...p, ...participant, is_ready: true } : p
          ),
        }
      })
    })

    // Error handling
    const cleanupError = socket.onError(error => {
      ready.fail(error.message)
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

  if (entry.loading) {
    return <LoadingScreen message={t('common.loading')} className="loopy-bg loopy-heading" />
  }

  if (entry.error)
    return (
      <div className="loopy-bg min-h-screen p-6">
        <div className="mx-auto max-w-2xl py-12">
          <ResourceLoadError message={entry.error} onRetry={entry.retry} />
          <button
            onClick={() => navigate('/practice/compete')}
            className="mt-4 rounded-xl border loopy-border px-5 py-3 font-bold loopy-heading"
          >
            Về Challenge Hub
          </button>
        </div>
      </div>
    )

  if (!match) {
    return (
      <div className="loopy-bg flex min-h-screen flex-col items-center justify-center gap-4">
        <p className="loopy-heading text-2xl font-black">{pvpNotFoundTitle}</p>
        <p className="loopy-body max-w-md text-center text-sm">{pvpNotFoundDesc}</p>
        <button
          onClick={() => navigate('/practice/compete')}
          className="px-4 py-2 bg-brand-teal text-white rounded-lg hover:bg-brand-cyan transition-colors"
        >
          {t('pvp.match.backToLobby')}
        </button>
      </div>
    )
  }

  return (
    <div className="loopy-bg relative min-h-screen overflow-hidden text-[color:var(--loopy-text)]">
      {(!socket.isConnected || socket.error) &&
        !['completed', 'cancelled'].includes(match.status) && (
          <div
            role="status"
            aria-label="Trạng thái kết nối PvP"
            className="relative z-20 mx-auto max-w-4xl rounded-xl border border-amber-500/40 p-4 text-center loopy-body"
          >
            <p>
              {socket.error ||
                'Đang kết nối lại phòng. Bài chưa xác nhận sẽ được đồng bộ từ server.'}
            </p>
            <button
              type="button"
              onClick={() => {
                if (socket.isConnected) socket.joinMatch(match.id)
                else socket.reconnect()
              }}
              className="mt-3 rounded-lg border px-4 py-2 font-bold"
            >
              {socket.isConnected ? 'Đồng bộ lại phòng' : 'Kết nối lại'}
            </button>
          </div>
        )}
      {/* Subtle background texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'radial-gradient(#000 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />
      <div className="absolute top-0 right-0 -mr-[200px] -mt-[200px] w-[600px] h-[600px] rounded-full bg-brand-teal/10 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 -ml-[200px] -mb-[200px] w-[500px] h-[500px] rounded-full bg-brand-cyan/10 blur-[100px] pointer-events-none" />

      <AnimatePresence mode="wait">
        {match.status === 'cancelled' && (
          <div className="p-8 text-center">
            <h1 className="text-2xl font-bold">Trận đấu đã hủy</h1>
            <button
              onClick={() => navigate('/practice/compete')}
              className="mt-4 rounded-lg bg-brand-teal px-5 py-3 font-bold text-slate-950"
            >
              Về phòng chờ
            </button>
          </div>
        )}
        {match.status === 'waiting' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MatchLobby
              match={match}
              onReady={() => void ready.request()}
              readyPending={ready.pending}
              readyError={ready.error}
              currentUserId={user?.id || ''}
              isConnected={socket.isConnected}
              content={content}
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
              key={JSON.stringify([match.id, currentQuestion.id, user?.id])}
              match={match}
              question={currentQuestion}
              timeRemaining={timeRemaining}
              socket={socket}
              currentUserId={user?.id || ''}
              isCooldown={isCooldown}
              initialSubmission={savedSubmission}
              isMatchOverCooldown={isMatchOverCooldown}
              isPaused={isPaused}
              pauseInfo={pauseInfo}
              pauseCountdown={pauseCountdown}
              content={content}
            />
          </motion.div>
        )}

        {(match.status === 'starting' || match.status === 'in_progress') && !currentQuestion && (
          <div role="status" className="p-8 text-center">
            <p>Đang chờ đồng bộ câu hỏi…</p>
            <button
              onClick={() => socket.joinMatch(match.id)}
              className="mt-4 rounded-lg bg-brand-teal px-5 py-3 font-bold text-slate-950"
            >
              Kết nối lại phòng
            </button>
          </div>
        )}

        {match.status === 'completed' && !finalScores.length && (
          <div role="alert" className="relative z-10 mx-auto max-w-2xl p-8 text-center">
            <p>Chưa xác nhận được xếp hạng đã lưu của trận đấu này.</p>
            <button
              type="button"
              onClick={entry.retry}
              className="mt-4 rounded-lg border px-4 py-2 font-bold"
            >
              Thử tải lại kết quả
            </button>
          </div>
        )}
        {match.status === 'completed' && finalScores.length > 0 && (
          <motion.div
            key="results"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <MatchResults
              match={match}
              finalScores={finalScores}
              currentUserId={user?.id || ''}
              content={content}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

const PvPMatchPage: React.FC = () => {
  const { roomCode } = useParams<{ roomCode: string }>()
  const { user, loading } = useAuth()
  const location = useLocation()
  if (loading) return <LoadingScreen />
  if (!user) return <Navigate to="/auth" replace state={{ from: location }} />
  return <PvPMatchSession key={JSON.stringify([roomCode, user?.id])} />
}

export default PvPMatchPage
