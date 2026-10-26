export const adminControl =
  'min-h-10 min-w-0 max-w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'

const buttonVariants = {
  primary: 'border-teal-700 bg-teal-700 text-white hover:border-teal-800 hover:bg-teal-800',
  secondary: 'border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50',
  danger:
    'border-transparent text-slate-500 hover:border-red-100 hover:bg-red-50 hover:text-red-700',
}

export interface AdminButtonStyleProps {
  variant?: keyof typeof buttonVariants
  size?: 'default' | 'icon'
  className?: string
}

/** Buttons and navigation links share presentation while retaining their native semantics. */
export function adminButtonClassName({
  variant = 'secondary',
  size = 'default',
  className = '',
}: AdminButtonStyleProps = {}) {
  return `inline-flex min-h-10 max-w-full shrink-0 items-center justify-center gap-2 rounded-lg border text-sm font-semibold transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0 ${size === 'icon' ? 'h-10 w-10 p-0' : 'px-3 py-2'} ${buttonVariants[variant]} ${className}`
}
