import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  Edit3,
  PlusCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react'
import apiClient from '../../services/admin/apiClient'

interface PracticeSet {
  id: string
  title: string
  description?: string
  topic?: string
  languageId?: string
  difficulty: 'easy' | 'medium' | 'hard'
  visibility: 'public' | 'private' | 'unlisted' | 'official'
  status: 'draft' | 'published'
  questionCount: number
  createdBy: string
  createdAt: string
  updatedAt: string
}

interface PracticeStats {
  totalSets?: number
  officialSets?: number
  publishedSets?: number
  draftSets?: number
}

const PracticeStatsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-4">
    {Array.from({ length: 4 }).map((_, index) => (
      <div key={index} className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
        <div className="h-4 w-28 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-8 w-16 animate-pulse rounded bg-slate-100" />
      </div>
    ))}
  </div>
)

const PracticeTableSkeleton = () => (
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
          <div className="mt-2 h-3 w-24 animate-pulse rounded bg-slate-100" />
        </td>
        <td className="px-5 py-4">
          <div className="flex justify-end gap-2">
            {Array.from({ length: 2 }).map((_, actionIndex) => (
              <div key={actionIndex} className="h-9 w-9 animate-pulse rounded-lg bg-slate-100" />
            ))}
          </div>
        </td>
      </tr>
    ))}
  </>
)

const statusClass = (status: PracticeSet['status']) =>
  status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'

const visibilityClass = (visibility: PracticeSet['visibility']) =>
  visibility === 'official' ? 'bg-purple-100 text-purple-700' :
  visibility === 'public' ? 'bg-sky-100 text-sky-700' :
  visibility === 'unlisted' ? 'bg-slate-100 text-slate-600' :
  'bg-slate-100 text-slate-600'

const difficultyClass = (difficulty: PracticeSet['difficulty']) =>
  difficulty === 'easy' ? 'bg-green-50 text-green-700' :
  difficulty === 'medium' ? 'bg-amber-50 text-amber-700' :
  'bg-red-50 text-red-700'

