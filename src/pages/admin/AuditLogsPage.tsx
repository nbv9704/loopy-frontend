import { useEffect, useState } from 'react'
import { Clock, Filter, AlertCircle } from 'lucide-react'
import { auditService, AuditLog } from '../../services/admin/audit.service'

const AuditLogSkeletonRows = () => (
  <div className="space-y-2">
    {Array.from({ length: 5 }).map((_, index) => (
      <div key={index} className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-white p-4 shadow-sm">
        <div className="flex flex-1 items-start gap-4">
          <div className="h-7 w-20 animate-pulse rounded-lg bg-slate-100" />
          <div className="flex-1">
            <div className="h-4 w-56 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-3 w-40 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
        <div className="shrink-0 space-y-2 text-right">
          <div className="h-3 w-28 animate-pulse rounded bg-slate-100" />
          <div className="ml-auto h-3 w-16 animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    ))}
  </div>
)

const AuditLogsPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [action, setAction] = useState<string>('')
  const [resourceType, setResourceType] = useState<string>('')
  const [offset, setOffset] = useState(0)
  const [total, setTotal] = useState(0)

  const limit = 50

  useEffect(() => {
    loadLogs()
  }, [action, resourceType, offset])

  const loadLogs = async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await auditService.getLogs({
        action: action || undefined,
        resourceType: resourceType || undefined,
        limit,
        offset,
      })
      setLogs(data.logs)
      setTotal(data.total)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load audit logs')
    } finally {
      setIsLoading(false)
    }
  }

  const actionColors: Record<string, string> = {
    create: 'bg-green-50 text-green-700',
    update: 'bg-blue-50 text-blue-700',
    delete: 'bg-red-50 text-red-700',
    import: 'bg-purple-50 text-purple-700',
    publish: 'bg-teal-50 text-teal-700',
    archive: 'bg-amber-50 text-amber-700',
  }

  const resourceTypeLabels: Record<string, string> = {
    lesson: 'Bài học',
    chapter: 'Chương',
    test_case: 'Test case',
    import: 'Import',
  }

  const actionLabels: Record<string, string> = {
    create: 'Tạo mới',
    update: 'Cập nhật',
    delete: 'Xóa',
    import: 'Import',
    publish: 'Xuất bản',
    archive: 'Lưu trữ',
  }

  return (
    <div className="space-y-6">
      <div>
        <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-200 bg-teal-50 px-3 py-1 text-xs font-black uppercase tracking-widest text-teal-700">
          <Clock className="h-3.5 w-3.5" />
          Audit trail
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-950 md:text-4xl">Nhật ký hoạt động</h1>
        <p className="mt-2 max-w-2xl text-base font-medium text-slate-600">
          Theo dõi tất cả các thao tác của admin: tạo, sửa, xóa bài học, import dữ liệu, v.v.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm md:flex-row md:items-end">
        <div className="flex-1">
          <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Hành động</label>
          <select
            value={action}
            onChange={e => {
              setAction(e.target.value)
              setOffset(0)
            }}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-950 focus:border-teal-500 focus:outline-none"
          >
            <option value="">Tất cả hành động</option>
            <option value="create">Tạo mới</option>
            <option value="update">Cập nhật</option>
            <option value="delete">Xóa</option>
            <option value="import">Import</option>
            <option value="publish">Xuất bản</option>
            <option value="archive">Lưu trữ</option>
          </select>
        </div>

        <div className="flex-1">
          <label className="block text-xs font-black uppercase tracking-widest text-slate-500">Loại tài nguyên</label>
          <select
            value={resourceType}
            onChange={e => {
              setResourceType(e.target.value)
              setOffset(0)
            }}
            className="mt-2 w-full rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-950 focus:border-teal-500 focus:outline-none"
          >
            <option value="">Tất cả loại</option>
            <option value="lesson">Bài học</option>
            <option value="chapter">Chương</option>
            <option value="test_case">Test case</option>
            <option value="import">Import</option>
          </select>
        </div>

        <button
          onClick={() => {
            setAction('')
            setResourceType('')
            setOffset(0)
          }}
          className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-4 py-2 text-sm font-black text-slate-700 transition-colors hover:bg-slate-50"
        >
          <Filter className="h-4 w-4" />
          Xóa bộ lọc
        </button>
      </div>

      {/* Logs Table */}
      {isLoading ? (
        <AuditLogSkeletonRows />
      ) : error ? (
        <div className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-black">Lỗi tải dữ liệu</p>
            <p className="text-sm font-medium">{error}</p>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Clock className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="font-black text-slate-950">Không có nhật ký nào</p>
          <p className="mt-1 text-sm font-medium text-slate-500">Chưa có hoạt động admin nào được ghi lại.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div
              key={log.id}
              className="flex items-start justify-between gap-4 rounded-lg border border-slate-100 bg-white p-4 transition-colors hover:border-slate-200 hover:bg-slate-50"
            >
              <div className="flex items-start gap-4 flex-1">
                <div className={`rounded-lg px-2.5 py-1 text-xs font-black ${actionColors[log.action] || 'bg-slate-50 text-slate-700'}`}>
                  {actionLabels[log.action] || log.action}
                </div>

                <div className="flex-1">
                  <div className="text-sm font-black text-slate-950">
                    {log.resource_name || `${resourceTypeLabels[log.resource_type] || log.resource_type} (${log.resource_id?.substring(0, 8)}...)`}
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-500">
                    {resourceTypeLabels[log.resource_type] || log.resource_type}
                    {log.metadata?.lessonsCreated && ` • ${log.metadata.lessonsCreated} bài học`}
                    {log.metadata?.testCasesCreated && ` • ${log.metadata.testCasesCreated} test case`}
                  </div>
                </div>
              </div>

              <div className="shrink-0 text-right">
                <div className="text-xs font-bold text-slate-400">
                  {new Date(log.created_at).toLocaleString('vi-VN')}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-500">
                  {log.ip_address && `IP: ${log.ip_address}`}
                </div>
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

export default AuditLogsPage
