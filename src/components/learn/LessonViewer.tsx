import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiX, FiInfo, FiAlertCircle, FiChevronRight, FiPlay, FiCheckCircle, FiArrowRight, FiArrowLeft, FiBookOpen } from 'react-icons/fi'
import { useLessonData } from '../../hooks/useLessonData'
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

const getCheckMethodLabel = (validationType?: string, gradingMode?: string) => {
  if (validationType === 'stdout') return 'Chấm bằng test case output: chạy code và so sánh kết quả in ra.'
  if (validationType === 'function') return 'Chấm bằng test case function: gọi hàm của bạn với input mẫu.'
  if (validationType === 'exact') return 'Chấm bằng so khớp code mẫu sau khi chuẩn hóa.'
  if (validationType === 'regex') return 'Chấm bằng mẫu regex yêu cầu trong bài.'
  if (validationType === 'rule') return 'Chấm bằng rule tĩnh: kiểm tra keyword, pattern và yêu cầu bài học.'
  if (gradingMode) return `Chấm bằng deterministic checker (${gradingMode}).`
  return 'Chấm bằng deterministic checker của Loopy, không dùng AI để quyết định đúng/sai.'
}

const createDebugCode = (source: string, language: string) => {
  if (language === 'python') {
    return `${source.trimEnd()}\n\n# Debug challenge: dòng dưới đang lỗi, hãy sửa hoặc xóa nó.\nprint(ten_chua_khai_bao)`
  }

  if (language === 'cpp') {
    return `${source.trimEnd()}\n\n// Debug challenge: dòng dưới đang lỗi, hãy sửa hoặc xóa nó.\ncout << ten_chua_khai_bao;`
  }

  return `${source.trimEnd()}\n\n// Debug challenge: dòng dưới đang lỗi, hãy sửa hoặc xóa nó.\nconsole.log(tenChuaKhaiBao);`
}

