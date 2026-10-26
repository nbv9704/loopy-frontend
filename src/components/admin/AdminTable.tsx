import type { ReactNode } from 'react'
import './AdminTable.css'

/** Cells use data-label for the stacked mobile view; rows and actions exist only once. */
export default function AdminTable({
  headings,
  label,
  children,
}: {
  headings: string[]
  label: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0 overflow-hidden rounded-2xl border border-slate-200 bg-white">
      <table role="table" className="admin-data-table" aria-label={label}>
        <thead>
          <tr>
            {headings.map(heading => (
              <th scope="col" key={heading}>
                {heading}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}
