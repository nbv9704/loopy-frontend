import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiX, FiInfo, FiAlertCircle, FiChevronRight, FiCheckCircle, FiArrowRight, FiArrowLeft, FiBookOpen, FiTerminal } from 'react-icons/fi'
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
import LessonStepCard, { type LessonStepItem } from './LessonStepCard'

type ContentMap = Record<string, string | null | undefined>

interface LessonViewerProps {
  language: string
  initialLessonId?: string
  content?: ContentMap
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

const LessonViewer: React.FC<LessonViewerProps> = ({ language, initialLessonId, content }) => {
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
  const [revealedHintLevel, setRevealedHintLevel] = useState(1)
  const [isLoadingHint, setIsLoadingHint] = useState(false)
  const [checkMethodLabel, setCheckMethodLabel] = useState('')
  const [hasPassedChangeCheck, setHasPassedChangeCheck] = useState(false)
  const [hasPassedDebugCheck, setHasPassedDebugCheck] = useState(false)
  const [stepAnswers, setStepAnswers] = useState<Record<string, string>>({})
  const [stepFeedback, setStepFeedback] = useState<Record<string, { passed: boolean; message: string }>>({})

  const isInitialMount = useRef(true)
  const gradingResultRef = useRef<HTMLDivElement>(null)
  const getContent = useCallback((key: string, fallback: string) => content?.[key] || fallback, [content])

  const currentLesson = lessons.find(l => l.id === activeLessonId)
  const hasLessons = lessons.length > 0
  const currentChapter = currentLesson ? chapters.find(chapter => chapter.id === currentLesson.chapterId) : null
  const completedCount = completedLessons.size
  const progressPercent = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0
  const hintLevels = currentLesson
    ? [
        currentLesson.hintLevel1 || currentLesson.hint,
        currentLesson.hintLevel2,
        currentLesson.hintLevel3,
      ].filter((hint): hint is string => Boolean(hint?.trim()))
    : []
  const visibleHintLevels = hintLevels.slice(0, revealedHintLevel)
  const canRevealMoreHints = revealedHintLevel < hintLevels.length
  const primaryInteractionStep = currentLesson?.steps?.[0]
  const lessonType = currentLesson?.lessonType || primaryInteractionStep?.type || 'code_fix'
  const isCodeLesson = ['code_fix', 'code_output', 'code_build', 'code_prompt'].includes(lessonType)
  const visibleFlowSteps: LessonStep[] = isCodeLesson ? ['see', 'change', 'run', 'fix', 'build'] : ['see', 'change', 'build']

  // Find next lesson
  const currentIndex = lessons.findIndex(l => l.id === activeLessonId)
  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
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
      setRevealedHintLevel(1)
      setIsLoadingHint(false)
      setCheckMethodLabel('')
      setHasPassedChangeCheck(false)
      setHasPassedDebugCheck(false)
      setStepAnswers({})
      setStepFeedback({})

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

  const checkLessonStep = useCallback((step: LessonStepItem) => {
    const answer = (stepAnswers[step.id] || '').trim()
    const expected = step.correctAnswer
    const normalizedExpected = Array.isArray(expected)
      ? expected.map(String).map(item => item.trim().toLowerCase())
      : expected === undefined || expected === null
        ? []
        : [String(expected).trim().toLowerCase()]

    if (step.type === 'note' || step.type === 'code_prompt' || normalizedExpected.length === 0) {
      setStepFeedback(current => ({
        ...current,
        [step.id]: { passed: true, message: step.explanation || 'Đã ghi nhận bước này. Tiếp tục flow chính nhé.' },
      }))
      return
    }

    const passed = normalizedExpected.includes(answer.toLowerCase())
    setStepFeedback(current => ({
      ...current,
      [step.id]: {
        passed,
        message: passed
          ? step.explanation || 'Đúng rồi. Đây chỉ là checkpoint nhỏ, hãy tiếp tục Kiểm tra lesson bằng checker chính.'
          : step.hint || 'Chưa đúng. Đọc lại prompt và thử lại nhé.',
      },
    }))
  }, [stepAnswers])

  const checkNonCodeAnswer = useCallback(() => {
    if (!primaryInteractionStep) return

    const answer = (stepAnswers[primaryInteractionStep.id] || '').trim().toLowerCase()
    const expected = primaryInteractionStep.correctAnswer
    const normalizedExpected = Array.isArray(expected)
      ? expected.map(String).map(item => item.trim().toLowerCase())
      : expected === undefined || expected === null
        ? []
        : [String(expected).trim().toLowerCase()]

    const passed = normalizedExpected.length === 0 || normalizedExpected.includes(answer)
    setStepFeedback(current => ({
      ...current,
      [primaryInteractionStep.id]: {
        passed,
        message: passed
          ? primaryInteractionStep.explanation || 'Đúng rồi. Bấm lưu hoàn thành để ghi nhận tiến độ.'
          : primaryInteractionStep.hint || 'Chưa đúng. Đọc lại yêu cầu và thử lại nhé.',
      },
    }))

    if (passed) {
      setOutputLogs(['Câu trả lời đã đạt yêu cầu. Bước tiếp theo là lưu hoàn thành.'])
      setHasPassedDebugCheck(true)
      setCurrentStep('build')
      return
    }

    setOutputLogs(['Câu trả lời chưa đạt yêu cầu. Hãy thử lại trước khi lưu tiến độ.'])
  }, [primaryInteractionStep, stepAnswers])

  const runSampleCode = useCallback(async () => {
    if (!currentLesson) return

    const sampleCode = currentLesson.code || currentLesson.starterCode || code
    setOutputLogs(['> Đang chạy code mẫu...'])
    try {
      const response = await api.executeCode(language, sampleCode)
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
        const debugCode = currentLesson?.debugStarterCode 
          ? currentLesson.debugStarterCode 
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

        const expectedStdout = currentLesson?.debugValidationRules?.expected_stdout
        if (typeof expectedStdout === 'string' && executionOutput.trim() !== expectedStdout.trim()) {
          setOutputLogs([
            `Output hiện tại: ${executionOutput || '(trống)'}`,
            `Output cần đạt: ${expectedStdout}`,
            currentLesson?.debugHint || 'Code đã chạy nhưng output chưa đúng yêu cầu debug.',
          ])
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
  }, [language, code, currentLesson])

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
        setCompletedLessons((prev: any) => new Set<string>(prev).add(lessonId))
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

  const goToPreviousLesson = () => {
    if (previousLesson) {
      setActiveLessonId(previousLesson.id)
    }
  }

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
            if (!isCodeLesson && currentStep === 'change') checkNonCodeAnswer()
            if (currentStep === 'change' && isCodeLesson) checkUserChange()
            if (currentStep === 'fix') checkDebugFix()
            if (currentStep === 'build') completeCurrentLesson()
          }
        } else {
          // Ctrl+Enter = Run code / move into answer panel
          if (currentStep === 'see') {
            if (isCodeLesson) runSampleCode()
            else setCurrentStep('change')
          }
          if (currentStep === 'run') runAcceptedCode()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [currentStep, isCodeLesson, runSampleCode, checkUserChange, checkNonCodeAnswer, runAcceptedCode, checkDebugFix, completeCurrentLesson])

  if (loading) return <div className="flex items-center justify-center h-full"><LoadingSpinner size="lg" /></div>

  if (!hasLessons) {
    return (
      <div className="flex h-full items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
        <div className="max-w-md">
          <FiBookOpen className="mx-auto mb-4 h-12 w-12 text-brand-teal" />
          <h1 className="text-2xl font-black text-white">{getContent('learn.viewer.empty_title', 'Lộ trình này chưa có bài học')}</h1>
          <p className="mt-3 text-slate-400">
            {getContent('learn.viewer.empty_desc', 'Nội dung đang được chuẩn bị. Bạn có thể quay lại Journey Map để chọn lộ trình khác.')}
          </p>
          <button
            onClick={() => navigate(`/library/${language}`)}
            className="mt-6 rounded-2xl bg-brand-teal px-6 py-3 font-black text-[#0a0e1a]"
          >
            {getContent('learn.viewer.back_to_journey', 'Quay lại Journey Map')}
          </button>
        </div>
      </div>
    )
  }

  const isCompleted = currentLesson ? completedLessons.has(currentLesson.id) : false
  const primaryAction = () => {
    if (!isCodeLesson) {
      if (currentStep === 'see') setCurrentStep('change')
      if (currentStep === 'change') checkNonCodeAnswer()
      if (currentStep === 'build') completeCurrentLesson()
      return
    }

    if (currentStep === 'see') runSampleCode()
    if (currentStep === 'change') checkUserChange()
    if (currentStep === 'run') runAcceptedCode()
    if (currentStep === 'fix') checkDebugFix()
    if (currentStep === 'build') completeCurrentLesson()
  }

  const stepMeta: Record<LessonStep, { label: string; title: string; body: string }> = {
    see: {
      label: getContent('learn.viewer.step.see.label', 'Quan sát'),
      title: getContent('learn.viewer.step.see.title', 'Đọc nhanh, chạy mẫu, hiểu output'),
      body: getContent(
        'learn.viewer.step.see.body',
        'Bắt đầu bằng cách quan sát code mẫu và trả lời các mini checkpoint nếu có. Editor đang khóa để bạn không phải đoán mò ngay từ đầu.',
      ),
    },
    change: {
      label: getContent('learn.viewer.step.change.label', 'Thay đổi'),
      title: getContent('learn.viewer.step.change.title', 'Sửa đúng một yêu cầu nhỏ'),
      body: getContent(
        'learn.viewer.step.change.body',
        'Giờ hãy sửa code theo nhiệm vụ. Bấm Kiểm tra thay đổi để Loopy chấm bằng checker deterministic.',
      ),
    },
    run: {
      label: getContent('learn.viewer.step.run.label', 'Chạy thử'),
      title: getContent('learn.viewer.step.run.title', 'Xem output thật của code đã pass'),
      body: getContent('learn.viewer.step.run.body', 'Bước này chỉ execute code và hiển thị output. Nó không thay thế bước Kiểm tra.'),
    },
    fix: {
      label: getContent('learn.viewer.step.fix.label', 'Sửa lỗi'),
      title: getContent('learn.viewer.step.fix.title', 'Debug một lỗi nhỏ trong terminal'),
      body: getContent('learn.viewer.step.fix.body', 'Đọc lỗi trong terminal, sửa code rồi kiểm tra lại. Đây là bài tập đọc lỗi thực tế cho người mới.'),
    },
    build: {
      label: getContent('learn.viewer.step.build.label', 'Hoàn thành'),
      title: getContent('learn.viewer.step.build.title', 'Lưu tiến độ bài học'),
      body: getContent('learn.viewer.step.build.body', 'Bạn đã đi qua quan sát, sửa, chạy thử và debug. Bấm Lưu hoàn thành để backend ghi nhận progress.'),
    },
  }

  return (
    <div className="loopy-page flex h-full min-h-0 flex-col overflow-hidden">
      <header className="loopy-surface shrink-0 border-b loopy-border px-4 py-3 backdrop-blur md:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3 md:gap-4">
            <button
              onClick={() => navigate(`/library/${language}`)}
              className="inline-flex items-center gap-2 rounded-xl border loopy-border loopy-surface-soft px-3 py-2 text-xs font-black loopy-muted shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-teal/40 hover:text-brand-ocean"
            >
              <FiArrowLeft className="h-4 w-4" /> {getContent('learn.viewer.back_to_journey', 'Journey')}
            </button>

            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-teal">
                {currentChapter?.title || language.toUpperCase()}
              </div>
              <h1 className="max-w-[560px] truncate text-base font-black tracking-tight md:text-xl">
                {currentLesson?.title || getContent('learn.viewer.lesson_fallback_title', 'Bài học')}
              </h1>
            </div>

            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-400/25 bg-green-400/10 px-3 py-1 text-xs font-black text-green-300 shadow-lg shadow-green-950/20">
                <FiCheckCircle className="h-3.5 w-3.5" /> {getContent('learn.viewer.completed_badge', 'Đã hoàn thành')}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar rounded-2xl border loopy-border loopy-surface-soft p-1 shadow-sm">
              {visibleFlowSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <div className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all whitespace-nowrap ${currentStep === step ? 'bg-brand-teal text-slate-950 shadow-[0_3px_0_#0b889c]' : 'loopy-muted hover:bg-brand-teal/10'}`}>
                    {stepMeta[step].label}
                  </div>
                  {index < visibleFlowSteps.length - 1 && <FiChevronRight className="h-4 w-4 shrink-0 text-slate-700" />}
                </div>
              ))}
            </div>
            <div className="hidden min-w-[240px] md:block">
              <div className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>{getContent('learn.viewer.progress_label', 'Journey progress')}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-brand-teal transition-all" style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid flex-1 min-h-0 border-t loopy-border lg:grid-cols-[430px,minmax(0,1fr)]">
        <aside className="loopy-surface min-h-0 overflow-y-auto border-b loopy-border p-4 lg:border-b-0 lg:border-r md:p-5">
          <div className="space-y-4">
            <section className="rounded-[1.35rem] border border-brand-teal/35 bg-brand-teal/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                <FiInfo className="h-4 w-4" /> {getContent('learn.viewer.current_task_label', 'Việc cần làm ngay')}
              </div>
              <h2 className="text-2xl font-black leading-tight tracking-tight">{stepMeta[currentStep].title}</h2>
              <p className="mt-3 text-sm leading-6 loopy-muted">{stepMeta[currentStep].body}</p>
              <div className="mt-4 rounded-2xl border border-brand-teal/20 loopy-surface p-3 text-xs leading-5 loopy-muted shadow-sm">
                <span className="font-bold">{getContent('learn.viewer.rules_label', 'Luật Loopy:')} </span>
                {getContent(
                  'learn.viewer.rules_body',
                  'Chạy thử chỉ xem output. Kiểm tra mới chấm bằng rule/test case. Hoàn thành chỉ lưu sau khi backend xác nhận.',
                )}
              </div>
            </section>

            <section className="loopy-surface-soft rounded-[1.35rem] border loopy-border p-4 shadow-sm">
              <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                {getContent('learn.viewer.lesson_content_label', 'Nội dung bài học')}
              </div>
              <div className="prose max-w-none text-sm leading-relaxed loopy-muted prose-p:my-2 prose-strong:text-current prose-code:rounded-md prose-code:bg-brand-teal/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:text-brand-ocean">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentStep === 'see'
                    ? currentLesson?.description
                    : currentStep === 'fix'
                      ? currentLesson?.debugTaskDescription || currentLesson?.taskDescription
                      : currentLesson?.taskDescription}
                </ReactMarkdown>
              </div>
            </section>

            {isCodeLesson && currentStep === 'see' && currentLesson?.steps && currentLesson.steps.length > 0 && (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                      {getContent('learn.viewer.mini_checkpoint_title', 'Mini checkpoint')}
                    </div>
                    <p className="mt-1 text-xs leading-5 loopy-muted">
                      {getContent('learn.viewer.mini_checkpoint_desc', 'Trả lời nhanh để chắc bạn hiểu trước khi code.')}
                    </p>
                  </div>
                </div>
                {currentLesson.steps.map(step => (
                  <LessonStepCard
                    key={step.id}
                    step={step as LessonStepItem}
                    answer={stepAnswers[step.id]}
                    feedback={stepFeedback[step.id]}
                    onAnswerChange={(stepId, value) => setStepAnswers(current => ({ ...current, [stepId]: value }))}
                    onCheck={checkLessonStep}
                  />
                ))}
              </section>
            )}

            {(showHint || currentStep === 'build') && (
              <section className="rounded-2xl border border-brand-teal/20 bg-brand-teal/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-brand-teal">
                  <FiAlertCircle className="h-4 w-4" /> {getContent('learn.viewer.hints_title', 'Gợi ý cho bạn')}
                </div>
                {visibleHintLevels.length > 0 ? (
                  <div className="space-y-3">
                    {visibleHintLevels.map((hint, index) => (
                      <div key={`${currentLesson?.id}-hint-${index}`} className="loopy-surface rounded-xl border loopy-border p-3 shadow-sm">
                        <div className="mb-1 text-xs font-bold uppercase tracking-wide text-brand-cyan">
                          {getContent('learn.viewer.hint_count', 'Gợi ý {current}/{total}')
                            .replace('{current}', String(index + 1))
                            .replace('{total}', String(hintLevels.length))}
                        </div>
                        <p className="text-sm leading-6 loopy-muted">{hint}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm loopy-muted">{getContent('learn.viewer.no_authored_hint', 'Bài này chưa có gợi ý sẵn.')}</p>
                )}

                {currentLesson?.commonMistakes && (
                  <p className="mt-3 border-t border-brand-teal/10 pt-3 text-xs italic loopy-muted">
                    {getContent('learn.viewer.common_mistakes_prefix', 'Lỗi thường gặp:')} {currentLesson.commonMistakes}
                  </p>
                )}

                {canRevealMoreHints && (
                  <button
                    onClick={() => setRevealedHintLevel(level => Math.min(level + 1, hintLevels.length))}
                    className="mt-3 text-xs font-bold text-brand-teal underline transition-colors hover:text-brand-cyan"
                  >
                    {getContent('learn.viewer.reveal_more_hint', 'Tôi vẫn bị kẹt, cho gợi ý tiếp theo')}
                  </button>
                )}

                {aiHint && (
                  <div className="mt-3 border-t border-brand-teal/10 pt-3">
                    <div className="mb-1 text-xs font-bold text-brand-cyan">{getContent('learn.viewer.ai_hint_title', '🤖 AI Mentor chỉ gợi ý')}</div>
                    <p className="text-sm leading-6 loopy-muted">{aiHint}</p>
                  </div>
                )}

                {!aiHint && !canRevealMoreHints && (
                  <button
                    onClick={async () => {
                      if (!currentLesson || isLoadingHint) return
                      setIsLoadingHint(true)
                      try {
                        const res = await api.requestLessonHint(currentLesson.id, code, language, {
                          starterCode: currentLesson.starterCode,
                          lessonTitle: currentLesson.title,
                          lessonDescription: currentLesson.description,
                          outputLogs,
                        })
                        if (res.success && res.data?.hint) setAiHint(res.data.hint)
                      } catch {
                        setAiHint(getContent('learn.viewer.ai_unavailable', 'Hiện tại AI Mentor đang bận. Hãy thử đọc lại các gợi ý bên trên nhé!'))
                      } finally {
                        setIsLoadingHint(false)
                      }
                    }}
                    disabled={isLoadingHint}
                    className="mt-3 text-xs font-bold text-brand-cyan underline transition-colors hover:text-brand-teal disabled:opacity-50"
                  >
                    {isLoadingHint
                      ? getContent('learn.viewer.ai_busy', '🤖 Đang suy nghĩ...')
                      : getContent('learn.viewer.ask_ai_hint', '🤖 Hỏi AI Mentor gợi ý thêm')}
                  </button>
                )}
              </section>
            )}
          </div>
        </aside>

        <section className="grid min-h-0 bg-[color:var(--loopy-output)] xl:grid-cols-[minmax(0,1fr),minmax(320px,0.82fr)]">
          <div className="grid min-h-0 grid-rows-[auto,minmax(0,1fr),auto] border-b border-white/10 xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#171524] px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                <FiTerminal className="h-4 w-4 text-brand-teal" /> {isCodeLesson ? `script.${language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'js'}` : 'answer.panel'}
              </div>
              {isCodeLesson ? (
                !hasLessons || currentStep === 'see' ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">read-only</span>
                ) : (
                  <span className="rounded-full border border-brand-teal/25 bg-brand-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-teal">editable</span>
                )
              ) : (
                <span className="rounded-full border border-brand-teal/25 bg-brand-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-teal">interactive</span>
              )}
            </div>

            {isCodeLesson ? (
              <div className="loopy-editor-bg min-h-0">
                <CodeEditor
                  value={code}
                  onChange={setCode}
                  editable={hasLessons && currentStep !== 'see'}
                  language={language}
                />
              </div>
            ) : (
              <div className="min-h-0 overflow-y-auto bg-[#111827] p-5">
                <div className="mx-auto flex min-h-full max-w-2xl flex-col justify-center">
                  <div className="rounded-[1.5rem] border border-white/10 bg-white/[0.04] p-5 shadow-2xl shadow-black/20">
                    <div className="mb-3 text-[10px] font-black uppercase tracking-[0.24em] text-brand-cyan">
                      {lessonType.replace('_', ' ')}
                    </div>
                    <h2 className="text-2xl font-black text-white">{primaryInteractionStep?.title || currentLesson?.title}</h2>
                    <p className="mt-3 text-sm leading-6 text-slate-300">{primaryInteractionStep?.prompt || currentLesson?.taskDescription}</p>

                    {primaryInteractionStep && ['multiple_choice', 'true_false'].includes(primaryInteractionStep.type) && (
                      <div className="mt-5 grid gap-3">
                        {(primaryInteractionStep.options?.length ? primaryInteractionStep.options : ['Đúng', 'Sai']).map(option => {
                          const value = String(option)
                          const selected = stepAnswers[primaryInteractionStep.id] === value
                          return (
                            <button
                              key={value}
                              onClick={() => setStepAnswers(current => ({ ...current, [primaryInteractionStep.id]: value }))}
                              className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all ${
                                selected
                                  ? 'border-brand-teal bg-brand-teal/15 text-brand-cyan shadow-lg shadow-brand-teal/10'
                                  : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-brand-teal/40 hover:bg-brand-teal/10'
                              }`}
                            >
                              {value}
                            </button>
                          )
                        })}
                      </div>
                    )}

                    {primaryInteractionStep && primaryInteractionStep.type === 'fill_blank' && (
                      <input
                        value={stepAnswers[primaryInteractionStep.id] || ''}
                        onChange={event => setStepAnswers(current => ({ ...current, [primaryInteractionStep.id]: event.target.value }))}
                        className="mt-5 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-bold text-white outline-none transition-colors placeholder:text-slate-500 focus:border-brand-teal"
                        placeholder="Nhập đáp án"
                      />
                    )}

                    {primaryInteractionStep && primaryInteractionStep.type === 'short_answer' && (
                      <textarea
                        value={stepAnswers[primaryInteractionStep.id] || ''}
                        onChange={event => setStepAnswers(current => ({ ...current, [primaryInteractionStep.id]: event.target.value }))}
                        className="mt-5 min-h-[140px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-bold text-white outline-none transition-colors placeholder:text-slate-500 focus:border-brand-teal"
                        placeholder="Viết câu trả lời ngắn của bạn"
                      />
                    )}

                    {primaryInteractionStep && stepFeedback[primaryInteractionStep.id] && (
                      <div className={`mt-5 rounded-2xl border p-4 text-sm font-bold leading-6 ${stepFeedback[primaryInteractionStep.id].passed ? 'border-green-400/30 bg-green-400/10 text-green-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-100'}`}>
                        {stepFeedback[primaryInteractionStep.id].message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-white/10 bg-[#171524] p-3 md:flex-row md:items-center md:justify-between">
              <div className="min-w-0">
                <div className="text-[10px] font-black uppercase tracking-[0.2em] text-brand-teal">
                  {getContent('learn.viewer.editor_current_step', 'Bước hiện tại')}
                </div>
                <p className="mt-1 truncate text-xs text-slate-400">{stepMeta[currentStep].body}</p>
              </div>
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                {isCodeLesson && (currentStep === 'change' || currentStep === 'fix') && (
                  <button
                    onClick={() => setShowHint(true)}
                    className="rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition-all hover:-translate-y-0.5 hover:border-brand-teal/30 hover:text-brand-teal"
                  >
                    {getContent('learn.viewer.editor_hint_button', 'Gợi ý')}
                  </button>
                )}
                <button
                  onClick={primaryAction}
                  disabled={isGrading}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-xs font-black text-slate-950 shadow-[0_4px_0_#0b889c] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 active:translate-y-1 active:shadow-[0_1px_0_#0b889c]"
                >
                  {isGrading
                    ? getContent('learn.action.processing', 'Đang xử lý...')
                    : !isCodeLesson
                      ? currentStep === 'see' ? 'Bắt đầu trả lời' : currentStep === 'change' ? 'Kiểm tra câu trả lời' : 'Lưu hoàn thành'
                      : getContent(`learn.action.${currentStep}.label`, currentStep === 'see' ? 'Chạy code mẫu' : currentStep === 'change' ? 'Kiểm tra thay đổi' : currentStep === 'run' ? 'Chạy thử output' : currentStep === 'fix' ? 'Kiểm tra sửa lỗi' : 'Lưu hoàn thành')}
                </button>
              </div>
            </div>
          </div>

          <aside className="grid min-h-0 grid-rows-[auto,minmax(0,1fr)] bg-[color:var(--loopy-output)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-cyan">
                  {getContent('learn.viewer.output_check_title', 'Output / Kiểm tra')}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {getContent('learn.viewer.output_check_desc', 'Chạy thử xem output. Kiểm tra mới validate đúng/sai.')}
                </p>
              </div>
              {gradingResult && (
                <button
                  onClick={() => setGradingResult(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 transition-colors hover:border-brand-teal/30 hover:text-white"
                  aria-label={getContent('learn.viewer.close_check_result', 'Đóng kết quả kiểm tra')}
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="min-h-0 overflow-y-auto p-3">
              <div className="mb-3 min-h-[160px]">
                <Terminal logs={outputLogs} onClear={() => setOutputLogs([])} isActive={hasLessons} />
              </div>

              <div ref={gradingResultRef} className="rounded-2xl border border-white/10 bg-slate-950/70 p-3">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-cyan">
                      {getContent('learn.viewer.check_result_title', 'Kết quả kiểm tra')}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">{getContent('learn.viewer.checker_desc', 'Checker deterministic của Loopy.')}</p>
                  </div>
                </div>

                {isGrading && <GradingSkeleton />}
                {!isGrading && !gradingResult && (
                  <div className="flex h-[120px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 text-center text-xs leading-5 text-slate-500">
                    {getContent('learn.viewer.no_check_result', 'Chưa có kết quả kiểm tra. Khi bấm “Kiểm tra”, kết quả sẽ hiện ở panel này.')}
                  </div>
                )}
                {gradingResult && (
                  <div className="max-h-[420px] overflow-y-auto pr-1">
                    <div className="mb-3 rounded-xl border border-brand-teal/20 bg-brand-teal/[0.07] p-3 text-xs leading-5 text-slate-300">
                      <span className="font-bold text-brand-teal">{getContent('learn.viewer.check_lesson_prefix', 'Kiểm tra bài:')} </span>
                      {checkMethodLabel || getCheckMethodLabel()}
                    </div>
                    <GradingResults result={gradingResult} onRetry={checkUserChange} isGrading={isGrading} />
                  </div>
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
      <footer className="loopy-nav-bg grid shrink-0 grid-cols-[1fr,auto,1fr] items-center border-t loopy-border px-4 py-2.5 text-white">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-brand-teal">
          {currentChapter?.title || language.toUpperCase()}
        </div>
        <div className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-1.5 text-xs font-black text-slate-200">
          {currentIndex >= 0 ? currentIndex + 1 : 0}/{lessons.length}
        </div>
        <div className="flex justify-end gap-2">
          <button
            onClick={goToPreviousLesson}
            disabled={!previousLesson}
            className="rounded-xl border border-brand-teal px-4 py-2 text-xs font-black text-brand-teal transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:border-white/10 disabled:text-slate-600 disabled:hover:translate-y-0"
          >
            {getContent('learn.viewer.back_button', 'Back')}
          </button>
          <button
            onClick={goToNextLesson}
            disabled={!nextLesson || !isCompleted}
            className="rounded-xl bg-brand-teal px-4 py-2 text-xs font-black text-slate-950 shadow-[0_3px_0_#0b889c] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:bg-slate-700 disabled:text-slate-500 disabled:shadow-none disabled:hover:translate-y-0 active:translate-y-1 active:shadow-[0_1px_0_#0b889c]"
          >
            {getContent('learn.viewer.next_button', 'Next')}
          </button>
        </div>
      </footer>

      {showCelebration && (
        <div className="border-t border-green-400/20 bg-gradient-to-r from-green-500/10 via-brand-teal/10 to-green-500/10 p-4">
          <div className="flex flex-col gap-4 rounded-2xl border border-green-500/20 bg-slate-950/70 p-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-4">
              <div className="text-4xl">🎉</div>
              <div>
                <h3 className="text-lg font-black text-green-300">{getContent('learn.viewer.progress_saved', 'Tuyệt vời! Progress đã được lưu.')}</h3>
                <p className="mt-1 text-sm text-slate-400">
                  {currentLesson?.isAhaLesson
                    ? getContent('learn.viewer.aha_complete_desc', 'Đây chính là khoảnh khắc Aha! đầu tiên của bạn. Hành trình vừa bắt đầu!')
                    : getContent('learn.viewer.complete_desc', 'Tiếp tục phát huy nhé, bạn đang tiến bộ rất nhanh!')}
                </p>
              </div>
            </div>
            {nextLesson && (
              <button
                onClick={goToNextLesson}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-teal px-5 py-3 font-black text-[#07111f] transition-all hover:-translate-y-0.5"
              >
                {getContent('learn.viewer.next_lesson_button', 'Bài tiếp theo')} <FiArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LessonViewer
