import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiX } from 'react-icons/fi'
import { executeCode, formatError } from '../../utils/codeExecution'
import { useLessonData } from '../../hooks/useLessonData'
import LessonSidebar from './LessonSidebar'
import LessonToolbar, { type EditorTab } from './LessonToolbar'
import CodeEditor from '../common/CodeEditor'
import Terminal from '../common/Terminal'
import GradingResults from '../grading/GradingResults'
import GradingSkeleton from '../grading/GradingSkeleton'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'
import type { GradingResult, GradingDepth } from '../../types/grading.types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface LessonViewerProps {
  language: string
  initialLessonId?: string
}

const LessonViewer: React.FC<LessonViewerProps> = ({ language, initialLessonId }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const {
    lessons,
    chapters,
    loading,
    activeTab: activeLessonId,
    setActiveTab: setActiveLessonId,
    completedLessons,
    setCompletedLessons,
  } = useLessonData(language, initialLessonId, user?.id)

  const [code, setCode] = useState('')
  const [outputLogs, setOutputLogs] = useState<string[]>([])
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null)
  const [isGrading, setIsGrading] = useState(false)
  const [editorTab, setEditorTab] = useState<EditorTab>('exercise')

  const handleTabChange = (tab: EditorTab) => {
    setEditorTab(tab)
    if (tab === 'theory' || tab === 'example') {
      setGradingResult(null)
    }
  }
  const isInitialMount = useRef(true)
  const gradingResultRef = useRef<HTMLDivElement>(null)

  const currentLesson = lessons.find(l => l.id === activeLessonId)
  const hasLessons = lessons.length > 0

  /**
   * Split lesson code into theory (sample code) and exercise (practice section).
   *
   * Code structure:
   *   Sample code...          → theory tab
   *   === BÀI TẬP ===         → separator (removed)
   *   // Bài 1: ...           → exercise tab
   *   === ĐÁP ÁN ===         → removed entirely
   */
  const splitLessonCode = (rawCode: string): { theory: string; exercise: string } => {
    const lines = rawCode.split('\n')

    // Find exercise separator (BÀI TẬP or BAI TAP)
    const exerciseIndex = lines.findIndex(line => /BÀI TẬP|BAI T[AẬ]P/i.test(line))

    // Find answer separator (ĐÁP ÁN or DAP AN)
    const answerIndex = lines.findIndex(line => /ĐÁP ÁN|DAP AN/i.test(line))

    // Determine end of relevant code (before answers)
    let endIndex = answerIndex !== -1 ? answerIndex : lines.length
    // Also remove separator line above ĐÁP ÁN if it's a divider (=====)
    if (endIndex > 0 && lines[endIndex - 1]?.match(/^\/\/\s*=+/)) {
      endIndex--
    }

    if (exerciseIndex === -1) {
      // No exercise separator → everything is exercise (old format or exercise-only)
      return {
        theory: '',
        exercise: lines.slice(0, endIndex).join('\n').trimEnd() + '\n',
      }
    }

    // Theory = everything before the exercise separator
    let theoryEnd = exerciseIndex
    // Remove separator line above BÀI TẬP if it's a divider
    if (theoryEnd > 0 && lines[theoryEnd - 1]?.match(/^(\/\/\s*)?=+|console\.log/)) {
      // Also skip blank lines and console.log separators
      while (
        theoryEnd > 0 &&
        (lines[theoryEnd - 1].trim() === '' ||
          /console\.log\(\s*["']\s*["']\s*\)/.test(lines[theoryEnd - 1]) ||
          /=== BA/.test(lines[theoryEnd - 1]))
      ) {
        theoryEnd--
      }
    }

    // Exercise = everything after the exercise separator, before answers
    let exerciseStart = exerciseIndex + 1
    // Skip blank lines after separator
    while (exerciseStart < endIndex && lines[exerciseStart].trim() === '') {
      exerciseStart++
    }

    return {
      theory: lines.slice(0, theoryEnd).join('\n').trimEnd() + '\n',
      exercise: lines.slice(exerciseStart, endIndex).join('\n').trimEnd() + '\n',
    }
  }

  // Update code and URL when lesson changes
  useEffect(() => {
    if (currentLesson) {
      const { exercise } = splitLessonCode(currentLesson.code || '')
      setCode(exercise)
      setOutputLogs([t('learn.readyToRun')])
      setGradingResult(null)

      // Only update URL after the initial data load, not on first mount
      if (isInitialMount.current) {
        isInitialMount.current = false
      } else {
        navigate(`/learn/${language}/${currentLesson.lesson_id}`, { replace: true })
      }
    }
  }, [activeLessonId, currentLesson, language, navigate, t])

  // Auto-scroll to grading results when they appear
  useEffect(() => {
    if (gradingResult && gradingResultRef.current) {
      gradingResultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [gradingResult])

  // Auto-complete lesson when grading score ≥ 85
  useEffect(() => {
    if (gradingResult && currentLesson && user && gradingResult.finalScore >= 85) {
      const lessonId = currentLesson.id
      if (!completedLessons.has(lessonId)) {
        api
          .completeLesson(lessonId)
          .then(response => {
            if (response.success) {
              setCompletedLessons(prev => new Set(prev).add(lessonId))
            }
          })
          .catch(() => {
            // Silent fail — not critical
          })
      }
    }
  }, [gradingResult, currentLesson, user, completedLessons, setCompletedLessons])

  const runCode = () => {
    setOutputLogs([])
    const result = executeCode(code, language)

    if (result.error) {
      setOutputLogs([...result.logs, formatError(result.error)])
    } else {
      setOutputLogs(result.logs)
    }
  }

  const submitForGrading = useCallback(
    async (depth: GradingDepth = 'quick') => {
      if (!currentLesson) {
        setOutputLogs([t('grading.selectLesson')])
        return
      }

      // Debounce: prevent re-submission while grading
      if (isGrading) return

      setIsGrading(true)
      setGradingResult(null)
      const depthLabels = { quick: 'quick', careful: 'careful', thorough: 'thorough' }
      setOutputLogs([t('grading.processing', { depth: depthLabels[depth] })])

      try {
        // Send the exercise template as starter code for accurate diff comparison
        const { exercise: exerciseTemplate } = splitLessonCode(currentLesson.code || '')
        const response = (await api.submitForGrading(currentLesson.id, code, language, 'both', {
          starterCode: exerciseTemplate,
          lessonTitle: currentLesson.title,
          lessonDescription: currentLesson.description,
          lessonInsight: currentLesson.insight,
          gradingDepth: depth,
        })) as { success: boolean; data?: GradingResult; error?: { message: string } }

        if (response.success && response.data) {
          setGradingResult(response.data as GradingResult)
          setOutputLogs([
            t('grading.complete', {
              score: response.data.finalScore,
              grade: response.data.gradeLevel,
            }),
          ])
        } else {
          setOutputLogs([t('grading.failed', { error: response.error?.message || 'Unknown error' })])
        }
      } catch (error: any) {
        setOutputLogs([t('grading.error', { message: error.message || 'Server error' })])
      } finally {
        setIsGrading(false)
      }
    },
    [currentLesson, code, language, isGrading, t]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex flex-col items-center gap-4">
          <LoadingSpinner size="lg" />
          <p className="text-brand-teal text-sm font-medium">{t('learn.loadingLesson')}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <LessonSidebar
        lessons={lessons}
        chapters={chapters}
        activeLesson={activeLessonId}
        language={language}
        currentLesson={currentLesson}
        onSelectLesson={setActiveLessonId}
      />

      <main className="flex-1 flex flex-col gap-4 min-w-0 h-full">
        <div
          className={`flex-1 flex flex-col bg-white/3 border border-brand-teal/10 rounded-card min-h-0 ${!hasLessons ? 'opacity-50 pointer-events-none' : ''}`}
        >
          {/* Toolbar with tab switcher */}
          <div className="relative flex-shrink-0">
            <LessonToolbar
              hasLessons={hasLessons}
              activeTab={editorTab}
              isGrading={isGrading}
              onTabChange={handleTabChange}
              onRunCode={runCode}
              onSubmitGrading={submitForGrading}
            />
          </div>

          {/* Tab content */}
          <div className="flex-1 overflow-auto min-h-0">
            {editorTab === 'theory' ? (
              (() => {
                if (!currentLesson?.insight) {
                  return (
                    <div className="p-6">
                      <p className="text-slate-500 italic">
                        {t('learn.noContent')}
                      </p>
                    </div>
                  )
                }

                return (
                  <div className="flex-1 p-6 overflow-y-auto bg-slate-900/50">
                    <div className="prose prose-invert prose-brand max-w-none text-slate-300 text-sm leading-relaxed font-sans">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {currentLesson.insight}
                      </ReactMarkdown>
                    </div>
                  </div>
                )
              })()
            ) : editorTab === 'example' ? (
              (() => {
                const { theory } = splitLessonCode(currentLesson?.code || '')
                return theory ? (
                  <CodeEditor value={theory} onChange={() => {}} editable={false} />
                ) : (
                  <div className="p-6">
                    <p className="text-slate-500 italic">{t('learn.noExample')}</p>
                  </div>
                )
              })()
            ) : (
              <CodeEditor value={code} onChange={setCode} editable={hasLessons} />
            )}
          </div>
        </div>

        <Terminal logs={outputLogs} onClear={() => setOutputLogs([])} isActive={hasLessons} />

        {/* Grading Results Panel */}
        <div ref={gradingResultRef}>
          {isGrading && <GradingSkeleton />}
          {gradingResult && (
            <div className="max-h-[500px] overflow-y-auto scrollbar-thin relative">
              <button
                onClick={() => setGradingResult(null)}
                className="sticky top-2 right-2 float-right z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-bg-primary/80 backdrop-blur-sm border border-white/10 text-gray-400 hover:text-white hover:border-brand-teal/50 transition-colors cursor-pointer"
                title={t('learn.closeResults')}
              >
                <FiX className="w-4 h-4" />
              </button>
              <GradingResults
                result={gradingResult}
                onRetry={submitForGrading}
                isGrading={isGrading}
              />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default LessonViewer
