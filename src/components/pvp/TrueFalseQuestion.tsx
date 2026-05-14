/**
 * True/False Question Component
 * Large True/False buttons with manual submit (like multiple choice)
 */

import React from 'react'
import { motion } from 'framer-motion'
import { Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { PvPQuestion } from '../../types/pvp.types'

interface TrueFalseQuestionProps {
  question: PvPQuestion
  selectedAnswer: string
  onSelectAnswer: (answer: string) => void
  hasSubmitted: boolean
  submissionResult?: { isCorrect: boolean; points: number } | null
}

const TrueFalseQuestion: React.FC<TrueFalseQuestionProps> = ({
  question,
  selectedAnswer,
  onSelectAnswer,
  hasSubmitted,
  submissionResult,
}) => {
  const { t } = useTranslation()
  // Fixed order: TRUE first, FALSE second (no shuffle)
  const options = question.options || [
    { id: 'true', text: 'True' },
    { id: 'false', text: 'False' },
  ]

  const getButtonStyle = (optionId: string) => {
    const isSelected = selectedAnswer === optionId
    const showResult = hasSubmitted && isSelected && submissionResult

    if (showResult) {
      return submissionResult.isCorrect
        ? 'bg-green-500/20 border-green-500 hover:bg-green-500/30'
        : 'bg-red-500/20 border-red-500 hover:bg-red-500/30'
    }

    if (isSelected) {
      return 'bg-brand-teal/20 border-brand-teal hover:bg-brand-teal/30'
    }

    return 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
  }

  const getIconColor = (optionId: string) => {
    const isSelected = selectedAnswer === optionId
    const showResult = hasSubmitted && isSelected && submissionResult

    if (showResult) {
      return submissionResult.isCorrect ? 'text-green-400' : 'text-red-400'
    }

    if (isSelected) {
      return 'text-brand-teal'
    }

    return 'text-slate-400'
  }

  return (
    <div className="space-y-6">
      {/* Question */}
      <h2 className="text-2xl font-bold text-white mb-8 text-center">{question.question_text}</h2>

      {/* True/False Buttons - Fixed order (TRUE left, FALSE right) */}
      <div className="grid grid-cols-2 gap-6">
        {options.map(option => {
          const isTrue = option.id === 'true'
          const Icon = isTrue ? Check : X
          const label = isTrue ? 'TRUE' : 'FALSE'

          return (
            <motion.button
              key={option.id}
              whileHover={{ scale: hasSubmitted ? 1 : 1.02 }}
              whileTap={{ scale: hasSubmitted ? 1 : 0.98 }}
              onClick={() => !hasSubmitted && onSelectAnswer(option.id)}
              disabled={hasSubmitted}
              className={`
                relative p-12 rounded-2xl border-2 transition-all duration-300
                ${getButtonStyle(option.id)}
                ${hasSubmitted ? 'cursor-not-allowed opacity-75' : 'cursor-pointer'}
              `}
            >
              <div className="flex flex-col items-center gap-4">
                <Icon className={`w-16 h-16 ${getIconColor(option.id)}`} />
                <span className="text-3xl font-bold text-white">{label}</span>
              </div>

              {/* Selection indicator */}
              {selectedAnswer === option.id && !hasSubmitted && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 w-6 h-6 bg-brand-teal rounded-full flex items-center justify-center"
                >
                  <Check className="w-4 h-4 text-[#0a0e1a]" />
                </motion.div>
              )}
            </motion.button>
          )
        })}
      </div>

      {/* Hint */}
      {!hasSubmitted && (
        <p className="text-center text-slate-400 text-sm mt-4">
          {t('pvpQuestion.selectAndSubmit')}
        </p>
      )}
    </div>
  )
}

export default TrueFalseQuestion
