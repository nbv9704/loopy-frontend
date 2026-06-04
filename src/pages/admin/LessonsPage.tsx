import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Edit3,
  ExternalLink,
  PlusCircle,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'
import { contentService } from '../../services/admin/content.service'

interface AdminChapter {
  id: string
  language_id?: string
  title?: string
  order_index?: number
}

interface AdminLesson {
  id: string
  chapter_id: string
  lesson_id?: string
  title?: string
  description?: string
  starter_code?: string
  task_description?: string
  hint?: string
  common_mistakes?: string
  solution_code?: string
  grading_mode?: string
  validation_type?: string
  difficulty?: string
  status?: string
  order_index?: number
  test_case_count?: number
}

const requiredFields: Array<{ key: keyof AdminLesson; label: string }> = [
  { key: 'title', label: 'title' },
  { key: 'starter_code', label: 'starter code' },
  { key: 'task_description', label: 'task' },
  { key: 'solution_code', label: 'solution' },
]

const getMissingFields = (lesson: AdminLesson) =>
  requiredFields.filter(field => !String(lesson[field.key] || '').trim()).map(field => field.label)

const getQualityIssues = (lesson: AdminLesson) => {
  const issues = getMissingFields(lesson)

  if ((lesson.test_case_count || 0) === 0) {
    issues.push('test case')
  }

  return issues
}

const LessonStatsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-3">
    {Array.from({ length: 3 }).map((_, index) => (
      <div key={index} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-100" />
        {index === 2 && <div className="mt-2 h-3 w-28 animate-pulse rounded bg-slate-100" />}
      </div>
    ))}
  </div>
)

