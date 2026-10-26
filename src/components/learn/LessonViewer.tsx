import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FiX,
  FiInfo,
  FiAlertCircle,
  FiChevronRight,
  FiCheckCircle,
  FiArrowRight,
  FiArrowLeft,
  FiBookOpen,
  FiTerminal,
} from 'react-icons/fi'
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
import { selectedCurriculumPath } from '../../features/journey/curriculum.service'
import { answerOptions, selectPrimaryAnswerStep } from '../../features/learn/answerQuestion'
import { useLessonHint } from '../../features/learn/useLessonHint'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import {
  checkLessonAnswer,
  LessonActionError,
  executeLessonCode,
  saveLessonCompletion,
} from '../../features/learn/lessonActions.service'
import {
  createDebugCode,
  getCheckMethodLabel,
  toLessonGradingResult,
} from '../../features/learn/lessonFlow.model'

type ContentMap = Record<string, string | null | undefined>

interface LessonViewerProps {
  language: string
  initialLessonId?: string
  content?: ContentMap
}

type LessonStep = 'see' | 'change' | 'run' | 'fix' | 'build'

const CONCEPT_ACK_TOKEN = '__loopy_concept_ack__'
const codeLessonTypes = new Set(['code_fix', 'code_build'])
const answerLessonTypes = new Set([
  'concept',
  'true_false',
  'multiple_choice',
  'fill_blank',
  'short_answer',
  'code_output',
])

