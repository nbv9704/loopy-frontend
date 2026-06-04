import { useEffect, useState } from 'react'
import { Upload, Filter, AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react'
import { importHistoryService, ImportHistoryRecord, ImportStats } from '../../services/admin/import-history.service'

const ImportStatsSkeleton = () => (
  <div className="grid gap-4 md:grid-cols-5">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="h-3 w-24 animate-pulse rounded bg-slate-100" />
        <div className="mt-3 h-7 w-12 animate-pulse rounded bg-slate-100" />
      </div>
    ))}
  </div>
)

const ImportHistorySkeletonRows = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-1 items-start gap-4">
          <div className="h-7 w-24 animate-pulse rounded-lg bg-slate-100" />
          <div className="flex-1">
            <div className="h-4 w-72 animate-pulse rounded bg-slate-100" />
            <div className="mt-3 flex gap-3">
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

const ImportHistoryPage: React.FC = () => {
  const [imports, setImports] = useState<ImportHistoryRecord[]>([])
  const [stats, setStats] = useState<ImportStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [status, setStatus] = useState<string>('')
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)

  const limit = 50

  useEffect(() => {
    loadData()
  }, [status, offset])

  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const [historyData, statsData] = await Promise.all([
        importHistoryService.getHistory({
          status: status || undefined,
          limit,
          offset,
        }),
        importHistoryService.getStats(),
      ])
      setImports(historyData.imports)
      setTotal(historyData.total)
      setStats(statsData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load import history')
    } finally {
      setIsLoading(false)
    }
  }

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
    <div className="space-y-6">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-purple-700">
          <Upload className="h-3.5 w-3.5" />
          Import history
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Lịch sử nhập dữ liệu</h1>
        <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
          Theo dõi tất cả các lần bulk import: thời gian, số bài học, test case, trạng thái và lỗi.
        </p>
      </div>

      {/* Stats */}
      {isLoading && !stats ? (
        <ImportStatsSkeleton />
      ) : stats && (
        <div className="grid gap-4 md:grid-cols-5">
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Tổng import</p>
            <p className="mt-2 text-2xl font-black text-slate-950">{stats.totalImports}</p>
          </div>
          <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Thành công</p>
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
            <p className="text-xs font-bold uppercase tracking-widest text-slate-500">Test case</p>
            <p className="mt-2 text-2xl font-black text-cyan-700">{stats.totalTestCasesImported}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end">
        <div className="flex-1">
          <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Trạng thái</label>
          <select
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

        <button
          onClick={() => {
            setStatus('')
            setOffset(0)
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Filter className="h-4 w-4" />
          Xóa bộ lọc
        </button>
      </div>

      {/* History Table */}
      {isLoading ? (
        <ImportHistorySkeletonRows />
      ) : error ? (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-black">Lỗi tải dữ liệu</p>
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      ) : imports.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Upload className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="font-black text-slate-950">Không có lịch sử import</p>
          <p className="mt-1 text-sm font-medium text-slate-500">Chưa có lần bulk import nào được thực hiện.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {imports.map(record => (
            <div
              key={record.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-white p-4 transition-colors hover:border-slate-200 hover:bg-slate-50"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className={`rounded-lg px-2.5 py-1 text-xs font-black inline-flex items-center gap-1 ${statusColors[record.status] || 'bg-slate-50 text-slate-700'}`}>
                  {statusIcons[record.status]}
                  {statusLabels[record.status] || record.status}
                </div>

                <div className="flex-1">
                  <div className="text-sm font-black text-slate-950">
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

              <div className="shrink-0 text-right">
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

      {/* Pagination */}
      {total > limit && (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-sm font-medium text-slate-600">
            Hiển thị {offset + 1} - {Math.min(offset + limit, total)} trong {total} mục
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - limit))}
              disabled={offset === 0}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Trước
            </button>
            <button
              onClick={() => setOffset(offset + limit)}
              disabled={offset + limit >= total}
              className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Tiếp
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ImportHistoryPage
