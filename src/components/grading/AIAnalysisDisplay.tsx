/**
 * AIAnalysisDisplay Component
 *
 * Displays AI analysis scores breakdown with visual progress bars,
 * strengths, improvements, and suggestions in collapsible sections.
 *
 * Validates Requirements: 15.3, 15.4, 8.3, 8.4
 */

import React, { useState } from 'react'
import { FiAward, FiChevronDown, FiCheckCircle, FiTool, FiZap } from 'react-icons/fi'
import { useTranslation } from 'react-i18next'
import type { AIAnalysis } from '../../types/grading.types'

interface AIAnalysisDisplayProps {
  analysis: AIAnalysis
}

const AIAnalysisDisplay: React.FC<AIAnalysisDisplayProps> = ({ analysis }) => {
  const { t } = useTranslation()
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['strengths']) // Auto-expand strengths
  )

  const SCORE_CRITERIA = [
    { key: 'codeQuality' as const, label: t('gradingUI.codeQuality'), weight: '40%', color: '#10b981' },
    { key: 'bestPractices' as const, label: 'Best Practices', weight: '30%', color: '#3b82f6' },
    { key: 'complexity' as const, label: t('gradingUI.complexity'), weight: '20%', color: '#f59e0b' },
    { key: 'security' as const, label: t('gradingUI.security'), weight: '10%', color: '#ef4444' },
  ]

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev)
      if (next.has(section)) {
        next.delete(section)
      } else {
        next.add(section)
      }
      return next
    })
  }

  return (
    <div className="bg-bg-elevated rounded-xl border border-brand-teal/10 p-6">
      {/* Header */}
      <h4 className="text-sm font-semibold text-white flex items-center gap-2 mb-5">
        <FiAward className="w-4 h-4 text-brand-cyan" />
        AI Analysis
        <span className="ml-auto text-brand-cyan font-bold">{analysis.aiScore}/100</span>
      </h4>

      {/* Score Breakdown Bars */}
      <div className="space-y-3 mb-6">
        {SCORE_CRITERIA.map(criteria => {
          const score = analysis.scores[criteria.key]
          return (
            <div key={criteria.key}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-gray-400">{criteria.label}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">{criteria.weight}</span>
                  <span className="text-xs font-medium text-white">{score}</span>
                </div>
              </div>
              <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${score}%`,
                    backgroundColor: criteria.color,
                    opacity: 0.85,
                  }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Collapsible Sections */}
      <div className="space-y-2">
        <CollapsibleSection
          title={t('gradingUI.strengths')}
          icon={<FiCheckCircle className="w-3.5 h-3.5" />}
          items={analysis.strengths}
          color="text-green-400"
          isExpanded={expandedSections.has('strengths')}
          onToggle={() => toggleSection('strengths')}
        />
        <CollapsibleSection
          title={t('gradingUI.improvements')}
          icon={<FiTool className="w-3.5 h-3.5" />}
          items={analysis.improvements}
          color="text-yellow-400"
          isExpanded={expandedSections.has('improvements')}
          onToggle={() => toggleSection('improvements')}
        />
        <CollapsibleSection
          title={t('gradingUI.suggestions')}
          icon={<FiZap className="w-3.5 h-3.5" />}
          items={analysis.suggestions}
          color="text-brand-cyan"
          isExpanded={expandedSections.has('suggestions')}
          onToggle={() => toggleSection('suggestions')}
        />
      </div>

      {/* Overall Feedback */}
      {analysis.feedback && (
        <div className="mt-4 p-4 bg-bg-primary rounded-lg border border-white/5">
          <p className="text-xs text-gray-500 mb-2">{t('gradingUI.overallFeedback')}</p>
          <p className="text-sm text-gray-300 leading-relaxed">{analysis.feedback}</p>
        </div>
      )}
    </div>
  )
}

// ============================================================================
// CollapsibleSection Sub-Component
// ============================================================================

interface CollapsibleSectionProps {
  title: string
  icon: React.ReactNode
  items: string[]
  color: string
  isExpanded: boolean
  onToggle: () => void
}

const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  icon,
  items,
  color,
  isExpanded,
  onToggle,
}) => {
  if (!items || items.length === 0) return null

  return (
    <div className="border border-white/5 rounded-lg overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-white/[0.02] transition-colors"
      >
        <span className={`text-sm font-medium ${color} flex items-center gap-2`}>
          <span>{icon}</span>
          {title}
          <span className="text-xs text-gray-500">({items.length})</span>
        </span>
        <FiChevronDown
          className={`w-4 h-4 text-gray-500 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
        />
      </button>

      {isExpanded && (
        <div className="px-3 pb-3 space-y-2 animate-slideDown">
          {items.map((item, index) => (
            <div key={index} className="flex items-start gap-2 text-sm text-gray-300">
              <span className="text-gray-600 mt-0.5">•</span>
              <span>{item}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default AIAnalysisDisplay
