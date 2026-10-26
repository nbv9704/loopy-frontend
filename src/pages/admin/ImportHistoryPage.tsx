import CatalogPagination from '../../components/admin/CatalogPagination'
import { ADMIN_PAGE_SIZE } from '../../lib/adminPagination'
import AdminButton from '../../components/admin/AdminButton'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import { useCallback, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAsyncResource } from '../../hooks/useAsyncResource'
import { useAuthStore } from '../../store/admin/authStore'
import { getAdminErrorMessage } from '../../services/admin/errors'
import { Upload, Filter, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import { importHistoryService } from '../../services/admin/import-history.service'

const ImportStatsSkeleton = () => (
  <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="h-3 w-full max-w-24 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-7 w-12 animate-pulse rounded bg-slate-100" />
      </div>
    ))}
  </div>
)

const ImportHistorySkeletonRows = () => (
  <div role="status" aria-label="Đang tải lịch sử import" className="space-y-2">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex min-w-0 flex-col items-start justify-between gap-4 rounded-lg border border-slate-100 bg-white p-4 sm:flex-row shadow-sm"
      >
        <div className="flex min-w-0 w-full flex-1 items-start gap-4">
          <div className="h-7 w-24 animate-pulse rounded-lg bg-slate-100" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-full max-w-72 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 flex flex-wrap gap-3">
              <div className="h-3 w-20 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
              <div className="h-3 w-16 animate-pulse rounded bg-slate-100" />
            </div>
          </div>
        </div>
        <div className="shrink-0 space-y-2 text-right">
          <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
          <div className="ml-auto h-3 w-14 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    ))}
  </div>
)

