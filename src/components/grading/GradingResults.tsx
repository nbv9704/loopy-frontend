/**
 * GradingResults Component
 *
 * Displays overall grading results: final score, grade level, test/AI score breakdown.
 * Uses color coding based on grade level.
 *
 * Validates Requirements: 15.1, 15.6, 15.7
 */

import React, { useState, useEffect } from 'react'
import { FiCheckCircle, FiCpu, FiClock } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import {
  type GradingResult,
  type GradingDepth,
  GRADE_LABELS,
  GRADE_COLORS,
} from '../../types/grading.types'
import TestCaseResults from './TestCaseResults'
import AIAnalysisDisplay from './AIAnalysisDisplay'
import GradingDepthDropdown from './GradingDepthDropdown'

interface GradingResultsProps {
  result: GradingResult
  /** Whether to show detailed breakdown (default: true) */
  showDetails?: boolean
  /** Callback for re-grading with selected depth */
  onRetry?: (depth: GradingDepth) => void
  /** Whether currently grading */
  isGrading?: boolean
}

const GradingResults: React.FC<GradingResultsProps> = ({
  result,
  showDetails = true,
  onRetry,
  isGrading = false,
}) => {
  const { t } = useTranslation()
  const gradeColor = GRADE_COLORS[result.gradeLevel]
  const gradeLabel = GRADE_LABELS[result.gradeLevel]

  // Animated score (0 → finalScore)
  const [animatedScore, setAnimatedScore] = useState(0)
  useEffect(() => {
    setAnimatedScore(0)
    const target = result.finalScore
    const duration = 800 // ms
    const startTime = Date.now()

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3)
      setAnimatedScore(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }

    requestAnimationFrame(animate)
  }, [result.finalScore])

  // Determine if test cases exist
  const hasTestResults =
    result.feedback.testResults && result.feedback.testResults.results.length > 0
  const showBothScores = hasTestResults && result.aiScore !== null

  // Format date in Vietnamese locale (Requirement 15.7)
  const formattedDate = new Date(result.gradedAt).toLocaleString('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Score Overview Card */}
      <div className="bg-bg-elevated rounded-xl border border-brand-teal/10 p-6">
        {/* Final Score + Grade Badge */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            {/* Circular Score Display */}
            <div className="relative w-20 h-20">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 72 72">
                <circle
                  cx="36"
                  cy="36"
                  r="30"
                  fill="none"
                  stroke="rgba(255,255,255,0.05)"
                  strokeWidth="6"
                />
                <circle
                  cx="36"
                  cy="36"
                  r="30"
                  fill="none"
                  stroke={gradeColor}
                  strokeWidth="6"
                  strokeLinecap="round"
                  strokeDasharray={`${(animatedScore / 100) * 188.5} 188.5`}
                  style={{ transition: 'none' }}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xl font-bold text-white">{animatedScore}</span>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-white">{t('gradingUI.result')}</h3>
              <span
                className="inline-block px-3 py-1 mt-1 text-sm font-medium rounded-full"
                style={{
                  backgroundColor: `${gradeColor}20`,
                  color: gradeColor,
                  border: `1px solid ${gradeColor}40`,
                }}
              >
                {gradeLabel}
              </span>
            </div>
          </div>

          <div className="text-right text-sm text-gray-400">
            <p className="flex items-center gap-1 justify-end">
              <FiClock className="w-3 h-3" />
              {formattedDate}
            </p>
            <p className="text-xs mt-1">{(result.executionTime / 1000).toFixed(1)}s</p>
          </div>
        </div>

        {/* Score Breakdown — dynamic based on available scores */}
        <div className={`grid gap-4 ${showBothScores ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {/* Test Score — only show if test cases exist */}
          {hasTestResults && (
            <div className="bg-bg-primary rounded-lg p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <FiCheckCircle className="w-4 h-4 text-green-400" />
                <span className="text-sm text-gray-400">Đúng/Sai</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {showBothScores ? '70%' : '100%'}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{result.testScore}</span>
                <span className="text-sm text-gray-500 mb-1">/100</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-700"
                  style={{ width: `${result.testScore}%` }}
                />
              </div>
            </div>
          )}

          {/* AI Score — always show if available */}
          {result.aiScore !== null && (
            <div className="bg-bg-primary rounded-lg p-4 border border-white/5">
              <div className="flex items-center gap-2 mb-2">
                <FiCpu className="w-4 h-4 text-brand-cyan" />
                <span className="text-sm text-gray-400">AI đánh giá</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {showBothScores ? '30%' : '100%'}
                </span>
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-bold text-white">{result.aiScore}</span>
                <span className="text-sm text-gray-500 mb-1">/100</span>
              </div>
              <div className="mt-2 h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-brand-cyan to-brand-teal transition-all duration-700"
                  style={{ width: `${result.aiScore}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {result.feedback.overallFeedback && (
          <div className="mt-4 rounded-lg border border-brand-teal/15 bg-brand-teal/5 p-4 text-sm text-slate-200 leading-relaxed">
            {result.feedback.overallFeedback}
          </div>
        )}
      </div>

      {/* Detailed Results */}
      {showDetails && (
        <>
          {/* Test Case Results */}
          {result.feedback.testResults && result.feedback.testResults.results.length > 0 && (
            <TestCaseResults testRunResult={result.feedback.testResults} />
          )}

          {/* AI Analysis */}
          {result.feedback.aiAnalysis && (
            <AIAnalysisDisplay analysis={result.feedback.aiAnalysis} />
          )}
        </>
      )}

      {/* Retry with mode selection */}
      {onRetry && (
        <div className="flex justify-center pt-2">
          <GradingDepthDropdown isGrading={isGrading} onGrade={onRetry} label={t('gradingUI.regrade')} dropUp />
        </div>
      )}
    </div>
  )
}

export default GradingResults
