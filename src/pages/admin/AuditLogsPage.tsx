import CatalogPagination from '../../components/admin/CatalogPagination'
import { ADMIN_PAGE_SIZE } from '../../lib/adminPagination'
import AdminButton from '../../components/admin/AdminButton'
import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminFilterBar from '../../components/admin/AdminFilterBar'
import { useCallback, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/admin/authStore'
import { useAsyncResource } from '../../hooks/useAsyncResource'
import { Clock, Filter, AlertCircle } from 'lucide-react'
import { auditService } from '../../services/admin/audit.service'

const AuditLogSkeletonRows = () => (
  <div role="status" aria-label="Đang tải nhật ký" className="space-y-2">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="flex min-w-0 flex-col items-start justify-between gap-4 rounded-lg border border-slate-100 bg-white p-4 shadow-sm sm:flex-row"
      >
        <div className="flex min-w-0 w-full flex-1 items-start gap-4">
          <div className="h-7 w-20 animate-pulse rounded-lg bg-slate-100" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-full max-w-56 animate-pulse rounded bg-slate-100" />
            <div className="mt-2 h-3 w-full max-w-40 animate-pulse rounded bg-slate-100" />
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

const AuditLogsView: React.FC = () => {
  const revision = useAuthStore(state => state.sessionRevision)
  const [action, setAction] = useState('')
  const [resourceType, setResourceType] = useState('')
  const [offset, setOffset] = useState(0)
  const limit = ADMIN_PAGE_SIZE
  const load = useCallback(
    (signal: AbortSignal) =>
      auditService.getLogs(
        {
          action: action || undefined,
          resourceType: resourceType || undefined,
          limit,
          offset,
        },
        signal
      ),
    [action, resourceType, offset]
  )
  const resource = useAsyncResource(JSON.stringify([revision, action, resourceType, offset]), load)
  const { loading: isLoading, error } = resource
  const logs = resource.data?.logs ?? []
  const total = resource.data?.total ?? 0

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
    content_item: 'Nội dung CMS',
    practice_set: 'Bộ luyện tập',
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
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Nhật ký hoạt động"
        eyebrow="Nhật ký vận hành"
        description="Các thao tác admin đã ghi nhận. Nhật ký có thể thiếu khi ghi log thất bại; danh sách rỗng không chứng minh chưa có thay đổi."
      />

      {/* Filters */}
      <AdminFilterBar>
        <div className="flex-1">
          <label
            htmlFor="audit-action"
            className="block text-xs font-black uppercase tracking-widest text-slate-500"
          >
            Hành động
          </label>
          <select
            id="audit-action"
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
          <label
            htmlFor="audit-resource"
            className="block text-xs font-black uppercase tracking-widest text-slate-500"
          >
            Loại tài nguyên
          </label>
          <select
            id="audit-resource"
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
            <option value="content_item">Nội dung CMS</option>
            <option value="practice_set">Bộ luyện tập</option>
          </select>
        </div>

        <AdminButton
          onClick={() => {
            setAction('')
            setResourceType('')
            setOffset(0)
          }}
        >
          <Filter className="h-4 w-4" />
          Xóa bộ lọc
        </AdminButton>
      </AdminFilterBar>

      {/* Logs Table */}
      {isLoading ? (
        <AuditLogSkeletonRows />
      ) : error ? (
        <div
          role="alert"
          className="flex items-center gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-red-700"
        >
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-black">Lỗi tải dữ liệu</p>
            <p className="text-sm font-medium">{error}</p>
            <AdminButton className="mt-2" onClick={resource.retry}>
              Thử lại
            </AdminButton>
          </div>
        </div>
      ) : logs.length === 0 ? (
        <div className="rounded-lg border border-slate-200 bg-white p-8 text-center shadow-sm">
          <Clock className="mx-auto mb-3 h-8 w-8 text-slate-300" />
          <p className="font-black text-slate-950">Không có nhật ký nào</p>
          <p className="mt-1 text-sm font-medium text-slate-500">
            Không có nhật ký phù hợp với bộ lọc và trang hiện tại.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map(log => (
            <div
              key={log.id}
              className="flex flex-wrap items-start justify-between gap-4 rounded-lg border border-slate-100 bg-white p-4 transition-colors hover:border-slate-200 hover:bg-slate-50"
            >
              <div className="flex min-w-0 max-w-full flex-1 flex-col items-start gap-3 sm:flex-row">
                <div
                  className={`rounded-lg px-2.5 py-1 text-xs font-black ${actionColors[log.action] || 'bg-slate-50 text-slate-700'}`}
                >
                  {actionLabels[log.action] || log.action}
                </div>

                <div className="min-w-0 flex-1 break-words [overflow-wrap:anywhere]">
                  <div className="text-sm font-black text-slate-950">
                    {log.resource_name ||
                      `${resourceTypeLabels[log.resource_type] || log.resource_type} (${log.resource_id?.substring(0, 8)}...)`}
                  </div>
                  <div className="mt-1 text-xs font-medium text-slate-500">
                    {resourceTypeLabels[log.resource_type] || log.resource_type}
                    {typeof log.metadata?.lessonsCreated === 'number' &&
                      ` • ${log.metadata.lessonsCreated} bài học`}
                    {typeof log.metadata?.testCasesCreated === 'number' &&
                      ` • ${log.metadata.testCasesCreated} test case`}
                  </div>
                </div>
              </div>

              <div className="max-w-full shrink-0 text-left sm:text-right">
                <div className="text-xs font-bold text-slate-400">
                  {Number.isFinite(Date.parse(log.created_at))
                    ? new Date(log.created_at).toLocaleString('vi-VN')
                    : 'Không rõ thời gian'}
                </div>
                <div className="mt-1 text-xs font-medium text-slate-500">
                  {log.ip_address && `IP: ${log.ip_address}`}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!isLoading && !error && resource.data && (
        <CatalogPagination
          page={offset / limit}
          total={total}
          count={logs.length}
          onChange={page => setOffset(page * limit)}
        />
      )}
    </div>
  )
}

export default function AuditLogsPage() {
  const revision = useAuthStore(state => state.sessionRevision)
  const location = useLocation()
  return <AuditLogsView key={`${revision}:${location.key}`} />
}
