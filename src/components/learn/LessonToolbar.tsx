/**
 * LessonToolbar — Editor toolbar with tab switching, run code, and grading actions.
 *
 * Two tabs: "Lý thuyết" (theory/content) and "Bài tập" (code editor).
 * Auto-completes lesson when grading score ≥ 85.
 */

import { FileText, Play, Code2, BookOpen, Lightbulb, ExternalLink } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import GradingDepthDropdown from '../grading/GradingDepthDropdown'
import type { GradingDepth } from '../../types/grading.types'

export type EditorTab = 'theory' | 'example' | 'exercise'

interface LessonToolbarProps {
  hasLessons: boolean
  activeTab: EditorTab
  isGrading?: boolean
  onTabChange: (tab: EditorTab) => void
  onRunCode: () => void
  onSubmitGrading?: (depth: GradingDepth) => void
  onHint?: () => void
  onOpenPlayground?: () => void
}

const LessonToolbar: React.FC<LessonToolbarProps> = ({
  hasLessons,
  activeTab,
  isGrading = false,
  onTabChange,
  onRunCode,
  onSubmitGrading,
  onHint,
  onOpenPlayground,
}) => {
  const { t } = useTranslation()

  const tabClass = (tab: EditorTab) =>
    `flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-xl transition-all duration-200 cursor-pointer ${
      activeTab === tab
        ? 'bg-brand-teal/15 border border-brand-teal/40 text-brand-teal shadow-sm shadow-brand-teal/10'
        : 'bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-slate-200'
    }`

  return (
    <div className="bg-[#0a0e1a]/80 backdrop-blur-sm px-5 py-3 flex items-center justify-between border-b border-white/10 flex-shrink-0">
      {/* Left: Tab switcher */}
      <div className="flex items-center gap-2">
        <button onClick={() => onTabChange('theory')} className={tabClass('theory')}>
          <BookOpen className="w-4 h-4" />
          {t('learn.theory')}
        </button>
        <button onClick={() => onTabChange('example')} className={tabClass('example')}>
          <FileText className="w-4 h-4" />
          {t('learn.example')}
        </button>
        <button onClick={() => onTabChange('exercise')} className={tabClass('exercise')}>
          <Code2 className="w-4 h-4" />
          {t('learn.exercise')}
        </button>
      </div>

      {/* Right: Action buttons (only visible in exercise tab) */}
      {activeTab === 'exercise' && (
        <div className="flex items-center gap-3 flex-shrink-0">
          {onHint && (
            <button
              onClick={onHint}
              disabled={!hasLessons}
              className={`rounded-xl px-4 py-2.5 bg-yellow-500/10 border border-yellow-500/30 text-yellow-500 text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
                hasLessons
                  ? 'cursor-pointer hover:bg-yellow-500/20 hover:border-yellow-500/50 hover:shadow-lg hover:shadow-yellow-500/20'
                  : 'cursor-not-allowed opacity-50'
              }`}
              title={t('learn.getHint')}
            >
              <Lightbulb className="w-5 h-5" />
            </button>
          )}

          {onOpenPlayground && (
            <button
              onClick={onOpenPlayground}
              disabled={!hasLessons}
              className={`rounded-xl px-4 py-2.5 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-bold flex items-center gap-2 transition-all duration-300 ${
                hasLessons
                  ? 'cursor-pointer hover:bg-blue-500/20 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/20'
                  : 'cursor-not-allowed opacity-50'
              }`}
              title="Open in Playground"
            >
              <ExternalLink className="w-5 h-5" />
            </button>
          )}

          <button
            onClick={onRunCode}
            disabled={!hasLessons}
            className={`rounded-xl px-7 py-2.5 bg-brand-teal/20 border border-brand-teal/50 text-brand-teal text-sm font-bold flex items-center gap-2 transition-all duration-300 shadow-lg shadow-brand-teal/20 ${
              hasLessons
                ? 'cursor-pointer hover:bg-brand-teal/30 hover:border-brand-teal hover:shadow-brand-teal/30'
                : 'cursor-not-allowed opacity-50'
            }`}
          >
            <Play className="w-5 h-5" />
            {t('learn.runCode')}
          </button>

          {hasLessons && onSubmitGrading && (
            <GradingDepthDropdown isGrading={isGrading} onGrade={onSubmitGrading} />
          )}
        </div>
      )}
    </div>
  )
}

export default LessonToolbar
