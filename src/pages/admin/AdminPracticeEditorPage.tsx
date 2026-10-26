import AdminEditorSkeleton from '../../components/admin/AdminEditorSkeleton'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminButton from '../../components/admin/AdminButton'
import AdminSectionNav from '../../components/admin/AdminSectionNav'
import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Pencil,
  PlusCircle,
  Save,
  Trash2,
} from 'lucide-react'
import { adminPracticeEditorService } from '../../features/admin-practice/editor.service'
import {
  normalizePracticeWrite,
  type readPracticeAuthoring,
} from '../../features/practice/practiceWrite'
import { usePracticeWrite } from '../../features/practice/usePracticeWrite'
import { PracticeSaveRecovery } from '../../features/practice/PracticeSaveRecovery'
import { getAdminErrorMessage } from '../../services/admin/errors'
import EditorLoadError from '../../components/admin/EditorLoadError'

type QuestionType = 'true_false' | 'multiple_choice' | 'multiple_select' | 'fill_blank'
type Difficulty = 'easy' | 'medium' | 'hard'
type Visibility = 'public' | 'private' | 'unlisted' | 'official'
type Status = 'draft' | 'published' | 'archived'

interface PracticeQuestion {
  id?: string
  type: QuestionType
  title?: string
  prompt: string
  options?: string[]
  correctAnswer?: string | string[] | boolean
  explanation?: string
  points?: number
  orderIndex?: number
}

interface PracticeSetForm {
  id?: string
  title: string
  description: string
  topic: string
  languageId: string
  difficulty: Difficulty
  visibility: Visibility
  status: Status
}

const emptySet: PracticeSetForm = {
  title: '',
  description: '',
  topic: '',
  languageId: '',
  difficulty: 'medium',
  visibility: 'official',
  status: 'draft',
}

const emptyQuestion: PracticeQuestion = {
  type: 'multiple_choice',
  title: '',
  prompt: '',
  options: ['', '', ''],
  correctAnswer: '',
  explanation: '',
  points: 10,
}

const normalizeQuestion = (
  question: ReturnType<typeof readPracticeAuthoring>['questions'][number],
  index: number
): PracticeQuestion => ({
  id: question.id,
  type: question.type || 'multiple_choice',
  title: question.title || '',
  prompt: question.prompt || '',
  options:
    question.type === 'true_false'
      ? ['true', 'false']
      : Array.isArray(question.options)
        ? question.options
        : ['', '', ''],
  correctAnswer:
    question.type === 'multiple_select'
      ? parseMultipleSelectAnswer(question.correctAnswer)
      : question.type === 'true_false'
        ? question.correctAnswer.toLowerCase()
        : question.correctAnswer,
  explanation: question.explanation || '',
  points: question.points ?? 10,
  orderIndex: question.orderIndex ?? index,
})

const resetQuestionForType = (type: QuestionType): PracticeQuestion => ({
  ...emptyQuestion,
  type,
  options: type === 'true_false' ? ['true', 'false'] : type === 'fill_blank' ? [] : ['', '', ''],
  correctAnswer: type === 'true_false' ? 'true' : type === 'multiple_select' ? [] : '',
})

function parseMultipleSelectAnswer(value: unknown): string[] {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (typeof value !== 'string') return []

  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed.map(String).filter(Boolean) : []
  } catch {
    return value
      .split('|')
      .map(answer => answer.trim())
      .filter(Boolean)
  }
}

function normalizeCorrectAnswer(question: PracticeQuestion): string {
  if (question.type === 'multiple_select') {
    const answers = Array.isArray(question.correctAnswer) ? question.correctAnswer : []
    return JSON.stringify(answers.map(answer => String(answer).trim()).filter(Boolean))
  }

  if (question.type === 'true_false') {
    return String(question.correctAnswer ?? '').toLowerCase()
  }

  return String(question.correctAnswer || '').trim()
}

