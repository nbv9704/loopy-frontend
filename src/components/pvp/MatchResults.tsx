/**
 * Match Results Component
 * Display final scores and rankings
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Trophy, Medal, Award, Home, RotateCcw } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { PvPMatch, FinalScore } from '../../types/pvp.types'
import confetti from 'canvas-confetti'

interface MatchResultsProps {
  match: PvPMatch
  finalScores: FinalScore[]
  currentUserId: string
}

const MatchResults: React.FC<MatchResultsProps> = ({ match, finalScores, currentUserId }) => {
  const navigate = useNavigate()

  // If no final scores yet, calculate from participants
  const scores = React.useMemo(() => {
    if (finalScores && finalScores.length > 0) {
      return finalScores
    }

    // Fallback: calculate from match participants
    if (match.participants && match.participants.length > 0) {
      const sorted = [...match.participants].sort(
        (a, b) => (b.total_score || 0) - (a.total_score || 0)
      )

      let currentRank = 1
      let previousScore = sorted.length > 0 ? sorted[0].total_score || 0 : null

      return sorted.map((p, index) => {
        const score = p.total_score || 0
        if (index > 0 && score < (previousScore as number)) {
          currentRank = index + 1
        }
        previousScore = score

        return {
          userId: p.user_id,
          displayName: p.display_name || 'Anonymous',
          score,
          rank: currentRank,
        }
      })
    }

    return []
  }, [finalScores, match.participants])

  const currentUserScore = scores.find(s => s.userId === currentUserId)
  const isWinner = currentUserScore?.rank === 1
  const isDraw = scores.filter(s => s.rank === 1).length > 1

  // Trigger confetti for winner(s)
  React.useEffect(() => {
    if (isWinner) {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      })
    }
  }, [isWinner])

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-8 h-8 text-yellow-400" />
      case 2:
        return <Medal className="w-8 h-8 text-slate-400" />
      case 3:
        return <Award className="w-8 h-8 text-orange-400" />
      default:
        return <span className="text-2xl font-bold text-slate-400">#{rank}</span>
    }
  }

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'from-yellow-500/20 to-yellow-600/20 border-yellow-500'
      case 2:
        return 'from-slate-500/20 to-slate-600/20 border-slate-400'
      case 3:
        return 'from-orange-500/20 to-orange-600/20 border-orange-500'
      default:
        return 'from-white/5 to-white/10 border-white/10'
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
      <div className="max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring' }}
            className="inline-block mb-6"
          >
            {isWinner && !isDraw ? (
              <Trophy className="w-24 h-24 text-yellow-400" />
            ) : isWinner && isDraw ? (
              <Medal className="w-24 h-24 text-brand-teal" />
            ) : (
              <Award className="w-24 h-24 text-brand-teal" />
            )}
          </motion.div>

          <h1 className="text-5xl font-black text-white mb-4">
            {isWinner && !isDraw
              ? 'Bạn thắng vòng này!'
              : isWinner && isDraw
                ? 'Hòa ở hạng nhất!'
                : 'Trận đấu hoàn thành'}
          </h1>
          <p className="text-slate-400 text-xl">
            {isWinner && !isDraw
              ? 'Tốt lắm. Hãy xem lại câu nào giúp bạn ghi điểm nhanh nhất.'
              : isWinner && isDraw
                ? 'Bạn giữ được nhịp rất tốt. Lần sau thử tăng độ khó.'
                : `Bạn kết thúc ở hạng #${currentUserScore?.rank || '-'}. Đây là tín hiệu tốt để biết phần nào cần ôn lại.`}
          </p>
        </motion.div>

        {/* Leaderboard */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="space-y-4 mb-12"
        >
          {scores.length > 0 ? (
            scores.map((score, index) => (
              <motion.div
                key={score.userId}
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className={`p-6 rounded-2xl border-2 bg-gradient-to-r ${getRankColor(score.rank)} ${
                  score.userId === currentUserId ? 'ring-2 ring-brand-teal' : ''
                }`}
              >
                <div className="flex items-center gap-6">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-16 flex items-center justify-center">
                    {getRankIcon(score.rank)}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-white mb-1">
                      {score.displayName}
                      {score.userId === currentUserId && (
                        <span className="ml-2 text-sm text-brand-teal">(Bạn)</span>
                      )}
                    </h3>
                    <p className="text-slate-400 text-sm">Hạng #{score.rank}</p>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <p className="text-3xl font-bold text-white">{score.score}</p>
                    <p className="text-slate-400 text-sm">điểm</p>
                  </div>
                </div>
              </motion.div>
            ))
          ) : (
            <div className="text-center text-slate-400 py-8">
              <p>Đang tải kết quả...</p>
            </div>
          )}
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex gap-4 justify-center"
        >
          <button
            onClick={() => navigate('/pvp')}
            className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-brand-teal to-brand-cyan text-[#0a0e1a] font-bold rounded-xl hover:shadow-lg hover:shadow-brand-teal/30 transition-all"
          >
            <RotateCcw className="w-5 h-5" />
            Đấu lại
          </button>

          <button
            onClick={() => navigate('/languages')}
            className="flex items-center gap-2 px-8 py-4 bg-white/5 border border-white/10 text-white font-bold rounded-xl hover:bg-white/10 transition-all"
          >
            <Home className="w-5 h-5" />
            Về lộ trình
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default MatchResults
