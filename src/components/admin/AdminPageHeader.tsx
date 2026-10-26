import type { ReactNode } from 'react'

export default function AdminPageHeader({
  title,
  description,
  eyebrow,
  actions,
  leading,
}: {
  title: ReactNode
  description: ReactNode
  eyebrow?: string
  actions?: ReactNode
  leading?: ReactNode
}) {
  return (
    <header className="flex min-w-0 flex-wrap items-start justify-between gap-4">
      <div className="flex min-w-0 max-w-full flex-1 basis-full items-start gap-3 sm:basis-80">
        {leading}
        <div className="min-w-0">
          {eyebrow && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-teal-700">
              {eyebrow}
            </p>
          )}
          <h1 className="break-words text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
            {title}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">{description}</p>
        </div>
      </div>
      {actions && <div className="flex max-w-full flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
