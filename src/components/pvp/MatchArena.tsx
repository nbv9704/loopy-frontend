/**
 * Match Arena Component
 * Main gameplay interface
 */

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Send, Code, Smile, Loader2, AlertCircle } from 'lucide-react'
import CodeMirror from '@uiw/react-codemirror'
import { javascript } from '@codemirror/lang-javascript'
import { python } from '@codemirror/lang-python'
import { cpp } from '@codemirror/lang-cpp'
import { oneDark } from '@codemirror/theme-one-dark'
import { useTranslation } from 'react-i18next'
import type { PvPMatch, PvPQuestion, MatchPausedPayload } from '../../types/pvp.types'
import type { UsePvPSocketReturn } from '../../hooks/usePvPSocket'
import ParticipantCard from './ParticipantCard'
import ReactionPicker from './ReactionPicker'
import TrueFalseQuestion from './TrueFalseQuestion'
import toast from 'react-hot-toast'

interface MatchArenaProps {
  match: PvPMatch
  question: PvPQuestion
  timeRemaining: number
  socket: UsePvPSocketReturn
  currentUserId: string
  isCooldown?: boolean
  isMatchOverCooldown?: boolean
  isPaused?: boolean
  pauseInfo?: MatchPausedPayload | null
  pauseCountdown: number
}

