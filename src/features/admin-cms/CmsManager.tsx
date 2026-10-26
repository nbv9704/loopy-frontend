import CatalogPagination from '../../components/admin/CatalogPagination'
import { ADMIN_PAGE_SIZE } from '../../lib/adminPagination'
import { FileText, Info, Plus, RefreshCw } from 'lucide-react'
import { useCmsManager } from './useCmsManager'
import CmsEditorDialog from './CmsEditorDialog'
import CmsImportDialog from './CmsImportDialog'
import AdminButton from '../../components/admin/AdminButton'
import CmsToolbar from './CmsToolbar'
import CmsItemsTable from './CmsItemsTable'

export default function CmsManager() {
  const state = useCmsManager()
  const rows = state.items.data?.items ?? []
  const catalog = state.categories.data ?? []
  const ready = !!catalog.length && !state.categories.loading
  const total = state.items.data?.total
  return (
    <div className="min-w-0 space-y-5">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-700">
            Website CMS
          </p>
          <h1 className="text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            Quản lý nội dung
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
            Tìm và chỉnh sửa nội dung hiển thị trên website theo category và ngôn ngữ.
          </p>
        </div>
        <AdminButton
          variant="primary"
          disabled={!ready || !state.canWrite || state.pending}
          onClick={() => state.openEditor(null)}
        >
          <Plus size={17} aria-hidden="true" />
          Tạo item
        </AdminButton>
      </header>
      {state.items.data?.readOnly && (
        <p
          role="status"
          className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"
        >
          {state.readOnlyMessage}
        </p>
      )}
      {state.notice && (
        <p
          role="status"
          className="rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm font-medium text-teal-900"
        >
          {state.notice}
        </p>
      )}
      {state.error && !state.transfer && (
        <p
          role="alert"
          className="whitespace-pre-line break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
        >
          {state.error}
        </p>
      )}
      {state.categories.loading ? (
        <p
          role="status"
          className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500"
        >
          Đang tải categories...
        </p>
      ) : state.categories.error ? (
        <section
          role="alert"
          className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-800"
        >
          <p>{state.categories.error}</p>
          <AdminButton className="mt-3" onClick={state.categories.retry}>
            Tải lại categories
          </AdminButton>
        </section>
      ) : !catalog.length ? (
        <p className="rounded-2xl border border-slate-200 bg-white p-6 text-sm text-slate-500">
          Chưa có category CMS. Kiểm tra cấu hình danh mục trước khi tạo item.
        </p>
      ) : (
        <>
          <CmsToolbar
            categories={catalog}
            category={state.selectedCategory}
            language={state.language}
            search={state.search}
            pending={state.pending}
            canWrite={state.canWrite}
            onCategory={state.setCategory}
            onLanguage={state.setLanguage}
            onSearch={state.setSearch}
            onExport={state.exportFile}
            onImport={state.prepareImport}
          />
          <section
            aria-label="Danh sách nội dung CMS"
            className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-5">
              <div>
                <h2 className="text-base font-semibold text-slate-900">Danh sách nội dung</h2>
                {state.items.data && !state.items.loading && (
                  <p className="mt-1 text-xs text-slate-500">{total} items khớp bộ lọc</p>
                )}
              </div>
              <AdminButton disabled={state.pending || state.items.loading} onClick={state.refresh}>
                <RefreshCw size={15} aria-hidden="true" />
                Tải lại items
              </AdminButton>
            </div>
            {state.items.loading ? (
              <p
                role="status"
                className="border-t border-slate-100 px-5 py-12 text-center text-sm text-slate-500"
              >
                Đang tải items...
              </p>
            ) : state.items.error ? (
              <section
                role="alert"
                className="mx-4 mb-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"
              >
                <p>{state.items.error}</p>
                <AdminButton className="mt-2" onClick={state.items.retry}>
                  Thử lại danh sách
                </AdminButton>
              </section>
            ) : (
              state.items.data && (
                <>
                  {!rows.length ? (
                    <div className="border-t border-slate-100 px-5 py-12 text-center">
                      <FileText
                        size={28}
                        aria-hidden="true"
                        className="mx-auto mb-3 text-slate-300"
                      />
                      <p className="text-sm font-medium text-slate-700">
                        Không có content item phù hợp.
                      </p>
                      <p className="mt-2 text-xs text-slate-500">
                        Thử chọn All, đổi ngôn ngữ hoặc điều chỉnh từ khóa.
                      </p>
                    </div>
                  ) : (
                    <CmsItemsTable
                      items={rows}
                      categories={catalog}
                      showCategory={!state.selectedCategory}
                      canWrite={state.canWrite}
                      pending={state.pending}
                      onEdit={state.openEditor}
                      onDelete={state.remove}
                    />
                  )}
                  <CatalogPagination
                    page={state.offset / ADMIN_PAGE_SIZE}
                    total={total ?? 0}
                    count={rows.length}
                    disabled={state.pending}
                    onChange={page => state.setOffset(page * ADMIN_PAGE_SIZE)}
                  />
                </>
              )
            )}
          </section>
        </>
      )}
      <details className="group rounded-xl border border-slate-200/80 bg-white/60 text-sm text-slate-500">
        <summary className="flex cursor-pointer list-none items-center gap-2 rounded-xl px-4 py-3 font-medium text-slate-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600">
          <Info size={16} aria-hidden="true" />
          Hướng dẫn chỉnh sửa
          <span aria-hidden="true" className="ml-auto text-slate-400 group-open:rotate-45">
            +
          </span>
        </summary>
        <div className="space-y-2 border-t border-slate-100 px-4 py-3 text-xs leading-6">
          <p>
            Chọn đúng category và ngôn ngữ trước khi sửa. Nội dung đã lưu có thể xuất hiện trên
            website ngay.
          </p>
          <p>
            Key nav.* thuộc nhóm nav; footer.* thuộc footer. Nếu còn bản trùng ở category khác,
            website ưu tiên category trùng phần đầu key.
          </p>
          <p>
            Tab website cùng địa chỉ sẽ tải lại nội dung sau khi lưu. Nếu dùng địa chỉ hoặc trình
            duyệt khác, hãy tải lại trang.
          </p>
        </div>
      </details>
      {state.editor && (
        <CmsEditorDialog
          item={state.editor.item}
          categories={catalog}
          category={state.selectedCategory || catalog[0]?.id || ''}
          language={state.language}
          pending={state.pending}
          error={state.editorError}
          onSave={state.save}
          onClose={state.closeEditor}
          clearError={state.clearEditorError}
        />
      )}
      {state.transfer && (
        <CmsImportDialog
          {...state.transfer}
          pending={state.pending}
          error={state.error}
          onImport={state.importFile}
          onClose={state.closeTransfer}
        />
      )}
    </div>
  )
}
