import AdminButton from '../../components/admin/AdminButton'
import AdminLink from '../../components/admin/AdminLink'
import { Archive, Pencil, Plus, RefreshCw } from 'lucide-react'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import AdminTable from '../../components/admin/AdminTable'
import { adminControl } from '../../components/admin/adminStyles'
import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/admin/authStore'
import ResourceError from '../../components/admin/ResourceError'
import CatalogPagination from '../../components/admin/CatalogPagination'
import { useCatalogPage } from '../../hooks/admin/useCatalogPage'
import { usePracticeCatalog } from '../../features/admin-practice/usePracticeCatalog'
import {
  AdminPracticeSet,
  PracticeFilters,
  practiceCatalogService,
} from '../../features/admin-practice/catalog.service'

function PracticeCatalog() {
  const state = usePracticeCatalog(),
    [search, setSearch] = useState('')
  const filtered = (state.list.data ?? []).filter(item =>
    [
      item.title,
      item.topic,
      item.description,
      item.languageId,
      item.difficulty,
      item.visibility,
      item.status,
    ].some(value => value?.toLowerCase().includes(search.trim().toLowerCase()))
  )
  const paging = useCatalogPage(filtered, JSON.stringify([state.filters, search]))
  const control = adminControl
  const changeFilter = (key: keyof PracticeFilters, value: string) =>
    state.setFilters({ ...state.filters, [key]: value })
  return (
    <div className="min-w-0 space-y-5">
      <AdminPageHeader
        title="Practice Sets"
        eyebrow="Nội dung học"
        description="Quản lý bộ luyện tập, trạng thái và phạm vi chia sẻ. Official + published chưa bảo đảm ngân hàng câu hỏi PvP hợp lệ."
        actions={
          <AdminLink to="/admin/practice/new" variant="primary">
            <Plus size={16} aria-hidden="true" />
            Tạo practice set
          </AdminLink>
        }
      />
      {state.error && (
        <ResourceError
          error={state.error}
          retry={() => {
            state.list.retry()
            state.stats.retry()
          }}
        />
      )}
      {state.message && (
        <p role="status" className="text-teal-700">
          {state.message}
        </p>
      )}
      <section aria-label="Thống kê Practice" className="space-y-2">
        <p className="text-sm text-slate-600">
          Thống kê toàn bộ Practice, độc lập với bộ lọc danh sách.
        </p>
        {state.stats.loading ? (
          <p role="status">Đang tải thống kê...</p>
        ) : state.stats.error ? (
          <ResourceError error={state.stats.error} retry={state.stats.retry} />
        ) : (
          state.stats.data && (
            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {[
                ['Tổng practice sets', state.stats.data.totalSets],
                ['Official', state.stats.data.officialSets],
                ['Published', state.stats.data.publishedSets],
                ['Draft', state.stats.data.draftSets],
              ].map(([label, count]) => (
                <div className="rounded-lg border bg-white p-4" key={label}>
                  <p className="text-sm text-slate-600">{label}</p>
                  <p className="text-2xl font-black">{count}</p>
                </div>
              ))}
            </div>
          )
        )}
      </section>
      <AdminFilterBar>
        <label className="col-span-2 grid min-w-0 gap-1 xl:col-span-1">
          Search
          <input
            className={`${control} min-w-0 w-full`}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Title, topic, language..."
          />
        </label>
        <label className="grid gap-1">
          Trạng thái
          <select
            className={control}
            disabled={state.action.pending}
            value={state.filters.status}
            onChange={e => changeFilter('status', e.target.value)}
          >
            <option value="active">Active + draft</option>
            {['all', 'draft', 'published', 'archived'].map(value => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          Visibility
          <select
            className={control}
            disabled={state.action.pending}
            value={state.filters.visibility}
            onChange={e => changeFilter('visibility', e.target.value)}
          >
            {['all', 'official', 'public', 'private', 'unlisted'].map(value => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>
        <label className="grid gap-1">
          Độ khó
          <select
            className={control}
            disabled={state.action.pending}
            value={state.filters.difficulty}
            onChange={e => changeFilter('difficulty', e.target.value)}
          >
            {['all', 'easy', 'medium', 'hard'].map(value => (
              <option key={value}>{value}</option>
            ))}
          </select>
        </label>

        <AdminButton
          disabled={state.list.loading || state.action.pending}
          onClick={() => {
            state.list.retry()
            state.stats.retry()
          }}
        >
          <RefreshCw size={16} aria-hidden="true" />
          Refresh
        </AdminButton>
      </AdminFilterBar>
      {state.list.loading ? (
        <p role="status">Đang tải đầy đủ catalog...</p>
      ) : state.list.error ? (
        <ResourceError error={state.list.error} retry={state.list.retry} />
      ) : (
        state.list.data && (
          <>
            <p className="text-sm">
              Đã tải {state.list.data.length} set trong bộ lọc. Tìm kiếm trên toàn bộ tập này.
            </p>
            <AdminTable
              headings={['Practice set', 'Trạng thái / visibility', 'Câu hỏi', 'Thao tác']}
              label="Practice Sets catalog"
            >
              {!filtered.length ? (
                <tr>
                  <td className="p-8 text-center" colSpan={4}>
                    Không có practice set phù hợp.
                  </td>
                </tr>
              ) : (
                paging.visible.map(item => (
                  <tr key={item.id} className="border-t">
                    <td data-label="Practice set" className="max-w-sm break-words p-4">
                      <p className="line-clamp-3 break-words font-bold" title={item.title}>
                        {item.title}
                      </p>
                      <p className="text-slate-500">
                        {item.topic} · {item.languageId || 'Không gắn ngôn ngữ'}
                      </p>
                      <p>{item.difficulty}</p>
                    </td>
                    <td data-label="Trạng thái / visibility" className="p-4">
                      <div className="grid gap-2">
                        <label className="grid gap-1">
                          Trạng thái
                          <select
                            aria-label={`Trạng thái ${item.title}`}
                            className={control}
                            disabled={state.action.pending}
                            value={item.status}
                            onChange={e =>
                              state.perform(
                                () =>
                                  practiceCatalogService.status(
                                    item,
                                    e.target.value as AdminPracticeSet['status']
                                  ),
                                'Đã cập nhật trạng thái.'
                              )
                            }
                          >
                            {['draft', 'published', 'archived'].map(value => (
                              <option key={value}>{value}</option>
                            ))}
                          </select>
                        </label>
                        <label className="grid gap-1">
                          Visibility
                          <select
                            aria-label={`Visibility ${item.title}`}
                            className={control}
                            disabled={state.action.pending}
                            value={item.visibility}
                            onChange={e =>
                              state.perform(
                                () =>
                                  practiceCatalogService.visibility(
                                    item,
                                    e.target.value as AdminPracticeSet['visibility']
                                  ),
                                'Đã cập nhật visibility.'
                              )
                            }
                          >
                            {['public', 'private', 'unlisted', 'official'].map(value => (
                              <option key={value}>{value}</option>
                            ))}
                          </select>
                        </label>
                      </div>
                    </td>
                    <td data-label="Câu hỏi" className="p-4">
                      {item.questionCount} câu hỏi
                    </td>
                    <td data-label="Thao tác" className="p-4">
                      <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                        <AdminLink
                          to={`/admin/practice/${item.id}`}
                          aria-label={`Sửa practice set ${item.title}`}
                        >
                          <Pencil size={14} aria-hidden="true" />
                          Sửa
                        </AdminLink>
                        <AdminButton
                          size="icon"
                          title={`Lưu trữ practice set ${item.title}`}
                          disabled={state.action.pending || item.status === 'archived'}
                          onClick={() => state.archive(item)}
                          aria-label={`Lưu trữ practice set ${item.title}`}
                        >
                          <Archive size={16} aria-hidden="true" />
                        </AdminButton>
                      </div>
                    </td>
                  </tr>
                ))
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
export function AdminPracticePage() {
  const revision = useAuthStore(state => state.sessionRevision),
    location = useLocation()
  return <PracticeCatalog key={`${revision}:${location.key}`} />
}
export default AdminPracticePage
