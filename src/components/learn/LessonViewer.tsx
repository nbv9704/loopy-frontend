import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiX, FiInfo, FiAlertCircle, FiChevronRight, FiPlay, FiCheckCircle, FiArrowRight, FiExternalLink, FiArrowLeft, FiBookOpen } from 'react-icons/fi'
import { useLessonData } from '../../hooks/useLessonData'
import LessonSidebar from './LessonSidebar'
import CodeEditor from '../common/CodeEditor'
import Terminal from '../common/Terminal'
import GradingResults from '../grading/GradingResults'
import GradingSkeleton from '../grading/GradingSkeleton'
import { api } from '../../lib/api'
import { useAuth } from '../../contexts/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'
import type { GradingResult } from '../../types/grading.types'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface LessonViewerProps {
  language: string
  initialLessonId?: string
}

type LessonStep = 'see' | 'change' | 'run' | 'fix' | 'build'

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
  const [currentStep, setCurrentStep] = useState<LessonStep>('see')
  const [showHint, setShowHint] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [aiHint, setAiHint] = useState<string | null>(null)
  const [isLoadingHint, setIsLoadingHint] = useState(false)
  const [showSidebar, setShowSidebar] = useState(false)

  const isInitialMount = useRef(true)
  const gradingResultRef = useRef<HTMLDivElement>(null)

  const currentLesson = lessons.find(l => l.id === activeLessonId)
  const hasLessons = lessons.length > 0

  // Find next lesson
  const currentIndex = lessons.findIndex(l => l.id === activeLessonId)
  const nextLesson = currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null

  // Update code and URL when lesson changes
  useEffect(() => {
    if (currentLesson) {
      setCode(currentLesson.starterCode || '')
      setOutputLogs([t('learn.readyToRun')])
      setGradingResult(null)
      setCurrentStep('see')
      setShowHint(false)
      setShowCelebration(false)
      setAiHint(null)
      setIsLoadingHint(false)

      if (isInitialMount.current) {
        isInitialMount.current = false
      } else {
        navigate(`/learn/${language}/${currentLesson.lessonId}`, { replace: true })
      }
    }
  }, [activeLessonId, currentLesson, language, navigate, t])

  useEffect(() => {
    if (gradingResult && gradingResultRef.current) {
      gradingResultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [gradingResult])

  const runCode = async () => {
    setOutputLogs(['> ' + t('common.loading') + '...'])
    
    try {
      const response = await api.executeCode(language, code)
      if (response.success && response.data) {
        const { output: executionOutput, error } = response.data
        if (error) {
          setOutputLogs([`❌ LỖI: ${error}`])
          setCurrentStep('fix')
        } else {
          setOutputLogs(executionOutput ? executionOutput.split('\n') : [t('learn.readyToRun')])
          if (currentStep === 'see' || currentStep === 'change' || currentStep === 'fix') {
            setCurrentStep('run')
          }
        }
      } else {
        setOutputLogs(['❌ LỖI: Không thể thực thi mã nguồn.'])
        setCurrentStep('fix')
      }
    } catch (err: any) {
      setOutputLogs([`❌ LỖI: ${err.message}`])
      setCurrentStep('fix')
    }
  }

  const submitForGrading = useCallback(async () => {
    if (!currentLesson || isGrading) return

    setCurrentStep('build')
    setIsGrading(true)
    setGradingResult(null)
    setShowCelebration(false)
    setOutputLogs([t('grading.processing', { depth: 'quick' })])

    try {
      // Use deterministic validation engine
      const response = await api.checkLesson(currentLesson.id, code, language)

      if (response.success && response.data) {
        const check = response.data

        // Map LessonCheckResult to GradingResult to reuse premium UI display perfectly
        const mappedResult: GradingResult = {
          submissionId: 'deterministic',
          testScore: check.score,
          aiScore: null,
          finalScore: check.score,
          gradeLevel: check.passed ? 'excellent' : 'poor',
          gradedAt: new Date().toISOString(),
          executionTime: 0,
          feedback: {
            testResults: {
              testScore: check.score,
              totalExecutionTime: 0,
              results: check.checks.map((c, idx) => ({
                testCaseId: `check-${idx}`,
                passed: c.passed,
                actualOutput: check.output || '',
                expectedOutput: '',
                executionTime: 0,
                error: c.message || null,
                description: c.label,
              })),
            },
            aiAnalysis: null,
            overallFeedback: check.passed 
              ? (check.output || '✓ Trả lời chính xác!') 
              : (check.hint || 'Hãy kiểm tra kỹ yêu cầu bài học.'),
          },
        }

        setGradingResult(mappedResult)

        if (check.passed) {
          setShowCelebration(true)
          const lessonId = currentLesson.id
          if (!completedLessons.has(lessonId)) {
            await api.completeLesson(lessonId)
            setCompletedLessons(prev => new Set(prev).add(lessonId))
          }
        }
      }
    } catch (error: any) {
      setOutputLogs([t('grading.error', { message: error.message || 'Server error' })])
    } finally {
      setIsGrading(false)
    }
  }, [currentLesson, code, language, isGrading, completedLessons, setCompletedLessons, t])

  const goToNextLesson = () => {
    if (nextLesson) {
      setActiveLessonId(nextLesson.id)
    }
  }

  // Keyboard shortcuts (freeCodeCamp-inspired: Ctrl+Enter to run, Ctrl+Shift+Enter to submit)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault()
        if (e.shiftKey) {
          // Ctrl+Shift+Enter = Submit for grading
          if (currentStep !== 'see') {
            submitForGrading()
          }
        } else {
          // Ctrl+Enter = Run code
          runCode()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, submitForGrading])

  if (loading) return <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" /></div>

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      {showSidebar && (
        <div className="fixed inset-0 z-50 lg:relative lg:inset-auto">
          <div className="absolute inset-0 bg-[#0a0e1a]/80 backdrop-blur-sm lg:hidden" onClick={() => setShowSidebar(false)} />
          <div className="relative h-full w-[300px] shrink-0">
            <LessonSidebar
              lessons={lessons}
              chapters={chapters}
              activeLesson={activeLessonId}
              language={language}
              currentLesson={currentLesson}
              completedLessons={completedLessons}
              onSelectLesson={(id) => {
                setActiveLessonId(id)
                setShowSidebar(false)
              }}
            />
          </div>
        </div>
      )}

      <main className="flex-1 flex flex-col gap-4 min-w-0 h-full">
        <div className="flex-1 flex flex-col bg-[#0f172a] border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
          {/* Linear Progress Header */}
          <div className="px-6 py-4 bg-white/5 border-b border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-6">
              <button
                onClick={() => navigate(`/library/${language}`)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group cursor-pointer"
              >
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                <span>{t('learn.backToLibrary')}</span>
              </button>

              <div className="h-4 w-px bg-white/10" />

              <button
                onClick={() => setShowSidebar(!showSidebar)}
                className={`p-2 rounded-lg transition-all ${showSidebar ? 'bg-brand-teal text-[#0a0e1a]' : 'bg-white/5 text-slate-400 hover:text-white'}`}
                title="Bật/Tắt danh sách bài học"
              >
                <FiBookOpen className="w-4 h-4" />
              </button>

              <div className="h-4 w-px bg-white/10" />

              <div className="flex items-center gap-2 lg:gap-4 overflow-x-auto no-scrollbar">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${currentStep === 'see' ? 'bg-brand-teal text-[#0a0e1a]' : 'bg-white/10 text-slate-400'}`}>
                  <FiInfo className="w-3.5 h-3.5" /> Quan sát
                </div>
                <FiChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${currentStep === 'change' ? 'bg-brand-teal text-[#0a0e1a]' : 'bg-white/10 text-slate-400'}`}>
                  <FiPlay className="w-3.5 h-3.5" /> Thay đổi
                </div>
                <FiChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${currentStep === 'run' ? 'bg-brand-teal text-[#0a0e1a]' : 'bg-white/10 text-slate-400'}`}>
                  <FiPlay className="w-3.5 h-3.5" /> Chạy thử
                </div>
                <FiChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${currentStep === 'fix' ? 'bg-red-400 text-[#0a0e1a]' : 'bg-white/10 text-slate-400'}`}>
                  <FiAlertCircle className="w-3.5 h-3.5" /> Sửa lỗi
                </div>
                <FiChevronRight className="w-4 h-4 text-slate-600 shrink-0" />
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap ${currentStep === 'build' ? 'bg-brand-teal text-[#0a0e1a]' : 'bg-white/10 text-slate-400'}`}>
                  <FiCheckCircle className="w-3.5 h-3.5" /> Hoàn thành
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={runCode}
                className="px-4 py-2 bg-brand-teal/10 hover:bg-brand-teal/20 text-brand-teal rounded-xl text-sm font-bold transition-all flex items-center gap-2 cursor-pointer"
              >
                <FiPlay className="w-4 h-4" /> Chạy thử
                <span className="text-[10px] opacity-60 ml-1 hidden lg:inline">(Ctrl+Enter)</span>
              </button>
              <button
                onClick={() => navigate('/playground', { state: { code, language, lessonTitle: currentLesson?.title } })}
                className="px-3 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 cursor-pointer border border-white/10"
                title="Mở trong Playground để tự do thử nghiệm"
              >
                <FiExternalLink className="w-4 h-4" /> Playground
              </button>
              {currentStep !== 'see' && (
                <button 
                  onClick={submitForGrading}
                  disabled={isGrading}
                  className="px-4 py-2 bg-brand-teal text-[#0a0e1a] rounded-xl text-sm font-bold hover:scale-105 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isGrading ? 'Đang chấm...' : <><span>Kiểm tra bài</span><span className="text-[10px] opacity-60 ml-1 hidden lg:inline">(Ctrl+Shift+Enter)</span></>}
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col min-h-0">
            {/* Guide Section */}
            <div className="p-6 bg-gradient-to-b from-white/5 to-transparent border-b border-white/5">
              <h2 className="text-xl font-bold text-white mb-3">{currentLesson?.title}</h2>
              <div className="prose prose-invert prose-brand max-w-none text-slate-300 text-sm leading-relaxed">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentStep === 'see' ? currentLesson?.description : currentLesson?.taskDescription}
                </ReactMarkdown>
              </div>
              
              {(showHint || currentStep === 'build') && (
                <div className="mt-4 p-4 bg-brand-teal/5 border border-brand-teal/20 rounded-xl space-y-3">
                  <div className="flex items-center gap-2 text-brand-teal font-bold text-sm mb-1">
                    <FiAlertCircle className="w-4 h-4" /> Gợi ý cho bạn
                  </div>
                  <p className="text-slate-400 text-sm">{currentLesson?.hint}</p>
                  {currentLesson?.commonMistakes && (
                    <p className="text-slate-500 text-xs mt-2 italic">Lỗi thường gặp: {currentLesson?.commonMistakes}</p>
                  )}

                  {/* AI Hint */}
                  {aiHint && (
                    <div className="mt-3 pt-3 border-t border-brand-teal/10">
                      <div className="flex items-center gap-2 text-brand-cyan font-bold text-xs mb-1">🤖 AI Mentor</div>
                      <p className="text-slate-300 text-sm">{aiHint}</p>
                    </div>
                  )}

                  {!aiHint && (
                    <button
                      onClick={async () => {
                        if (!currentLesson || isLoadingHint) return
                        setIsLoadingHint(true)
                        try {
                          const res = await api.getAIHint(currentLesson.id, code, language, {
                            starterCode: currentLesson.starterCode,
                            lessonTitle: currentLesson.title,
                            lessonDescription: currentLesson.description,
                            outputLogs,
                          })
                          if (res.success && res.data?.hint) {
                            setAiHint(res.data.hint)
                          }
                        } catch {
                          setAiHint('Hiện tại AI Mentor đang bận. Hãy thử đọc lại gợi ý bên trên nhé!')
                        } finally {
                          setIsLoadingHint(false)
                        }
                      }}
                      disabled={isLoadingHint}
                      className="text-xs text-brand-cyan hover:text-brand-teal transition-colors underline cursor-pointer disabled:opacity-50"
                    >
                      {isLoadingHint ? '🤖 Đang suy nghĩ...' : '🤖 Hỏi AI Mentor gợi ý thêm'}
                    </button>
                  )}
                </div>
              )}
              
              {currentStep === 'change' && !showHint && (
                <button 
                  onClick={() => setShowHint(true)}
                  className="mt-4 text-xs text-slate-500 hover:text-brand-teal transition-colors underline cursor-pointer"
                >
                  Tôi bị kẹt, hãy giúp tôi
                </button>
              )}
            </div>

            {/* Editor */}
            <div className="flex-1 min-h-0">
              <CodeEditor 
                value={code} 
                onChange={(newCode) => {
                  setCode(newCode)
                  if (currentStep === 'see') setCurrentStep('change')
                }} 
                editable={hasLessons} 
              />
            </div>
          </div>
        </div>

        <Terminal logs={outputLogs} onClear={() => setOutputLogs([])} isActive={hasLessons} />

        {/* Celebration Banner */}
        {showCelebration && (
          <div className="bg-gradient-to-r from-green-500/10 via-brand-teal/10 to-green-500/10 border border-green-500/30 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="text-4xl">🎉</div>
                <div>
                  <h3 className="text-green-400 font-bold text-lg">Tuyệt vời! Bạn đã hoàn thành bài học!</h3>
                  <p className="text-slate-400 text-sm mt-1">
                    {currentLesson?.isAhaLesson 
                      ? 'Đây chính là khoảnh khắc "Aha!" đầu tiên của bạn. Hành trình vừa bắt đầu!' 
                      : 'Tiếp tục phát huy nhé, bạn đang tiến bộ rất nhanh!'}
                  </p>
                </div>
              </div>
              {nextLesson && (
                <button
                  onClick={goToNextLesson}
                  className="flex items-center gap-2 px-6 py-3 bg-brand-teal text-[#0a0e1a] rounded-xl font-bold hover:scale-105 transition-all cursor-pointer whitespace-nowrap"
                >
                  Bài tiếp theo <FiArrowRight className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* What you just learned */}
            <div className="bg-white/5 rounded-xl p-4 border border-white/10">
              <h4 className="text-brand-teal font-bold text-sm mb-2 flex items-center gap-2">
                <FiCheckCircle className="w-4 h-4" /> Bạn vừa học được gì?
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed">{currentLesson?.description}</p>
              {currentLesson?.commonMistakes && (
                <div className="mt-3 pt-3 border-t border-white/5">
                  <p className="text-slate-500 text-xs">
                    <span className="text-yellow-400/80 font-semibold">💡 Ghi nhớ: </span>
                    {currentLesson.commonMistakes}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <div ref={gradingResultRef}>
          {isGrading && <GradingSkeleton />}
          {gradingResult && (
            <div className="max-h-[500px] overflow-y-auto scrollbar-thin relative">
              <button
                onClick={() => setGradingResult(null)}
                className="sticky top-2 right-2 float-right z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-bg-primary/80 backdrop-blur-sm border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
              <GradingResults result={gradingResult} onRetry={submitForGrading} isGrading={isGrading} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default LessonViewer
