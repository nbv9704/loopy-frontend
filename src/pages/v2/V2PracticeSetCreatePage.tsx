import React, { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  ArrowLeft,
  AlertTriangle,
  CheckCircle,
  CheckSquare,
  Copy,
  HelpCircle,
  Plus,
  Save,
  Search,
  Settings,
  TextCursorInput,
  Trash2,
  X,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import SEO from '../../components/common/SEO'
import { V2PublicShell } from '../../components/v2/V2PublicShell'
import { LoadingScreen } from '../../components/v2/LoadingScreen'
import { useAuth } from '../../contexts/AuthContext'
import { useContentPreloader } from '../../hooks/useContentPreloader'
import { api } from '../../lib/api'
import { practiceService } from '../../services/practice.service'
import type { PracticeQuestion, PracticeSet } from '../../types/practice.types'

type QuestionType = 'true_false' | 'multiple_choice' | 'multiple_select' | 'fill_blank'
type BuilderMode = 'preview' | 'editor'

type QuestionDraft = {
  id: string
  type: QuestionType
  title: string
  prompt: string
  options: string[]
  correctAnswer: string
  correctAnswers: string[]
  explanation: string
  points: number
}

type LibraryQuestion = {
  set: PracticeSet
  question: PracticeQuestion
}

type LanguageOption = {
  id: string
  label: string
}

const typeMeta: Record<QuestionType, { label: string; shortLabel: string; icon: typeof HelpCircle }> = {
  true_false: { label: 'True or False', shortLabel: 'TRUE / FALSE', icon: HelpCircle },
  multiple_choice: { label: 'Multiple questions', shortLabel: 'MULTIPLE CHOICE', icon: CheckCircle },
  multiple_select: { label: 'Multiple selects', shortLabel: 'MULTIPLE SELECT', icon: CheckSquare },
  fill_blank: { label: 'Fill in the blanks', shortLabel: 'FILL IN THE BLANKS', icon: TextCursorInput },
}

const fallbackLanguages: LanguageOption[] = [
  { id: 'javascript', label: 'JavaScript' },
  { id: 'python', label: 'Python' },
  { id: 'cpp', label: 'C++' },
]

const normalizeModerationText = (value: string) =>
  value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

const findBannedKeywords = (values: string[], keywords: string[]) => {
  const normalizedText = normalizeModerationText(values.filter(Boolean).join(' '))
  if (!normalizedText.trim() || !keywords.length) return []

  return keywords.filter(keyword => {
    const pattern = new RegExp(`(^|[^a-z0-9])${keyword}([^a-z0-9]|$)`, 'i')
    return pattern.test(normalizedText)
  })
}

const ModerationWarning: React.FC<{ matches: string[] }> = ({ matches }) => {
  if (!matches.length) return null

  return (
    <div className="mt-4 flex items-start gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold leading-6 text-amber-900">
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
      <div>
        <div className="font-black">Content warning</div>
        <div>Found restricted keyword{matches.length > 1 ? 's' : ''}: {matches.join(', ')}. Please revise this content before publishing.</div>
      </div>
    </div>
  )
}

const newQuestion = (type: QuestionType = 'multiple_choice'): QuestionDraft => ({
  id: crypto.randomUUID(),
  type,
  title: '',
  prompt: '',
  options: ['', '', '', ''],
  correctAnswer: '',
  correctAnswers: [],
  explanation: '',
  points: 1,
})

const parseAnswerArray = (value?: string | null) => {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(item => String(item)).filter(Boolean) : []
  } catch {
    return value.split('|').map(item => item.trim()).filter(Boolean)
  }
}

const fromPracticeQuestion = (question: PracticeQuestion): QuestionDraft => ({
  id: crypto.randomUUID(),
  type: question.type as QuestionType,
  title: question.title || '',
  prompt: question.prompt,
  options: question.type === 'true_false' ? ['true', 'false', '', ''] : [...(question.options || []), '', '', '', ''].slice(0, 4),
  correctAnswer: question.type === 'multiple_select' ? '' : question.correctAnswer || '',
  correctAnswers: question.type === 'multiple_select' ? parseAnswerArray(question.correctAnswer) : [],
  explanation: question.explanation || '',
  points: question.points || 1,
})

