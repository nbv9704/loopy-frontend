import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

/** Shared action hierarchy for the public learning entry pages. */
export default function LearningLink({
  to,
  children,
  secondary = false,
}: {
  to: string
  children: ReactNode
  secondary?: boolean
}) {
  return (
    <Link
      to={to}
      className={`inline-flex min-h-12 items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand-ocean ${
        secondary
          ? 'loopy-heading hover:bg-brand-teal/10'
          : 'bg-brand-teal text-slate-950 shadow-[0_3px_0_#0b889c] hover:bg-brand-teal/85 active:shadow-none'
      }`}
    >
      {children}
    </Link>
  )
}
