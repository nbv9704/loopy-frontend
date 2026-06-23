import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  BookOpenCheck,
  CheckCircle,
  ChevronRight,
  Circle,
  Play,
  Send,
  Trophy,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import SEO from '../components/common/SEO'
import { PublicShell } from '../components/PublicShell'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../contexts/AuthContext'
import { useContentPreloader } from '../hooks/useContentPreloader'
import { practiceService } from '../services/practice.service'
import type { PracticeAttempt, PracticeQuestion, PracticeSet } from '../types/practice.types'

type SubmissionState = {
  isCorrect: boolean
  pointsEarned: number
  testResults?: unknown
}

const getQuestionOptions = (question: PracticeQuestion) => {
  if (question.type === 'true_false') return ['true', 'false']
  return question.options || []
}

const getSelectedAnswers = (value?: string) => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(item => String(item)) : []
  } catch {
    return []
  }
}

const PracticeSetDetailPage: React.FC = () => {
  const { setId } = useParams<{ setId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { i18n } = useTranslation()
  const [set, setSet] = useState<PracticeSet | null>(null)
  const [attempt, setAttempt] = useState<PracticeAttempt | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>({})
  const [submissions, setSubmissions] = useState<Record<string, SubmissionState>>({})
  const [setLoading, setSetLoading] = useState(true)
  const [starting, setStarting] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const contentKeys = useMemo(() => [
    'nav.learn',
    'nav.playground',
    'nav.practice',
    'nav.docs',
    'nav.settings',
    'nav.logout',
    'practice.sets.start',
    'practice.detail.loading',
    'practice.detail.seo_fallback',
    'practice.detail.toast.started',
    'practice.detail.toast.unavailable',
    'practice.detail.toast.choose_one',
    'practice.detail.toast.fill_blank',
    'practice.detail.toast.choose_answer',
    'practice.detail.toast.correct',
    'practice.detail.toast.submitted',
    'practice.detail.toast.submit_error',
    'practice.detail.back_my_sets',
    'practice.detail.back_official_sets',
    'practice.detail.back_sets',
    'practice.detail.not_found',
    'practice.detail.attempt_badge',
    'practice.detail.progress_summary',
    'practice.detail.question_label',
    'practice.detail.completed_title',
    'practice.detail.score_summary',
    'practice.detail.back_overview',
    'practice.detail.question_fallback',
    'practice.detail.points',
    'practice.detail.your_answer',
    'practice.detail.correct',
    'practice.detail.submitted',
    'practice.detail.earned_points',
    'practice.detail.next_question',
    'practice.detail.submitting',
    'practice.detail.submit_answer',
    'practice.detail.question_count',
    'practice.detail.topic',
    'practice.detail.language',
    'practice.detail.starting',
    'footer.aboutLoopy',
    'footer.about',
    'footer.team',
    'footer.contact',
    'footer.resources',
    'footer.docs',
    'footer.blog',
    'footer.faq',
    'footer.description',
    'footer.allRightsReserved',
    'footer.privacy',
    'footer.terms',
  ], [])

  const { content, loading: contentLoading } = useContentPreloader(contentKeys, i18n.language)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: location } })
    }
  }, [authLoading, location, navigate, user])

  useEffect(() => {
    if (!user || !setId) return

    let mounted = true
    const loadSet = async () => {
      setSetLoading(true)
      try {
        const result = await practiceService.getSet(setId)
        if (mounted) setSet(result)
      } catch {
        if (mounted) setSet(null)
      } finally {
        if (mounted) setSetLoading(false)
      }
    }

    loadSet()
    return () => {
      mounted = false
    }
  }, [setId, user])

  const questions = attempt?.questions || set?.questions || []
  const activeQuestion = questions[activeIndex]
  const submittedCount = Object.keys(submissions).length
  const totalQuestions = questions.length
  const earnedPoints = Object.values(submissions).reduce((sum, submission) => sum + submission.pointsEarned, 0)
  const maxPoints = attempt?.maxScore || questions.reduce((sum: number, question: PracticeQuestion) => sum + question.points, 0)
  const isAttemptComplete = Boolean(attempt && totalQuestions > 0 && submittedCount >= totalQuestions)

  const headerContent = {
    'nav.learn': content['nav.learn'],
    'nav.playground': content['nav.playground'],
    'nav.practice': content['nav.practice'],
    'nav.docs': content['nav.docs'],
    'nav.settings': content['nav.settings'],
    'nav.logout': content['nav.logout'],
  }

  const footerContent = {
    'footer.aboutLoopy': content['footer.aboutLoopy'],
    'footer.about': content['footer.about'],
    'footer.team': content['footer.team'],
    'footer.contact': content['footer.contact'],
    'footer.resources': content['footer.resources'],
    'footer.docs': content['footer.docs'],
    'footer.blog': content['footer.blog'],
    'footer.faq': content['footer.faq'],
    'footer.description': content['footer.description'],
    'footer.allRightsReserved': content['footer.allRightsReserved'],
    'footer.privacy': content['footer.privacy'],
    'footer.terms': content['footer.terms'],
  }

  const text = (key: string, fallback: string) => content[key] || fallback
  const formatText = (key: string, fallback: string, values: Record<string, string | number>) =>
    Object.entries(values).reduce((result, [name, value]) => result.replace(`{${name}}`, String(value)), text(key, fallback))

  const handleStart = async () => {
    if (!setId) return
    setStarting(true)
    try {
      const startedAttempt = await practiceService.startAttempt(setId)
      setAttempt(startedAttempt)
      setActiveIndex(0)
      setAnswers({})
      setSubmissions({})
      toast.success(formatText('practice.detail.toast.started', 'Started practice attempt ({count} questions)', { count: startedAttempt.questions?.length || 0 }))
    } catch {
      toast.error(text('practice.detail.toast.unavailable', 'You have not met the requirements, or this practice set is unavailable'))
    } finally {
      setStarting(false)
    }
  }

  const setAnswer = (questionId: string, value: string) => {
    setAnswers(current => ({ ...current, [questionId]: value }))
  }

  const handleSubmitQuestion = async () => {
    if (!attempt || !activeQuestion || submissions[activeQuestion.id]) return
    const rawValue = answers[activeQuestion.id] ?? ''
    const value = rawValue.trim()
    if (activeQuestion.type === 'multiple_select' && getSelectedAnswers(value).length === 0) {
      toast.error(text('practice.detail.toast.choose_one', 'Choose at least one answer first'))
      return
    }
    if (!value) {
      toast.error(activeQuestion.type === 'fill_blank' ? text('practice.detail.toast.fill_blank', 'Fill in the answer before submitting') : text('practice.detail.toast.choose_answer', 'Choose an answer first'))
      return
    }

    setSubmitting(true)
    try {
      const result = await practiceService.submitAnswer(
        attempt.id,
        activeQuestion.id,
        { selectedAnswer: value }
      )
      setAttempt(result.attempt)
      setSubmissions(current => ({
        ...current,
        [activeQuestion.id]: {
          isCorrect: result.submission.isCorrect,
          pointsEarned: result.submission.pointsEarned,
          testResults: result.submission.testResults,
        },
      }))
      toast.success(result.submission.isCorrect ? text('practice.detail.toast.correct', 'Correct answer') : text('practice.detail.toast.submitted', 'Answer submitted'))
    } catch (error) {
      toast.error(error instanceof Error ? error.message : text('practice.detail.toast.submit_error', 'Unable to submit answer'))
    } finally {
      setSubmitting(false)
    }
  }

  const goNext = () => {
    setActiveIndex(index => Math.min(index + 1, totalQuestions - 1))
  }

  if (contentLoading || setLoading) {
    return <LoadingScreen message={text('practice.detail.loading', 'Loading practice set...')} />
  }

  return (
    <PublicShell headerContent={headerContent} footerContent={footerContent}>
      <SEO title={`${set?.title || text('practice.detail.seo_fallback', 'Practice Set')} | Loopy`} description={set?.description || undefined} />
      <main className="flex-grow pb-16 pt-8 md:pt-10">
        <section className="mx-auto max-w-6xl px-6">
          {!attempt && (
            <button
              onClick={() => {
                if (location.state?.from === 'my-sets') navigate('/practice/my-sets')
                else if (location.state?.from === 'official-sets') navigate('/practice/official-sets')
                else navigate('/practice/sets')
              }}
              className="mb-6 inline-flex items-center gap-2 text-sm font-black loopy-muted hover:text-brand-teal"
            >
              <ArrowLeft className="h-4 w-4" />
              {location.state?.from === 'my-sets' 
                ? text('practice.detail.back_my_sets', 'Back to my set library') 
                : location.state?.from === 'official-sets' 
                  ? text('practice.detail.back_official_sets', 'Back to official sets') 
                  : text('practice.detail.back_sets', 'Back to sets')}
            </button>
          )}

          {!set ? (
            <div className="loopy-card rounded-lg border border-dashed px-6 py-12 text-center">
              <h1 className="loopy-heading text-2xl font-black">{text('practice.detail.not_found', 'Practice set not found')}</h1>
            </div>
          ) : attempt ? (
            <div className="grid gap-6 lg:grid-cols-[280px,1fr]">
              <aside className="space-y-4">
                <section className="rounded-lg border loopy-border loopy-surface p-5 shadow-sm">
                  <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-brand-teal">
                    <BookOpenCheck className="h-4 w-4" />
                    {text('practice.detail.attempt_badge', 'Practice attempt')}
                  </div>
                  <h1 className="loopy-heading mt-3 text-xl font-black">{set.title}</h1>
                  <div className="loopy-skeleton mt-4 h-2 overflow-hidden rounded-full">
                    <div
                      className="h-full rounded-full bg-brand-teal transition-all"
                      style={{ width: `${totalQuestions ? (submittedCount / totalQuestions) * 100 : 0}%` }}
                    />
                  </div>
                  <div className="mt-3 text-sm font-bold loopy-muted">
                    {formatText('practice.detail.progress_summary', '{submitted}/{total} submitted · {earned}/{max} points', { submitted: submittedCount, total: totalQuestions, earned: earnedPoints, max: maxPoints })}
                  </div>
                </section>

                <section className="loopy-card rounded-lg border p-4 shadow-sm">
                  <div className="space-y-2">
                    {questions.map((question: PracticeQuestion, index: number) => {
                      const submission = submissions[question.id]
                      const isActive = index === activeIndex
                      return (
                        <button
                          key={question.id}
                          type="button"
                          onClick={() => setActiveIndex(index)}
                          className={`flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition ${
                            isActive ? 'border-brand-teal bg-brand-teal/10' : 'loopy-border loopy-surface hover:border-brand-teal/50'
                          }`}
                        >
                          {submission ? (
                            <CheckCircle className={`h-5 w-5 ${submission.isCorrect ? 'text-emerald-600' : 'text-amber-500'}`} />
                          ) : (
                            <Circle className="h-5 w-5 text-slate-300" />
                          )}
                          <div className="min-w-0">
                            <div className="text-sm font-black loopy-heading">{formatText('practice.detail.question_label', 'Question {index}', { index: index + 1 })}</div>
                            <div className="truncate text-xs font-semibold text-slate-500">{question.type.replace('_', ' ')}</div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </section>
              </aside>

              <section className="min-w-0">
                {isAttemptComplete ? (
                  <div className="loopy-card rounded-lg border p-8 text-center shadow-sm">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-teal/10 text-brand-teal">
                      <Trophy className="h-7 w-7" />
                    </div>
                    <h2 className="loopy-heading mt-4 text-3xl font-black">{text('practice.detail.completed_title', 'Practice completed')}</h2>
                    <p className="loopy-body mt-3 text-base font-semibold">
                      {formatText('practice.detail.score_summary', 'Your score: {earned}/{max} points', { earned: earnedPoints, max: maxPoints })}
                    </p>
                    <button
                      type="button"
                      onClick={() => {
                        setAttempt(null)
                        setActiveIndex(0)
                      }}
                      className="mt-6 rounded-lg border px-5 py-3 text-sm font-black loopy-subtle-button"
                    >
                      {text('practice.detail.back_overview', 'Back to set overview')}
                    </button>
                  </div>
                ) : activeQuestion ? (
                  <div className="loopy-card rounded-lg border shadow-sm">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b loopy-border px-5 py-4">
                      <div>
                        <div className="text-xs font-black uppercase tracking-wide text-brand-teal">
                          {formatText('practice.detail.question_label', 'Question {index}', { index: activeIndex + 1 })} · {activeQuestion.type.replace('_', ' ')}
                        </div>
                        <h2 className="loopy-heading mt-1 text-2xl font-black">{activeQuestion.title || text('practice.detail.question_fallback', 'Practice question')}</h2>
                      </div>
                      <div className="loopy-surface-soft rounded-full px-3 py-1 text-xs font-black loopy-muted">
                        {formatText('practice.detail.points', '{points} points', { points: activeQuestion.points })}
                      </div>
                    </div>

                    <div className="p-5">
                      <p className="loopy-body text-base font-semibold leading-8">{activeQuestion.prompt}</p>

                      {activeQuestion.type === 'fill_blank' ? (
                        <label className="mt-5 block">
                          <span className="mb-2 block text-xs font-black uppercase tracking-wide text-slate-500">{text('practice.detail.your_answer', 'Your answer')}</span>
                          <input
                            value={answers[activeQuestion.id] || ''}
                            onChange={event => setAnswer(activeQuestion.id, event.target.value)}
                            disabled={Boolean(submissions[activeQuestion.id])}
                            className="loopy-surface w-full rounded-lg border loopy-border px-4 py-3 text-base font-semibold outline-none focus:border-brand-teal disabled:opacity-60"
                          />
                        </label>
                      ) : (
                        <div className="mt-5 grid gap-3 md:grid-cols-2">
                          {getQuestionOptions(activeQuestion).map((option: string) => {
                            const selectedAnswers = getSelectedAnswers(answers[activeQuestion.id])
                            const selected = activeQuestion.type === 'multiple_select'
                              ? selectedAnswers.includes(option)
                              : answers[activeQuestion.id] === option
                            const locked = Boolean(submissions[activeQuestion.id])
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => {
                                  if (activeQuestion.type === 'multiple_select') {
                                    const next = selected
                                      ? selectedAnswers.filter(answer => answer !== option)
                                      : [...selectedAnswers, option]
                                    setAnswer(activeQuestion.id, JSON.stringify(next))
                                    return
                                  }
                                  setAnswer(activeQuestion.id, option)
                                }}
                                disabled={locked}
                                className={`rounded-lg border px-4 py-4 text-left text-sm font-black transition ${
                                  selected
                                    ? 'border-brand-teal bg-brand-teal/10 text-[color:var(--loopy-text)]'
                                    : 'loopy-border loopy-surface loopy-muted hover:border-brand-teal/50'
                                } disabled:cursor-not-allowed`}
                              >
                                {option}
                              </button>
                            )
                          })}
                        </div>
                      )}

                      {submissions[activeQuestion.id] && (
                        <div className={`mt-5 rounded-lg border p-4 ${
                          submissions[activeQuestion.id].isCorrect
                            ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                            : 'border-amber-200 bg-amber-50 text-amber-800'
                        }`}>
                          <div className="font-black">
                            {submissions[activeQuestion.id].isCorrect ? text('practice.detail.correct', 'Correct') : text('practice.detail.submitted', 'Submitted')}
                          </div>
                          <div className="mt-1 text-sm font-semibold">
                            {formatText('practice.detail.earned_points', 'Earned {earned}/{points} points.', { earned: submissions[activeQuestion.id].pointsEarned, points: activeQuestion.points })}
                          </div>
                          {activeQuestion.explanation && (
                            <p className="mt-3 text-sm font-semibold leading-6">{activeQuestion.explanation}</p>
                          )}
                        </div>
                      )}

                      <div className="mt-6 flex flex-wrap justify-end gap-3">
                        {submissions[activeQuestion.id] && activeIndex < totalQuestions - 1 && (
                          <button
                            type="button"
                            onClick={goNext}
                            className="inline-flex items-center gap-2 rounded-lg border px-5 py-3 text-sm font-black loopy-subtle-button"
                          >
                            {text('practice.detail.next_question', 'Next question')}
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        )}
                        {!submissions[activeQuestion.id] && (
                          <button
                            type="button"
                            onClick={handleSubmitQuestion}
                            disabled={submitting}
                            className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-60"
                          >
                            <Send className="h-4 w-4" />
                            {submitting ? text('practice.detail.submitting', 'Submitting...') : text('practice.detail.submit_answer', 'Submit answer')}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : null}
              </section>
            </div>
          ) : (
            <>
              <div className="loopy-card rounded-lg border p-6 shadow-sm">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-teal/10 px-3 py-1 text-xs font-black uppercase tracking-wide text-brand-teal">
                  <BookOpenCheck className="h-4 w-4" />
                  {set.difficulty}
                </div>
                <h1 className="loopy-heading text-3xl font-black">{set.title}</h1>
                {set.description && <p className="loopy-body mt-4 text-base font-medium leading-7">{set.description}</p>}
                <div className="mt-6 flex flex-wrap gap-3 text-sm font-bold loopy-muted">
                  <span>{formatText('practice.detail.question_count', '{count} questions', { count: set.questionCount || set.questions?.length || 0 })}</span>
                  {set.topic && <span>{formatText('practice.detail.topic', 'Topic: {topic}', { topic: set.topic })}</span>}
                  {set.languageId && <span>{formatText('practice.detail.language', 'Language: {language}', { language: set.languageId })}</span>}
                </div>
                <button
                  onClick={handleStart}
                  disabled={starting}
                  className="mt-8 inline-flex items-center gap-2 rounded-lg bg-brand-teal px-5 py-3 text-sm font-black text-slate-950 disabled:opacity-60"
                >
                  <Play className="h-4 w-4" />
                  {starting ? text('practice.detail.starting', 'Starting...') : content['practice.sets.start'] || 'Start'}
                </button>
              </div>

              <div className="mt-6 space-y-3">
                {set.questions?.map((question: PracticeQuestion, index: number) => (
                  <div key={question.id} className="loopy-card rounded-lg border p-5 shadow-sm">
                    <div className="mb-2 text-xs font-black uppercase tracking-wide text-brand-teal">
                      {formatText('practice.detail.question_label', 'Question {index}', { index: index + 1 })} · {question.type.replace('_', ' ')}
                    </div>
                    <h2 className="loopy-heading text-lg font-black">{question.title || question.prompt}</h2>
                    {question.title && <p className="loopy-body mt-2 text-sm font-medium leading-6">{question.prompt}</p>}
                  </div>
                ))}
              </div>
            </>
          )}
        </section>
      </main>
    </PublicShell>
  )
}

export default PracticeSetDetailPage