const V2PracticeSetCreatePage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { setId } = useParams<{ setId: string }>()
  const { user, loading: authLoading } = useAuth()
  const isAdmin = user?.isAdmin === true
  const [initialLoading, setInitialLoading] = useState(!!setId)
  const [bannedKeywords, setBannedKeywords] = useState<string[]>([])

  useEffect(() => {
    api.getPublicModerationKeywords().then(res => {
      if (res.success && res.data) {
        setBannedKeywords(res.data)
      }
    }).catch(console.error)
  }, [])
  const { i18n } = useTranslation()
  const [mode, setMode] = useState<BuilderMode>('preview')
  const [saving, setSaving] = useState(false)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [editorQuestion, setEditorQuestion] = useState<QuestionDraft>(newQuestion())
  const [libraryKeyword, setLibraryKeyword] = useState('')
  const [libraryLoading, setLibraryLoading] = useState(false)
  const [libraryResults, setLibraryResults] = useState<LibraryQuestion[]>([])
  const [languageOptions, setLanguageOptions] = useState<LanguageOption[]>(fallbackLanguages)
  const [setForm, setSetForm] = useState({
    title: 'Untitled Quiz',
    description: '',
    topic: '',
    languageId: 'javascript',
    difficulty: 'easy' as 'easy' | 'medium' | 'hard',
    visibility: 'public' as 'public' | 'private' | 'unlisted' | 'official',
    status: 'published' as 'draft' | 'published',
    requirementCount: '',
  })
  const [settingsDraft, setSettingsDraft] = useState(setForm)
  const [questions, setQuestions] = useState<QuestionDraft[]>([])

  const contentKeys = useMemo(() => [
    'nav.learn',
    'nav.playground',
    'nav.practice',
    'nav.docs',
    'nav.settings',
    'nav.logout',
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
    let mounted = true
    const loadLanguages = async () => {
      try {
        const response = await api.getLanguages()
        const rawLanguages = Array.isArray(response.data)
          ? response.data
          : (response.data as { languages?: Array<{ id: string; name?: string; display_name?: string }> } | undefined)?.languages || []
        const mappedLanguages = rawLanguages
          .map(language => ({
            id: language.id,
            label: language.display_name || language.name || language.id,
          }))
          .filter(language => language.id)
        if (mounted && mappedLanguages.length) setLanguageOptions(mappedLanguages)
      } catch {
        if (mounted) setLanguageOptions(fallbackLanguages)
      }
    }

    loadLanguages()
    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: location } })
    }
  }, [authLoading, location, navigate, user])

  useEffect(() => {
    if (!setId || !user) return

    let mounted = true
    const loadExistingSet = async () => {
      try {
        const data = await practiceService.getSet(setId)
        if (!mounted) return

        const formState = {
          title: data.title,
          description: data.description || '',
          topic: data.topic || '',
          languageId: data.languageId || 'javascript',
          difficulty: data.difficulty as any,
          visibility: data.visibility as any,
          status: data.status as any,
          requirementCount: data.requirements?.count?.toString() || '',
        }

        setSetForm(formState)
        setSettingsDraft(formState)

        if (data.questions) {
          setQuestions(data.questions.map(q => fromPracticeQuestion(q)))
        }
      } catch (error) {
        toast.error('Unable to load set')
        navigate('/practice/my-sets')
      } finally {
        if (mounted) setInitialLoading(false)
      }
    }

    loadExistingSet()

    return () => { mounted = false }
  }, [setId, user, navigate])

  useEffect(() => {
    if (!libraryKeyword.trim()) {
      setLibraryResults([])
      return
    }

    let mounted = true
    const timeout = window.setTimeout(async () => {
      setLibraryLoading(true)
      try {
        const results = await practiceService.searchQuestions(libraryKeyword)
        if (mounted) setLibraryResults(results)
      } finally {
        if (mounted) setLibraryLoading(false)
      }
    }, 350)

    return () => {
      mounted = false
      window.clearTimeout(timeout)
    }
  }, [libraryKeyword])

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

  const totalPoints = questions.reduce((sum, question) => sum + question.points, 0)
  const settingsModerationMatches = useMemo(() => findBannedKeywords([
    settingsDraft.title,
    settingsDraft.description,
    settingsDraft.topic,
  ], bannedKeywords), [settingsDraft.description, settingsDraft.title, settingsDraft.topic, bannedKeywords])
  const setModerationMatches = useMemo(() => findBannedKeywords([
    setForm.title,
    setForm.description,
    setForm.topic,
    ...questions.flatMap(question => [
      question.title,
      question.prompt,
      question.explanation,
      question.correctAnswer,
      ...question.correctAnswers,
      ...question.options,
    ]),
  ], bannedKeywords), [questions, setForm.description, setForm.title, setForm.topic, bannedKeywords])
  const editorModerationMatches = useMemo(() => findBannedKeywords([
    editorQuestion.title,
    editorQuestion.prompt,
    editorQuestion.explanation,
    editorQuestion.correctAnswer,
    ...editorQuestion.correctAnswers,
    ...editorQuestion.options,
  ], bannedKeywords), [editorQuestion, bannedKeywords])

  const openSettings = () => {
    setSettingsDraft(setForm)
    setSettingsOpen(true)
  }

  const saveSettings = () => {
    if (settingsModerationMatches.length) {
      toast.error('Settings contain restricted keywords')
      return
    }
    setSetForm(settingsDraft)
    setSettingsOpen(false)
  }

  const updateEditor = (patch: Partial<QuestionDraft>) => {
    setEditorQuestion(current => ({ ...current, ...patch }))
  }

  const updateEditorType = (type: QuestionType) => {
    setEditorQuestion(current => ({
      ...current,
      type,
      correctAnswer: '',
      correctAnswers: [],
      options: type === 'true_false' ? ['true', 'false', '', ''] : current.options,
    }))
  }

  const updateOption = (optionIndex: number, value: string) => {
    setEditorQuestion(current => {
      const previousValue = current.options[optionIndex]
      const options = [...current.options]
      options[optionIndex] = value
      const previousTrimmed = previousValue.trim()
      const nextTrimmed = value.trim()
      return {
        ...current,
        options,
        correctAnswer: current.correctAnswer === previousTrimmed ? nextTrimmed : current.correctAnswer,
        correctAnswers: current.correctAnswers
          .map(answer => (answer === previousTrimmed ? nextTrimmed : answer))
          .filter(Boolean),
      }
    })
  }

  const toggleCorrectAnswer = (option: string) => {
    const normalizedOption = option.trim()
    if (!normalizedOption) return
    setEditorQuestion(current => {
      const exists = current.correctAnswers.includes(normalizedOption)
      return {
        ...current,
        correctAnswers: exists
          ? current.correctAnswers.filter(answer => answer !== normalizedOption)
          : [...current.correctAnswers, normalizedOption],
      }
    })
  }

  const markSingleCorrectAnswer = (option: string) => {
    const normalizedOption = option.trim()
    if (!normalizedOption) return
    updateEditor({ correctAnswer: normalizedOption })
  }

  const validateQuestion = (question: QuestionDraft) => {
    if (!question.prompt.trim()) throw new Error('Question needs a prompt')

    if (question.type === 'true_false' && !['true', 'false'].includes(question.correctAnswer)) {
      throw new Error('Choose True or False as the correct answer')
    }

    if (question.type === 'multiple_choice' || question.type === 'multiple_select') {
      const options = question.options.map(option => option.trim()).filter(Boolean)
      if (options.length < 2 || options.length > 4) throw new Error('Question needs 2-4 answer options')

      if (question.type === 'multiple_choice' && !options.includes(question.correctAnswer.trim())) {
        throw new Error('Choose one correct answer matching an option')
      }

      if (question.type === 'multiple_select') {
        const correctAnswers = question.correctAnswers.map(answer => answer.trim()).filter(Boolean)
        if (correctAnswers.length < 2 || correctAnswers.some(answer => !options.includes(answer))) {
          throw new Error('Choose at least 2 correct answers matching options')
        }
      }
    }

    if (question.type === 'fill_blank' && !question.correctAnswer.trim()) {
      throw new Error('Fill in the correct blank answer')
    }
  }

  const saveQuestion = () => {
    try {
      validateQuestion(editorQuestion)
      if (editorModerationMatches.length) {
        toast.error('Question contains restricted keywords')
        return
      }
      if (questions.length >= 30 && !editingQuestionId) {
        toast.error('Maximum 30 questions per set')
        return
      }

      setQuestions(current => {
        if (editingQuestionId) {
          return current.map(question => (question.id === editingQuestionId ? editorQuestion : question))
        }
        return [...current, editorQuestion]
      })
      setEditingQuestionId(null)
      setEditorQuestion(newQuestion())
      setMode('preview')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save question')
    }
  }

  const editQuestion = (question: QuestionDraft) => {
    setEditingQuestionId(question.id)
    setEditorQuestion(question)
    setMode('editor')
  }

  const addLibraryQuestion = (question: PracticeQuestion) => {
    if (questions.length >= 30) {
      toast.error('Maximum 30 questions per set')
      return
    }
    setQuestions(current => [...current, fromPracticeQuestion(question)])
    toast.success('Question added')
  }

  const buildPayloadQuestions = () => questions.map((question, index) => {
    validateQuestion(question)
    const base = {
      type: question.type,
      title: question.title.trim() || undefined,
      prompt: question.prompt.trim(),
      explanation: question.explanation.trim() || undefined,
      points: question.points,
    }

    if (question.type === 'true_false') {
      return { ...base, options: ['true', 'false'], correctAnswer: question.correctAnswer }
    }

    if (question.type === 'multiple_choice') {
      return {
        ...base,
        options: question.options.map(option => option.trim()).filter(Boolean),
        correctAnswer: question.correctAnswer.trim(),
      }
    }

    if (question.type === 'multiple_select') {
      return {
        ...base,
        options: question.options.map(option => option.trim()).filter(Boolean),
        correctAnswer: JSON.stringify(question.correctAnswers.map(answer => answer.trim()).filter(Boolean)),
      }
    }

    if (!question.correctAnswer.trim()) throw new Error(`Question ${index + 1} needs a blank answer`)
    return { ...base, correctAnswer: question.correctAnswer.trim() }
  })

  const publishSet = async () => {
    if (questions.length === 0) {
      toast.error('Add at least one question before publishing')
      return
    }
    if (setModerationMatches.length) {
      toast.error('This set contains restricted keywords')
      return
    }
    setSaving(true)
    try {
      const payload = {
        title: setForm.title.trim(),
        description: setForm.description.trim() || undefined,
        topic: setForm.topic.trim() || undefined,
        languageId: setForm.languageId,
        difficulty: setForm.difficulty,
        visibility: setForm.visibility,
        status: setForm.status,
        requirements: setForm.requirementCount ? {
          type: 'completed_lessons_count' as const,
          count: parseInt(setForm.requirementCount, 10),
          languageId: setForm.languageId,
        } : undefined,
        questions: buildPayloadQuestions(),
      }

      if (setId) {
        await practiceService.updateSet(setId, payload)
        toast.success('Practice set updated successfully')
        navigate('/practice/my-sets')
      } else {
        await practiceService.createSet(payload)
        toast.success('Practice set created successfully')
        navigate('/practice/sets')
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to save practice set')
    } finally {
      setSaving(false)
    }
  }

  if (contentLoading || initialLoading) return <LoadingScreen message="Loading set builder..." />

  return (
    <V2PublicShell headerContent={headerContent} footerContent={footerContent}>
      <SEO title="Create Practice Set | Loopy" />
      <main className="flex-grow bg-[#f7fbff]">
        {mode === 'editor' ? (
          <section className="min-h-[calc(100vh-73px)] bg-[#f7fbff]">
            <div className="sticky top-[73px] z-30 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex items-center gap-3">
                  <button type="button" onClick={() => setMode('preview')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div className="text-sm font-black text-slate-800">{editingQuestionId ? 'Edit question' : 'Create question'}</div>
                </div>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={saveQuestion} className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-black text-slate-950">
                    <Save className="h-4 w-4" />
                    Save question
                  </button>
                </div>
              </div>
            </div>

            <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr,320px]">
              <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
                <div className="mb-5">
                  <div className="text-xs font-black uppercase tracking-wide text-brand-teal">{typeMeta[editorQuestion.type].label}</div>
                  <h1 className="mt-2 text-2xl font-black text-slate-950">{editingQuestionId ? 'Edit question' : 'Create question'}</h1>
                </div>

                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-800">Question prompt</span>
                  <textarea
                    value={editorQuestion.prompt}
                    onChange={event => updateEditor({ prompt: event.target.value })}
                    placeholder="Type question here"
                    rows={7}
                    className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-4 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-teal focus:bg-white"
                  />
                </label>
                <ModerationWarning matches={editorModerationMatches} />

                {(editorQuestion.type === 'multiple_choice' || editorQuestion.type === 'multiple_select') && (
                  <div className="mt-6">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div>
                        <h2 className="text-sm font-black text-slate-900">Answer options</h2>
                        <p className="mt-1 text-xs font-semibold text-slate-500">Fill 2-4 answers. Empty answers will not be included.</p>
                      </div>
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                        {editorQuestion.options.filter(option => option.trim()).length}/4 filled
                      </span>
                    </div>
                    <div className="space-y-3">
                      {editorQuestion.options.map((option, optionIndex) => {
                        const normalizedOption = option.trim()
                        const canMarkCorrect = Boolean(normalizedOption)
                        const isCorrect = editorQuestion.type === 'multiple_select'
                          ? editorQuestion.correctAnswers.includes(normalizedOption) && canMarkCorrect
                          : editorQuestion.correctAnswer === normalizedOption && canMarkCorrect
                        return (
                          <div key={optionIndex} className={`flex items-center gap-3 rounded-lg border bg-white p-3 transition ${isCorrect ? 'border-brand-teal ring-2 ring-brand-teal/15' : 'border-slate-200'}`}>
                            <button
                              type="button"
                              disabled={!canMarkCorrect}
                              onClick={() => editorQuestion.type === 'multiple_select' ? toggleCorrectAnswer(option) : markSingleCorrectAnswer(option)}
                              className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition disabled:cursor-not-allowed disabled:opacity-35 ${isCorrect
                                  ? 'border-brand-teal bg-brand-teal text-slate-950'
                                  : 'border-slate-300 bg-white text-slate-400 hover:border-brand-teal hover:text-brand-teal'
                                }`}
                              title="Mark correct"
                            >
                              <CheckCircle className={`h-5 w-5 ${isCorrect ? 'fill-current' : ''}`} />
                            </button>
                            <input
                              value={option}
                              onChange={event => updateOption(optionIndex, event.target.value)}
                              placeholder={`Answer ${optionIndex + 1}`}
                              className="min-w-0 flex-1 rounded-md border border-transparent bg-slate-50 px-3 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-teal focus:bg-white"
                            />
                            <span className="hidden text-xs font-black uppercase tracking-wide text-slate-400 sm:inline">
                              {isCorrect ? 'Correct' : canMarkCorrect ? 'Mark' : 'Empty'}
                            </span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {editorQuestion.type === 'true_false' && (
                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    {['true', 'false'].map(value => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => updateEditor({ correctAnswer: value })}
                        className={`flex min-h-[120px] items-center justify-between rounded-lg border-2 px-5 text-left text-xl font-black transition ${editorQuestion.correctAnswer === value
                            ? 'border-brand-teal bg-brand-teal/10 text-slate-950'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-brand-teal/60'
                          }`}
                      >
                        <span>{value === 'true' ? 'True' : 'False'}</span>
                        {editorQuestion.correctAnswer === value && <CheckCircle className="h-6 w-6 fill-brand-teal text-brand-teal" />}
                      </button>
                    ))}
                  </div>
                )}

                {editorQuestion.type === 'fill_blank' && (
                  <label className="mt-6 block rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <span className="mb-2 block text-sm font-black text-slate-800">Correct blank answer</span>
                    <input
                      value={editorQuestion.correctAnswer}
                      onChange={event => updateEditor({ correctAnswer: event.target.value })}
                      placeholder="Type the expected answer"
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-base font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-teal"
                    />
                  </label>
                )}

                {editorQuestion.type === 'multiple_select' && (
                  <div className="mt-4 flex items-center gap-3 text-sm font-black text-slate-700">
                    <span>Multiple correct answers:</span>
                    <span className="rounded-full bg-brand-teal/15 px-3 py-1 text-slate-950">{editorQuestion.correctAnswers.length} selected</span>
                  </div>
                )}

                <label className="mt-6 block">
                  <span className="mb-2 block text-sm font-black text-slate-800">Answer explanation</span>
                  <textarea
                    value={editorQuestion.explanation}
                    onChange={event => updateEditor({ explanation: event.target.value })}
                    rows={3}
                    placeholder="Optional explanation shown after the learner answers."
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-teal focus:bg-white"
                  />
                </label>
              </div>

              <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm lg:sticky lg:top-[145px] lg:self-start">
                <h2 className="text-sm font-black uppercase tracking-wide text-slate-500">Question setup</h2>
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-black text-slate-800">Question type</span>
                  <select value={editorQuestion.type} onChange={event => updateEditorType(event.target.value as QuestionType)} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-black text-slate-800 outline-none focus:border-brand-teal">
                    {(Object.entries(typeMeta) as Array<[QuestionType, typeof typeMeta[QuestionType]]>).map(([type, meta]) => (
                      <option key={type} value={type}>{meta.label}</option>
                    ))}
                  </select>
                </label>
                <label className="mt-4 block">
                  <span className="mb-2 block text-sm font-black text-slate-800">Points</span>
                  <input type="number" min="1" max="100" value={editorQuestion.points} onChange={event => updateEditor({ points: Number(event.target.value) })} className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-black text-slate-800 outline-none focus:border-brand-teal" />
                </label>
                <div className="mt-5 rounded-lg bg-slate-50 p-4 text-sm font-semibold leading-6 text-slate-600">
                  Tick an answer to mark it correct. Empty options stay disabled and will be skipped when saving.
                </div>
              </aside>
            </div>
          </section>
        ) : (
          <section className="min-h-[calc(100vh-73px)]">
            <div className="sticky top-[73px] z-30 border-b border-slate-200 bg-white">
              <div className="flex items-center justify-between gap-4 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <button type="button" onClick={() => navigate('/practice/sets')} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700">
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <input value={setForm.title} onChange={event => setSetForm(current => ({ ...current, title: event.target.value }))} className="min-w-0 rounded-lg border border-slate-200 px-3 py-2 text-sm font-black text-slate-950 outline-none" />
                </div>
                <div className="flex items-center gap-4">
                  <button type="button" onClick={openSettings} className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-700 md:hidden">
                    <Settings className="h-4 w-4" />
                  </button>
                  <button type="button" onClick={openSettings} className="hidden items-center gap-2 text-sm font-black text-slate-700 md:inline-flex">
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <button type="button" onClick={publishSet} disabled={saving} className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-black text-slate-950 disabled:opacity-60">
                    <Save className="h-4 w-4" />
                    {saving ? 'Publishing...' : <span className="font-semibold">{setId ? 'Update Set' : 'Publish Set'}</span>}
                  </button>
                </div>
              </div>
            </div>

            <div className="grid gap-6 px-6 py-8 xl:grid-cols-[1fr,420px]">
              <main>
                <ModerationWarning matches={setModerationMatches} />
                <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                  <div className="text-lg font-black text-slate-800">
                    {questions.length} Questions <span className="mx-3 text-slate-400">•</span> {totalPoints} Points
                  </div>
                  <button type="button" onClick={() => { setEditingQuestionId(null); setEditorQuestion(newQuestion()); setMode('editor') }} className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-800">
                    <Plus className="h-4 w-4" />
                    Create question
                  </button>
                </div>

                {questions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-16 text-center">
                    <h2 className="text-2xl font-black text-slate-950">No questions yet</h2>
                    <p className="mt-2 text-sm font-semibold text-slate-500">Create a question or find one from existing practice sets.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {questions.map((question, index) => (
                      <article key={question.id} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <div className="text-xs font-black uppercase tracking-wide text-slate-500">
                              {String(index + 1).padStart(2, '0')} {typeMeta[question.type].shortLabel} <span className="mx-2">•</span> {question.points}Pt
                            </div>
                            <h3 className="mt-5 text-base font-black text-slate-950">{question.prompt || question.title}</h3>
                          </div>
                          <div className="flex items-center gap-2">
                            <button type="button" onClick={() => setQuestions(current => [...current, { ...question, id: crypto.randomUUID() }])} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                              <Copy className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => setQuestions(current => current.filter(item => item.id !== question.id))} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100">
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <button type="button" onClick={() => editQuestion(question)} className="rounded-lg px-3 py-2 text-sm font-black text-slate-700 hover:bg-slate-100">
                              Edit
                            </button>
                          </div>
                        </div>

                        {(question.type === 'multiple_choice' || question.type === 'multiple_select' || question.type === 'true_false') && (
                          <div className="mt-5 grid gap-3 md:grid-cols-2">
                            {(question.type === 'true_false' ? ['true', 'false'] : question.options.filter(Boolean)).map(option => {
                              const correct = question.type === 'multiple_select' ? question.correctAnswers.includes(option) : question.correctAnswer === option
                              return (
                                <div key={option} className="flex items-center gap-3 text-sm font-semibold text-slate-800">
                                  {correct ? <CheckCircle className="h-5 w-5 fill-emerald-600 text-emerald-600" /> : <span className="h-5 w-5 rounded-full border border-slate-300" />}
                                  {option}
                                </div>
                              )
                            })}
                          </div>
                        )}

                        {question.type === 'fill_blank' && (
                          <div className="mt-5 rounded-lg bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-700">
                            Correct answer: {question.correctAnswer}
                          </div>
                        )}
                      </article>
                    ))}
                  </div>
                )}
              </main>

              <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black text-slate-950">Find questions</h2>
                  <span className="text-xs font-black text-slate-400">From sets</span>
                </div>
                <label className="mt-5 flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-3 shadow-sm">
                  <Search className="h-5 w-5 text-slate-500" />
                  <input value={libraryKeyword} onChange={event => setLibraryKeyword(event.target.value)} placeholder="Search for questions on any topic" className="min-w-0 flex-1 text-sm font-semibold outline-none placeholder:text-slate-400" />
                </label>

                <div className="mt-6 space-y-3">
                  {libraryLoading && <div className="text-sm font-semibold text-slate-500">Searching...</div>}
                  {!libraryLoading && !libraryKeyword.trim() && (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-12 text-center text-sm font-semibold leading-6 text-slate-500">
                      Search existing sets, then add matching questions into this set.
                    </div>
                  )}
                  {!libraryLoading && libraryKeyword.trim() && libraryResults.length === 0 && (
                    <div className="rounded-lg border border-dashed border-slate-200 bg-slate-50 px-4 py-8 text-center text-sm font-semibold text-slate-500">
                      No matching questions found.
                    </div>
                  )}
                  {libraryResults.map(({ set, question }) => (
                    <button key={`${set.id}-${question.id}`} type="button" onClick={() => addLibraryQuestion(question)} className="w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition hover:border-brand-teal/50 hover:shadow-md">
                      <div className="text-[10px] font-black uppercase tracking-wide text-brand-teal">{set.title}</div>
                      <div className="mt-2 text-sm font-black text-slate-950">{question.title || question.prompt}</div>
                      <div className="mt-2 text-xs font-semibold text-slate-500">{typeMeta[question.type as QuestionType]?.label || question.type}</div>
                    </button>
                  ))}
                </div>
              </aside>
            </div>
          </section>
        )}
        {settingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
            <div className="max-h-[calc(100vh-48px)] w-full max-w-2xl overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-2xl">
              <div className="sticky top-0 z-10 flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-5 py-4">
                <div>
                  <div className="text-xs font-black uppercase tracking-wide text-brand-teal">Set settings</div>
                  <h2 className="mt-1 text-xl font-black text-slate-950">Practice set details</h2>
                </div>
                <button type="button" onClick={() => setSettingsOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="space-y-5 px-5 py-5">
                <ModerationWarning matches={settingsModerationMatches} />
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-800">Set title</span>
                  <input
                    value={settingsDraft.title}
                    onChange={event => setSettingsDraft(current => ({ ...current, title: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-teal focus:bg-white"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-800">Description</span>
                  <textarea
                    value={settingsDraft.description}
                    onChange={event => setSettingsDraft(current => ({ ...current, description: event.target.value }))}
                    rows={3}
                    placeholder="Short note about this practice set."
                    className="w-full resize-none rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-teal focus:bg-white"
                  />
                </label>

                <div className="grid gap-4 md:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-slate-800">Topic</span>
                    <input
                      value={settingsDraft.topic}
                      onChange={event => setSettingsDraft(current => ({ ...current, topic: event.target.value }))}
                      placeholder="Arrays, loops, functions..."
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-teal focus:bg-white"
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-slate-800">Language</span>
                    <select
                      value={settingsDraft.languageId}
                      onChange={event => setSettingsDraft(current => ({ ...current, languageId: event.target.value }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-brand-teal"
                    >
                      {languageOptions.map(language => (
                        <option key={language.id} value={language.id}>{language.label}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-slate-800">Difficulty</span>
                    <select
                      value={settingsDraft.difficulty}
                      onChange={event => setSettingsDraft(current => ({ ...current, difficulty: event.target.value as 'easy' | 'medium' | 'hard' }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-brand-teal"
                    >
                      <option value="easy">Easy</option>
                      <option value="medium">Medium</option>
                      <option value="hard">Hard</option>
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-slate-800">Visibility</span>
                    <select
                      value={settingsDraft.visibility}
                      onChange={event => setSettingsDraft(current => ({ ...current, visibility: event.target.value as 'public' | 'private' | 'unlisted' | 'official' }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-brand-teal"
                    >
                      <option value="public">Public</option>
                      <option value="unlisted">Unlisted</option>
                      <option value="private">Private</option>
                      {isAdmin && (
                        <option value="official">Official</option>
                      )}
                    </select>
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-slate-800">Status</span>
                    <select
                      value={settingsDraft.status}
                      onChange={event => setSettingsDraft(current => ({ ...current, status: event.target.value as 'draft' | 'published' }))}
                      className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-800 outline-none focus:border-brand-teal"
                    >
                      <option value="published">Published</option>
                      <option value="draft">Draft</option>
                    </select>
                  </label>
                </div>

                <label className="block rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <span className="mb-2 block text-sm font-black text-slate-800">Required completed lessons</span>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={settingsDraft.requirementCount}
                    onChange={event => setSettingsDraft(current => ({ ...current, requirementCount: event.target.value }))}
                    placeholder="Leave empty for no requirement"
                    className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-brand-teal"
                  />
                  <p className="mt-2 text-xs font-semibold leading-5 text-slate-500">
                    When filled, learners must complete this many lessons in the selected language before starting the set.
                  </p>
                </label>
              </div>

              <div className="sticky bottom-0 flex items-center justify-end gap-3 border-t border-slate-200 bg-white px-5 py-4">
                <button type="button" onClick={() => setSettingsOpen(false)} className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50">
                  Cancel
                </button>
                <button type="button" onClick={saveSettings} className="rounded-lg bg-brand-teal px-4 py-2.5 text-sm font-black text-slate-950">
                  Save settings
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </V2PublicShell>
  )
}

export default V2PracticeSetCreatePage
