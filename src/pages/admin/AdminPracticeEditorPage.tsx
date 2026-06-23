import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Edit3,
  FileText,
  PlusCircle,
  Save,
  Trash2,
} from 'lucide-react'
import apiClient from '../../services/admin/apiClient'

type QuestionType = 'true_false' | 'multiple_choice' | 'multiple_select' | 'fill_blank'
type Difficulty = 'easy' | 'medium' | 'hard'
type Visibility = 'public' | 'private' | 'unlisted' | 'official'
type Status = 'draft' | 'published'

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

const normalizeQuestion = (question: any, index: number): PracticeQuestion => ({
  id: question.id,
  type: question.type || 'multiple_choice',
  title: question.title || '',
  prompt: question.prompt || '',
  options: Array.isArray(question.options) ? question.options : ['', '', ''],
  correctAnswer: question.correctAnswer ?? question.correct_answer ?? '',
  explanation: question.explanation || '',
  points: question.points || 10,
  orderIndex: question.orderIndex ?? question.order_index ?? index,
})

const resetQuestionForType = (type: QuestionType): PracticeQuestion => ({
  ...emptyQuestion,
  type,
  options: type === 'true_false' ? ['True', 'False'] : type === 'fill_blank' ? [] : ['', '', ''],
  correctAnswer: type === 'true_false' ? 'True' : type === 'multiple_select' ? [] : '',
})

const EditorSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="mt-1 h-10 w-10 animate-pulse rounded-lg bg-slate-100" />
        <div>
          <div className="mb-3 h-7 w-44 animate-pulse rounded-full bg-slate-100" />
          <div className="h-10 w-64 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-5 w-full max-w-xl animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="h-12 w-40 animate-pulse rounded-lg bg-slate-100" />
    </div>
    <div className="grid gap-6 xl:grid-cols-[1fr,360px]">
      <div className="space-y-5">
        {Array.from({ length: 2 }).map((_, index) => (
          <section key={index} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 h-6 w-44 animate-pulse rounded bg-slate-100" />
            <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
          </section>
        ))}
      </div>
      <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="mb-4 h-5 w-32 animate-pulse rounded bg-slate-100" />
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </aside>
    </div>
  </div>
)

const AdminPracticeEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [practiceSet, setPracticeSet] = useState<PracticeSetForm>(emptySet)
  const [questions, setQuestions] = useState<PracticeQuestion[]>([])
  const [editingQuestion, setEditingQuestion] = useState<PracticeQuestion>(emptyQuestion)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [savingQuestion, setSavingQuestion] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (isNew || !id) {
      setPracticeSet(emptySet)
      setQuestions([])
      setLoading(false)
      return
    }

    let isMounted = true

    const loadPracticeSet = async () => {
      setLoading(true)
      setError(null)
      try {
        const response = await apiClient.get(`/api/admin/practice/sets/${id}`)
        const data = response.data.data
        if (!isMounted) return

        setPracticeSet({
          id: data.id,
          title: data.title || '',
          description: data.description || '',
          topic: data.topic || '',
          languageId: data.languageId || data.language_id || '',
          difficulty: data.difficulty || 'medium',
          visibility: data.visibility || 'official',
          status: data.status || 'draft',
        })
        setQuestions((data.questions || []).map(normalizeQuestion))
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Không thể tải practice set')
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    loadPracticeSet()

    return () => {
      isMounted = false
    }
  }, [id, isNew])

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

  const saveSet = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      if (!practiceSet.title.trim()) {
        setError('Title là bắt buộc.')
        return
      }
      if (questions.length === 0) {
        setError('Cần ít nhất một câu hỏi trước khi lưu practice set.')
        return
      }

      const payload = {
        title: practiceSet.title,
        description: practiceSet.description,
        topic: practiceSet.topic,
        languageId: practiceSet.languageId || undefined,
        difficulty: practiceSet.difficulty,
        visibility: practiceSet.visibility,
        status: practiceSet.status,
        questions: questions.map((question, index) => ({
          ...question,
          options: question.options?.filter(option => option.trim()) || [],
          points: Number(question.points) || 10,
          orderIndex: index,
        })),
      }

      const response = isNew
        ? await apiClient.post('/api/admin/practice/sets', payload)
        : await apiClient.put(`/api/admin/practice/sets/${id}`, payload)

      const saved = response.data.data
      setMessage('Đã lưu practice set.')
      setPracticeSet(current => ({ ...current, id: saved.id }))

      if (isNew) {
        navigate(`/admin/practice/${saved.id}`, { replace: true })
      }
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể lưu practice set')
    } finally {
      setSaving(false)
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
      if (editingQuestion.type === 'multiple_choice' && !String(editingQuestion.correctAnswer || '').trim()) {
        setError('Multiple choice cần chọn đáp án đúng.')
        return
      }
      if (editingQuestion.type === 'multiple_select' && !Array.isArray(editingQuestion.correctAnswer)) {
        setError('Multiple select cần ít nhất một đáp án đúng.')
        return
      }
      if (editingQuestion.type === 'fill_blank' && !String(editingQuestion.correctAnswer || '').trim()) {
        setError('Fill blank cần đáp án đúng.')
        return
      }

      const nextQuestion = {
        ...editingQuestion,
        points: Number(editingQuestion.points) || 10,
      }

      setQuestions(current => {
        if (editingIndex !== null) {
          return current.map((question, index) => index === editingIndex ? { ...nextQuestion, orderIndex: index } : question)
        }
        return [...current, { ...nextQuestion, orderIndex: current.length }]
      })
      resetQuestion(questions.length + 2)
      setMessage('Đã cập nhật câu hỏi. Nhớ bấm Lưu practice set để persist.')
    } finally {
      setSavingQuestion(false)
    }
  }

  const editQuestion = (question: PracticeQuestion, index: number) => {
    setEditingQuestion({ ...question, orderIndex: index })
    setEditingIndex(index)
  }

  const deleteQuestion = (index: number) => {
    setQuestions(current => current.filter((_, itemIndex) => itemIndex !== index).map((question, nextIndex) => ({ ...question, orderIndex: nextIndex })))
  }

  const moveQuestion = (index: number, direction: 'up' | 'down') => {
    setQuestions(current => {
      const targetIndex = direction === 'up' ? index - 1 : index + 1
      if (targetIndex < 0 || targetIndex >= current.length) return current
      const next = [...current]
      ;[next[index], next[targetIndex]] = [next[targetIndex], next[index]]
      return next.map((question, nextIndex) => ({ ...question, orderIndex: nextIndex }))
    })
  }

  const toggleMultipleSelectAnswer = (option: string) => {
    const currentAnswers = Array.isArray(editingQuestion.correctAnswer) ? editingQuestion.correctAnswer : []
    const nextAnswers = currentAnswers.includes(option)
      ? currentAnswers.filter(answer => answer !== option)
      : [...currentAnswers, option]
    setEditingQuestion(current => ({ ...current, correctAnswer: nextAnswers }))
  }

  if (loading) return <EditorSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/admin/practice')}
            className="mt-1 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50"
            aria-label="Quay lại danh sách practice sets"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-teal-700">
              <FileText className="h-3.5 w-3.5" />
              Practice editor
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              {isNew ? 'Tạo practice set' : 'Chỉnh practice set'}
            </h1>
            <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
              Quản lý metadata và câu hỏi dùng cho Practice/PvP trong một trang riêng như Lesson editor.
            </p>
          </div>
        </div>

        <button
          onClick={saveSet}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Đang lưu...' : 'Lưu practice set'}
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {message && (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 text-sm font-bold text-green-700">
          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{message}</span>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[1fr,360px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-black text-slate-950">Thông tin cơ bản</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-600">Title</span>
                <input
                  value={practiceSet.title}
                  onChange={event => updateSet({ title: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  placeholder="Python Basics - Loops"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-600">Description</span>
                <textarea
                  value={practiceSet.description}
                  onChange={event => updateSet({ description: event.target.value })}
                  className="h-24 w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">Topic</span>
                <input
                  value={practiceSet.topic}
                  onChange={event => updateSet({ topic: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  placeholder="Loops, Arrays, Functions..."
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">Language ID</span>
                <input
                  value={practiceSet.languageId}
                  onChange={event => updateSet({ languageId: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  placeholder="python"
                />
              </label>
              <label className="block">
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
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">Status</span>
                <select
                  value={practiceSet.status}
                  onChange={event => updateSet({ status: event.target.value as Status })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>
              <label className="block md:col-span-2">
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

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">Questions</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Câu hỏi được lưu cùng practice set. Save set sẽ thay thế danh sách câu hỏi hiện tại.
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
                <div key={`${question.id || 'new'}-${index}`} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-start justify-between gap-3">
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
                      <p className="mt-2 text-sm font-medium leading-6 text-slate-600">{question.prompt}</p>
                      {question.explanation && (
                        <p className="mt-2 text-xs font-semibold text-slate-500">Giải thích: {question.explanation}</p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-wrap justify-end gap-2">
                      <button
                        onClick={() => moveQuestion(index, 'up')}
                        disabled={index === 0}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => moveQuestion(index, 'down')}
                        disabled={index === questions.length - 1}
                        className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs font-black text-slate-600 hover:bg-slate-50 disabled:opacity-40"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => editQuestion(question, index)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-700"
                        aria-label="Sửa câu hỏi"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteQuestion(index)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-100 text-red-600 transition-colors hover:bg-red-50"
                        aria-label="Xóa câu hỏi"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="text-lg font-black text-slate-950">
              {editingIndex !== null ? 'Sửa câu hỏi' : 'Thêm câu hỏi'}
            </h2>
            <div className="mt-4 space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">Type</span>
                <select
                  value={editingQuestion.type}
                  onChange={event => setEditingQuestion(resetQuestionForType(event.target.value as QuestionType))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="multiple_choice">Multiple choice</option>
                  <option value="true_false">True / False</option>
                  <option value="multiple_select">Multiple select</option>
                  <option value="fill_blank">Fill blank</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">Title</span>
                <input
                  value={editingQuestion.title || ''}
                  onChange={event => setEditingQuestion(current => ({ ...current, title: event.target.value }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  placeholder="Optional short label"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">Prompt</span>
                <textarea
                  value={editingQuestion.prompt}
                  onChange={event => setEditingQuestion(current => ({ ...current, prompt: event.target.value }))}
                  className="h-28 w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </label>

              {(editingQuestion.type === 'multiple_choice' || editingQuestion.type === 'multiple_select') && (
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="text-sm font-bold text-slate-600">Options</span>
                    <button
                      onClick={() => setEditingQuestion(current => ({ ...current, options: [...(current.options || []), ''] }))}
                      className="text-xs font-black text-teal-700 hover:text-teal-800"
                    >
                      + option
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(editingQuestion.options || []).map((option, index) => (
                      <div key={index} className="flex items-center gap-2">
                        {editingQuestion.type === 'multiple_choice' ? (
                          <input
                            type="radio"
                            checked={editingQuestion.correctAnswer === option && option.trim().length > 0}
                            onChange={() => setEditingQuestion(current => ({ ...current, correctAnswer: option }))}
                          />
                        ) : (
                          <input
                            type="checkbox"
                            checked={Array.isArray(editingQuestion.correctAnswer) && editingQuestion.correctAnswer.includes(option)}
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
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-600">Correct answer</span>
                  <select
                    value={String(editingQuestion.correctAnswer || 'True')}
                    onChange={event => setEditingQuestion(current => ({ ...current, correctAnswer: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  >
                    <option value="True">True</option>
                    <option value="False">False</option>
                  </select>
                </label>
              )}

              {editingQuestion.type === 'fill_blank' && (
                <label className="block">
                  <span className="mb-2 block text-sm font-bold text-slate-600">Correct answer</span>
                  <input
                    value={String(editingQuestion.correctAnswer || '')}
                    onChange={event => setEditingQuestion(current => ({ ...current, correctAnswer: event.target.value }))}
                    className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
              )}

              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">Explanation</span>
                <textarea
                  value={editingQuestion.explanation || ''}
                  onChange={event => setEditingQuestion(current => ({ ...current, explanation: event.target.value }))}
                  className="h-24 w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">Points</span>
                <input
                  type="number"
                  min={1}
                  value={editingQuestion.points || 10}
                  onChange={event => setEditingQuestion(current => ({ ...current, points: Number(event.target.value) || 10 }))}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <div className="flex gap-2">
                <button
                  onClick={saveQuestion}
                  disabled={savingQuestion}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-2.5 text-sm font-black text-white hover:bg-teal-800 disabled:opacity-50"
                >
                  <PlusCircle className="h-4 w-4" />
                  {editingIndex !== null ? 'Cập nhật' : 'Thêm'}
                </button>
                {editingIndex !== null && (
                  <button
                    onClick={() => resetQuestion()}
                    className="rounded-lg border border-slate-200 px-4 py-2.5 text-sm font-black text-slate-700 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
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
                  <div key={issue} className="rounded-lg bg-amber-50 p-3 text-sm font-black text-amber-700">
                    {issue}
                  </div>
                ))
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default AdminPracticeEditorPage
