import AdminButton from './AdminButton'
import { useId } from 'react'
import { adminControl } from './adminStyles'

export default function AdminSectionNav({
  sections,
}: {
  sections: { id: string; label: string }[]
}) {
  const selectId = useId()
  const go = (id: string) =>
    document.getElementById(id)?.scrollIntoView({
      block: 'start',
      behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth',
    })
  return (
    <nav
      aria-label="Các phần trong editor"
      className="min-w-0 rounded-2xl border border-slate-200 bg-white p-3"
    >
      <div className="grid gap-2 text-xs font-medium text-slate-500 md:hidden">
        <label htmlFor={selectId}>Đi đến mục</label>
        <select
          id={selectId}
          className={`${adminControl} w-full`}
          value=""
          onChange={event => go(event.target.value)}
        >
          <option value="" disabled>
            Chọn phần cần chỉnh sửa
          </option>
          {sections.map(section => (
            <option key={section.id} value={section.id}>
              {section.label}
            </option>
          ))}
        </select>
      </div>
      <div className="hidden flex-wrap gap-2 md:flex">
        {sections.map(section => (
          <AdminButton key={section.id} type="button" onClick={() => go(section.id)}>
            {section.label}
          </AdminButton>
        ))}
      </div>
    </nav>
  )
}