const ImportHistoryView: React.FC = () => {
  const [status, setStatus] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = ADMIN_PAGE_SIZE
  const loadHistory = useCallback(
    async (signal: AbortSignal) => {
      try {
        return await importHistoryService.getHistory(
          { status: status || undefined, limit, offset },
          signal
        )
      } catch (cause) {
        throw new Error(getAdminErrorMessage(cause, 'Không tải được lịch sử import.'))
      }
    },
    [status, offset]
  )
  const loadStats = useCallback(async (signal: AbortSignal) => {
    try {
      return await importHistoryService.getStats(signal)
    } catch (cause) {
      throw new Error(getAdminErrorMessage(cause, 'Không tải được thống kê import.'))
    }
  }, [])
  const history = useAsyncResource(JSON.stringify([status, offset]), loadHistory)
  const statistics = useAsyncResource('import-stats', loadStats)
  const imports = history.data?.imports ?? []
  const total = history.data?.total ?? 0
  const stats = statistics.data
  const isLoading = history.loading
  const error = history.error

  const statusColors: Record<string, string> = {
    success: 'bg-green-50 text-green-700',
    partial: 'bg-amber-50 text-amber-700',
    failed: 'bg-red-50 text-red-700',
  }

  const statusIcons: Record<string, React.ReactNode> = {
    success: <CheckCircle2 className="h-4 w-4" />,
    partial: <AlertTriangle className="h-4 w-4" />,
    failed: <AlertCircle className="h-4 w-4" />,
  }

  const statusLabels: Record<string, string> = {
    success: 'Thành công',
    partial: 'Một phần',
    failed: 'Thất bại',
  }

  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Lịch sử nhập dữ liệu"
        eyebrow="Nhật ký vận hành"
        description="Theo dõi các lần import đã ghi log. Log là thông tin bổ sung; log trống không chứng minh request đã rollback."
      />

      {/* Stats */}
      {statistics.loading ? (
        <ImportStatsSkeleton />
      ) : statistics.error ? (
        <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800">
          <p>{statistics.error}</p>
          <AdminButton className="mt-2" type="button" onClick={statistics.retry}>
            Tải lại thống kê
          </AdminButton>
        </div>
      ) : (
        stats && (
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-5">
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Tổng import
              </p>
              <p className="mt-2 text-2xl font-black text-slate-950">{stats.totalImports}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Thành công / một phần
              </p>
              <p className="mt-2 text-2xl font-black text-green-700">{stats.successfulImports}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Thất bại</p>
              <p className="mt-2 text-2xl font-black text-red-700">{stats.failedImports}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Bài học</p>
              <p className="mt-2 text-2xl font-black text-blue-700">{stats.totalLessonsImported}</p>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
                Test case
              </p>
              <p className="mt-2 text-2xl font-black text-cyan-700">
                {stats.totalTestCasesImported}
              </p>
            </div>
          </div>
        )
      )}

      {/* Filters */}
      <AdminFilterBar>
        <div className="min-w-0 flex-1">
          <label
            htmlFor="import-status"
            className="block text-xs font-black uppercase tracking-widest text-slate-500"
          >
            Trạng thái
          </label>
          <select
            id="import-status"
            value={status}
            onChange={e => {
              setStatus(e.target.value)
              setOffset(0)
            }}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-950 focus:border-teal-500 focus:outline-none"
          >
            <option value="">Tất cả trạng thái</option>
            <option value="success">Thành công</option>
            <option value="partial">Một phần</option>
            <option value="failed">Thất bại</option>
          </select>
        </div>

        <AdminButton
          onClick={() => {
            setStatus('')
            setOffset(0)
          }}
        >
          <Filter className="h-4 w-4" />
          Xóa bộ lọc
        </AdminButton>
      </AdminFilterBar>

      {/* History Table */}
      {isLoading ? (
        <ImportHistorySkeletonRows />
      ) : error ? (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-black">Lỗi tải dữ liệu</p>
            <p className="text-sm font-medium">{error}</p>
            <AdminButton className="mt-2" type="button" onClick={history.retry}>
              Tải lại lịch sử
            </AdminButton>
          </div>
        </div>
      ) : imports.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Upload className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="font-black text-slate-950">Không có lịch sử import</p>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Không có log khớp bộ lọc hiện tại.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {imports.map(record => (
            <div
              key={record.id}
              className="flex min-w-0 flex-col items-start justify-between gap-4 rounded-lg border border-slate-100 bg-white p-4 sm:flex-row transition-colors hover:border-slate-200 hover:bg-slate-50"
            >
              <div className="flex min-w-0 w-full flex-1 flex-col items-start gap-3 sm:flex-row">
                <div
                  className={`rounded-lg px-2.5 py-1 text-xs font-black inline-flex items-center gap-1 ${statusColors[record.status] || 'bg-slate-50 text-slate-700'}`}
                >
                  {statusIcons[record.status]}
                  {statusLabels[record.status] || record.status}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="break-all text-sm font-black text-slate-950">
                    {record.chapters?.title || 'Unknown Chapter'} • {record.file_name}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs font-medium text-slate-500">
                    <span>📚 {record.lessons_count} bài học</span>
                    <span>✓ {record.test_cases_count} test case</span>
                    {record.errors_count > 0 && <span>⚠️ {record.errors_count} lỗi</span>}
                  </div>
                  {record.error_message && (
                    <p className="mt-2 text-xs text-red-600 line-clamp-2">{record.error_message}</p>
                  )}
                </div>
              </div>

              <div className="shrink-0 text-left sm:text-right">
                <div className="text-xs font-bold text-slate-400">
                  {new Date(record.created_at).toLocaleString('vi-VN')}
                </div>
                {record.file_size && (
                  <div className="mt-1 text-xs font-medium text-slate-500">
                    {(record.file_size / 1024).toFixed(1)} KB
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && history.data && (
        <CatalogPagination
          page={offset / limit}
          total={total}
          count={imports.length}
          onChange={page => setOffset(page * limit)}
        />
      )}
    </div>
  )
}

export default function ImportHistoryPage() {
  const revision = useAuthStore(state => state.sessionRevision)
  const location = useLocation()
  return <ImportHistoryView key={`${revision}:${location.key}`} />
}
