import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminButton from '../../components/admin/AdminButton'
import { Link, useLocation } from 'react-router-dom'
import { Upload } from 'lucide-react'
import { useAuthStore } from '../../store/admin/authStore'
import { ImportPreview } from '../../features/admin-import/BulkImportPreview'
import { samplePayload } from '../../features/admin-import/samplePayload'
import { useBulkImport } from '../../features/admin-import/useBulkImport'

function BulkImportForm() {
  const form = useBulkImport()
  return (
    <div className="min-w-0 space-y-6">
      <AdminPageHeader
        title="Bulk Import Lessons"
        eyebrow="Nhập dữ liệu"
        description="Dán JSON, kiểm tra preview và dữ liệu sẽ thay thế, rồi xác nhận import."
      />
      <form
        onSubmit={event => {
          event.preventDefault()
          form.submit()
        }}
        className="grid min-w-0 gap-6 xl:grid-cols-2"
      >
        <fieldset
          disabled={form.pending}
          className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <label htmlFor="import-json" className="font-bold text-slate-900">
              JSON payload
            </label>
            <AdminButton
              type="button"
              onClick={() => form.edit(JSON.stringify(samplePayload, null, 2))}
            >
              Load example
            </AdminButton>
          </div>
          <textarea
            id="import-json"
            value={form.source}
            onChange={event => form.edit(event.target.value)}
            spellCheck={false}
            placeholder='{ "chapter_id": "...", "lessons": [...] }'
            className="h-80 min-h-64 w-full resize-y xl:h-[480px] rounded-lg border border-slate-300 bg-white p-4 font-mono text-sm text-slate-900 disabled:opacity-60"
          />
          {form.preview.payload && (
            <label className="flex items-start gap-3 text-sm text-slate-700">
              <input
                type="checkbox"
                checked={form.reviewed}
                onChange={event => form.setReviewed(event.target.checked)}
                className="mt-1"
              />
              Tôi đã kiểm tra chapter, trạng thái lesson và dữ liệu sẽ thay thế trong preview.
            </label>
          )}
          <AdminButton
            variant="primary"
            type="submit"
            disabled={form.pending || !form.preview.payload || !form.reviewed || !!form.result}
            className="w-full"
          >
            <Upload className="h-5 w-5" />
            {form.pending ? 'Đang import...' : 'Import lessons'}
          </AdminButton>
          <p className="text-sm text-slate-600">
            Sau mỗi lần import thành công, hãy chỉnh payload trước khi thực hiện lượt khác.
          </p>
        </fieldset>
        <div className="min-w-0 space-y-4" aria-live="polite">
          {!form.source.trim() && (
            <section className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm leading-6 text-slate-500">
              <h2 className="mb-2 font-semibold text-slate-900">Xem trước dữ liệu</h2>
              <p>
                Dán JSON hoặc chọn Load example để xem chapter, lesson và các dữ liệu con trước khi
                ghi.
              </p>
            </section>
          )}
          {form.preview.issues.length > 0 && (
            <section
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
            >
              <h2 className="font-bold">Payload chưa hợp lệ</h2>
              <ul className="mt-2 max-h-80 list-inside list-disc overflow-y-auto break-words text-sm">
                {form.preview.issues.slice(0, 20).map((issue, index) => (
                  <li key={index}>{issue}</li>
                ))}
              </ul>
              {form.preview.issues.length > 20 && (
                <p>Còn {form.preview.issues.length - 20} lỗi khác.</p>
              )}
            </section>
          )}
          {form.preview.payload && <ImportPreview payload={form.preview.payload} />}
          {form.error && (
            <div
              role="alert"
              className="rounded-lg border border-red-200 bg-red-50 p-4 text-red-800"
            >
              <h2 className="font-bold">Import chưa thành công hoặc chưa được xác nhận</h2>
              <p>{form.error}</p>
            </div>
          )}
          {form.result && (
            <section
              role="status"
              className="space-y-2 rounded-lg border border-green-200 bg-green-50 p-5 text-green-900"
            >
              <h2 className="font-bold">Import thành công</h2>
              <p>{form.result.lessonsCreated} lesson đã thêm/cập nhật.</p>
              <p>
                {form.result.testCasesCreated} test case, {form.result.stepsCreated} step được ghi.
              </p>
              <p>
                Đã thay {form.result.testCasesReplaced} test case cũ và {form.result.stepsReplaced}{' '}
                step cũ.
              </p>
            </section>
          )}
          <div className="flex flex-wrap gap-4 text-sm font-bold text-teal-800">
            <Link to="/admin/lessons">Kiểm tra lesson trong chapter</Link>
            <Link to="/admin/import-history">Xem lịch sử import</Link>
          </div>
        </div>
      </form>
    </div>
  )
}

export default function BulkImportPage() {
  const revision = useAuthStore(state => state.sessionRevision)
  const location = useLocation()
  return <BulkImportForm key={`${revision}:${location.key}`} />
}
