import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import Header, { HeaderProps } from './Header'
import Footer, { FooterProps } from './Footer'

export function PressedButton({ children, to, variant = 'primary' }: { children: ReactNode; to: string; variant?: 'primary' | 'secondary' }) {
  const classes = variant === 'primary'
    ? 'bg-brand-teal text-[#111827] shadow-[0_5px_0_#0b889c] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_#0b889c]'
    : 'loopy-subtle-button border shadow-[0_5px_0_rgba(15,23,42,0.22)] hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_rgba(15,23,42,0.22)]'

  return (
    <Link to={to} className={`inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-black uppercase tracking-wide transition-all ${classes}`}>
      {children}
    </Link>
  )
}

export function PublicShell({ children, headerContent, footerContent }: { children: ReactNode; headerContent?: HeaderProps['headerContent']; footerContent?: FooterProps['footerContent'] }) {
  return (
    <div className="loopy-page min-h-screen flex flex-col">
      <Header headerContent={headerContent} />
      <div className="flex-1 animate-v2-page-enter">
        {children}
      </div>
      <Footer footerContent={footerContent} />
    </div>
  )
}