const LessonViewer: React.FC<LessonViewerProps> = ({ language, initialLessonId }) => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
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
  const [checkMethodLabel, setCheckMethodLabel] = useState('')
  const [hasPassedChangeCheck, setHasPassedChangeCheck] = useState(false)
  const [hasPassedDebugCheck, setHasPassedDebugCheck] = useState(false)

  const isInitialMount = useRef(true)
  const gradingResultRef = useRef<HTMLDivElement>(null)

  const currentLesson = lessons.find(l => l.id === activeLessonId)
  const hasLessons = lessons.length > 0
  const currentChapter = currentLesson ? chapters.find(chapter => chapter.id === currentLesson.chapterId) : null
  const completedCount = completedLessons.size
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0

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
      setCheckMethodLabel('')
      setHasPassedChangeCheck(false)
      setHasPassedDebugCheck(false)

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

  const runSampleCode = useCallback(async () => {
    if (!currentLesson) return

    setOutputLogs(['> Đang chạy code mẫu...'])
    try {
      const response = await api.executeCode(language, currentLesson.starterCode || code)
      if (response.success && response.data) {
        const { output: executionOutput, error } = response.data
        if (error) {
          setOutputLogs([`Code mẫu đang lỗi: ${error}`])
          return
        }

        setOutputLogs(executionOutput ? executionOutput.split('\n') : ['Code mẫu chạy xong nhưng không có output.'])
        setCurrentStep('change')
      } else {
        setOutputLogs(['Không thể chạy code mẫu.'])
      }
    } catch (err: any) {
      setOutputLogs([`Không thể chạy code mẫu: ${err.message}`])
    }
  }, [currentLesson, code, language])

  const checkUserChange = useCallback(async () => {
    if (!currentLesson || isGrading) return

    setCurrentStep('change')
    setIsGrading(true)
    setGradingResult(null)
    setShowCelebration(false)
    setOutputLogs(['> Đang kiểm tra thay đổi của bạn...'])

    try {
      // Use deterministic validation engine
      const response = await api.checkLesson(currentLesson.id, code, language)

      if (response.success && response.data) {
        const check = response.data
        setCheckMethodLabel(getCheckMethodLabel(check.validationType, check.gradingMode))

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
          setHasPassedChangeCheck(true)
          setCurrentStep('run')
          setOutputLogs(['Thay đổi đã đạt yêu cầu. Bây giờ hãy chạy thử để xem output thật.'])
        }
      }
    } catch (error: any) {
      setOutputLogs([t('grading.error', { message: error.message || 'Server error' })])
    } finally {
      setIsGrading(false)
    }
  }, [currentLesson, code, language, isGrading, t])

  const runAcceptedCode = useCallback(async () => {
    if (!hasPassedChangeCheck) {
      setCurrentStep('change')
      setOutputLogs(['Bạn cần kiểm tra thay đổi đạt yêu cầu trước khi chạy thử bước này.'])
      return
    }

    setOutputLogs(['> Đang chạy code đã đạt yêu cầu...'])

    try {
      const response = await api.executeCode(language, code)
      if (response.success && response.data) {
        const { output: executionOutput, error } = response.data
        if (error) {
          setOutputLogs([`Lỗi khi chạy code: ${error}`])
          setCurrentStep('fix')
          return
        }

        setOutputLogs(executionOutput ? executionOutput.split('\n') : ['Code chạy xong nhưng không có output.'])
        
        // Use data-driven debug code if available, otherwise fallback to generated code
        const debugCode = currentLesson?.debug_starter_code 
          ? currentLesson.debug_starter_code 
          : createDebugCode(code, language)
        setCode(debugCode)
        setCurrentStep('fix')
      } else {
        setOutputLogs(['Không thể chạy code.'])
      }
    } catch (err: any) {
      setOutputLogs([`Lỗi khi chạy code: ${err.message}`])
      setCurrentStep('fix')
    }
  }, [hasPassedChangeCheck, language, code, currentLesson])

  const checkDebugFix = useCallback(async () => {
    setOutputLogs(['> Đang kiểm tra phần sửa lỗi...'])

    try {
      const response = await api.executeCode(language, code)
      if (response.success && response.data) {
        const { output: executionOutput, error } = response.data
        if (error) {
          setOutputLogs([`Vẫn còn lỗi: ${error}`])
          return
        }

        setOutputLogs(executionOutput ? executionOutput.split('\n') : ['Không còn runtime error.'])
        setHasPassedDebugCheck(true)
        setCurrentStep('build')
      } else {
        setOutputLogs(['Không thể kiểm tra phần sửa lỗi.'])
      }
    } catch (err: any) {
      setOutputLogs([`Vẫn còn lỗi: ${err.message}`])
    }
  }, [language, code])

  const completeCurrentLesson = useCallback(async () => {
    if (!currentLesson || !hasPassedDebugCheck) return

    setIsGrading(true)
    setOutputLogs(['> Đang lưu hoàn thành bài học...'])

    try {
      const lessonId = currentLesson.id
      if (!completedLessons.has(lessonId)) {
        const completeResponse = await api.completeLesson(lessonId)
        if (!completeResponse.success) {
          setOutputLogs([completeResponse.error?.message || 'Bài đã xong nhưng chưa lưu được tiến độ. Vui lòng thử lại.'])
          return
        }
        setCompletedLessons(prev => new Set(prev).add(lessonId))
        await refreshUser()
      }

      setShowCelebration(true)
      setOutputLogs(['Bài học đã được lưu là hoàn thành.'])
    } catch (error: any) {
      setOutputLogs([error.message || 'Bài đã xong nhưng chưa lưu được tiến độ. Vui lòng thử lại.'])
    } finally {
      setIsGrading(false)
    }
  }, [currentLesson, hasPassedDebugCheck, completedLessons, setCompletedLessons, refreshUser])

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
            if (currentStep === 'change') checkUserChange()
            if (currentStep === 'fix') checkDebugFix()
            if (currentStep === 'build') completeCurrentLesson()
          }
        } else {
          // Ctrl+Enter = Run code
          if (currentStep === 'see') runSampleCode()
          if (currentStep === 'run') runAcceptedCode()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, runSampleCode, checkUserChange, runAcceptedCode, checkDebugFix, completeCurrentLesson])

  if (loading) return <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" /></div>

  if (!hasLessons) {
    return (
      <div className="flex h-full items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
        <div className="max-w-md">
          <FiBookOpen className="mx-auto mb-4 h-12 w-12 text-brand-teal" />
          <h1 className="text-2xl font-black text-white">Lộ trình này chưa có bài học</h1>
          <p className="mt-3 text-slate-400">Nội dung đang được chuẩn bị. Bạn có thể quay lại Journey Map để chọn lộ trình khác.</p>
          <button
            onClick={() => navigate(`/library/${language}`)}
            className="mt-6 rounded-2xl bg-brand-teal px-6 py-3 font-black text-[#0a0e1a]"
          >
            Quay lại Journey Map
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      <main className="flex-1 flex flex-col gap-4 min-w-0 h-full">
        <div className="flex-1 flex flex-col bg-[#0f172a] border border-white/5 rounded-[1.5rem] overflow-hidden shadow-2xl">
          {/* Linear Progress Header */}
          <div className="px-4 py-4 bg-white/5 border-b border-white/5 flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between md:px-6">
            <div className="flex flex-wrap items-center gap-4 xl:gap-6">
              <button
                onClick={() => navigate(`/library/${language}`)}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm font-medium group cursor-pointer"
              >
                <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
                <span>{t('learn.backToLibrary')}</span>
              </button>

              <div className="h-4 w-px bg-white/10" />

              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-widest text-brand-teal">
                  {currentChapter?.title || language.toUpperCase()}
                </div>
                <div className="max-w-[240px] truncate text-sm font-bold text-white md:max-w-[360px]">
                  {currentLesson?.title || 'Bài học'}
                </div>
              </div>

              <div className="hidden h-4 w-px bg-white/10 md:block" />

              <div className="hidden min-w-[120px] md:block">
                <div className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-500">
                  <span>Journey</span>
                  <span>{progressPercent}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div className="h-full rounded-full bg-brand-teal transition-all" style={{ width: `${progressPercent}%` }} />
                </div>
              </div>

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
             
            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => {
                  if (currentStep === 'see') runSampleCode()
                  if (currentStep === 'change') checkUserChange()
                  if (currentStep === 'run') runAcceptedCode()
                  if (currentStep === 'fix') checkDebugFix()
                  if (currentStep === 'build') completeCurrentLesson()
                }}
                disabled={isGrading}
                className="px-4 py-2 bg-brand-teal text-[#0a0e1a] rounded-xl text-sm font-bold hover:scale-105 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {isGrading && 'Đang xử lý...'}
                {!isGrading && currentStep === 'see' && <><FiPlay className="w-4 h-4" /> Chạy code mẫu</>}
                {!isGrading && currentStep === 'change' && <><FiCheckCircle className="w-4 h-4" /> Kiểm tra thay đổi</>}
                {!isGrading && currentStep === 'run' && <><FiPlay className="w-4 h-4" /> Chạy thử kết quả</>}
                {!isGrading && currentStep === 'fix' && <><FiAlertCircle className="w-4 h-4" /> Kiểm tra sửa lỗi</>}
                {!isGrading && currentStep === 'build' && <><FiCheckCircle className="w-4 h-4" /> Hoàn thành lesson</>}
              </button>
            </div>
          </div>

          <div className="flex-1 grid min-h-0 lg:grid-cols-[380px,minmax(0,1fr)]">
            {/* Guide Section */}
            <div className="min-h-0 overflow-y-auto border-b border-white/5 bg-gradient-to-b from-white/5 to-transparent p-4 lg:border-b-0 lg:border-r md:p-5">
              <div className="space-y-4">
                <div>
                  <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-teal">
                    <FiInfo className="h-4 w-4" /> Mentor panel
                  </div>
                  <h2 className="text-lg font-black text-white mb-3">{currentLesson?.title}</h2>
                  <div className="prose prose-invert prose-brand max-w-none text-slate-300 text-sm leading-relaxed prose-p:my-2">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {currentStep === 'see' ? currentLesson?.description : currentLesson?.taskDescription}
                    </ReactMarkdown>
                  </div>
                </div>

                <div className="rounded-2xl border border-brand-teal/20 bg-brand-teal/[0.06] p-4">
                  <div className="mb-2 text-sm font-black text-brand-teal">
                    {currentStep === 'see' && 'Bước 1: quan sát code mẫu'}
                    {currentStep === 'change' && 'Bước 2: sửa một phần code'}
                    {currentStep === 'run' && 'Bước 3: chạy code đã đúng'}
                    {currentStep === 'fix' && 'Bước 4: debug một lỗi nhỏ'}
                    {currentStep === 'build' && 'Bước 5: tổng kết'}
                  </div>
                  <p className="text-sm leading-6 text-slate-300">
                    {currentStep === 'see' && 'Bấm “Chạy code mẫu” để xem output trước. Ở bước này editor đang khóa để bạn chỉ tập trung quan sát.'}
                    {currentStep === 'change' && 'Bây giờ hãy sửa code theo yêu cầu. Bấm “Kiểm tra thay đổi” để Loopy kiểm tra bạn đã gõ đúng yêu cầu chưa.'}
                    {currentStep === 'run' && 'Thay đổi đã đạt yêu cầu. Bấm “Chạy thử kết quả” để thấy output thật của code bạn vừa sửa.'}
                    {currentStep === 'fix' && 'Loopy đã thêm một lỗi nhỏ vào code. Hãy đọc terminal, sửa lỗi rồi bấm “Kiểm tra sửa lỗi”.'}
                    {currentStep === 'build' && 'Bạn đã quan sát, sửa code, chạy thử và debug. Bấm “Hoàn thành lesson” để lưu tiến độ.'}
                  </p>
                  <div className="mt-3 rounded-xl border border-white/10 bg-black/20 p-3 text-xs leading-5 text-slate-400">
                    <span className="font-bold text-white">Cách hoạt động: </span>
                    Quan sát chạy code mẫu. Thay đổi được chấm bằng rule/test case. Chạy thử chỉ xem output. Debug kiểm tra bằng runtime. Bước tổng kết mới lưu lesson hoàn thành.
                  </div>
                </div>
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
            <div className="min-h-[360px] lg:min-h-0">
              <CodeEditor 
                value={code} 
                onChange={setCode}
                editable={hasLessons && currentStep !== 'see'} 
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
              <div className="mb-3 rounded-2xl border border-brand-teal/20 bg-brand-teal/[0.06] p-4 text-sm leading-6 text-slate-300">
                <span className="font-bold text-brand-teal">Kiểm tra bài: </span>
                {checkMethodLabel || getCheckMethodLabel()}
              </div>
              <button
                onClick={() => setGradingResult(null)}
                className="sticky top-2 right-2 float-right z-10 w-8 h-8 flex items-center justify-center rounded-lg bg-bg-primary/80 backdrop-blur-sm border border-white/10 text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <FiX className="w-4 h-4" />
              </button>
              <GradingResults result={gradingResult} onRetry={checkUserChange} isGrading={isGrading} />
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

export default LessonViewer