const LessonTableSkeleton = () => (
  <>
    {Array.from({ length: 5 }).map((_, index) => (
      <tr key={index}>
        <td className="max-w-xl px-5 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-1 h-8 w-8 shrink-0 animate-pulse rounded-lg bg-slate-100" />
            <div className="w-full space-y-2">
              <div className="h-4 w-56 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-32 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-full max-w-md animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        </td>
        <td className="px-5 py-4">
          <div className="h-7 w-24 animate-pulse rounded-full bg-slate-100" />
        </td>
        <td className="px-5 py-4">
          <div className="h-4 w-20 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-16 animate-pulse rounded bg-slate-100" />
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-slate-100" />
        </td>
        <td className="px-5 py-4">
          <div className="flex justify-end gap-2">
            {Array.from({ length: 3 }).map((_, actionIndex) => (
              <div key={actionIndex} className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        </td>
      </tr>
    ))}
  </>
)

const LessonsPage: React.FC = () => {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const filter = searchParams.get('filter')
  const [chapters, setChapters] = useState<AdminChapter[]>([])
  const [selectedChapterId, setSelectedChapterId] = useState<string>('')
  const [lessons, setLessons] = useState<AdminLesson[]>([])
  const [search, setSearch] = useState('')
  const [isLoadingChapters, setIsLoadingChapters] = useState(true)
  const [isLoadingLessons, setIsLoadingLessons] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    let isMounted = true

    const loadChapters = async () => {
      setIsLoadingChapters(true)
      setError(null)

      try {
        const data = await contentService.getChapters()
        if (!isMounted) return

        setChapters(data)
        if (filter) {
          setSelectedChapterId('all')
        } else {
          setSelectedChapterId(current => current || data[0]?.id || '')
        }
      } catch (err) {
        if (!isMounted) return
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách chapter')
      } finally {
        if (isMounted) {
          setIsLoadingChapters(false)
        }
      }
    }

    loadChapters()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedChapterId) {
      setLessons([])
      return
    }

    let isMounted = true

    const loadLessons = async () => {
      setIsLoadingLessons(true)
      setError(null)

      try {
        const data = await contentService.getLessons(selectedChapterId)
        if (isMounted) {
          setLessons(data)
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'Không thể tải danh sách lesson')
        }
      } finally {
        if (isMounted) {
          setIsLoadingLessons(false)
        }
      }
    }

    loadLessons()

    return () => {
      isMounted = false
    }
  }, [selectedChapterId, reloadKey])

  const selectedChapter = chapters.find(chapter => chapter.id === selectedChapterId)

  const filteredLessons = useMemo(() => {
    let result = lessons

    if (filter === 'missing-required-fields') {
      result = result.filter(lesson => getMissingFields(lesson).length > 0)
    } else if (filter === 'missing-test-case') {
      result = result.filter(lesson => (lesson.test_case_count || 0) === 0)
    } else if (filter === 'missing-hint') {
      result = result.filter(lesson => !String(lesson.hint || '').trim())
    }

    const keyword = search.trim().toLowerCase()
    if (!keyword) return result

    return result.filter(lesson =>
      [lesson.title, lesson.lesson_id, lesson.difficulty, lesson.grading_mode]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(keyword))
    )
  }, [lessons, search, filter])

  const lessonsMissingRequiredFields = lessons.filter(lesson => getMissingFields(lesson).length > 0)
  const lessonsWithoutHint = lessons.filter(lesson => !String(lesson.hint || '').trim())
  const lessonsWithoutTestCases = lessons.filter(lesson => (lesson.test_case_count || 0) === 0)
  const shouldShowLessonSkeleton = isLoadingChapters || isLoadingLessons

  const handleDelete = async (lesson: AdminLesson) => {
    const lessonName = lesson.title || lesson.lesson_id || lesson.id
    const confirmed = window.confirm(`Xóa lesson "${lessonName}"? Hành động này không thể hoàn tác.`)
    if (!confirmed) return

    setDeletingId(lesson.id)
    setError(null)

    try {
      await contentService.deleteLesson(lesson.id)
      setLessons(current => current.filter(item => item.id !== lesson.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể xóa lesson')
    } finally {
      setDeletingId(null)
    }
  }

  const openLearnerLesson = (lesson: AdminLesson) => {
    if (!selectedChapter?.language_id || !lesson.lesson_id) return
    window.open(`/learn/${selectedChapter.language_id}/${lesson.lesson_id}`, '_blank')
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-teal-700">
            <BookOpen className="h-3.5 w-3.5" />
            Content manager
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Lessons
          </h1>
          <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
            Quản lý lesson theo chapter, rà nhanh nội dung thiếu và mở editor để sửa.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/lessons/new')}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-teal-800"
        >
          <PlusCircle className="h-4 w-4" />
          Tạo lesson
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {shouldShowLessonSkeleton ? (
        <LessonStatsSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Lessons trong chapter</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{lessons.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Cần kiểm tra</p>
            <p className="mt-2 text-3xl font-black text-amber-700">
              {lessonsMissingRequiredFields.length}
            </p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Thiếu test case</p>
            <p className="mt-2 text-3xl font-black text-slate-950">
              {lessonsWithoutTestCases.length}
            </p>
            <p className="mt-1 text-xs font-bold text-slate-400">
              {lessonsWithoutHint.length} lesson chưa có hint
            </p>
          </div>
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[minmax(260px,360px),1fr,auto]">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              Chapter
            </span>
            <select
              value={selectedChapterId}
              onChange={event => {
                setSelectedChapterId(event.target.value)
                if (filter) {
                  searchParams.delete('filter')
                  setSearchParams(searchParams)
                }
              }}
              disabled={isLoadingChapters}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            >
              <option value="all">Tất cả chapters</option>
              {chapters.map(chapter => (
                <option key={chapter.id} value={chapter.id}>
                  {chapter.language_id || 'unknown'} - {chapter.title || chapter.id}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              Search
            </span>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={event => setSearch(event.target.value)}
                placeholder="Tìm theo title, slug, difficulty, grading..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </label>

          <div className="flex items-end">
            <button
              onClick={() => setReloadKey(current => current + 1)}
              disabled={isLoadingLessons || !selectedChapterId}
              className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${isLoadingLessons ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                  Lesson
                </th>
                <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                  Quality
                </th>
                <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                  Validation
                </th>
                <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {shouldShowLessonSkeleton && <LessonTableSkeleton />}

              {!shouldShowLessonSkeleton && filteredLessons.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm font-bold text-slate-500">
                    Không có lesson phù hợp.
                  </td>
                </tr>
              )}

              {!shouldShowLessonSkeleton &&
                filteredLessons.map(lesson => {
                  const qualityIssues = getQualityIssues(lesson)
                  const isComplete = qualityIssues.length === 0

                  return (
                    <tr key={lesson.id} className="hover:bg-slate-50/80">
                      <td className="max-w-xl px-5 py-4">
                        <div className="flex items-start gap-3">
                          <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600">
                            {lesson.order_index ?? '-'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <div className="font-black text-slate-950">
                                {lesson.title || 'Untitled lesson'}
                              </div>
                              <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                lesson.status === 'published' ? 'bg-green-100 text-green-700' :
                                lesson.status === 'archived' ? 'bg-slate-100 text-slate-600' :
                                'bg-amber-100 text-amber-700'
                              }`}>
                                {lesson.status || 'draft'}
                              </span>
                            </div>
                            <div className="mt-1 text-sm font-semibold text-slate-500">
                              {lesson.lesson_id || 'missing-slug'}
                            </div>
                            {lesson.description && (
                              <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-600">
                                {lesson.description}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        {isComplete ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-green-50 px-2.5 py-1 text-xs font-black text-green-700">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Ready
                          </span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {qualityIssues.map(field => (
                              <span
                                key={field}
                                className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-black text-amber-700"
                              >
                                Thiếu {field}
                              </span>
                            ))}
                          </div>
                        )}
                      </td>

                      <td className="px-5 py-4">
                        <div className="text-sm font-black text-slate-950">
                          {lesson.grading_mode || 'stdout'}
                        </div>
                        <div className="mt-1 text-xs font-bold text-slate-500">
                          {lesson.test_case_count || 0} test case
                        </div>
                        <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                          {lesson.validation_type || 'rule'} / {lesson.difficulty || 'beginner'}
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openLearnerLesson(lesson)}
                            disabled={!selectedChapter?.language_id || !lesson.lesson_id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-slate-50 hover:text-slate-950 disabled:cursor-not-allowed disabled:opacity-40"
                            aria-label="Mở lesson người học"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => navigate(`/admin/lessons/${lesson.id}`)}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-700"
                            aria-label="Sửa lesson"
                          >
                            <Edit3 className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(lesson)}
                            disabled={deletingId === lesson.id}
                            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label="Xóa lesson"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}

export default LessonsPage
