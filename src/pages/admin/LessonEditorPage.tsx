import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  Code,
  FileText,
  PlusCircle,
  Save,
  Trash2,
} from 'lucide-react'
import { contentService, LessonTestCase } from '../../services/admin/content.service'

interface ChapterOption {
  id: string
  language_id?: string
  title?: string
}

const emptyLesson = {
  id: '',
  chapterId: '',
  lessonId: '',
  title: '',
  description: '',
  starterCode: '',
  taskDescription: '',
  hint: '',
  commonMistakes: '',
  solutionCode: '',
  isAhaLesson: false,
  orderIndex: 1,
  difficulty: 'beginner',
  gradingMode: 'stdout',
  status: 'draft',
  qaChecklist: [] as Array<{ id: string; label: string; checked: boolean; order: number }>,
  debugStarterCode: '',
  debugTaskDescription: '',
  debugValidationRules: [] as Array<{ type: 'rule' | 'exact' | 'regex' | 'stdout'; value: string; description?: string }>,
  debugHint: '',
}

const emptyTestCase: LessonTestCase = {
  description: '',
  input: [],
  expected_output: '',
  weight: 10,
  timeout: 1000,
  is_hidden: false,
  order_index: 1,
}

const stringifyJson = (value: unknown) => {
  if (typeof value === 'string') return value
  try {
    return JSON.stringify(value, null, 2)
  } catch {
    return ''
  }
}

const parseJsonField = (value: string, fallback: unknown) => {
  if (!value.trim()) return fallback
  try {
    return JSON.parse(value)
  } catch {
    return value
  }
}

const LessonEditorSkeleton = () => (
  <div className="space-y-6">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex items-start gap-4">
        <div className="mt-1 h-10 w-10 animate-pulse rounded-lg bg-slate-100" />
        <div>
          <div className="mb-3 h-7 w-36 animate-pulse rounded-full bg-slate-100" />
          <div className="h-10 w-52 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-5 w-full max-w-xl animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="h-12 w-32 animate-pulse rounded-lg bg-slate-100" />
    </div>

    <div className="grid gap-6 xl:grid-cols-[1fr,340px]">
      <div className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 h-6 w-44 animate-pulse rounded bg-slate-100" />
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className={index === 2 ? 'md:col-span-2' : ''}>
                <div className="mb-2 h-4 w-20 animate-pulse rounded bg-slate-100" />
                <div className="h-11 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ))}
          </div>
        </section>

        {Array.from({ length: 3 }).map((_, index) => (
          <section key={index} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4 h-6 w-40 animate-pulse rounded bg-slate-100" />
            <div className="h-36 animate-pulse rounded-lg bg-slate-100" />
          </section>
        ))}
      </div>

      <aside className="space-y-5">
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 h-5 w-32 animate-pulse rounded bg-slate-100" />
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, index) => (
              <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        </section>
        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 h-5 w-28 animate-pulse rounded bg-slate-100" />
          <div className="h-24 animate-pulse rounded-lg bg-slate-100" />
        </section>
      </aside>
    </div>
  </div>
)

const LessonEditorPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const isNew = !id || id === 'new'

  const [chapters, setChapters] = useState<ChapterOption[]>([])
  const [lesson, setLesson] = useState<any>(emptyLesson)
  const [testCases, setTestCases] = useState<LessonTestCase[]>([])
  const [editingTestCase, setEditingTestCase] = useState<LessonTestCase>(emptyTestCase)
  const [testInputText, setTestInputText] = useState('[]')
  const [expectedOutputText, setExpectedOutputText] = useState('""')
  const [newChecklistItem, setNewChecklistItem] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingTestCase, setSavingTestCase] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      setLoading(true)
      setError(null)

      try {
        const chaptersData = await contentService.getChapters()
        setChapters(chaptersData)

        if (!isNew && id) {
          const [lessonData, testCaseData] = await Promise.all([
            contentService.getLessonById(id),
            contentService.getLessonTestCases(id),
          ])

          setLesson({
            id: lessonData.id,
            chapterId: lessonData.chapter_id || '',
            lessonId: lessonData.lesson_id || '',
            title: lessonData.title || '',
            description: lessonData.description || '',
            starterCode: lessonData.starter_code || '',
            taskDescription: lessonData.task_description || '',
            hint: lessonData.hint || '',
            commonMistakes: lessonData.common_mistakes || '',
            solutionCode: lessonData.solution_code || '',
            isAhaLesson: lessonData.is_aha_lesson || false,
            orderIndex: lessonData.order_index || 1,
            difficulty: lessonData.difficulty || 'beginner',
            gradingMode: lessonData.grading_mode || 'stdout',
            status: lessonData.status || 'draft',
            qaChecklist: lessonData.qa_checklist || [],
            debugStarterCode: lessonData.debug_starter_code || '',
            debugTaskDescription: lessonData.debug_task_description || '',
            debugValidationRules: lessonData.debug_validation_rules || [],
            debugHint: lessonData.debug_hint || '',
          })
          setTestCases(testCaseData)
          setEditingTestCase({ ...emptyTestCase, order_index: testCaseData.length + 1 })
        } else {
          setLesson({ ...emptyLesson, chapterId: chaptersData[0]?.id || '' })
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Không thể tải dữ liệu lesson')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [id, isNew])

  const qualityIssues = useMemo(() => {
    const issues = []
    if (!lesson.title.trim()) issues.push('Thiếu title')
    if (!lesson.chapterId) issues.push('Thiếu chapter')
    if (!lesson.lessonId.trim()) issues.push('Thiếu slug')
    if (!lesson.starterCode.trim()) issues.push('Thiếu starter code')
    if (!lesson.taskDescription.trim()) issues.push('Thiếu task description')
    if (!lesson.solutionCode.trim()) issues.push('Thiếu solution code')
    if (!isNew && testCases.length === 0) issues.push('Chưa có test case')
    return issues
  }, [isNew, lesson, testCases.length])

  const updateLesson = (patch: Partial<typeof emptyLesson>) => {
    setLesson((current: any) => ({ ...current, ...patch }))
  }

  const resetTestCaseForm = (nextOrder = testCases.length + 1) => {
    setEditingTestCase({ ...emptyTestCase, order_index: nextOrder })
    setTestInputText('[]')
    setExpectedOutputText('""')
  }

  const handleSaveLesson = async () => {
    setSaving(true)
    setError(null)
    setMessage(null)

    try {
      const saved = await contentService.upsertLesson({
        id: lesson.id || undefined,
        chapter_id: lesson.chapterId,
        lesson_id: lesson.lessonId,
        title: lesson.title,
        description: lesson.description,
        starter_code: lesson.starterCode,
        task_description: lesson.taskDescription,
        hint: lesson.hint,
        common_mistakes: lesson.commonMistakes,
        solution_code: lesson.solutionCode,
        is_aha_lesson: lesson.isAhaLesson,
        order_index: Number(lesson.orderIndex) || 0,
        difficulty: lesson.difficulty || 'beginner',
        grading_mode: lesson.gradingMode || 'stdout',
        status: lesson.status || 'draft',
        qa_checklist: lesson.qaChecklist || [],
        debug_starter_code: lesson.debugStarterCode || '',
        debug_task_description: lesson.debugTaskDescription || '',
        debug_validation_rules: lesson.debugValidationRules || [],
        debug_hint: lesson.debugHint || '',
      })

      setLesson((current: any) => ({ ...current, id: saved.id }))
      setMessage('Đã lưu lesson.')

      if (isNew) {
        navigate(`/admin/lessons/${saved.id}`, { replace: true })
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu lesson')
    } finally {
      setSaving(false)
    }
  }

  const handleEditTestCase = (testCase: LessonTestCase) => {
    setEditingTestCase(testCase)
    setTestInputText(stringifyJson(testCase.input ?? []))
    setExpectedOutputText(stringifyJson(testCase.expected_output ?? ''))
  }

  const handleSaveTestCase = async () => {
    const lessonId = lesson.id || id
    if (!lessonId) {
      setError('Lưu lesson trước khi thêm test case.')
      return
    }

    setSavingTestCase(true)
    setError(null)
    setMessage(null)

    try {
      const saved = await contentService.upsertLessonTestCase(lessonId, {
        ...editingTestCase,
        input: parseJsonField(testInputText, []),
        expected_output: parseJsonField(expectedOutputText, ''),
        weight: Number(editingTestCase.weight) || 10,
        timeout: Number(editingTestCase.timeout) || 1000,
        order_index: Number(editingTestCase.order_index) || testCases.length + 1,
      })

      setTestCases(current => {
        const exists = current.some(item => item.id === saved.id)
        const next = exists ? current.map(item => (item.id === saved.id ? saved : item)) : [...current, saved]
        return next.sort((a, b) => a.order_index - b.order_index)
      })
      resetTestCaseForm(testCases.length + 2)
      setMessage('Đã lưu test case.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể lưu test case')
    } finally {
      setSavingTestCase(false)
    }
  }

  const handleDeleteTestCase = async (testCase: LessonTestCase) => {
    if (!testCase.id) return
    if (!window.confirm(`Xóa test case "${testCase.description}"?`)) return

    setError(null)
    try {
      await contentService.deleteLessonTestCase(testCase.id)
      setTestCases(current => current.filter(item => item.id !== testCase.id))
      setMessage('Đã xóa test case.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa test case')
    }
  }

  const autoSaveChecklist = async (newChecklist: any) => {
    if (!lesson.id) return // Chỉ auto-save nếu lesson đã có ID
    try {
      await contentService.upsertLesson({
        id: lesson.id,
        chapter_id: lesson.chapterId,
        lesson_id: lesson.lessonId,
        title: lesson.title,
        description: lesson.description,
        starter_code: lesson.starterCode,
        task_description: lesson.taskDescription,
        hint: lesson.hint,
        common_mistakes: lesson.commonMistakes,
        solution_code: lesson.solutionCode,
        is_aha_lesson: lesson.isAhaLesson,
        order_index: Number(lesson.orderIndex) || 0,
        difficulty: lesson.difficulty || 'beginner',
        grading_mode: lesson.gradingMode || 'stdout',
        status: lesson.status || 'draft',
        qa_checklist: newChecklist,
      })
    } catch (err) {
      console.error('Auto-save checklist failed:', err)
    }
  }

  const handleAddChecklistItem = () => {
    if (!newChecklistItem.trim()) return
    const item = {
      id: `checklist-${Date.now()}`,
      label: newChecklistItem.trim(),
      checked: false,
      order: (lesson.qaChecklist || []).length + 1,
    }
    const newChecklist = [...(lesson.qaChecklist || []), item]
    updateLesson({ qaChecklist: newChecklist as any })
    setNewChecklistItem('')
    autoSaveChecklist(newChecklist)
  }

  const handleToggleChecklistItem = (itemId: string) => {
    const newChecklist = (lesson.qaChecklist || []).map((item: any) =>
      item.id === itemId ? { ...item, checked: !item.checked } : item
    )
    updateLesson({
      qaChecklist: newChecklist as any,
    })
    autoSaveChecklist(newChecklist)
  }

  const handleDeleteChecklistItem = (itemId: string) => {
    const newChecklist = (lesson.qaChecklist || []).filter((item: any) => item.id !== itemId)
    updateLesson({
      qaChecklist: newChecklist as any,
    })
    autoSaveChecklist(newChecklist)
  }

  const handleMoveChecklistItem = (itemId: string, direction: 'up' | 'down') => {
    const items = lesson.qaChecklist || []
    const index = items.findIndex((item: any) => item.id === itemId)
    if (index === -1) return
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === items.length - 1) return

    const newItems = [...items]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    ;[newItems[index], newItems[targetIndex]] = [newItems[targetIndex], newItems[index]]

    // Update order numbers
    newItems.forEach((item: any, i: number) => {
      item.order = i + 1
    })

    updateLesson({ qaChecklist: newItems as any })
    autoSaveChecklist(newItems)
  }

  if (loading) return <LessonEditorSkeleton />

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/admin/lessons')}
            className="mt-1 rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition-colors hover:bg-slate-50"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-teal-700">
              <FileText className="h-3.5 w-3.5" />
              Lesson editor
            </div>
            <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
              {isNew ? 'Tạo lesson' : 'Chỉnh lesson'}
            </h1>
            <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
              Author nội dung theo flow See-Change-Run-Fix-Build. Test case quản lý trực tiếp ở cuối trang.
            </p>
          </div>
        </div>

        <button
          onClick={handleSaveLesson}
          disabled={saving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-teal-800 disabled:opacity-50"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Đang lưu...' : 'Lưu lesson'}
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

      <div className="grid gap-6 xl:grid-cols-[1fr,340px]">
        <div className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-black text-slate-950">Thông tin cơ bản</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">Chapter</span>
                <select
                  value={lesson.chapterId}
                  onChange={event => updateLesson({ chapterId: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                >
                  <option value="">Chọn chapter...</option>
                  {chapters.map(chapter => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.language_id || 'unknown'} - {chapter.title || chapter.id}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">Slug</span>
                <input
                  value={lesson.lessonId}
                  onChange={event => updateLesson({ lessonId: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  placeholder="loi-chao-dau-tien"
                />
              </label>
              <label className="block md:col-span-2">
                <span className="mb-2 block text-sm font-bold text-slate-600">Title</span>
                <input
                  value={lesson.title}
                  onChange={event => updateLesson({ title: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mb-5 text-xl font-black text-slate-950">Flow học</h2>
            <div className="space-y-5">
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">1. See - giải thích</span>
                <textarea
                  value={lesson.description}
                  onChange={event => updateLesson({ description: event.target.value })}
                  className="h-28 w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">Starter code</span>
                <textarea
                  value={lesson.starterCode}
                  onChange={event => updateLesson({ starterCode: event.target.value })}
                  className="h-44 w-full resize-none rounded-lg border border-slate-200 bg-slate-950 px-3 py-3 font-mono text-sm text-slate-100 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">2. Change - task description</span>
                <textarea
                  value={lesson.taskDescription}
                  onChange={event => updateLesson({ taskDescription: event.target.value })}
                  className="h-28 w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </label>
              <div className="grid gap-4 md:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-700">Fix - hint</span>
                  <textarea
                    value={lesson.hint}
                    onChange={event => updateLesson({ hint: event.target.value })}
                    className="h-28 w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-slate-700">Common mistakes</span>
                  <textarea
                    value={lesson.commonMistakes}
                    onChange={event => updateLesson({ commonMistakes: event.target.value })}
                    className="h-28 w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                </label>
              </div>
              <label className="block">
                <span className="mb-2 block text-sm font-black text-slate-700">Build - solution code</span>
                <textarea
                  value={lesson.solutionCode}
                  onChange={event => updateLesson({ solutionCode: event.target.value })}
                  className="h-44 w-full resize-none rounded-lg border border-slate-200 bg-slate-950 px-3 py-3 font-mono text-sm text-slate-100 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                />
              </label>

              <div className="border-t border-slate-200 pt-5">
                <h3 className="mb-4 text-lg font-black text-slate-950">Fix - Debug Challenge (Data-driven)</h3>
                <div className="space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-slate-700">Debug starter code (code với bug)</span>
                    <textarea
                      value={lesson.debugStarterCode}
                      onChange={event => updateLesson({ debugStarterCode: event.target.value })}
                      className="h-40 w-full resize-none rounded-lg border border-slate-200 bg-slate-950 px-3 py-3 font-mono text-sm text-slate-100 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      placeholder="Code với bug(s) để user sửa"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-slate-700">Debug task description</span>
                    <textarea
                      value={lesson.debugTaskDescription}
                      onChange={event => updateLesson({ debugTaskDescription: event.target.value })}
                      className="h-24 w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      placeholder="Mô tả user cần sửa gì"
                    />
                  </label>
                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-slate-700">Debug hint</span>
                    <textarea
                      value={lesson.debugHint}
                      onChange={event => updateLesson({ debugHint: event.target.value })}
                      className="h-20 w-full resize-none rounded-lg border border-slate-200 px-3 py-3 text-sm font-medium text-slate-900 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      placeholder="Gợi ý giúp user tìm bug"
                    />
                  </label>
                  <div>
                    <label className="mb-3 block text-sm font-black text-slate-700">Debug validation rules</label>
                    <div className="space-y-2 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50 p-3">
                      {(lesson.debugValidationRules || []).length === 0 ? (
                        <div className="text-xs font-bold text-slate-500">Chưa có rule</div>
                      ) : (
                        (lesson.debugValidationRules || []).map((rule: any, index: number) => (
                          <div key={index} className="flex items-start gap-2 rounded bg-white p-2">
                            <div className="flex-1 min-w-0">
                              <div className="text-xs font-bold text-slate-700">{rule.type}: {rule.value}</div>
                              {rule.description && <div className="text-xs text-slate-500">{rule.description}</div>}
                            </div>
                            <button
                              onClick={() => {
                                const newRules = (lesson.debugValidationRules || []).filter((_: any, i: number) => i !== index)
                                updateLesson({ debugValidationRules: newRules as any })
                              }}
                              className="rounded px-2 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                            >
                              ✕
                            </button>
                          </div>
                        ))
                      )}
                    </div>
                    <div className="mt-3 space-y-2">
                      <select
                        id="ruleType"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-bold outline-none"
                        defaultValue="rule"
                      >
                        <option value="rule">rule</option>
                        <option value="exact">exact</option>
                        <option value="regex">regex</option>
                        <option value="stdout">stdout</option>
                      </select>
                      <input
                        id="ruleValue"
                        type="text"
                        placeholder="Rule value"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      />
                      <input
                        id="ruleDesc"
                        type="text"
                        placeholder="Description (optional)"
                        className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      />
                      <button
                        onClick={() => {
                          const type = (document.getElementById('ruleType') as HTMLSelectElement)?.value || 'rule'
                          const value = (document.getElementById('ruleValue') as HTMLInputElement)?.value || ''
                          const description = (document.getElementById('ruleDesc') as HTMLInputElement)?.value || ''
                          if (!value.trim()) return
                          const newRules = [...(lesson.debugValidationRules || []), { type, value, description }]
                          updateLesson({ debugValidationRules: newRules as any })
                          ;(document.getElementById('ruleValue') as HTMLInputElement).value = ''
                          ;(document.getElementById('ruleDesc') as HTMLInputElement).value = ''
                        }}
                        className="w-full rounded-lg bg-teal-700 px-3 py-2 text-sm font-black text-white hover:bg-teal-800"
                      >
                        + Thêm rule
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-slate-950">Test cases</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Dùng cho bước Kiểm tra deterministic. Chạy thử vẫn chỉ execute code.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-black text-slate-600">
                {testCases.length}
              </span>
            </div>

            <div className="grid gap-5 lg:grid-cols-[1fr,360px]">
              <div className="space-y-3">
                {testCases.length === 0 && (
                  <div className="rounded-lg border border-dashed border-slate-200 p-6 text-center text-sm font-bold text-slate-500">
                    Chưa có test case.
                  </div>
                )}
                {testCases.map(testCase => (
                  <div key={testCase.id || testCase.order_index} className="rounded-lg border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="text-sm font-black text-slate-950">
                          #{testCase.order_index} {testCase.description}
                        </div>
                        <div className="mt-1 text-xs font-bold text-slate-500">
                          weight {testCase.weight ?? 10} / timeout {testCase.timeout ?? 1000}ms
                          {testCase.is_hidden ? ' / hidden' : ''}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditTestCase(testCase)}
                          className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-black text-slate-700 hover:bg-slate-50"
                        >
                          Sửa
                        </button>
                        <button
                          onClick={() => handleDeleteTestCase(testCase)}
                          className="rounded-lg border border-red-100 px-3 py-1.5 text-xs font-black text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <h3 className="mb-4 text-sm font-black uppercase tracking-widest text-slate-500">
                  {editingTestCase.id ? 'Sửa test case' : 'Thêm test case'}
                </h3>
                <div className="space-y-3">
                  <input
                    value={editingTestCase.description}
                    onChange={event => setEditingTestCase(current => ({ ...current, description: event.target.value }))}
                    placeholder="Mô tả test case"
                    className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                  />
                  <textarea
                    value={testInputText}
                    onChange={event => setTestInputText(event.target.value)}
                    className="h-24 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    placeholder="input JSON"
                  />
                  <textarea
                    value={expectedOutputText}
                    onChange={event => setExpectedOutputText(event.target.value)}
                    className="h-24 w-full resize-none rounded-lg border border-slate-200 px-3 py-2 font-mono text-xs outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                    placeholder="expected_output JSON/string"
                  />
                  <div className="grid grid-cols-3 gap-2">
                    <input
                      type="number"
                      value={editingTestCase.order_index}
                      onChange={event => setEditingTestCase(current => ({ ...current, order_index: Number(event.target.value) }))}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none"
                      placeholder="Order"
                    />
                    <input
                      type="number"
                      value={editingTestCase.weight ?? 10}
                      onChange={event => setEditingTestCase(current => ({ ...current, weight: Number(event.target.value) }))}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none"
                      placeholder="Weight"
                    />
                    <input
                      type="number"
                      value={editingTestCase.timeout ?? 1000}
                      onChange={event => setEditingTestCase(current => ({ ...current, timeout: Number(event.target.value) }))}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold outline-none"
                      placeholder="Timeout"
                    />
                  </div>
                  <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                    <input
                      type="checkbox"
                      checked={editingTestCase.is_hidden || false}
                      onChange={event => setEditingTestCase(current => ({ ...current, is_hidden: event.target.checked }))}
                      className="h-4 w-4 accent-teal-700"
                    />
                    Hidden test case
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSaveTestCase}
                      disabled={savingTestCase || !lesson.id}
                      className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-teal-700 px-3 py-2 text-sm font-black text-white hover:bg-teal-800 disabled:opacity-50"
                    >
                      <PlusCircle className="h-4 w-4" />
                      {savingTestCase ? 'Đang lưu...' : 'Lưu test case'}
                    </button>
                    <button
                      onClick={() => resetTestCaseForm()}
                      className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-black text-slate-700 hover:bg-white"
                    >
                      Clear
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>

        <aside className="space-y-5">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-slate-950">Settings</h2>
            <div className="space-y-4">
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">Status</span>
                <select
                  value={lesson.status}
                  onChange={event => updateLesson({ status: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none"
                >
                  <option value="draft">Draft (Bản nháp)</option>
                  <option value="published">Published (Công khai)</option>
                  <option value="archived">Archived (Đã lưu trữ)</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">Difficulty</span>
                <select
                  value={lesson.difficulty}
                  onChange={event => updateLesson({ difficulty: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none"
                >
                  <option value="beginner">beginner</option>
                  <option value="intermediate">intermediate</option>
                  <option value="advanced">advanced</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">Grading mode</span>
                <select
                  value={lesson.gradingMode}
                  onChange={event => updateLesson({ gradingMode: event.target.value })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none"
                >
                  <option value="stdout">stdout</option>
                  <option value="function">function</option>
                </select>
              </label>
              <label className="block">
                <span className="mb-2 block text-sm font-bold text-slate-600">Order</span>
                <input
                  type="number"
                  value={lesson.orderIndex}
                  onChange={event => updateLesson({ orderIndex: Number(event.target.value) })}
                  className="w-full rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-bold outline-none"
                />
              </label>
              <label className="flex items-center gap-2 text-sm font-bold text-slate-600">
                <input
                  type="checkbox"
                  checked={lesson.isAhaLesson}
                  onChange={event => updateLesson({ isAhaLesson: event.target.checked })}
                  className="h-4 w-4 accent-teal-700"
                />
                Aha lesson
              </label>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-slate-950">Quality</h2>
            <div className="space-y-2">
              {qualityIssues.length === 0 ? (
                <div className="flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm font-black text-green-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Ready
                </div>
              ) : (
                qualityIssues.map(issue => (
                  <div key={issue} className="flex items-center gap-2 rounded-lg bg-amber-50 p-3 text-sm font-black text-amber-700">
                    <AlertTriangle className="h-4 w-4" />
                    {issue}
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-black text-slate-950">QA Checklist</h2>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {(lesson.qaChecklist || []).length === 0 ? (
                <div className="rounded-lg border border-dashed border-slate-200 p-3 text-center text-xs font-bold text-slate-500">
                  Chưa có mục check
                </div>
              ) : (
                (lesson.qaChecklist || []).map((item: any, index: number) => (
                  <div key={item.id} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-slate-50 p-3">
                    <input
                      type="checkbox"
                      checked={item.checked || false}
                      onChange={() => handleToggleChecklistItem(item.id)}
                      className="mt-1 h-4 w-4 accent-teal-700"
                    />
                    <div className="flex-1 min-w-0">
                      <div className={`text-xs font-bold ${item.checked ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                        {item.label}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {index > 0 && (
                        <button
                          onClick={() => handleMoveChecklistItem(item.id, 'up')}
                          className="rounded px-1.5 py-1 text-xs font-bold text-slate-500 hover:bg-white"
                          title="Lên"
                        >
                          ↑
                        </button>
                      )}
                      {index < (lesson.qaChecklist || []).length - 1 && (
                        <button
                          onClick={() => handleMoveChecklistItem(item.id, 'down')}
                          className="rounded px-1.5 py-1 text-xs font-bold text-slate-500 hover:bg-white"
                          title="Xuống"
                        >
                          ↓
                        </button>
                      )}
                      <button
                        onClick={() => handleDeleteChecklistItem(item.id)}
                        className="rounded px-1.5 py-1 text-xs font-bold text-red-600 hover:bg-red-50"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
            <div className="mt-3 flex gap-2">
              <input
                value={newChecklistItem}
                onChange={event => setNewChecklistItem(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') {
                    handleAddChecklistItem()
                  }
                }}
                placeholder="Thêm mục check..."
                className="flex-1 rounded-lg border border-slate-200 px-2.5 py-2 text-xs font-semibold outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
              <button
                onClick={handleAddChecklistItem}
                className="rounded-lg bg-teal-700 px-3 py-2 text-xs font-black text-white hover:bg-teal-800"
              >
                +
              </button>
            </div>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <h2 className="mb-2 flex items-center gap-2 text-lg font-black text-slate-950">
              <Code className="h-5 w-5 text-teal-700" />
              Rule nhắc lại
            </h2>
            <p className="text-sm font-medium leading-6 text-slate-600">
              `Chạy thử` chỉ execute code. `Kiểm tra` mới validate bằng test case/rule. Lesson chỉ hoàn thành sau khi backend lưu progress thành công.
            </p>
          </section>
        </aside>
      </div>
    </div>
  )
}

export default LessonEditorPage
