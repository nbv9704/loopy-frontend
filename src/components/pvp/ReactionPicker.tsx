/**
 * Reaction Picker Component
 * Emoji selector for reactions
 */

import React from 'react'
import { motion } from 'framer-motion'

interface ReactionPickerProps {
  onSelect: (emoji: string) => void
  onClose: () => void
}

const EMOJIS = ['👍', '🔥', '💯', '😂', '😮', '🎉', '💪', '🚀', '❤️', '👏']

const ReactionPicker: React.FC<ReactionPickerProps> = ({ onSelect, onClose }) => {
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      {/* Picker */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="absolute top-full right-0 mt-2 p-3 bg-[#0a0e1a] border border-white/20 rounded-xl shadow-2xl z-50"
      >
        <div className="grid grid-cols-5 gap-2">
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="w-10 h-10 flex items-center justify-center text-2xl hover:bg-white/10 rounded-lg transition-all hover:scale-110"
            >
              {emoji}
            </button>
          ))}
        </div>
      </motion.div>
    </>
  )
}

export default ReactionPicker
