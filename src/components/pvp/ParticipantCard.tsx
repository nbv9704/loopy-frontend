/**
 * Participant Card Component
 * Display participant info and score
 */

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Target } from 'lucide-react'
import type { PvPParticipant } from '../../types/pvp.types'

interface ParticipantCardProps {
  participant: PvPParticipant
  isCurrentUser: boolean
  reactions?: string[]
}

const ParticipantCard: React.FC<ParticipantCardProps> = ({ 
  participant, 
  isCurrentUser,
  reactions = []
}) => {
  return (
    <div className="relative">
      {/* Reactions Display (Floating to the left) */}
      <div className="absolute right-full mr-4 top-1/2 -translate-y-1/2 flex flex-col items-end gap-2 pointer-events-none z-50">
        <AnimatePresence>
          {reactions.map((emoji, index) => (
            <motion.div
              key={`${emoji}-${index}`}
              initial={{ opacity: 0, x: 20, scale: 0 }}
              animate={{ 
                opacity: 1, 
                x: -Math.random() * 20, // Add some random spread
                y: -Math.random() * 20,
                scale: 1.5 
              }}
              exit={{ opacity: 0, y: -40, scale: 0.5 }}
              transition={{ type: 'spring', damping: 12 }}
              className="text-3xl drop-shadow-lg filter"
            >
              {emoji}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className={`p-4 rounded-xl border transition-all ${
          isCurrentUser ? 'bg-brand-teal/10 border-brand-teal' : 'bg-white/5 border-white/10'
        } ${!participant.is_connected ? 'opacity-50' : ''}`}
      >
        <div className="flex items-center gap-3 mb-3">
          {/* Avatar */}
          <div className="w-12 h-12 bg-gradient-to-br from-brand-teal to-brand-cyan rounded-full flex items-center justify-center text-white font-bold">
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

          {/* Name */}
          <div className="flex-1 min-w-0">
            <h4 className="text-white font-semibold truncate">
              {participant.display_name || 'Anonymous'}
              {isCurrentUser && <span className="text-brand-teal ml-1">(You)</span>}
            </h4>
            {!participant.is_connected && <p className="text-red-400 text-xs">Disconnected</p>}
          </div>
        </div>

        {/* Stats */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Trophy className="w-4 h-4 text-brand-teal" />
              <span className="text-slate-400 text-sm">Score</span>
            </div>
            <span className="text-white font-bold">{participant.total_score}</span>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-teal" />
              <span className="text-slate-400 text-sm">Correct</span>
            </div>
            <span className="text-white font-bold">
              {participant.correct_answers}/{participant.questions_answered}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default ParticipantCard