const AdminPracticeEditorForm = ({ id }: { id?: string }) => {
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [practiceSet, setPracticeSet] = useState<PracticeSetForm>(emptySet)
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [requirements, setRequirements] = useState<Record<string, unknown>>({})
  const [editingQuestion, setEditingQuestion] = useState<PracticeQuestion>(emptyQuestion)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const write = usePracticeWrite(id || 'new')
  const saving = write.pending
  const blocked = write.blocked
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadRevision, setLoadRevision] = useState(0)

  useEffect(() => {
    if (isNew || !id) {
      setPracticeSet(emptySet)
      setQuestions([])
      setRequirements({})
      setLoading(false)
      return
    }

    const controller = new AbortController()

    const loadPracticeSet = async () => {
      setLoading(true)
      setLoadError(null)
      try {
        const data = await adminPracticeEditorService.get(id, controller.signal)
        if (controller.signal.aborted) return

        setPracticeSet({
          id: data.id,
          title: data.title || '',
          description: data.description || '',
          topic: data.topic || '',
          languageId: data.languageId || '',
          difficulty: data.difficulty || 'medium',
          visibility: data.visibility || 'official',
          status: data.status || 'draft',
        })
        setQuestions((data.questions || []).map(normalizeQuestion))
        setRequirements(data.requirements || {})
      } catch (err) {
        if (!controller.signal.aborted) {
          setLoadError(getAdminErrorMessage(err, 'Không thể tải practice set'))
        }
      } finally {
        if (!controller.signal.aborted) setLoading(false)
      }
    }

    void loadPracticeSet()

    return () => {
      controller.abort()
    }
  }, [id, isNew, loadRevision])

  const qualityIssues = useMemo(() => {
    const issues: string[] = []
    if (!practiceSet.title.trim()) issues.push('Thiếu title')
    if (!practiceSet.topic.trim()) issues.push('Thiếu topic')
    if (questions.length === 0) issues.push('Chưa có câu hỏi')
    return issues
  }, [practiceSet.title, practiceSet.topic, questions.length])

  const updateSet = (patch: Partial<PracticeSetForm>) => {
    setPracticeSet(current => ({ ...current, ...patch }))
  }

  const resetQuestion = (nextOrder = questions.length + 1) => {
    setEditingQuestion({ ...emptyQuestion, orderIndex: nextOrder })
    setEditingIndex(null)
  }

  const saveSet = () => {
    setError(null)
    setMessage(null)

    if (!practiceSet.title.trim()) {
      setError('Title là bắt buộc.')
      return
    }
    if (questions.length === 0) {
      setError('Cần ít nhất một câu hỏi trước khi lưu practice set.')
      return
    }

    const payloadInput = {
      title: practiceSet.title,
      description: practiceSet.description,
      topic: practiceSet.topic,
      languageId: practiceSet.languageId || undefined,
      difficulty: practiceSet.difficulty,
      visibility: practiceSet.visibility,
      status: practiceSet.status,
      requirements,
      questions: questions.map((question, index) => ({
        ...question,
        options: question.options?.filter(option => option.trim()) || [],
        correctAnswer: normalizeCorrectAnswer(question),
        points: Number(question.points),
        orderIndex: index,
      })),
    }

    try {
      const payload = normalizePracticeWrite(payloadInput)
      void write.save(
        () => adminPracticeEditorService.save(payload, isNew ? undefined : id),
        payload,
        isNew ? undefined : id,
        savedId => {
          setMessage('Đã lưu practice set.')
          setPracticeSet(current => ({ ...current, id: savedId }))
          if (isNew) navigate(`/admin/practice/${savedId}`, { replace: true })
        },
        err => setError(getAdminErrorMessage(err, 'Không thể lưu practice set'))
      )
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Không thể lưu practice set'))
    }
  }
  const saveQuestion = () => {
    setSavingQuestion(true)
    setError(null)
    setMessage(null)

    try {
      if (!editingQuestion.prompt.trim()) {
        setError('Prompt câu hỏi là bắt buộc.')
        return
      }
      if (
        editingQuestion.type === 'multiple_choice' &&
        !String(editingQuestion.correctAnswer || '').trim()
      ) {
        setError('Multiple choice cần chọn đáp án đúng.')
        return
      }
      if (
        editingQuestion.type === 'multiple_select' &&
        (!Array.isArray(editingQuestion.correctAnswer) || editingQuestion.correctAnswer.length < 2)
      ) {
        setError('Multiple select cần ít nhất hai đáp án đúng.')
        return
      }
      if (
        editingQuestion.type === 'fill_blank' &&
        !String(editingQuestion.correctAnswer || '').trim()
      ) {
        setError('Fill blank cần đáp án đúng.')
        return
      }

      const nextQuestion = {
        ...editingQuestion,
        points: Number(editingQuestion.points),
      }
      normalizePracticeWrite({
        title: 'Question draft',
        questions: [{ ...nextQuestion, correctAnswer: normalizeCorrectAnswer(nextQuestion) }],
      })
      if (editingIndex === null && questions.length >= 30) {
        setError('Mỗi bộ bài có tối đa 30 câu hỏi.')
        return
      }

      setQuestions(current => {
        if (editingIndex !== null) {
          return current.map((question, index) =>
            index === editingIndex ? { ...nextQuestion, orderIndex: index } : question
          )
        }
        return [...current, { ...nextQuestion, orderIndex: current.length }]
      })
      resetQuestion(questions.length + 2)
      setMessage('Đã cập nhật bản nháp câu hỏi. Bấm Lưu practice set để lưu bộ bài.')
    } catch (err) {
      setError(getAdminErrorMessage(err, 'Câu hỏi chưa hợp lệ. Hãy kiểm tra lại.'))
    } finally {
      setSavingQuestion(false)
    }
  }

  const editQuestion = (question: PracticeQuestion, index: number) => {
    setEditingQuestion({ ...question, orderIndex: index })
    setEditingIndex(index)
  }

  const deleteQuestion = (index: number) => {
    if (editingIndex === index) {
      resetQuestion(questions.length)
    } else {
      setEditingIndex(current => (current !== null && current > index ? current - 1 : current))
    }
    setQuestions(current =>
      current
        .filter((_, itemIndex) => itemIndex !== index)
        .map((question, nextIndex) => ({ ...question, orderIndex: nextIndex }))
    )
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    if (targetIndex < 0 || targetIndex >= questions.length) return
    setEditingIndex(current =>
      current === index ? targetIndex : current === targetIndex ? index : current
    )
    setQuestions(current => {
      const next = [...current]
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next.map((question, nextIndex) => ({ ...question, orderIndex: nextIndex }))
    })
  }

  const toggleMultipleSelectAnswer = (option: string) => {
    const currentAnswers = Array.isArray(editingQuestion.correctAnswer)
      ? editingQuestion.correctAnswer
      : []
    const nextAnswers = currentAnswers.includes(option)
      ? currentAnswers.filter(answer => answer !== option)
      : [...currentAnswers, option]
    setEditingQuestion(current => ({ ...current, correctAnswer: nextAnswers }))
  }

  if (loading) return <AdminEditorSkeleton />
  if (loadError)
    return (
      <EditorLoadError
        message={loadError}
        onRetry={() => setLoadRevision(value => value + 1)}
        backTo="/admin/practice"
      />
    )

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title={isNew ? 'Tạo practice set' : 'Chỉnh practice set'}
        eyebrow="Practice editor"
        description="Quản lý thông tin bộ luyện tập và soạn câu hỏi; Lưu practice set để ghi toàn bộ thay đổi."
        leading={
          <AdminButton
            size="icon"
            className="mt-1"
            onClick={() => navigate('/admin/practice')}
            aria-label="Quay lại danh sách practice sets"
          >
            <ArrowLeft className="h-5 w-5" />
          </AdminButton>
        }
        actions={
          <AdminButton variant="primary" onClick={saveSet} disabled={blocked}>
            <Save className="h-4 w-4" />
            {saving ? 'Đang lưu...' : 'Lưu practice set'}
          </AdminButton>
        }
      />
      {write.recovery && (
        <PracticeSaveRecovery
          message={write.recovery.message}
          pending={write.pending}
          onRetry={() =>
            void write.recover(
              savedId => adminPracticeEditorService.get(savedId),
              savedId => {
                setMessage('Đã xác nhận bộ bài đã lưu.')
                setPracticeSet(current => ({ ...current, id: savedId }))
                if (isNew) navigate(`/admin/practice/${savedId}`, { replace: true })
              }
            )
          }
          onBack={() => navigate('/admin/practice')}
        />
      )}
      <fieldset disabled={blocked} className="min-w-0 space-y-6">
        {requirements.type === 'completed_lessons_count' &&
          typeof requirements.count === 'number' &&
          typeof requirements.languageId === 'string' && (
            <p className="rounded-lg border p-4 text-sm">
              Điều kiện mở khóa hiện tại: hoàn thành {requirements.count} bài học (
              {requirements.languageId}).
            </p>
          )}
        <AdminSectionNav
          sections={[
            { id: 'practice-basics', label: 'Thông tin' },
            { id: 'practice-questions', label: 'Danh sách câu hỏi' },
            { id: 'practice-question-editor', label: 'Soạn câu hỏi' },
          ]}
        />

        {error && (
          <div
            role="alert"
            className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700"
          >
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {message && (
          <div
            role="status"
            className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700"
          >
            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{message}</span>
          </div>
        )}

        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
          <div className="min-w-0 space-y-5">
            <section
              id="practice-basics"
              className="scroll-mt-24 min-w-0 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <h2 className="mb-5 text-xl font-black text-slate-950">Thông tin cơ bản</h2>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block min-w-0 md:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-slate-600">Title</span>
                  <input
                    value={practiceSet.title}
                    onChange={event => updateSet({ title: event.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    placeholder="Python Basics - Loops"
                  />
                </label>
                <label className="block min-w-0 md:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-slate-600">Description</span>
                  <textarea
                    value={practiceSet.description}
                    onChange={event => updateSet({ description: event.target.value })}
                    className="h-24 w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-2 block text-sm font-bold text-slate-600">Topic</span>
                  <input
                    value={practiceSet.topic}
                    onChange={event => updateSet({ topic: event.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    placeholder="Loops, Arrays, Functions..."
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-2 block text-sm font-bold text-slate-600">Language ID</span>
                  <input
                    value={practiceSet.languageId}
                    onChange={event => updateSet({ languageId: event.target.value })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    placeholder="python"
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-2 block text-sm font-bold text-slate-600">Difficulty</span>
                  <select
                    value={practiceSet.difficulty}
                    onChange={event => updateSet({ difficulty: event.target.value as Difficulty })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </label>
                <label className="block min-w-0">
                  <span className="mb-2 block text-sm font-bold text-slate-600">Status</span>
                  <select
                    value={practiceSet.status}
                    onChange={event => updateSet({ status: event.target.value as Status })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </label>
                <label className="block min-w-0 md:col-span-2">
                  <span className="mb-2 block text-sm font-bold text-slate-600">Visibility</span>
                  <select
                    value={practiceSet.visibility}
                    onChange={event => updateSet({ visibility: event.target.value as Visibility })}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="official">Official - dùng cho PvP</option>
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                    <option value="unlisted">Unlisted</option>
                  </select>
                </label>
              </div>
            </section>

            <section
              id="practice-questions"
              className="scroll-mt-24 min-w-0 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
            >
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-slate-950">Questions</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    Câu hỏi được lưu cùng practice set. Save set sẽ thay thế danh sách câu hỏi hiện
                    tại.
                  </p>
                </div>
                <span className="rounded-full bg-teal-50 px-2.5 py-1 text-xs font-black text-teal-700">
                  {questions.length}
                </span>
              </div>

              <div className="space-y-3">
                {questions.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-500">
                    Chưa có câu hỏi. Tạo câu hỏi ở panel bên phải.
                  </div>
                )}
                {questions.map((question, index) => (
                  <div
                    key={`${question.id || 'new'}-${index}`}
                    className="rounded-lg border border-slate-200 p-4"
                  >
                    <div className="flex flex-col items-start justify-between gap-3 2xl:flex-row">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="text-sm font-black text-slate-950">
                            #{index + 1} {question.title || question.type}
                          </div>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[11px] font-black uppercase tracking-wider text-slate-600">
                            {question.type}
                          </span>
                          <span className="rounded-full bg-teal-50 px-2.5 py-1 text-[11px] font-black text-teal-700">
                            {question.points || 10} pts
                          </span>
                        </div>
                        <p className="mt-2 text-sm font-medium leading-6 text-slate-600">
                          {question.prompt}
                        </p>
                        {question.explanation && (
                          <p className="mt-2 text-xs font-semibold text-slate-500">
                            Giải thích: {question.explanation}
                          </p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-wrap justify-end gap-2">
                        <AdminButton
                          size="icon"
                          onClick={() => moveQuestion(index, 'up')}
                          disabled={index === 0}
                        >
                          ↑
                        </AdminButton>
                        <AdminButton
                          size="icon"
                          onClick={() => moveQuestion(index, 'down')}
                          disabled={index === questions.length - 1}
                        >
                          ↓
                        </AdminButton>
                        <AdminButton
                          onClick={() => editQuestion(question, index)}
                          aria-label="Sửa câu hỏi"
                        >
                          <Pencil size={14} aria-hidden="true" />
                          Sửa
                        </AdminButton>
                        <AdminButton
                          variant="danger"
                          size="icon"
                          onClick={() => deleteQuestion(index)}
                          aria-label="Xóa câu hỏi"
                        >
                          <Trash2 className="h-4 w-4" />
                        </AdminButton>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>

          <aside className="min-w-0 space-y-5">
            <section
              id="practice-question-editor"
              className="scroll-mt-24 min-w-0 rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
            >
              <h2 className="text-lg font-black text-slate-950">
                {editingIndex !== null ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}
              </h2>
              <div className="mt-4 space-y-4">
                <label className="block min-w-0">
                  <span className="mb-2 block text-sm font-bold text-slate-600">Type</span>
                  <select
                    value={editingQuestion.type}
                    onChange={event =>
                      setEditingQuestion(resetQuestionForType(event.target.value as QuestionType))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="multiple_choice">Multiple choice</option>
                    <option value="true_false">True / False</option>
                    <option value="multiple_select">Multiple select</option>
                    <option value="fill_blank">Fill blank</option>
                  </select>
                </label>
                <label className="block min-w-0">
                  <span className="mb-2 block text-sm font-bold text-slate-600">Title</span>
                  <input
                    value={editingQuestion.title || ''}
                    onChange={event =>
                      setEditingQuestion(current => ({ ...current, title: event.target.value }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    placeholder="Optional short label"
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-2 block text-sm font-bold text-slate-600">Prompt</span>
                  <textarea
                    value={editingQuestion.prompt}
                    onChange={event =>
                      setEditingQuestion(current => ({ ...current, prompt: event.target.value }))
                    }
                    className="h-28 w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>

                {(editingQuestion.type === 'multiple_choice' ||
                  editingQuestion.type === 'multiple_select') && (
                  <div>
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-sm font-bold text-slate-600">Options</span>
                      <AdminButton
                        onClick={() =>
                          setEditingQuestion(current => ({
                            ...current,
                            options: [...(current.options || []), ''],
                          }))
                        }
                      >
                        + option
                      </AdminButton>
                    </div>
                    <div className="space-y-2">
                      {(editingQuestion.options || []).map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          {editingQuestion.type === 'multiple_choice' ? (
                            <input
                              type="radio"
                              checked={
                                editingQuestion.correctAnswer === option && option.trim().length > 0
                              }
                              onChange={() =>
                                setEditingQuestion(current => ({
                                  ...current,
                                  correctAnswer: option,
                                }))
                              }
                            />
                          ) : (
                            <input
                              type="checkbox"
                              checked={
                                Array.isArray(editingQuestion.correctAnswer) &&
                                editingQuestion.correctAnswer.includes(option)
                              }
                              onChange={() => toggleMultipleSelectAnswer(option)}
                            />
                          )}
                          <input
                            value={option}
                            onChange={event => {
                              const nextOptions = [...(editingQuestion.options || [])]
                              nextOptions[index] = event.target.value
                              setEditingQuestion(current => ({ ...current, options: nextOptions }))
                            }}
                            className="min-w-0 flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                            placeholder={`Option ${index + 1}`}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {editingQuestion.type === 'true_false' && (
                  <label className="block min-w-0">
                    <span className="mb-2 block text-sm font-bold text-slate-600">
                      Correct answer
                    </span>
                    <select
                      value={String(editingQuestion.correctAnswer ?? '').toLowerCase()}
                      onChange={event =>
                        setEditingQuestion(current => ({
                          ...current,
                          correctAnswer: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    >
                      <option value="">Chọn đáp án</option>
                      <option value="true">True</option>
                      <option value="false">False</option>
                    </select>
                  </label>
                )}

                {editingQuestion.type === 'fill_blank' && (
                  <label className="block min-w-0">
                    <span className="mb-2 block text-sm font-bold text-slate-600">
                      Correct answer
                    </span>
                    <input
                      value={String(editingQuestion.correctAnswer || '')}
                      onChange={event =>
                        setEditingQuestion(current => ({
                          ...current,
                          correctAnswer: event.target.value,
                        }))
                      }
                      className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    />
                  </label>
                )}

                <label className="block min-w-0">
                  <span className="mb-2 block text-sm font-bold text-slate-600">Explanation</span>
                  <textarea
                    value={editingQuestion.explanation || ''}
                    onChange={event =>
                      setEditingQuestion(current => ({
                        ...current,
                        explanation: event.target.value,
                      }))
                    }
                    className="h-24 w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
                <label className="block min-w-0">
                  <span className="mb-2 block text-sm font-bold text-slate-600">Points</span>
                  <input
                    type="number"
                    min={1}
                    max={100}
                    value={editingQuestion.points ?? 10}
                    onChange={event =>
                      setEditingQuestion(current => ({
                        ...current,
                        points: Number(event.target.value),
                      }))
                    }
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
                <div className="flex gap-2">
                  <AdminButton
                    variant="primary"
                    className="flex-1"
                    onClick={saveQuestion}
                    disabled={savingQuestion}
                  >
                    <PlusCircle className="h-4 w-4" />
                    {editingIndex !== null ? 'Cập nhật' : 'Thêm'}
                  </AdminButton>
                  {editingIndex !== null && (
                    <AdminButton onClick={() => resetQuestion()}>Hủy</AdminButton>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-black text-slate-950">Checklist</h2>
              <div className="mt-4 space-y-2">
                {qualityIssues.length === 0 ? (
                  <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-black text-green-700">
                    <CheckCircle2 className="h-4 w-4" />
                    Ready to publish
                  </div>
                ) : (
                  qualityIssues.map(issue => (
                    <div
                      key={issue}
                      className="rounded-lg bg-amber-50 p-3 text-sm font-black text-amber-700"
                    >
                      {issue}
                    </div>
                  ))
                )}
              </div>
            </section>
          </aside>
        </div>
      </fieldset>
    </div>
  )
}

export default function AdminPracticeEditorPage() {
  const { id } = useParams<{ id: string }>()
  const location = useLocation()
  return <AdminPracticeEditorForm key={location.key} id={id} />
}