const LessonViewer: React.FC<LessonViewerProps> = ({ language, initialLessonId, content }) => {
  const { t } = useTranslation()
  const translate = useRef(t)
  translate.current = t
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const {
    lessons,
    chapters,
    loading,
    error: loadError,
    retry: retryLoading,
    activeTab: activeLessonId,
    setActiveTab: setActiveLessonId,
    completedLessons,
    setCompletedLessons,
  } = useLessonData(language, initialLessonId, user?.id, selectedCurriculumPath(user, language))

  const [code, setCode] = useState('')
  const [outputLogs, setOutputLogs] = useState<string[]>([])
  const [gradingResult, setGradingResult] = useState<GradingResult | null>(null)
  const [currentStep, setCurrentStep] = useState<LessonStep>('see')
  const [showHint, setShowHint] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)
  const [revealedHintLevel, setRevealedHintLevel] = useState(1)
  const [checkMethodLabel, setCheckMethodLabel] = useState('')
  const [hasPassedChangeCheck, setHasPassedChangeCheck] = useState(false)
  const [hasPassedDebugCheck, setHasPassedDebugCheck] = useState(false)
  const [completionSubmissionId, setCompletionSubmissionId] = useState<string | null>(null)
  const [requiresReload, setRequiresReload] = useState(false)
  const [stepAnswers, setStepAnswers] = useState<Record<string, string>>({})
  const [stepFeedback, setStepFeedback] = useState<
    Record<string, { passed: boolean; message: string }>
  >({})

  const scopeKey = [
    user?.id,
    language,
    activeLessonId,
    selectedCurriculumPath(user, language),
  ].join(':')
  const { pending: isGrading, run: runAction } = useAsyncAction(scopeKey)
  const isInitialMount = useRef(true)
  const gradingResultRef = useRef<HTMLDivElement>(null)
  const getContent = useCallback(
    (key: string, fallback: string) => content?.[key] || fallback,
    [content]
  )

  const currentLesson = lessons.find(l => l.id === activeLessonId)
  const {
    hint: aiHint,
    error: hintError,
    pending: isLoadingHint,
    ask: askHint,
  } = useLessonHint(scopeKey, {
    lessonId: currentLesson?.id || '',
    code,
    language,
    outputLogs,
  })
  const hasLessons = lessons.length > 0
  const currentChapter = currentLesson
    ? chapters.find(chapter => chapter.id === currentLesson.chapterId)
    : null
  const completedCount = completedLessons.size
  const progressPercent =
    lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0
  const hintLevels = currentLesson
    ? [
        currentLesson.hintLevel1 || currentLesson.hint,
        currentLesson.hintLevel2,
        currentLesson.hintLevel3,
      ].filter((hint): hint is string => Boolean(hint?.trim()))
    : []
  const visibleHintLevels = hintLevels.slice(0, revealedHintLevel)
  const canRevealMoreHints = revealedHintLevel < hintLevels.length
  const inferredQuestion = selectPrimaryAnswerStep(
    currentLesson?.steps || [],
    currentLesson?.lessonType || ''
  )
  const lessonType = currentLesson?.lessonType || inferredQuestion?.type || 'code_fix'
  const primaryInteractionStep = selectPrimaryAnswerStep(currentLesson?.steps || [], lessonType)
  const isCodeLesson = codeLessonTypes.has(lessonType)
  const isAnswerLesson = answerLessonTypes.has(lessonType)
  const visibleFlowSteps: LessonStep[] = isCodeLesson
    ? ['see', 'change', 'run', 'fix', 'build']
    : ['see', 'change', 'build']
  const primaryInteractionType =
    lessonType === 'code_output' ? 'code_output' : primaryInteractionStep?.type || lessonType

  // Find next lesson
  const currentIndex = lessons.findIndex(l => l.id === activeLessonId)
  const previousLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null
  const nextLesson =
    currentIndex >= 0 && currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null

  // Update code and URL when lesson changes
  useEffect(() => {
    if (currentLesson) {
      setCode(currentLesson.starterCode || '')
      setOutputLogs([translate.current('learn.readyToRun')])
      setGradingResult(null)
      setCurrentStep('see')
      setShowHint(false)
      setShowCelebration(false)
      setRevealedHintLevel(1)
      setCheckMethodLabel('')
      setHasPassedChangeCheck(false)
      setHasPassedDebugCheck(false)
      setCompletionSubmissionId(null)
      setRequiresReload(false)
      setStepAnswers({})
      setStepFeedback({})

      if (isInitialMount.current) {
        isInitialMount.current = false
      } else {
        navigate(`/learn/${language}/${currentLesson.lessonId}`, { replace: true })
      }
    }
    // Interface language changes update copy without resetting code, checks or the active step.
  }, [activeLessonId, currentLesson, language, navigate, user?.id])

  useEffect(() => {
    if (gradingResult && gradingResultRef.current) {
      gradingResultRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [gradingResult])

  const runLessonAction = useCallback(
    (action: (isCurrent: () => boolean) => Promise<void>) =>
      requiresReload
        ? Promise.resolve()
        : runAction(action, {
            onSuccess: () => {},
            onError: (error: unknown) => {
              if (error instanceof LessonActionError && error.code === 'LESSON_CHECK_STALE') {
                setRequiresReload(true)
                setCompletionSubmissionId(null)
                setHasPassedDebugCheck(false)
                setGradingResult(null)
                setShowCelebration(false)
              }
              setOutputLogs([
                error instanceof Error
                  ? error.message
                  : 'Không thể xử lý bài học. Vui lòng thử lại.',
              ])
            },
          }),
    [runAction, requiresReload]
  )

  const checkLessonStep = useCallback(
    (step: LessonStepItem) =>
      runLessonAction(async isCurrent => {
        if (!currentLesson) return
        const response = await api.checkLessonStep(
          currentLesson.id,
          step.id,
          stepAnswers[step.id]?.trim()
        )
        if (!isCurrent()) return
        if (!response.success || !response.data || typeof response.data.passed !== 'boolean')
          throw new Error(
            response.error?.message || 'Không thể kiểm tra bước học. Vui lòng thử lại.'
          )
        setStepFeedback(current => ({ ...current, [step.id]: response.data! }))
      }),
    [currentLesson, stepAnswers, runLessonAction]
  )

  const checkNonCodeAnswer = useCallback(
    () =>
      runLessonAction(async isCurrent => {
        if (!currentLesson) return
        if (lessonType !== 'concept' && !primaryInteractionStep)
          throw new Error('Câu hỏi của bài học chưa sẵn sàng. Vui lòng thử lại sau.')
        const feedbackKey = primaryInteractionStep?.id || currentLesson.id
        const answer =
          lessonType === 'concept' ? CONCEPT_ACK_TOKEN : (stepAnswers[feedbackKey] || '').trim()
        if (!answer) throw new Error('Nhập câu trả lời trước khi kiểm tra nhé.')
        setHasPassedDebugCheck(false)
        setCompletionSubmissionId(null)
        setOutputLogs(['> Đang kiểm tra câu trả lời...'])
        const check = await checkLessonAnswer(currentLesson.id, answer, language)
        if (!isCurrent()) return
        setStepFeedback(current => ({
          ...current,
          [feedbackKey]: {
            passed: check.passed,
            message: check.passed
              ? check.output || 'Đúng rồi. Bấm lưu hoàn thành để ghi nhận tiến độ.'
              : check.hint || 'Chưa đúng. Hãy thử lại.',
          },
        }))
        setOutputLogs([
          check.passed
            ? 'Câu trả lời đã đạt yêu cầu. Bước tiếp theo là lưu hoàn thành.'
            : check.hint || 'Câu trả lời chưa đạt yêu cầu.',
        ])
        if (check.passed) {
          setCompletionSubmissionId(check.submissionId!)
          setHasPassedDebugCheck(true)
          setCurrentStep('build')
        }
      }),
    [primaryInteractionStep, currentLesson, stepAnswers, language, lessonType, runLessonAction]
  )

  const runSampleCode = useCallback(
    () =>
      runLessonAction(async isCurrent => {
        if (!currentLesson) return
        setOutputLogs(['> Đang chạy code mẫu...'])
        const result = await executeLessonCode(
          language,
          currentLesson.code || currentLesson.starterCode || code
        )
        if (!isCurrent()) return
        if (result.error) throw new Error(`Code mẫu đang lỗi: ${result.error}`)
        setOutputLogs(
          result.output ? result.output.split('\n') : ['Code mẫu chạy xong nhưng không có output.']
        )
        setCurrentStep('change')
      }),
    [currentLesson, code, language, runLessonAction]
  )

  const checkUserChange = useCallback(
    () =>
      runLessonAction(async isCurrent => {
        if (!currentLesson) return
        setCurrentStep('change')
        setHasPassedChangeCheck(false)
        setHasPassedDebugCheck(false)
        setCompletionSubmissionId(null)
        setGradingResult(null)
        setShowCelebration(false)
        setOutputLogs(['> Đang kiểm tra thay đổi của bạn...'])
        const check = await checkLessonAnswer(currentLesson.id, code, language)
        if (!isCurrent()) return
        setCheckMethodLabel(getCheckMethodLabel(check.validationType, check.gradingMode))
        setGradingResult(toLessonGradingResult(check))
        if (check.passed) {
          setHasPassedChangeCheck(true)
          setCurrentStep('run')
          setOutputLogs(['Thay đổi đã đạt yêu cầu. Bây giờ hãy chạy thử để xem output thật.'])
        } else setOutputLogs([check.hint || 'Thay đổi chưa đạt yêu cầu. Hãy thử lại.'])
      }),
    [currentLesson, code, language, runLessonAction]
  )

  const runAcceptedCode = useCallback(
    () =>
      runLessonAction(async isCurrent => {
        if (!currentLesson) return
        if (!hasPassedChangeCheck) {
          setCurrentStep('change')
          throw new Error('Bạn cần kiểm tra thay đổi đạt yêu cầu trước khi chạy thử bước này.')
        }
        setOutputLogs(['> Đang chạy code đã đạt yêu cầu...'])
        const result = await executeLessonCode(language, code)
        if (!isCurrent()) return
        setCurrentStep('fix')
        if (result.error) throw new Error(`Lỗi khi chạy code: ${result.error}`)
        setOutputLogs(
          result.output ? result.output.split('\n') : ['Code chạy xong nhưng không có output.']
        )
        setCode(currentLesson.debugStarterCode || createDebugCode(code, language))
      }),
    [hasPassedChangeCheck, language, code, currentLesson, runLessonAction]
  )

  const checkDebugFix = useCallback(
    () =>
      runLessonAction(async isCurrent => {
        if (!currentLesson) return
        setHasPassedDebugCheck(false)
        setCompletionSubmissionId(null)
        setOutputLogs(['> Đang kiểm tra phần sửa lỗi...'])
        const result = await executeLessonCode(language, code)
        if (!isCurrent()) return
        if (result.error) throw new Error(`Vẫn còn lỗi: ${result.error}`)
        // A successful execution only proves it ran; check the final code against the lesson too.
        const check = await checkLessonAnswer(currentLesson.id, code, language)
        if (!isCurrent()) return
        setGradingResult(toLessonGradingResult(check))
        setCheckMethodLabel(getCheckMethodLabel(check.validationType, check.gradingMode))
        if (!check.passed) {
          setOutputLogs([check.hint || 'Code chạy được nhưng chưa đạt yêu cầu bài học.'])
          return
        }
        setOutputLogs(result.output ? result.output.split('\n') : ['Phần sửa lỗi đã đạt yêu cầu.'])
        setHasPassedDebugCheck(true)
        setCompletionSubmissionId(check.submissionId!)
        setCurrentStep('build')
      }),
    [language, code, currentLesson, runLessonAction]
  )

  const completeCurrentLesson = useCallback(
    () =>
      runLessonAction(async isCurrent => {
        if (!currentLesson || !hasPassedDebugCheck) return
        const lessonId = currentLesson.id
        setOutputLogs(['> Đang lưu hoàn thành bài học...'])
        if (!completedLessons.has(lessonId)) {
          await saveLessonCompletion(lessonId, completionSubmissionId)
          if (!isCurrent()) return
          setCompletedLessons(previous => new Set(previous).add(lessonId))
          // Progress is committed already; a secondary profile refresh must not delay acknowledgement.
          void refreshUser()
        }
        setShowCelebration(true)
        setOutputLogs(['Bài học đã được lưu là hoàn thành.'])
      }),
    [
      currentLesson,
      hasPassedDebugCheck,
      completionSubmissionId,
      completedLessons,
      setCompletedLessons,
      refreshUser,
      runLessonAction,
    ]
  )

  const changeCode = (value: string) => {
    if (isGrading || value === code) return
    setCode(value)
    setCompletionSubmissionId(null)
    setHasPassedChangeCheck(false)
    setHasPassedDebugCheck(false)
    setGradingResult(null)
    setShowCelebration(false)
    if (currentStep === 'build') setCurrentStep('fix')
    if (currentStep === 'run') setCurrentStep('change')
  }

  const changeAnswer = (stepId: string, value: string) => {
    if (isGrading || stepAnswers[stepId] === value) return
    setStepAnswers(current => ({ ...current, [stepId]: value }))
    setCompletionSubmissionId(null)
    setStepFeedback(current => {
      const next = { ...current }
      delete next[stepId]
      return next
    })
    setHasPassedDebugCheck(false)
    setShowCelebration(false)
    if (currentStep === 'build') setCurrentStep('change')
  }

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
            else if (isAnswerLesson) setCurrentStep('change')
          }
          if (currentStep === 'run') runAcceptedCode()
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [
    currentStep,
    isCodeLesson,
    isAnswerLesson,
    runSampleCode,
    checkUserChange,
    checkNonCodeAnswer,
    runAcceptedCode,
    checkDebugFix,
    completeCurrentLesson,
  ])

  if (loading)
    return (
      <div className="flex items-center justify-center h-full">
        <LoadingSpinner size="lg" />
      </div>
    )

  if (loadError) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <div role="alert" className="text-center">
          <p>{loadError}</p>
          <button
            onClick={retryLoading}
            className="mt-4 rounded-xl bg-brand-teal px-5 py-3 font-bold text-slate-950"
          >
            Thử lại
          </button>
          <button
            onClick={() => navigate(`/library/${language}`)}
            className="ml-3 mt-4 rounded-xl border px-5 py-3 font-bold"
          >
            Quay lại Journey Map
          </button>
        </div>
      </div>
    )
  }

  if (!hasLessons) {
    return (
      <div className="flex h-full items-center justify-center rounded-[2rem] border border-white/10 bg-white/[0.04] p-8 text-center">
        <div className="max-w-md">
          <FiBookOpen className="mx-auto mb-4 h-12 w-12 text-brand-teal" />
          <h1 className="text-2xl font-black text-white">
            {getContent('learn.viewer.empty_title', 'Lộ trình này chưa có bài học')}
          </h1>
          <p className="mt-3 text-slate-400">
            {getContent(
              'learn.viewer.empty_desc',
              'Nội dung đang được chuẩn bị. Bạn có thể quay lại Journey Map để chọn lộ trình khác.'
            )}
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
  const primaryFeedbackKey = primaryInteractionStep?.id || currentLesson?.id || ''
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
        'Bắt đầu bằng cách quan sát code mẫu và trả lời các mini checkpoint nếu có. Editor đang khóa để bạn không phải đoán mò ngay từ đầu.'
      ),
    },
    change: {
      label: getContent('learn.viewer.step.change.label', 'Thay đổi'),
      title: getContent('learn.viewer.step.change.title', 'Sửa đúng một yêu cầu nhỏ'),
      body: getContent(
        'learn.viewer.step.change.body',
        isCodeLesson
          ? 'Giờ hãy sửa code theo nhiệm vụ. Bấm Kiểm tra thay đổi để Loopy chấm bằng checker deterministic.'
          : 'Trả lời câu hỏi của bài học. Bấm Kiểm tra để Loopy chấm đáp án ở backend.'
      ),
    },
    run: {
      label: getContent('learn.viewer.step.run.label', 'Chạy thử'),
      title: getContent('learn.viewer.step.run.title', 'Xem output thật của code đã pass'),
      body: getContent(
        'learn.viewer.step.run.body',
        'Bước này chỉ execute code và hiển thị output. Nó không thay thế bước Kiểm tra.'
      ),
    },
    fix: {
      label: getContent('learn.viewer.step.fix.label', 'Sửa lỗi'),
      title: getContent('learn.viewer.step.fix.title', 'Debug một lỗi nhỏ trong terminal'),
      body: getContent(
        'learn.viewer.step.fix.body',
        'Đọc lỗi trong terminal, sửa code rồi kiểm tra lại. Đây là bài tập đọc lỗi thực tế cho người mới.'
      ),
    },
    build: {
      label: getContent('learn.viewer.step.build.label', 'Hoàn thành'),
      title: getContent('learn.viewer.step.build.title', 'Lưu tiến độ bài học'),
      body: getContent(
        'learn.viewer.step.build.body',
        'Bạn đã đi qua quan sát, sửa, chạy thử và debug. Bấm Lưu hoàn thành để backend ghi nhận progress.'
      ),
    },
  }

  return (
    <div className="loopy-page flex h-full min-h-0 flex-col overflow-y-auto xl:overflow-hidden">
      <header className="loopy-surface shrink-0 border-b loopy-border px-4 py-3 backdrop-blur md:px-5">
        <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 flex-wrap items-center gap-3 md:gap-4">
            <button
              onClick={() => navigate(`/library/${language}`)}
              className="inline-flex items-center gap-2 rounded-xl border loopy-border loopy-surface-soft px-3 py-2 text-xs font-black loopy-muted shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-teal/40 hover:text-brand-ocean"
            >
              <FiArrowLeft className="h-4 w-4" />{' '}
              {getContent('learn.viewer.back_to_journey', 'Journey')}
            </button>

            <div className="min-w-0">
              <div className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-teal">
                {currentChapter?.title || language.toUpperCase()}
              </div>
              <h1 className="max-w-[560px] truncate text-base font-black tracking-tight md:text-xl">
                {currentLesson?.title ||
                  getContent('learn.viewer.lesson_fallback_title', 'Bài học')}
              </h1>
            </div>

            {isCompleted && (
              <span className="inline-flex items-center gap-1.5 rounded-full border border-green-400/25 bg-green-400/10 px-3 py-1 text-xs font-black text-green-300 shadow-lg shadow-green-950/20">
                <FiCheckCircle className="h-3.5 w-3.5" />{' '}
                {getContent('learn.viewer.completed_badge', 'Đã hoàn thành')}
              </span>
            )}
          </div>

          <div className="flex flex-col gap-3 xl:items-end">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar rounded-2xl border loopy-border loopy-surface-soft p-1 shadow-sm">
              {visibleFlowSteps.map((step, index) => (
                <div key={step} className="flex items-center gap-2">
                  <div
                    className={`rounded-xl px-3 py-1.5 text-xs font-black transition-all whitespace-nowrap ${currentStep === step ? 'bg-brand-teal text-slate-950 shadow-[0_3px_0_#0b889c]' : 'loopy-muted hover:bg-brand-teal/10'}`}
                  >
                    {stepMeta[step].label}
                  </div>
                  {index < visibleFlowSteps.length - 1 && (
                    <FiChevronRight className="h-4 w-4 shrink-0 text-slate-700" />
                  )}
                </div>
              ))}
            </div>
            <div className="hidden min-w-[240px] md:block">
              <div className="mb-1 flex justify-between text-[10px] font-bold uppercase tracking-widest text-slate-400">
                <span>{getContent('learn.viewer.progress_label', 'Journey progress')}</span>
                <span>{progressPercent}%</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-white/10">
                <div
                  className="h-full rounded-full bg-brand-teal transition-all"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 flex-none min-h-0 border-t loopy-border lg:grid-cols-[430px_minmax(0,1fr)] xl:flex-1">
        <aside className="loopy-surface min-h-0 overflow-y-auto border-b loopy-border p-4 lg:border-b-0 lg:border-r md:p-5">
          <div className="space-y-4">
            <section className="rounded-[1.35rem] border border-brand-teal/35 bg-brand-teal/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                <FiInfo className="h-4 w-4" />{' '}
                {getContent('learn.viewer.current_task_label', 'Việc cần làm ngay')}
              </div>
              <h2 className="text-2xl font-black leading-tight tracking-tight">
                {stepMeta[currentStep].title}
              </h2>
              <p className="mt-3 text-sm leading-6 loopy-muted">{stepMeta[currentStep].body}</p>
              <div className="mt-4 rounded-2xl border border-brand-teal/20 loopy-surface p-3 text-xs leading-5 loopy-muted shadow-sm">
                <span className="font-bold">
                  {getContent('learn.viewer.rules_label', 'Luật Loopy:')}{' '}
                </span>
                {getContent(
                  'learn.viewer.rules_body',
                  'Chạy thử chỉ xem output. Kiểm tra mới chấm bằng rule/test case. Hoàn thành chỉ lưu sau khi backend xác nhận.'
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

            {isCodeLesson &&
              currentStep === 'see' &&
              currentLesson?.steps &&
              currentLesson.steps.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                        {getContent('learn.viewer.mini_checkpoint_title', 'Mini checkpoint')}
                      </div>
                      <p className="mt-1 text-xs leading-5 loopy-muted">
                        {getContent(
                          'learn.viewer.mini_checkpoint_desc',
                          'Trả lời nhanh để chắc bạn hiểu trước khi code.'
                        )}
                      </p>
                    </div>
                  </div>
                  {currentLesson.steps.map(step => (
                    <LessonStepCard
                      key={step.id}
                      step={step as LessonStepItem}
                      answer={stepAnswers[step.id]}
                      feedback={stepFeedback[step.id]}
                      onAnswerChange={changeAnswer}
                      disabled={isGrading}
                      onCheck={checkLessonStep}
                    />
                  ))}
                </section>
              )}

            {(showHint || currentStep === 'build') && (
              <section className="rounded-2xl border border-brand-teal/20 bg-brand-teal/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-brand-teal">
                  <FiAlertCircle className="h-4 w-4" />{' '}
                  {getContent('learn.viewer.hints_title', 'Gợi ý cho bạn')}
                </div>
                {visibleHintLevels.length > 0 ? (
                  <div className="space-y-3">
                    {visibleHintLevels.map((hint, index) => (
                      <div
                        key={`${currentLesson?.id}-hint-${index}`}
                        className="loopy-surface rounded-xl border loopy-border p-3 shadow-sm"
                      >
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
                  <p className="text-sm loopy-muted">
                    {getContent('learn.viewer.no_authored_hint', 'Bài này chưa có gợi ý sẵn.')}
                  </p>
                )}

                {currentLesson?.commonMistakes && (
                  <p className="mt-3 border-t border-brand-teal/10 pt-3 text-xs italic loopy-muted">
                    {getContent('learn.viewer.common_mistakes_prefix', 'Lỗi thường gặp:')}{' '}
                    {currentLesson.commonMistakes}
                  </p>
                )}

                {canRevealMoreHints && (
                  <button
                    onClick={() =>
                      setRevealedHintLevel(level => Math.min(level + 1, hintLevels.length))
                    }
                    className="mt-3 text-xs font-bold text-brand-teal underline transition-colors hover:text-brand-cyan"
                  >
                    {getContent(
                      'learn.viewer.reveal_more_hint',
                      'Tôi vẫn bị kẹt, cho gợi ý tiếp theo'
                    )}
                  </button>
                )}

                {aiHint && (
                  <div className="mt-3 border-t border-brand-teal/10 pt-3">
                    <div className="mb-1 text-xs font-bold text-brand-cyan">
                      {getContent('learn.viewer.ai_hint_title', '🤖 AI Mentor chỉ gợi ý')}
                    </div>
                    <p className="text-sm leading-6 loopy-muted">{aiHint}</p>
                  </div>
                )}

                {hintError && (
                  <p role="alert" className="mt-3 text-sm loopy-muted">
                    {hintError}
                  </p>
                )}
                {!aiHint && !canRevealMoreHints && (
                  <button
                    onClick={() => void askHint()}
                    disabled={isLoadingHint}
                    className="mt-3 text-xs font-bold text-brand-cyan underline transition-colors hover:text-brand-teal disabled:opacity-50"
                  >
                    {isLoadingHint
                      ? getContent('learn.viewer.ai_busy', '🤖 Đang suy nghĩ...')
                      : hintError
                        ? 'Thử lại gợi ý AI'
                        : getContent('learn.viewer.ask_ai_hint', '🤖 Hỏi AI Mentor gợi ý thêm')}
                  </button>
                )}
              </section>
            )}
          </div>
        </aside>

        <section className="grid grid-cols-1 min-h-0 min-w-0 grid-rows-[minmax(360px,auto)_minmax(240px,auto)] bg-[color:var(--loopy-output)] xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.82fr)] xl:grid-rows-1">
          <div className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)_auto] border-b border-white/10 xl:border-b-0 xl:border-r">
            <div className="flex items-center justify-between border-b border-white/10 bg-[#171524] px-4 py-2.5">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                <FiTerminal className="h-4 w-4 text-brand-teal" />{' '}
                {isCodeLesson
                  ? `script.${language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : 'js'}`
                  : 'answer.panel'}
              </div>
              {isCodeLesson ? (
                !hasLessons || currentStep === 'see' ? (
                  <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-500">
                    read-only
                  </span>
                ) : (
                  <span className="rounded-full border border-brand-teal/25 bg-brand-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-teal">
                    editable
                  </span>
                )
              ) : (
                <span className="rounded-full border border-brand-teal/25 bg-brand-teal/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-brand-teal">
                  interactive
                </span>
              )}
            </div>

            {isCodeLesson ? (
              <div className="loopy-editor-bg min-h-0">
                <CodeEditor
                  value={code}
                  onChange={changeCode}
                  editable={hasLessons && currentStep !== 'see' && !isGrading}
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
                    <h2 className="text-2xl font-black text-white">
                      {primaryInteractionStep?.title || currentLesson?.title}
                    </h2>
                    <p className="mt-3 text-sm leading-6 text-slate-300">
                      {primaryInteractionStep?.prompt || currentLesson?.taskDescription}
                    </p>

                    {lessonType === 'concept' && (
                      <div className="mt-5 rounded-2xl border border-brand-teal/25 bg-brand-teal/10 p-4 text-sm font-bold leading-6 text-brand-cyan">
                        Đọc phần nội dung bên trái. Khi đã hiểu ý chính, bấm “Kiểm tra câu trả lời”
                        để Loopy ghi nhận xác nhận ở backend.
                      </div>
                    )}

                    {primaryInteractionStep &&
                      ['multiple_choice', 'true_false'].includes(primaryInteractionType) && (
                        <div className="mt-5 grid gap-3">
                          {answerOptions(
                            primaryInteractionType,
                            primaryInteractionStep.options
                          ).map(option => {
                            const value = option.value
                            const selected = stepAnswers[primaryFeedbackKey] === value
                            return (
                              <button
                                key={value}
                                disabled={isGrading}
                                onClick={() => changeAnswer(primaryFeedbackKey, value)}
                                className={`rounded-2xl border px-4 py-3 text-left text-sm font-bold transition-all ${
                                  selected
                                    ? 'border-brand-teal bg-brand-teal/15 text-brand-cyan shadow-lg shadow-brand-teal/10'
                                    : 'border-white/10 bg-white/[0.03] text-slate-300 hover:border-brand-teal/40 hover:bg-brand-teal/10'
                                }`}
                              >
                                {option.label}
                              </button>
                            )
                          })}
                        </div>
                      )}

                    {primaryInteractionType === 'fill_blank' && (
                      <input
                        value={stepAnswers[primaryFeedbackKey] || ''}
                        disabled={isGrading}
                        aria-label="Câu trả lời"
                        onChange={event => changeAnswer(primaryFeedbackKey, event.target.value)}
                        className="mt-5 w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-bold text-white outline-none transition-colors placeholder:text-slate-500 focus:border-brand-teal"
                        placeholder="Nhập đáp án"
                      />
                    )}

                    {['short_answer', 'code_output'].includes(primaryInteractionType) && (
                      <textarea
                        value={stepAnswers[primaryFeedbackKey] || ''}
                        disabled={isGrading}
                        aria-label="Câu trả lời"
                        onChange={event => changeAnswer(primaryFeedbackKey, event.target.value)}
                        className="mt-5 min-h-[140px] w-full rounded-2xl border border-white/10 bg-slate-950/70 px-4 py-3 text-sm font-bold text-white outline-none transition-colors placeholder:text-slate-500 focus:border-brand-teal"
                        placeholder={
                          lessonType === 'code_output'
                            ? 'Nhập output bạn dự đoán'
                            : 'Viết câu trả lời ngắn của bạn'
                        }
                      />
                    )}

                    {primaryFeedbackKey && stepFeedback[primaryFeedbackKey] && (
                      <div
                        className={`mt-5 rounded-2xl border p-4 text-sm font-bold leading-6 ${stepFeedback[primaryFeedbackKey].passed ? 'border-green-400/30 bg-green-400/10 text-green-200' : 'border-amber-400/30 bg-amber-400/10 text-amber-100'}`}
                      >
                        {stepFeedback[primaryFeedbackKey].message}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 border-t border-white/10 bg-[#171524] p-3">
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
                  onClick={requiresReload ? retryLoading : primaryAction}
                  disabled={isGrading}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-xs font-black text-slate-950 shadow-[0_4px_0_#0b889c] transition-all hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 active:translate-y-1 active:shadow-[0_1px_0_#0b889c]"
                >
                  {isGrading
                    ? getContent('learn.action.processing', 'Đang xử lý...')
                    : requiresReload
                      ? 'Tải lại bài học'
                      : !isCodeLesson
                        ? currentStep === 'see'
                          ? 'Bắt đầu trả lời'
                          : currentStep === 'change'
                            ? 'Kiểm tra câu trả lời'
                            : 'Lưu hoàn thành'
                        : getContent(
                            `learn.action.${currentStep}.button`,
                            currentStep === 'see'
                              ? 'Chạy code mẫu'
                              : currentStep === 'change'
                                ? 'Kiểm tra thay đổi'
                                : currentStep === 'run'
                                  ? 'Chạy thử output'
                                  : currentStep === 'fix'
                                    ? 'Kiểm tra sửa lỗi'
                                    : 'Lưu hoàn thành'
                          )}
                </button>
              </div>
            </div>
          </div>

          <aside className="grid min-h-0 min-w-0 grid-rows-[auto_minmax(0,1fr)] bg-[color:var(--loopy-output)]">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
              <div>
                <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-cyan">
                  {getContent('learn.viewer.output_check_title', 'Output / Kiểm tra')}
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  {getContent(
                    'learn.viewer.output_check_desc',
                    'Chạy thử xem output. Kiểm tra mới validate đúng/sai.'
                  )}
                </p>
              </div>
              {gradingResult && (
                <button
                  onClick={() => setGradingResult(null)}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/10 bg-white/[0.03] text-slate-400 transition-colors hover:border-brand-teal/30 hover:text-white"
                  aria-label={getContent(
                    'learn.viewer.close_check_result',
                    'Đóng kết quả kiểm tra'
                  )}
                >
                  <FiX className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="min-h-0 overflow-y-auto p-3">
              <div className="mb-3 min-h-[160px]">
                <Terminal
                  logs={outputLogs}
                  onClear={() => setOutputLogs([])}
                  isActive={hasLessons}
                />
              </div>

              <div
                ref={gradingResultRef}
                className="rounded-2xl border border-white/10 bg-slate-950/70 p-3"
              >
                <div className="mb-3 flex items-center justify-between gap-3">
                  <div>
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-cyan">
                      {getContent('learn.viewer.check_result_title', 'Kết quả kiểm tra')}
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {getContent('learn.viewer.checker_desc', 'Checker deterministic của Loopy.')}
                    </p>
                  </div>
                </div>

                {isGrading && <GradingSkeleton />}
                {!isGrading && !gradingResult && (
                  <div className="flex h-[120px] items-center justify-center rounded-xl border border-dashed border-white/10 bg-white/[0.02] px-4 text-center text-xs leading-5 text-slate-500">
                    {getContent(
                      'learn.viewer.no_check_result',
                      'Chưa có kết quả kiểm tra. Khi bấm “Kiểm tra”, kết quả sẽ hiện ở panel này.'
                    )}
                  </div>
                )}
                {gradingResult && (
                  <div className="max-h-[420px] overflow-y-auto pr-1">
                    <div className="mb-3 rounded-xl border border-brand-teal/20 bg-brand-teal/[0.07] p-3 text-xs leading-5 text-slate-300">
                      <span className="font-bold text-brand-teal">
                        {getContent('learn.viewer.check_lesson_prefix', 'Kiểm tra bài:')}{' '}
                      </span>
                      {checkMethodLabel || getCheckMethodLabel()}
                    </div>
                    <GradingResults
                      result={gradingResult}
                      onRetry={checkUserChange}
                      isGrading={isGrading}
                    />
                  </div>
                )}
              </div>
            </div>
          </aside>
        </section>
      </div>
      <footer className="loopy-nav-bg grid shrink-0 grid-cols-[1fr_auto_1fr] items-center border-t loopy-border px-4 py-2.5 text-white">
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
                <h3 className="text-lg font-black text-green-300">
                  {getContent('learn.viewer.progress_saved', 'Tuyệt vời! Progress đã được lưu.')}
                </h3>
                <p className="mt-1 text-sm text-slate-400">
                  {currentLesson?.isAhaLesson
                    ? getContent(
                        'learn.viewer.aha_complete_desc',
                        'Đây chính là khoảnh khắc Aha! đầu tiên của bạn. Hành trình vừa bắt đầu!'
                      )
                    : getContent(
                        'learn.viewer.complete_desc',
                        'Tiếp tục phát huy nhé, bạn đang tiến bộ rất nhanh!'
                      )}
                </p>
              </div>
            </div>
            {nextLesson && (
              <button
                onClick={goToNextLesson}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-teal px-5 py-3 font-black text-[#07111f] transition-all hover:-translate-y-0.5"
              >
                {getContent('learn.viewer.next_lesson_button', 'Bài tiếp theo')}{' '}
                <FiArrowRight className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default LessonViewer
