import AdminPageHeader from '../../components/admin/AdminPageHeader'
import AdminButton from '../../components/admin/AdminButton'
import AdminTable from '../../components/admin/AdminTable'
import CatalogPagination from '../../components/admin/CatalogPagination'
import { useCatalogPage } from '../../hooks/admin/useCatalogPage'
import { Plus, Power, RefreshCw, Trash2 } from 'lucide-react'
import { useCallback, useState } from 'react'
import toast from 'react-hot-toast'
import { useAsyncResource } from '../../hooks/useAsyncResource'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { getAdminErrorMessage } from '../../services/admin/errors'
import { Keyword, KeywordDraft, moderationService } from './moderation.service'
import KeywordDialog from './KeywordDialog'

export default function ModerationManager() {
  const load = useCallback((signal: AbortSignal) => moderationService.list(signal), [])
  const list = useAsyncResource('moderation', load)
  const paging = useCatalogPage(list.data ?? [], 'moderation')
  const action = useAsyncAction()
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const perform = (write: () => Promise<unknown>, message: string, firstPage = false) => {
    setError(null)
    void action.run(write, {
      onSuccess: () => {
        if (firstPage) paging.setPage(0)
        setCreating(false)
        toast.success(message)
        list.retry()
      },
      onError: cause =>
        setError(
          getAdminErrorMessage(cause, 'Chưa xác nhận được thay đổi. Hãy tải lại danh sách.')
        ),
    })
  }
  const create = (draft: KeywordDraft) =>
    perform(() => moderationService.create(draft), 'Đã thêm từ khóa.', true)
  const remove = (item: Keyword) => {
    if (!window.confirm(`Xóa từ khóa “${item.keyword}”?`)) return
    perform(() => moderationService.remove(item), 'Đã xóa từ khóa.')
  }
  return (
    <div className="min-w-0 space-y-5">
      <AdminPageHeader
        title="Kiểm duyệt từ khóa"
        eyebrow="Vận hành nội dung"
        description="Quản lý từ khóa và trạng thái kiểm duyệt nội dung Practice."
        actions={
          <>
            <AdminButton disabled={action.pending || list.loading} onClick={list.retry}>
              <RefreshCw size={16} aria-hidden="true" />
              Tải lại
            </AdminButton>
            <AdminButton
              variant="primary"
              disabled={action.pending || list.loading || !!list.error}
              onClick={() => {
                setError(null)
                setCreating(true)
              }}
            >
              <Plus size={16} aria-hidden="true" />
              Thêm từ khóa
            </AdminButton>
          </>
        }
      />
      {!creating && error && (
        <p role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
          {error}
        </p>
      )}
      {list.loading ? (
        <p role="status">Đang tải từ khóa...</p>
      ) : list.error ? (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-red-700">
          <p>{list.error}</p>
          <AdminButton className="mt-2" onClick={list.retry}>
            Thử lại
          </AdminButton>
        </div>
      ) : !list.data?.length ? (
        <p>Chưa có từ khóa. Danh sách rỗng không chặn nội dung.</p>
      ) : (
        <AdminTable
          headings={['Từ khóa', 'Nhóm', 'Ngôn ngữ', 'Trạng thái', 'Thao tác']}
          label="Từ khóa kiểm duyệt"
        >
          {paging.visible.map(item => (
            <tr key={item.id} className="border-t">
              <td data-label="Từ khóa" className="max-w-xs break-words p-3 font-semibold">
                {item.keyword}
              </td>
              <td data-label="Nhóm" className="p-3">
                {item.category}
              </td>
              <td data-label="Ngôn ngữ" className="p-3">
                {item.language}
              </td>
              <td data-label="Trạng thái" className="p-3">
                {item.is_active ? 'Đang bật' : 'Đã tắt'}
              </td>
              <td data-label="Thao tác" className="whitespace-nowrap p-3">
                <div className="flex flex-wrap items-center gap-1.5 md:justify-end">
                  <AdminButton
                    disabled={action.pending}
                    aria-label={`${item.is_active ? 'Tắt' : 'Bật'} ${item.keyword}`}
                    onClick={() =>
                      perform(() => moderationService.toggle(item), 'Đã cập nhật trạng thái.')
                    }
                  >
                    <Power size={14} aria-hidden="true" />
                    {item.is_active ? 'Tắt' : 'Bật'}
                  </AdminButton>
                  <AdminButton
                    variant="danger"
                    size="icon"
                    title={`Xóa ${item.keyword}`}
                    disabled={action.pending}
                    aria-label={`Xóa ${item.keyword}`}
                    onClick={() => remove(item)}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </AdminButton>
                </div>
              </td>
            </tr>
          ))}
        </AdminTable>
      )}
      {!list.loading && !list.error && list.data && (
        <CatalogPagination
          page={paging.page}
          total={list.data.length}
          onChange={paging.setPage}
          disabled={action.pending}
        />
      )}
      {creating && (
        <KeywordDialog
          pending={action.pending}
          error={error}
          onSave={create}
          onClose={() => setCreating(false)}
        />
      )}
    </div>
  )
}
