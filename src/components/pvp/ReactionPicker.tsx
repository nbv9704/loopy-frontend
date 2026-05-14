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
        initial={{ opacity: 0, scale: 0.9, x: -10 }}
        animate={{ opacity: 1, scale: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.9, x: -10 }}
        className="absolute left-full top-0 ml-3 p-3 bg-[#0a0e1a]/95 backdrop-blur-md border border-white/20 rounded-2xl shadow-[0_0_30px_rgba(0,0,0,0.5)] z-50 w-max"
      >
        <div className="grid grid-cols-2 gap-3 justify-items-center">
          {EMOJIS.map(emoji => (
            <button
              key={emoji}
              onClick={() => onSelect(emoji)}
              className="w-12 h-12 flex items-center justify-center text-3xl hover:bg-white/10 rounded-xl transition-all hover:scale-125 active:scale-95"
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
