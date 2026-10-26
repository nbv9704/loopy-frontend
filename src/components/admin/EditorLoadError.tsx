import AdminLink from './AdminLink'
import AdminButton from './AdminButton'

interface EditorLoadErrorProps {
  message: string
  onRetry: () => void
  backTo: string
}

export default function EditorLoadError({ message, onRetry, backTo }: EditorLoadErrorProps) {
  return (
    <div
      role="alert"
      className="min-w-0 space-y-4 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-800 [overflow-wrap:anywhere]"
    >
      <p className="font-bold">{message}</p>
      <p>Chưa tải được dữ liệu. Vui lòng thử lại trước khi chỉnh sửa.</p>
      <div className="flex flex-wrap gap-3">
        <AdminButton variant="primary" onClick={onRetry}>
          Thử lại
        </AdminButton>
        <AdminLink to={backTo}>Quay lại danh sách</AdminLink>
      </div>
    </div>
  )
}
