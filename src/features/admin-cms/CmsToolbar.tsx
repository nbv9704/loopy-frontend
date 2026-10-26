import { useRef } from 'react'
import { Download, Search, Upload } from 'lucide-react'
import type { CmsCategory } from './cms.service'
import AdminButton from '../../components/admin/AdminButton'

const field =
  'mt-2 h-11 w-full min-w-0 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 outline-none transition-colors focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15 disabled:bg-slate-50'

export default function CmsToolbar({
  categories,
  category,
  language,
  search,
  pending,
  canWrite,
  onCategory,
  onLanguage,
  onSearch,
  onExport,
  onImport,
}: {
  categories: CmsCategory[]
  category: string
  language: 'vi' | 'en'
  search: string
  pending: boolean
  canWrite: boolean
  onCategory: (value: string) => void
  onLanguage: (value: 'vi' | 'en') => void
  onSearch: (value: string) => void
  onExport: () => void
  onImport: (file: File) => void
}) {
  const input = useRef<HTMLInputElement>(null)
  return (
    <section
      aria-label="Bộ lọc và dữ liệu CMS"
      className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white"
    >
      <fieldset
        disabled={pending}
        className="grid min-w-0 grid-cols-2 gap-4 p-4 sm:p-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,15rem)_minmax(0,11rem)]"
      >
        <legend className="sr-only">Lọc nội dung CMS</legend>
        <label className="col-span-2 min-w-0 text-sm font-semibold text-slate-700 xl:col-span-1">
          Tìm kiếm
          <span className="relative block">
            <Search
              aria-hidden="true"
              size={17}
              className="pointer-events-none absolute left-3 top-1/2 mt-1 -translate-y-1/2 text-slate-400"
            />
            <input
              aria-label="Tìm key hoặc value"
              placeholder="Tìm theo key hoặc nội dung..."
              maxLength={200}
              value={search}
              onChange={event => onSearch(event.target.value)}
              className={`${field} pl-10 font-normal`}
            />
          </span>
        </label>
        <label className="min-w-0 text-sm font-semibold text-slate-700">
          Category
          <select
            aria-label="Category"
            value={category}
            onChange={event => onCategory(event.target.value)}
            className={`${field} font-normal`}
          >
            <option value="">All</option>
            {categories.map(entry => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </label>
        <label className="min-w-0 text-sm font-semibold text-slate-700">
          Ngôn ngữ
          <select
            aria-label="Language"
            value={language}
            onChange={event => onLanguage(event.target.value as 'vi' | 'en')}
            className={`${field} font-normal`}
          >
            <option value="vi">Tiếng Việt</option>
            <option value="en">English</option>
          </select>
        </label>
      </fieldset>
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 bg-slate-50/60 px-4 py-3 sm:px-5">
        <p className="min-w-0 text-xs leading-5 text-slate-500">
          Import để cập nhật hàng loạt. Export lấy toàn bộ nội dung {language.toUpperCase()}.
        </p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Import và export CMS">
          <AdminButton disabled={pending} onClick={onExport}>
            <Download size={16} aria-hidden="true" />
            Export {language.toUpperCase()}
          </AdminButton>
          <AdminButton disabled={pending || !canWrite} onClick={() => input.current?.click()}>
            <Upload size={16} aria-hidden="true" />
            Import JSON
          </AdminButton>
          <input
            ref={input}
            aria-label="Chọn file import CMS"
            type="file"
            accept=".json,application/json"
            tabIndex={-1}
            disabled={pending || !canWrite}
            className="sr-only"
            onChange={event => {
              const file = event.currentTarget.files?.[0]
              event.currentTarget.value = ''
              if (file) onImport(file)
            }}
          />
        </div>
      </div>
    </section>
  )
}
