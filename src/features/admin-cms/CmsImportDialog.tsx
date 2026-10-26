import AdminButton from '../../components/admin/AdminButton'
import { Upload } from 'lucide-react'
import { useState } from 'react'
import ModalDialog from '../../components/admin/ModalDialog'
import { CmsTransfer, flattenCmsTransfer } from './cmsContract'

export default function CmsImportDialog({
  name,
  payload,
  pending,
  error,
  onImport,
  onClose,
}: {
  name: string
  payload: CmsTransfer
  pending: boolean
  error: string | null
  onImport: () => void
  onClose: () => void
}) {
  const [reviewed, setReviewed] = useState(false)
  const entries = flattenCmsTransfer(payload)
  return (
    <ModalDialog
      open
      label="Preview import CMS"
      dismissible={!pending}
      onClose={onClose}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border-0 bg-white p-5 text-slate-900 backdrop:bg-slate-950/40"
    >
      <div className="space-y-4">
        <h2 className="text-xl font-black">Preview import CMS</h2>
        <p className="break-all">
          {name} · version {payload.version} · {payload.language.toUpperCase()}
        </p>
        <p>
          {entries.length} items trong {Object.keys(payload.categories).length} categories.
        </p>
        <p className="rounded bg-amber-50 p-3 text-sm text-amber-900">
          Import cập nhật giá trị theo category + key + ngôn ngữ trong file, có thể ảnh hưởng nội
          dung public ngay. Không xóa items vắng mặt. Version1.0 giữ type/description cũ khi cập
          nhật; version2.0 thay cả hai field. Toàn bộ file được ghi trong một transaction; mất phản
          hồi thì kiểm tra nội dung trước khi gửi lại.
        </p>
        <details>
          <summary className="cursor-pointer font-bold">Xem toàn bộ nội dung file</summary>
          <pre className="mt-2 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded bg-slate-50 p-3 text-xs">
            {JSON.stringify(payload, null, 2)}
          </pre>
        </details>
        {error && (
          <p role="alert" className="whitespace-pre-line text-red-800">
            {error}
          </p>
        )}
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            disabled={pending}
            checked={reviewed}
            onChange={event => setReviewed(event.target.checked)}
          />
          Tôi đã kiểm tra nội dung và ngôn ngữ {payload.language.toUpperCase()} trong file.
        </label>
        <div className="flex flex-wrap justify-end gap-3">
          <AdminButton disabled={pending} type="button" onClick={onClose}>
            Hủy import
          </AdminButton>
          <AdminButton
            variant="primary"
            type="button"
            disabled={pending || !reviewed}
            onClick={onImport}
          >
            <Upload size={16} aria-hidden="true" />
            {pending ? 'Đang import...' : 'Xác nhận import CMS'}
          </AdminButton>
        </div>
      </div>
    </ModalDialog>
  )
}
