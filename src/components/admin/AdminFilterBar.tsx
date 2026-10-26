import type { ReactNode } from 'react'

export default function AdminFilterBar({
  children,
  label = 'Bộ lọc danh sách',
}: {
  children: ReactNode
  label?: string
}) {
  return (
    <section
      aria-label={label}
      className="grid min-w-0 grid-cols-2 items-end gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 xl:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))] [&>*]:min-w-0 [&>label]:text-sm [&>label]:font-medium [&>label]:text-slate-600 [&_input]:w-full [&_select]:w-full"
    >
      {children}
    </section>
  )
}
