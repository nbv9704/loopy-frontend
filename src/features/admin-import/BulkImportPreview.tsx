import AdminTable from '../../components/admin/AdminTable'
import CatalogPagination from '../../components/admin/CatalogPagination'
import { useCatalogPage } from '../../hooks/admin/useCatalogPage'
import { importSummary, type ImportPayload } from './importPreview'

const childAction = (items: unknown[] | undefined) =>
  items === undefined
    ? 'Giữ nguyên'
    : items.length === 0
      ? 'Xóa toàn bộ'
      : `Thay bằng ${items.length}`

export function ImportPreview({ payload }: { payload: ImportPayload }) {
  const summary = importSummary(payload)
  const paging = useCatalogPage(payload.lessons, JSON.stringify(payload))
  return (
    <section
      className="space-y-4 rounded-lg border border-slate-200 bg-white p-5"
      aria-label="Preview import"
    >
      <h2 className="text-lg font-black text-slate-950">Preview trước khi import</h2>
      <p className="break-all text-sm text-slate-700">
        Chapter: <code>{payload.chapter_id}</code>
      </p>
      <p className="text-sm font-bold text-slate-700">
        {summary.lessons} lesson · {summary.testCases} test case · {summary.steps} step
      </p>
      <AdminTable
        headings={['Lesson / loại / trạng thái', 'Thứ tự', 'Test cases', 'Steps']}
        label="Các lesson và dữ liệu con sẽ thay thế"
      >
        {paging.visible.map(lesson => (
          <tr key={lesson.lesson_id} className="border-t border-slate-100">
            <td data-label="Lesson / loại / trạng thái" className="p-2">
              <span className="break-all font-bold">{lesson.lesson_id}</span>
              <br />
              {lesson.lesson_type} · {lesson.status}
            </td>
            <td data-label="Thứ tự" className="p-2">
              {lesson.order_index}
            </td>
            <td data-label="Test cases" className="p-2">
              {childAction(lesson.test_cases)}
            </td>
            <td data-label="Steps" className="p-2">
              {childAction(lesson.steps)}
            </td>
          </tr>
        ))}
      </AdminTable>
      <CatalogPagination
        page={paging.page}
        total={payload.lessons.length}
        onChange={paging.setPage}
      />
      <details className="text-sm text-slate-700">
        <summary className="cursor-pointer font-bold">
          Xem payload chuẩn hóa và các giá trị mặc định
        </summary>
        <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap break-all rounded-lg bg-slate-50 p-3">
          {JSON.stringify(payload, null, 2)}
        </pre>
      </details>
      <div className="space-y-2 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <p>
          Lesson cùng lesson_id trong chapter sẽ được cập nhật. Các field nội dung bỏ trống dùng mặc
          định trong preview, không giữ giá trị cũ; status mặc định là draft.
        </p>
        <p>
          Không có test_cases/steps: giữ dữ liệu con cũ. Mảng []: xóa toàn bộ. Mảng có phần tử: thay
          toàn bộ bộ cũ, tạo ID mới cho dữ liệu con.
        </p>
        <p>
          {summary.published > 0
            ? `${summary.published} lesson sẽ ở trạng thái published và có thể hiển thị cho người học ngay.`
            : 'Không có lesson published trong payload.'}{' '}
          Sửa nội dung sẽ làm kết quả Kiểm tra cũ hết hiệu lực.
        </p>
        <p>
          Import chạy trong một transaction. Nếu mất phản hồi, kiểm tra chapter trước khi gửi lại;
          lịch sử import chỉ là log bổ sung.
        </p>
      </div>
    </section>
  )
}
