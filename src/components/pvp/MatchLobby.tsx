/**
 * Match Lobby Component
 * Waiting room before match starts
 */

import React from 'react'
import { motion } from 'framer-motion'
import { ArrowLeft, Check, Clock, Copy, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import type { PvPMatch } from '../../types/pvp.types'

interface MatchLobbyProps {
  match: PvPMatch
  onReady: () => void
  currentUserId: string
}

const MatchLobby: React.FC<MatchLobbyProps> = ({ match, onReady, currentUserId }) => {
  const navigate = useNavigate()

  const currentParticipant = match.participants?.find(p => p.user_id === currentUserId)
  const isReady = currentParticipant?.is_ready || false
  const allReady = match.participants?.every(p => p.is_ready) || false
  const participantCount = match.participants?.length || 0
  const copyRoomCode = async () => {
    if (!match.room_code) return
    await navigator.clipboard.writeText(match.room_code)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 relative z-10">
      {/* Back button */}
      <button
        onClick={() => navigate('/pvp')}
        className="absolute top-6 left-6 flex items-center gap-2 px-4 py-2 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-all"
      >
        <ArrowLeft className="w-5 h-5" />
        Rời phòng
      </button>

      <div className="max-w-4xl w-full">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <Users className="w-10 h-10 text-brand-teal" />
              <h1 className="text-4xl font-black text-white">Phòng chờ thử thách</h1>
          </div>
          <div className="mb-6">
            <p className="text-slate-400 text-sm mb-2 uppercase tracking-wider font-semibold">
              Mã phòng
            </p>
            <div className="inline-flex items-center gap-4 bg-white/5 border border-white/10 px-8 py-4 rounded-2xl">
              <span className="text-4xl font-mono font-bold tracking-[0.2em] text-brand-teal">
                {match.room_code || '------'}
              </span>
              <button
                onClick={copyRoomCode}
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 transition-colors hover:border-brand-teal/40 hover:text-brand-teal"
                title="Copy mã phòng"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>
          </div>
          <p className="text-slate-400 text-lg">
            Chia sẻ mã phòng cho bạn bè. Đủ người thì bấm sẵn sàng. ({participantCount}/{match.max_players})
          </p>
        </motion.div>

        {/* Participants Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12"
        >
          {Array.from({ length: match.max_players }).map((_, index) => {
            const participant = match.participants?.[index]

            return (
              <div
                key={index}
                className={`p-8 rounded-2xl border-2 transition-all duration-300 ${
                  participant
                    ? participant.is_ready
                      ? 'bg-brand-teal/10 border-brand-teal'
                      : 'bg-white/5 border-white/20'
                    : 'bg-white/5 border-white/10 border-dashed'
                }`}
              >
                {participant ? (
                  <div className="flex items-center gap-4">
                    {/* Avatar */}
                    <div className="w-16 h-16 bg-gradient-to-br from-brand-teal to-brand-cyan rounded-full flex items-center justify-center text-white font-bold text-xl">
                      {participant.avatar_url ? (
                        <img
                          src={participant.avatar_url}
                          alt={participant.display_name}
                          className="w-full h-full object-cover rounded-full"
                        />
                      ) : (
                        participant.display_name?.[0]?.toUpperCase() || '?'
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1">
                      <h3 className="text-xl font-bold text-white mb-1">
                        {participant.display_name || 'Anonymous'}
                        {participant.user_id === currentUserId && (
                          <span className="ml-2 text-sm text-brand-teal">(Bạn)</span>
                        )}
                      </h3>
                      <div className="flex items-center gap-2">
                        {participant.is_ready ? (
                          <>
                            <Check className="w-4 h-4 text-brand-teal" />
                            <span className="text-brand-teal text-sm font-semibold">Sẵn sàng</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-4 h-4 text-slate-400" />
                            <span className="text-slate-400 text-sm">Đang chờ...</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-16">
                    <span className="text-slate-500 text-sm">Đang chờ người chơi...</span>
                  </div>
                )}
              </div>
            )
          })}
        </motion.div>

        {/* Ready Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          {!isReady ? (
            <button
              onClick={onReady}
              disabled={participantCount < match.max_players}
              className="group relative px-12 py-6 bg-gradient-to-r from-brand-teal to-brand-cyan text-[#0a0e1a] text-xl font-bold rounded-2xl cursor-pointer hover:shadow-lg hover:shadow-brand-teal/30 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden"
            >
              <span className="relative z-10 flex items-center gap-3">
                <Check className="w-6 h-6" />
                Tôi sẵn sàng
              </span>
              <div className="absolute inset-0 bg-brand-cyan transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
            </button>
          ) : (
            <div className="inline-flex items-center gap-3 px-12 py-6 bg-brand-teal/20 border-2 border-brand-teal rounded-2xl">
              <Check className="w-6 h-6 text-brand-teal" />
              <span className="text-brand-teal text-xl font-bold">
                {allReady ? 'Đang bắt đầu trận...' : 'Đang chờ người khác...'}
              </span>
            </div>
          )}

          {participantCount < match.max_players && (
            <p className="text-slate-400 text-sm mt-4">
              Cần thêm {match.max_players - participantCount} người chơi
            </p>
          )}
        </motion.div>

        {/* Match Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-12 p-6 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl"
        >
          <h3 className="text-lg font-bold text-white mb-4">Thiết lập trận</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <p className="text-slate-400 text-sm mb-1">Chế độ</p>
              <p className="text-white font-semibold">{match.mode.toUpperCase()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Độ khó</p>
              <p className="text-white font-semibold">{(match.difficulty || 'medium').toUpperCase()}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Câu hỏi</p>
              <p className="text-white font-semibold">{match.question_ids.length}</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Thời gian/câu</p>
              <p className="text-white font-semibold">{match.time_per_question}s</p>
            </div>
            <div>
              <p className="text-slate-400 text-sm mb-1">Ngôn ngữ</p>
              <p className="text-white font-semibold">{match.language_id || 'Mixed'}</p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default MatchLobby
