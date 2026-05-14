/**
 * SubmissionHistory Component
 *
 * Displays paginated list of submissions with scores, timestamps,
 * best/average scores, and navigation to detailed view.
 *
 * Validates Requirements: 9.2, 9.3, 9.4, 9.5, 9.6
 */

import React from 'react'
import { FiClock, FiChevronRight } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import {
  type SubmissionHistoryData,
  type SubmissionSummary,
  GRADE_LABELS,
  GRADE_COLORS,
} from '../../types/grading.types'

interface SubmissionHistoryProps {
  history: SubmissionHistoryData
  onSelectSubmission?: (submissionId: string) => void
  onPageChange?: (page: number) => void
  /** Highlight the best submission */
  highlightBest?: boolean
}

const SubmissionHistory: React.FC<SubmissionHistoryProps> = ({
  history,
  onSelectSubmission,
  onPageChange,
  highlightBest = true,
}) => {
  const { t } = useTranslation()
  // Find best submission ID
  const bestSubmissionId = highlightBest
    ? history.submissions.reduce(
        (best, s) => ((s.finalScore ?? 0) > (best?.finalScore ?? 0) ? s : best),
        history.submissions[0]
      )?.id
    : null

  return (
    <div className="bg-bg-elevated rounded-xl border border-brand-teal/10 p-6">
      {/* Header with Stats */}
      <div className="flex items-center justify-between mb-5">
        <h4 className="text-sm font-semibold text-white flex items-center gap-2">
          <FiClock className="w-4 h-4 text-brand-teal" />
          {t('grading.history')}
        </h4>
        <span className="text-xs text-gray-500">{t('gradingUI.submissionCount', { count: history.totalAttempts })}</span>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="bg-bg-primary rounded-lg p-3 border border-white/5 text-center">
          <p className="text-xs text-gray-500 mb-1">{t('grading.bestScore')}</p>
          <p className="text-lg font-bold text-green-400">{history.bestScore}</p>
        </div>
        <div className="bg-bg-primary rounded-lg p-3 border border-white/5 text-center">
          <p className="text-xs text-gray-500 mb-1">{t('grading.average')}</p>
          <p className="text-lg font-bold text-brand-cyan">{history.averageScore}</p>
        </div>
        <div className="bg-bg-primary rounded-lg p-3 border border-white/5 text-center">
          <p className="text-xs text-gray-500 mb-1">{t('grading.history')}</p>
          <p className="text-lg font-bold text-white">{history.totalAttempts}</p>
        </div>
      </div>

      {/* Submissions List */}
      {history.submissions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">{t('gradingUI.noSubmissions')}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {history.submissions.map(submission => (
            <SubmissionRow
              key={submission.id}
              submission={submission}
              isBest={submission.id === bestSubmissionId}
              onClick={() => onSelectSubmission?.(submission.id)}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {history.totalAttempts > history.limit && (
        <div className="flex items-center justify-center gap-2 mt-4 pt-4 border-t border-white/5">
          <button
            onClick={() => onPageChange?.(history.page - 1)}
            disabled={history.page <= 1}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-bg-primary rounded-md border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {t('gradingUI.previous')}
          </button>
          <span className="text-xs text-gray-500">
            {t('gradingUI.pageOf', { page: history.page, total: Math.ceil(history.totalAttempts / history.limit) })}
          </span>
          <button
            onClick={() => onPageChange?.(history.page + 1)}
            disabled={history.page >= Math.ceil(history.totalAttempts / history.limit)}
            className="px-3 py-1.5 text-xs text-gray-400 hover:text-white bg-bg-primary rounded-md border border-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            {t('gradingUI.next')}
          </button>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// SubmissionRow Sub-Component
// ============================================================================

interface SubmissionRowProps {
  submission: SubmissionSummary
  isBest: boolean
  onClick: () => void
}

const SubmissionRow: React.FC<SubmissionRowProps> = ({ submission, isBest, onClick }) => {
  const gradeColor = submission.gradeLevel ? GRADE_COLORS[submission.gradeLevel] : '#6b7280'
  const gradeLabel = submission.gradeLevel ? GRADE_LABELS[submission.gradeLevel] : '—'

  const formattedDate = submission.submittedAt
    ? new Date(submission.submittedAt).toLocaleString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all hover:bg-white/[0.03] ${
        isBest ? 'border-brand-teal/30 bg-brand-teal/5' : 'border-white/5 bg-bg-primary'
      }`}
    >
      <div className="flex items-center gap-3">
        {/* Score badge */}
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
          style={{
            backgroundColor: `${gradeColor}15`,
            color: gradeColor,
          }}
        >
          {submission.finalScore ?? '—'}
        </div>

        <div className="text-left">
          <div className="flex items-center gap-2">
            <span className="text-sm text-white font-medium">{gradeLabel}</span>
            {isBest && (
              <span className="text-[10px] px-1.5 py-0.5 bg-brand-teal/20 text-brand-teal rounded-full font-medium">
                Best
              </span>
            )}
          </div>
          <p className="text-xs text-gray-500 mt-0.5">{formattedDate}</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {submission.testScore !== null && (
          <div className="text-right">
            <p className="text-[10px] text-gray-500">Test</p>
            <p className="text-xs text-gray-300">{submission.testScore}</p>
          </div>
        )}
        {submission.aiScore !== null && (
          <div className="text-right">
            <p className="text-[10px] text-gray-500">AI</p>
            <p className="text-xs text-gray-300">{submission.aiScore}</p>
          </div>
        )}
        <FiChevronRight className="w-4 h-4 text-gray-600" />
      </div>
    </button>
  )
}

export default SubmissionHistory
