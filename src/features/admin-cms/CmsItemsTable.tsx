import { Pencil, Trash2 } from 'lucide-react'
import { isWritableCmsItem, type CmsCategory, type CmsItem, type CmsListItem } from './cms.service'
import AdminButton from '../../components/admin/AdminButton'

const date = new Intl.DateTimeFormat('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })
const time = new Intl.DateTimeFormat('vi-VN', { hour: '2-digit', minute: '2-digit' })
const cell = 'block min-w-0 px-4 py-3 align-top md:table-cell md:px-5 md:py-4'

/** One set of rows: a table on desktop and stacked records on narrow screens. */
export default function CmsItemsTable({
  items,
  categories,
  showCategory,
  canWrite,
  pending,
  onEdit,
  onDelete,
}: {
  items: CmsListItem[]
  categories: CmsCategory[]
  showCategory: boolean
  canWrite: boolean
  pending: boolean
  onEdit: (item: CmsItem) => void
  onDelete: (item: CmsItem) => void
}) {
  const categoryNames = new Map(categories.map(category => [category.id, category.name]))
  return (
    <table
      role="table"
      className="block w-full table-fixed border-separate border-spacing-0 text-left text-sm md:table"
    >
      <caption className="sr-only">Danh sách content items</caption>
      <thead className="hidden bg-slate-50 text-xs text-slate-500 md:table-header-group">
        <tr>
          <th scope="col" className="w-[27%] border-y border-slate-100 px-5 py-3 font-semibold">
            Key
          </th>
          {showCategory && (
            <th scope="col" className="w-[13%] border-y border-slate-100 px-5 py-3 font-semibold">
              Category
            </th>
          )}
          <th scope="col" className="border-y border-slate-100 px-5 py-3 font-semibold">
            Nội dung
          </th>
          <th scope="col" className="w-32 border-y border-slate-100 px-5 py-3 font-semibold">
            Cập nhật
          </th>
          <th
            scope="col"
            className="w-36 border-y border-slate-100 px-5 py-3 text-right font-semibold"
          >
            Thao tác
          </th>
        </tr>
      </thead>
      <tbody className="grid gap-3 bg-slate-50 p-3 md:table-row-group md:bg-white md:p-0">
        {items.map(item => {
          const updated = item.updatedAt ? new Date(item.updatedAt) : null
          const disabled = pending || !canWrite || !isWritableCmsItem(item)
          return (
            <tr
              key={item.id}
              className="grid min-w-0 grid-cols-2 overflow-hidden rounded-xl border border-slate-200 bg-white md:table-row md:rounded-none md:border-0 md:[&:not(:last-child)>td]:border-b md:[&>td]:border-slate-100"
            >
              <td className={`${cell} col-span-2 pb-2 md:pb-4`}>
                <div className="flex min-w-0 flex-wrap items-center gap-2">
                  <p
                    title={item.key}
                    className="min-w-0 line-clamp-3 break-all font-mono text-xs font-semibold leading-5 text-slate-900"
                  >
                    {item.key}
                  </p>
                  <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500">
                    {item.type}
                  </span>
                </div>
                {item.description && (
                  <p
                    className="mt-1.5 line-clamp-2 break-words text-xs leading-5 text-slate-500"
                    title={item.description}
                  >
                    {item.description}
                  </p>
                )}
              </td>
              {showCategory && (
                <td className={`${cell} col-span-2 py-1 md:py-4`}>
                  <span className="mr-2 text-xs text-slate-400 md:hidden" aria-hidden="true">
                    Category
                  </span>
                  <span className="break-all text-xs text-slate-600">
                    {categoryNames.get(item.categoryId) ?? item.categoryId}
                  </span>
                </td>
              )}
              <td className={`${cell} col-span-2 pt-2 md:pt-4`}>
                <p className="line-clamp-3 whitespace-pre-wrap break-words leading-6 text-slate-700 [overflow-wrap:anywhere]">
                  {item.value}
                </p>
              </td>
              <td className={`${cell} self-end border-t border-slate-100 md:border-t-0`}>
                <span
                  className="mb-1 block text-[10px] text-slate-400 md:hidden"
                  aria-hidden="true"
                >
                  Cập nhật
                </span>
                {updated ? (
                  <time
                    dateTime={item.updatedAt!}
                    title={updated.toLocaleString('vi-VN')}
                    className="block text-xs leading-5 text-slate-600"
                  >
                    {date.format(updated)}
                    <span className="ml-2 text-slate-400 md:ml-0 md:block">
                      {time.format(updated)}
                    </span>
                  </time>
                ) : (
                  <span className="text-xs text-slate-400">Chưa có thời gian</span>
                )}
              </td>
              <td className={`${cell} self-end border-t border-slate-100 md:border-t-0`}>
                <div className="flex justify-end gap-1.5">
                  <AdminButton
                    aria-label={`Sửa ${item.key}`}
                    disabled={disabled}
                    onClick={() => {
                      if (isWritableCmsItem(item)) onEdit(item)
                    }}
                  >
                    <Pencil size={14} aria-hidden="true" />
                    Sửa
                  </AdminButton>
                  <AdminButton
                    variant="danger"
                    size="icon"
                    aria-label={`Xóa ${item.key}`}
                    title={`Xóa ${item.key}`}
                    disabled={disabled}
                    onClick={() => {
                      if (isWritableCmsItem(item)) onDelete(item)
                    }}
                  >
                    <Trash2 size={16} aria-hidden="true" />
                  </AdminButton>
                </div>
              </td>
            </tr>
          )
        })}
      </tbody>
    </table>
  )
}