export function AdminPracticePage() {
  const navigate = useNavigate()
  const [sets, setSets] = useState<PracticeSet[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  const [filters, setFilters] = useState({
    status: 'all' as 'all' | 'draft' | 'published',
    visibility: 'all' as 'all' | 'public' | 'private' | 'unlisted' | 'official',
    difficulty: 'all' as 'all' | 'easy' | 'medium' | 'hard',
  })

  const [stats, setStats] = useState<PracticeStats | null>(null)

  useEffect(() => {
    let isMounted = true

    const fetchSets = async () => {
      try {
        setLoading(true)
        setError(null)
        const params: Record<string, string> = {}
        if (filters.status !== 'all') params.status = filters.status
        if (filters.visibility !== 'all') params.visibility = filters.visibility
        if (filters.difficulty !== 'all') params.difficulty = filters.difficulty

        const response = await apiClient.get('/api/admin/practice/sets', { params })
        if (isMounted) {
          setSets(response.data.data.items)
        }
      } catch (err: any) {
        if (isMounted) {
          setError(err.response?.data?.message || err.message || 'Không thể tải danh sách practice sets')
        }
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }

    fetchSets()

    return () => {
      isMounted = false
    }
  }, [filters, reloadKey])

  useEffect(() => {
    let isMounted = true

    const fetchStats = async () => {
      try {
        const response = await apiClient.get('/api/admin/practice/stats')
        if (isMounted) {
          setStats(response.data.data)
        }
      } catch (err) {
        console.error('Failed to fetch practice stats:', err)
      }
    }

    fetchStats()

    return () => {
      isMounted = false
    }
  }, [reloadKey])

  const filteredSets = useMemo(() => {
    const keyword = search.trim().toLowerCase()
    if (!keyword) return sets

    return sets.filter(set =>
      [set.title, set.topic, set.description, set.languageId, set.difficulty, set.visibility, set.status]
        .filter(Boolean)
        .some(value => String(value).toLowerCase().includes(keyword))
    )
  }, [sets, search])

  const handleDelete = async (practiceSet: PracticeSet) => {
    const setName = practiceSet.title || practiceSet.id
    const confirmed = window.confirm(`Xóa practice set "${setName}"? Hành động này không thể hoàn tác.`)
    if (!confirmed) return

    setDeletingId(practiceSet.id)
    setError(null)

    try {
      await apiClient.delete(`/api/admin/practice/sets/${practiceSet.id}`)
      setSets(current => current.filter(set => set.id !== practiceSet.id))
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể xóa practice set')
    } finally {
      setDeletingId(null)
    }
  }

  const handleStatusChange = async (setId: string, newStatus: PracticeSet['status']) => {
    try {
      await apiClient.put(`/api/admin/practice/sets/${setId}/status`, { status: newStatus })
      setSets(current => current.map(set => set.id === setId ? { ...set, status: newStatus } : set))
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể cập nhật trạng thái')
    }
  }

  const handleVisibilityChange = async (setId: string, newVisibility: PracticeSet['visibility']) => {
    try {
      await apiClient.put(`/api/admin/practice/sets/${setId}/visibility`, { visibility: newVisibility })
      setSets(current => current.map(set => set.id === setId ? { ...set, visibility: newVisibility } : set))
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Không thể cập nhật visibility')
    }
  }


  const shouldShowSkeleton = loading

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-teal-700">
            <BookOpen className="h-3.5 w-3.5" />
            Content manager
          </div>
          <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
            Practice Sets
          </h1>
          <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
            Quản lý practice sets dùng cho PvP và chế độ luyện tập của người học.
          </p>
        </div>

        <button
          onClick={() => navigate('/admin/practice/new')}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-700 px-4 py-3 text-sm font-black text-white shadow-sm transition-colors hover:bg-teal-800"
        >
          <PlusCircle className="h-4 w-4" />
          Tạo practice set
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-700">
          <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {shouldShowSkeleton && !stats ? (
        <PracticeStatsSkeleton />
      ) : (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Tổng practice sets</p>
            <p className="mt-2 text-3xl font-black text-slate-950">{stats?.totalSets ?? sets.length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Official cho PvP</p>
            <p className="mt-2 text-3xl font-black text-purple-700">{stats?.officialSets ?? sets.filter(set => set.visibility === 'official').length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Published</p>
            <p className="mt-2 text-3xl font-black text-green-700">{stats?.publishedSets ?? sets.filter(set => set.status === 'published').length}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-bold text-slate-500">Draft</p>
            <p className="mt-2 text-3xl font-black text-amber-700">{stats?.draftSets ?? sets.filter(set => set.status === 'draft').length}</p>
          </div>
        </div>
      )}

      <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
        <div className="grid gap-4 border-b border-slate-200 p-5 lg:grid-cols-[minmax(220px,260px),minmax(220px,260px),minmax(220px,260px),1fr,auto]">
          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              Trạng thái
            </span>
            <select
              value={filters.status}
              onChange={event => setFilters({ ...filters, status: event.target.value as typeof filters.status })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            >
              <option value="all">Tất cả</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              Visibility
            </span>
            <select
              value={filters.visibility}
              onChange={event => setFilters({ ...filters, visibility: event.target.value as typeof filters.visibility })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            >
              <option value="all">Tất cả</option>
              <option value="official">Official</option>
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="unlisted">Unlisted</option>
            </select>
          </label>

          <label className="block">
            <span className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-500">
              Độ khó
            </span>
            <select
              value={filters.difficulty}
              onChange={event => setFilters({ ...filters, difficulty: event.target.value as typeof filters.difficulty })}
              className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-bold text-slate-900 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            >
              <option value="all">Tất cả</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
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
                placeholder="Tìm theo title, topic, language, visibility..."
                className="w-full rounded-lg border border-slate-200 bg-white py-2.5 pl-10 pr-3 text-sm font-semibold text-slate-900 outline-none transition-colors placeholder:text-slate-400 focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </div>
          </label>

          <div className="flex items-end">
            <button
              onClick={() => setReloadKey(current => current + 1)}
              disabled={loading}
              className="inline-flex h-[42px] items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                  Practice set
                </th>
                <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                  Availability
                </th>
                <th className="px-5 py-3 text-left text-xs font-black uppercase tracking-widest text-slate-500">
                  Questions
                </th>
                <th className="px-5 py-3 text-right text-xs font-black uppercase tracking-widest text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {shouldShowSkeleton && <PracticeTableSkeleton />}

              {!shouldShowSkeleton && filteredSets.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-5 py-10 text-center text-sm font-bold text-slate-500">
                    Không có practice set phù hợp.
                  </td>
                </tr>
              )}

              {!shouldShowSkeleton && filteredSets.map(practiceSet => (
                <tr key={practiceSet.id} className="hover:bg-slate-50/80">
                  <td className="max-w-xl px-5 py-4">
                    <div className="flex items-start gap-3">
                      <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600">
                        {practiceSet.questionCount ?? 0}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-black text-slate-950">
                            {practiceSet.title || 'Untitled practice set'}
                          </div>
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${difficultyClass(practiceSet.difficulty)}`}>
                            {practiceSet.difficulty}
                          </span>
                        </div>
                        <div className="mt-1 text-sm font-semibold text-slate-500">
                          {practiceSet.topic || practiceSet.languageId || 'missing-topic'}
                        </div>
                        {practiceSet.description && (
                          <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-600">
                            {practiceSet.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex flex-wrap gap-1.5">
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${statusClass(practiceSet.status)}`}>
                        {practiceSet.status === 'published' && <CheckCircle2 className="h-3.5 w-3.5" />}
                        {practiceSet.status}
                      </span>
                      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-black ${visibilityClass(practiceSet.visibility)}`}>
                        {practiceSet.visibility === 'official' && <ShieldCheck className="h-3.5 w-3.5" />}
                        {practiceSet.visibility}
                      </span>
                    </div>
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      <select
                        value={practiceSet.status}
                        onChange={event => handleStatusChange(practiceSet.id, event.target.value as PracticeSet['status'])}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-900 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                      </select>
                      <select
                        value={practiceSet.visibility}
                        onChange={event => handleVisibilityChange(practiceSet.id, event.target.value as PracticeSet['visibility'])}
                        className="rounded-lg border border-slate-200 bg-white px-2.5 py-2 text-xs font-bold text-slate-900 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
                      >
                        <option value="private">Private</option>
                        <option value="public">Public</option>
                        <option value="unlisted">Unlisted</option>
                        <option value="official">Official</option>
                      </select>
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="text-sm font-black text-slate-950">
                      {practiceSet.questionCount || 0} câu hỏi
                    </div>
                    <div className="mt-1 text-xs font-bold text-slate-500">
                      Dùng cho Practice{practiceSet.visibility === 'official' ? ' + PvP' : ''}
                    </div>
                    <div className="mt-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                      {practiceSet.languageId || 'any-language'}
                    </div>
                  </td>

                  <td className="px-5 py-4">
                    <div className="flex justify-end gap-2">
                      <button
                        onClick={() => navigate(`/admin/practice/${practiceSet.id}`)}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-600 transition-colors hover:bg-teal-50 hover:text-teal-700"
                        aria-label="Sửa practice set"
                      >
                        <Edit3 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(practiceSet)}
                        disabled={deletingId === practiceSet.id}
                        className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-100 text-red-600 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Xóa practice set"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

    </div>
  )
}

export default AdminPracticePage