const MatchArena: React.FC<MatchArenaProps> = ({
  match,
  question,
  timeRemaining,
  socket,
  currentUserId,
  isCooldown = false,
  isMatchOverCooldown = false,
  isPaused = false,
  pauseInfo = null,
  pauseCountdown = 0,
}) => {
  const { t } = useTranslation()
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [code, setCode] = useState<string>(question.starterCode || '')
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [reactions, setReactions] = useState<Array<{ emoji: string; userId: string }>>([])
  const [submissionResult, setSubmissionResult] = useState<{
    isCorrect: boolean
    points: number
  } | null>(null)

  // Shuffle options client-side for fairness (different for each player)
  // Re-shuffle when question changes
  const shuffledOptions = React.useMemo(() => {
    if (question.type === 'multiple_choice' && question.options) {
      // Fisher-Yates shuffle
      const shuffled = [...question.options]
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
        ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
      }
      return shuffled
    }
    // True/False: no shuffle, keep original order
    return question.options || []
  }, [question.id, question.type, question.options])

  // Track shown toasts to prevent duplicates
  const shownRanks = React.useRef(new Set<string>())
  const shownSubmissions = React.useRef(new Set<string>()) // Track shown submission toasts

  // Reset submission state when question changes
  useEffect(() => {
    setHasSubmitted(false)
    setSelectedAnswer('')
    setCode(question.starterCode || '')
    setSubmissionResult(null)
    // Clear shown ranks and submissions for new question
    shownRanks.current.clear()
    shownSubmissions.current.clear()
  }, [question.id])

  // Listen for submissions
  useEffect(() => {
    if (!socket.socket) return

    const handleSubmissionReceived = (submission: any) => {
      if (submission.user_id === currentUserId) {
        // Create unique key for this submission
        const key = `${submission.user_id}-${submission.question_id}`

        // Only process if not already processed
        if (!shownSubmissions.current.has(key)) {
          shownSubmissions.current.add(key)

          setHasSubmitted(true)
          // Set result for visual feedback
          setSubmissionResult({
            isCorrect: submission.is_correct,
            points: submission.points_earned,
          })

          // Show single toast with points
          if (submission.points_earned > 0) {
            toast.success(`+${submission.points_earned} points!`, { icon: '🎯' })
          } else {
            toast.error('+0 points', { icon: '❌' })
          }
        }
      }
    }

    const handleSubmissionRanked = (_payload: any) => {
      // No longer show rank toast, only points toast from submission received
    }

    const handleReactionReceived = (reaction: any) => {
      setReactions(prev => [...prev, { emoji: reaction.emoji, userId: reaction.user_id }])
      setTimeout(() => {
        setReactions(prev => prev.filter(r => r.userId !== reaction.user_id))
      }, 3000)
    }

    const cleanup1 = socket.onSubmissionReceived(handleSubmissionReceived)
    const cleanup2 = socket.onSubmissionRanked(handleSubmissionRanked)
    const cleanup3 = socket.onReactionReceived(handleReactionReceived)

    // Cleanup
    return () => {
      cleanup1()
      cleanup2()
      cleanup3()
    }
  }, [socket.socket, currentUserId]) // Only re-run if socket or currentUserId changes

  const handleSubmitAnswer = () => {
    if (!selectedAnswer || hasSubmitted) return

    const timeTaken = Math.max(0, match.time_per_question - timeRemaining)
    socket.submitAnswer(match.id, question.id, selectedAnswer, timeTaken)
    // Toast will be shown when submission:received event is received
  }

  const handleSubmitCode = () => {
    if (!code.trim() || hasSubmitted) return

    const timeTaken = Math.max(0, match.time_per_question - timeRemaining)
    socket.submitCode(match.id, question.id, code, timeTaken)
    // Toast will be shown when submission:received event is received
  }

  const handleSendReaction = (emoji: string) => {
    socket.sendReaction(match.id, emoji)
    setShowReactionPicker(false)
  }

  const getLanguageExtension = () => {
    switch (question.language_id) {
      case 'python':
        return python()
      case 'cpp':
        return cpp()
      default:
        return javascript()
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen p-4 relative z-10">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          {/* Timer */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl ${
              timeRemaining <= 30
                ? 'bg-red-500/20 border-2 border-red-500'
                : 'bg-white/5 border border-white/10'
            }`}
          >
            <Clock
              className={`w-6 h-6 ${timeRemaining <= 30 ? 'text-red-400' : 'text-brand-teal'}`}
            />
            <span
              className={`text-2xl font-bold ${timeRemaining <= 30 ? 'text-red-400' : 'text-white'}`}
            >
              {formatTime(timeRemaining)}
            </span>
          </motion.div>

          {/* Question Progress */}
          <div className="text-center">
            <p className="text-slate-400 text-sm mb-1">Câu hỏi</p>
            <p className="text-white font-bold text-lg">
              {match.current_question_index + 1} / {match.question_ids.length}
            </p>
          </div>

          {/* Reaction Button */}
          <div className="relative">
            <button
              onClick={() => setShowReactionPicker(!showReactionPicker)}
              className="p-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all"
            >
              <Smile className="w-6 h-6 text-brand-teal" />
            </button>
            {showReactionPicker && (
              <ReactionPicker
                onSelect={handleSendReaction}
                onClose={() => setShowReactionPicker(false)}
              />
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Participants Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            <h3 className="text-lg font-bold text-white mb-4">Người chơi</h3>
            {match.participants?.map(participant => (
              <ParticipantCard
                key={participant.user_id}
                participant={participant}
                isCurrentUser={participant.user_id === currentUserId}
                reactions={reactions.filter(r => r.userId === participant.user_id).map(r => r.emoji)}
              />
            ))}
          </div>

          {/* Question Area */}
          <div className="lg:col-span-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8"
            >
              {/* True/False Question - Special UI with large buttons */}
              {question.type === 'true_false' && (
                <>
                  <TrueFalseQuestion
                    question={question}
                    selectedAnswer={selectedAnswer}
                    onSelectAnswer={setSelectedAnswer}
                    hasSubmitted={hasSubmitted}
                    submissionResult={submissionResult}
                  />

                  {/* Submit Button */}
                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswer || hasSubmitted || timeRemaining <= 0}
                    className="w-full py-4 bg-gradient-to-r from-brand-teal to-brand-cyan text-[#0a0e1a] font-bold rounded-xl hover:shadow-lg hover:shadow-brand-teal/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-6"
                  >
                    <Send className="w-5 h-5" />
                    {hasSubmitted ? 'Đã gửi' : 'Gửi đáp án'}
                  </button>
                </>
              )}

              {/* Multiple Choice Question - List UI */}
              {question.type === 'multiple_choice' && (
                <>
                  <h2 className="text-2xl font-bold text-white mb-6">{question.question_text}</h2>

                  <div className="space-y-3 mb-6">
                    {shuffledOptions.map(option => {
                      const isSelected = selectedAnswer === option.id
                      const showResult = hasSubmitted && isSelected && submissionResult
                      const borderColor = showResult
                        ? submissionResult.isCorrect
                          ? 'border-green-500'
                          : 'border-red-500'
                        : isSelected
                          ? 'border-brand-teal'
                          : 'border-white/10'

                      return (
                        <button
                          key={option.id}
                          onClick={() =>
                            !hasSubmitted && timeRemaining > 0 && setSelectedAnswer(option.id)
                          }
                          disabled={hasSubmitted || timeRemaining <= 0}
                          className={`w-full p-4 rounded-xl text-left transition-all duration-300 ${
                            isSelected
                              ? `bg-brand-teal/20 border-2 ${borderColor}`
                              : 'bg-white/5 border border-white/10 hover:bg-white/10'
                          } ${hasSubmitted ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                        >
                          <span className="text-white font-semibold">{option.id}.</span>{' '}
                          <span className="text-slate-300">{option.text}</span>
                        </button>
                      )
                    })}
                  </div>

                  <button
                    onClick={handleSubmitAnswer}
                    disabled={!selectedAnswer || hasSubmitted || timeRemaining <= 0}
                    className="w-full py-4 bg-gradient-to-r from-brand-teal to-brand-cyan text-[#0a0e1a] font-bold rounded-xl hover:shadow-lg hover:shadow-brand-teal/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    {hasSubmitted ? 'Đã gửi' : 'Gửi đáp án'}
                  </button>
                </>
              )}

              {/* Code Challenge */}
              {question.type === 'code_challenge' && (
                <>
                  <h2 className="text-2xl font-bold text-white mb-2">{question.problem_title}</h2>
                  <p className="text-slate-400 mb-6">{question.problem_description}</p>

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Code className="w-5 h-5 text-brand-teal" />
                      <h3 className="text-lg font-bold text-white">Lời giải của bạn</h3>
                    </div>
                    <CodeMirror
                      value={code}
                      height="400px"
                      theme={oneDark}
                      extensions={[getLanguageExtension()]}
                      onChange={value => !hasSubmitted && setCode(value)}
                      editable={!hasSubmitted}
                      className="rounded-xl overflow-hidden border border-white/10"
                    />
                  </div>

                  <button
                    onClick={handleSubmitCode}
                    disabled={!code.trim() || hasSubmitted || timeRemaining <= 0}
                    className="w-full py-4 bg-gradient-to-r from-brand-teal to-brand-cyan text-[#0a0e1a] font-bold rounded-xl hover:shadow-lg hover:shadow-brand-teal/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Send className="w-5 h-5" />
                    {hasSubmitted ? 'Đã gửi' : 'Gửi code'}
                  </button>
                </>
              )}
            </motion.div>
          </div>
        </div>

        {/* Cooldown Overlay */}
        <AnimatePresence>
          {isCooldown && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0e1a]/80 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.8, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 50 }}
                className="bg-slate-800/80 border border-white/10 rounded-2xl p-12 text-center max-w-lg mx-auto shadow-2xl shadow-brand-teal/20"
              >
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="w-24 h-24 border-4 border-slate-700 rounded-full animate-pulse"></div>
                    <div className="absolute inset-0 border-4 border-brand-teal rounded-full animate-spin border-t-transparent"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Clock className="w-10 h-10 text-brand-teal" />
                    </div>
                  </div>
                </div>
                <h2 className="text-3xl font-bold text-white mb-4">Hết vòng!</h2>
                  <p className="text-brand-teal text-lg font-medium animate-pulse">
                    {isMatchOverCooldown
                      ? t('pvp.match.summarizing')
                      : t('pvp.match.preparingNext')}
                  </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Pause Overlay — Disconnect Grace Period */}
        <AnimatePresence>
          {isPaused && pauseInfo && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[60] flex items-center justify-center bg-[#0a0e1a]/90 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.8, y: 30 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.8, y: 30 }}
                className="bg-[#0a0e1a]/95 backdrop-blur-md border border-amber-500/30 rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl"
              >
                <div className="w-20 h-20 bg-amber-500/10 border-2 border-amber-500/30 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-10 h-10 text-amber-500 animate-pulse" />
                </div>
                <h2 className="text-2xl font-bold text-amber-400 mb-2">{t('pvp.match.pausedTitle')}</h2>
                <p className="text-slate-300 mb-8 leading-relaxed">
                  <span className="font-semibold text-white">{pauseInfo.displayName}</span> {t('pvp.match.playerLeft')}
                </p>

                <div className="bg-white/5 rounded-2xl p-6 border border-white/10 mb-8">
                  <div className="flex items-center justify-center gap-4 mb-2">
                    <Loader2 className="w-5 h-5 text-brand-teal animate-spin" />
                    <p className="text-slate-400 text-sm mb-1">{t('pvp.match.waitingRecon')}</p>
                  </div>
                  <div className="text-4xl font-mono font-bold text-white tracking-wider">
                    {pauseCountdown}s
                  </div>
                </div>

                <p className="text-slate-500 text-sm">
                  {t('pvp.match.reconHint')}
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default MatchArena
