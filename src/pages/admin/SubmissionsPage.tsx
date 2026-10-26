import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminButton from '../../components/admin/AdminButton'
import CatalogPagination from '../../components/admin/CatalogPagination'
import { ADMIN_PAGE_SIZE } from '../../lib/adminPagination'
import { RefreshCw } from 'lucide-react'
import { useCallback, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '../../store/admin/authStore'
import { useAsyncResource } from '../../hooks/useAsyncResource'
import ResourceError from '../../components/admin/ResourceError'
import SubmissionCard from '../../features/admin-submissions/SubmissionCard'
import {
  submissionsService,
  SubmissionStatus,
} from '../../features/admin-submissions/submissions.service'

function SubmissionMonitor() {
  const [status, setStatus] = useState<SubmissionStatus>('all')
  const [offset, setOffset] = useState(0)
  const load = useCallback(
    (signal: AbortSignal) => submissionsService.list(status, offset, signal),
    [status, offset]
  )
  const resource = useAsyncResource(JSON.stringify([status, offset]), load)
  const rows = resource.data?.items ?? []
  return (
    <div className="min-w-0 space-y-5">
      <AdminPageHeader
        title="Submissions"
        eyebrow="Theo dõi học tập"
        description="Bài nộp Lesson theo bộ lọc All/Pass/Fail, mới nhất trước, 20 mục mỗi trang. Các số liệu bên dưới chỉ tính trên trang đang xem; bài nộp đúng không tự xác nhận lesson đã hoàn thành."
        actions={
          <AdminButton disabled={resource.loading} onClick={resource.retry}>
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </AdminButton>
        }
      />
      <div
        className="flex flex-wrap gap-2 rounded-2xl border border-slate-200 bg-white p-4"
        aria-label="Lọc kết quả bài nộp"
      >
        {(['all', 'pass', 'fail'] as SubmissionStatus[]).map(value => (
          <AdminButton
            key={value}
            aria-pressed={status === value}
            onClick={() => {
              setStatus(value)
              setOffset(0)
            }}
            variant={status === value ? 'primary' : 'secondary'}
          >
            {value}
          </AdminButton>
        ))}
      </div>
      {resource.loading ? (
        <p role="status">Đang tải bài nộp...</p>
      ) : resource.error ? (
        <ResourceError error={resource.error} retry={resource.retry} />
      ) : (
        resource.data && (
          <>
            <div
              aria-label="Số liệu trong danh sách hiện tại"
              className="grid grid-cols-2 gap-3 xl:grid-cols-4"
            >
              {[
                ['Đang xem', rows.length],
                ['Pass', rows.filter(item => item.is_correct === true).length],
                ['Fail', rows.filter(item => item.is_correct === false).length],
                ['Chưa có kết quả', rows.filter(item => item.is_correct === null).length],
              ].map(([label, count]) => (
                <div key={label} className="rounded-lg border bg-white p-4">
                  <p>{label}</p>
                  <p className="text-2xl font-black">{count}</p>
                </div>
              ))}
            </div>
            {!rows.length ? (
              <p>Chưa có submission phù hợp.</p>
            ) : (
              rows.map(item => <SubmissionCard key={item.id} item={item} />)
            )}
            <CatalogPagination
              page={offset / ADMIN_PAGE_SIZE}
              total={resource.data.total}
              count={rows.length}
              onChange={page => setOffset(page * ADMIN_PAGE_SIZE)}
            />
          </>
        )
      )}
    </div>
  )
}
export default function SubmissionsPage() {
  const revision = useAuthStore(state => state.sessionRevision),
    location = useLocation()
  return <SubmissionMonitor key={`${revision}:${location.key}`} />
}
