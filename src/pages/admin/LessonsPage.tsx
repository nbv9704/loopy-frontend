import AdminButton from '../../components/admin/AdminButton'
import AdminLink from '../../components/admin/AdminLink'
import { Archive, ExternalLink, FilterX, Pencil, Plus, RefreshCw } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import AdminTable from '../../components/admin/AdminTable'
import { adminButtonClassName, adminControl } from '../../components/admin/adminStyles'
import { useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../../store/admin/authStore'
import ResourceError from '../../components/admin/ResourceError'
import CatalogPagination from '../../components/admin/CatalogPagination'
import { useCatalogPage } from '../../hooks/admin/useCatalogPage'
import { useLessonCatalog } from '../../features/admin-lessons/useLessonCatalog'
import { LessonStatus, missingCodeFields } from '../../features/admin-lessons/catalog.service'

function LessonCatalog() {
  const [params] = useSearchParams()
  const initial = params.get('status')
  const state = useLessonCatalog(
    ['draft', 'published', 'archived', 'all'].includes(initial || '')
      ? (initial as LessonStatus)
      : 'active'
  )
  const [search, setSearch] = useState('')
  const quality = params.get('filter')
  const rows = state.lessons.data ?? []
  const filtered = rows.filter(item => {
    if (quality === 'missing-required-fields' && !missingCodeFields(item).length) return false
    if (quality === 'missing-test-case' && item.test_case_count !== 0) return false
    if (quality === 'missing-hint' && item.hint?.trim()) return false
    if (!search.trim()) return true
    return [item.title, item.lesson_id, item.difficulty, item.grading_mode].some(value =>
      value?.toLowerCase().includes(search.trim().toLowerCase())
    )
  })
  const paging = useCatalogPage(
    filtered,
    JSON.stringify([state.chapterId, state.status, quality, search])
  )
  const loadError = state.chapters.error || state.lessons.error
  const loading = state.chapters.loading || state.lessons.loading
  const loaded = state.lessons.data !== null && !loadError && !loading
  const control = adminControl
  return (
    <div className="min-w-0 space-y-5">
      <AdminPageHeader
        title="Lessons"
        eyebrow="Nội dung học"
        description="Rà nội dung theo chapter; các chỉ dấu không thay thế kiểm tra lesson thực tế."
        actions={
          <AdminLink to="/admin/lessons/new" variant="primary">
            <Plus size={16} aria-hidden="true" />
            Tạo lesson
          </AdminLink>
        }
      />
      {state.error && <ResourceError error={state.error} retry={state.lessons.retry} />}
      {state.message && (
        <p role="status" className="text-teal-700">
          {state.message}
        </p>
      )}
      <AdminFilterBar>
        <label className="col-span-2 grid min-w-0 gap-1 xl:col-span-1">
          Search
          <input
            className={`${control} min-w-0 w-full`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Title, slug, difficulty..."
          />
        </label>
        <label className="col-span-2 grid min-w-0 gap-1 sm:col-span-1">
          Chapter
          <select
            className={control}
            value={state.chapterId}
            disabled={state.chapters.loading || !!state.chapters.error || state.action.pending}
            onChange={e => state.setChapterId(e.target.value)}
          >
            <option value="all">Tất cả chapters</option>
            {state.chapters.data?.map(item => (
              <option key={item.id} value={item.id}>
                {item.language_id || 'Không rõ ngôn ngữ'} — {item.title || item.id}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          Status
          <select
            className={control}
            value={state.status}
            disabled={state.action.pending}
            onChange={e => state.setStatus(e.target.value as LessonStatus)}
          >
            <option value="active">Active + draft</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
            <option value="all">Tất cả status</option>
          </select>
        </label>

        <AdminButton
          disabled={loading || state.action.pending}
          onClick={() => {
            state.chapters.retry()
            state.lessons.retry()
          }}
        >
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </AdminButton>
      </AdminFilterBar>
      {quality && (
        <p className="text-sm">
          Bộ lọc rà nội dung: {quality}.{' '}
          <AdminLink to="/admin/lessons">
            <FilterX size={16} aria-hidden="true" />
            Xóa bộ lọc
          </AdminLink>
        </p>
      )}
      {loadError ? (
        <ResourceError
          error={loadError}
          retry={state.chapters.error ? state.chapters.retry : state.lessons.retry}
        />
      ) : loading ? (
        <p role="status">Đang tải lessons...</p>
      ) : (
        loaded && (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                ['Lesson trong bộ lọc', rows.length],
                ['Thiếu trường code', rows.filter(item => missingCodeFields(item).length).length],
                ['Chưa có test case', rows.filter(item => item.test_case_count === 0).length],
              ].map(([label, count]) => (
                <div key={label} className="rounded-lg border bg-white p-4">
                  <p className="text-sm text-slate-600">{label}</p>
                  <p className="text-2xl font-black">{count}</p>
                </div>
              ))}
            </div>
            <p className="text-sm text-slate-600">
              Starter/task/solution là tín hiệu rà code. Lesson concept/answer có thể không cần các
              trường này hoặc test case; không gắn nhãn Ready tự động.
            </p>
            <AdminTable
              headings={['Lesson', 'Rà nội dung', 'Validation', 'Thao tác']}
              label="Lessons catalog"
            >
              {!filtered.length ? (
                <tr>
                  <td className="p-8 text-center" colSpan={4}>
                    Không có lesson phù hợp.
                  </td>
                </tr>
              ) : (
                paging.visible.map(item => {
                  const chapter = state.chapters.data?.find(row => row.id === item.chapter_id)
                  const url =
                    item.status === 'published' && chapter?.language_id && item.lesson_id
                      ? `/learn/${encodeURIComponent(chapter.language_id)}/${encodeURIComponent(item.lesson_id)}`
                      : null
                  return (
                    <tr key={item.id} className="border-t">
                      <td data-label="Lesson" className="max-w-md break-words p-4">
                        <p
                          className="line-clamp-3 break-words font-bold"
                          title={item.title || 'Chưa có title'}
                        >
                          {item.order_index}. {item.title || 'Chưa có title'}
                        </p>
                        <p>{item.lesson_id || item.id}</p>
                        <p className="text-slate-500">
                          {item.status} · {item.lesson_type || 'Không rõ loại'}
                        </p>
                      </td>
                      <td data-label="Rà nội dung" className="p-4">
                        {missingCodeFields(item).length
                          ? `Thiếu trường code: ${missingCodeFields(item).join(', ')}`
                          : 'Đủ trường code cơ bản'}
                        <p>{item.hint?.trim() ? 'Có hint' : 'Chưa có hint'}</p>
                      </td>
                      <td data-label="Validation" className="p-4">
                        {item.test_case_count} test case
                        <p>
                          {item.validation_type || 'Chưa rõ checker'} /{' '}
                          {item.grading_mode || 'Chưa rõ grading'}
                        </p>
                      </td>
                      <td data-label="Thao tác" className="p-4">
                        <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                          {url ? (
                            <a
                              href={url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={adminButtonClassName()}
                              aria-label={`Mở lesson người học ${item.title || item.id}`}
                              title="Xem giao diện người học trong tab mới"
                            >
                              <ExternalLink size={14} aria-hidden="true" />
                              Xem bài
                            </a>
                          ) : (
                            <span className="text-slate-500">
                              Chỉ mở learner khi đã published và có ngôn ngữ
                            </span>
                          )}
                          <AdminLink
                            to={`/admin/lessons/${item.id}`}
                            aria-label={`Sửa lesson ${item.title || item.id}`}
                          >
                            <Pencil size={14} aria-hidden="true" />
                            Sửa
                          </AdminLink>
                          <AdminButton
                            size="icon"
                            title={`Lưu trữ lesson ${item.title || item.id}`}
                            disabled={state.action.pending || item.status === 'archived'}
                            onClick={() => state.archive(item)}
                            aria-label={`Lưu trữ lesson ${item.title || item.id}`}
                          >
                            <Archive size={16} aria-hidden="true" />
                          </AdminButton>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </AdminTable>
            <CatalogPagination
              page={paging.page}
              total={filtered.length}
              onChange={paging.setPage}
              disabled={state.action.pending}
            />
          </>
        )
      )}
    </div>
  )
}
export default function LessonsPage() {
  const revision = useAuthStore(state => state.sessionRevision),
    location = useLocation()
  return <LessonCatalog key={`${revision}:${location.key}`} />
}
