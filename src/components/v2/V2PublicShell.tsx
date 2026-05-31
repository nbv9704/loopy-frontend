import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import V2Header, { V2HeaderProps } from './V2Header'
import V2Footer, { V2FooterProps } from './V2Footer'

export function V2PressedButton({ children, to, variant = 'primary' }: { children: ReactNode; to: string; variant?: 'primary' | 'secondary' }) {
  const classes = variant === 'primary'
    ? 'bg-brand-teal text-[#111827] shadow-[0_5px_0_#0b889c] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_#0b889c]'
    : 'border border-slate-300 bg-white text-slate-900 shadow-[0_5px_0_#cbd5e1] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_#cbd5e1]'

  return (
    <Link to={to} className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-wide transition-all ${classes}`}>
      {children}
    </Link>
  )
}

export function V2PublicShell({ children, headerContent, footerContent }: { children: ReactNode; headerContent?: V2HeaderProps['headerContent']; footerContent?: V2FooterProps['footerContent'] }) {
  return (
    <div className="min-h-screen bg-[#f7fbff] text-slate-950 flex flex-col">
      <V2Header headerContent={headerContent} />
      <div className="flex-1 animate-v2-page-enter">
        {children}
      </div>
      <V2Footer footerContent={footerContent} />
    </div>
  )
}

