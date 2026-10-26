import AdminButton from './AdminButton'
import { ADMIN_PAGE_SIZE } from '../../lib/adminPagination'

export default function CatalogPagination({
  page,
  total,
  size = ADMIN_PAGE_SIZE,
  count,
  onChange,
  disabled = false,
}: {
  page: number
  total: number
  size?: number
  count?: number
  onChange: (page: number) => void
  disabled?: boolean
}) {
  const start = total && count !== 0 ? page * size + 1 : 0
  return (
    <nav
      aria-label="Phân trang danh sách"
      className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
    >
      <p className="text-sm">
        {count === 0 && page > 0
          ? 'Không có mục ở trang này.'
          : `Hiển thị ${start}–${start ? Math.min(page * size + (count ?? size), total) : 0} / ${total}`}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <AdminButton disabled={disabled || page === 0} onClick={() => onChange(page - 1)}>
          Trước
        </AdminButton>
        <span className="text-sm text-slate-500">Trang {page + 1}</span>
        <AdminButton
          disabled={disabled || (page + 1) * size >= total}
          onClick={() => onChange(page + 1)}
        >
          Tiếp
        </AdminButton>
      </div>
    </nav>
  )
}
