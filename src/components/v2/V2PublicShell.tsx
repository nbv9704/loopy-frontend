import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

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

export function V2PublicShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-[#f7fbff] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-[#f7fbff]/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-6">
          <Link to="/" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#111827] text-lg font-black text-brand-teal shadow-[0_4px_0_#54d9c4]">L</div>
            <div>
              <div className="text-lg font-black leading-none">Loopy</div>
              <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">V2 sandbox</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-6 text-sm font-bold text-slate-600 md:flex">
            <Link to="/v2/languages" className="hover:text-slate-950">Lộ trình</Link>
            <Link to="/v2/library" className="hover:text-slate-950">Library</Link>
            <Link to="/v2/learn" className="hover:text-slate-950">Learn</Link>
            <Link to="/v2/playground" className="hover:text-slate-950">Playground</Link>
            <Link to="/v2/docs" className="hover:text-slate-950">Docs</Link>
            <Link to="/v2/profile" className="hover:text-slate-950">Profile</Link>
            <Link to="/v2/onboarding" className="hover:text-slate-950">Onboarding</Link>
            <Link to="/v2/landing#learn" className="hover:text-slate-950">Học thử</Link>
            <Link to="/v2/landing#journey" className="hover:text-slate-950">Journey Map</Link>
            <Link to="/v2/landing#faq" className="hover:text-slate-950">FAQ</Link>
          </nav>

          <V2PressedButton to="/sample-lesson">Thử bài đầu</V2PressedButton>
        </div>
      </header>

      {children}

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.4fr,1fr,1fr] md:px-6">
          <div>
            <div className="text-2xl font-black">Loopy</div>
            <p className="mt-3 max-w-md text-sm leading-6 text-slate-600">
              UI v2 sandbox để test hướng giao diện mới. Route này chưa thay thế sản phẩm hiện tại.
            </p>
          </div>
          <div>
            <div className="mb-3 text-sm font-black uppercase tracking-widest text-slate-400">Khám phá</div>
            <div className="grid gap-2 text-sm font-semibold text-slate-600">
              <Link to="/v2/languages">Lộ trình</Link>
              <Link to="/v2/library">Library v2</Link>
              <Link to="/v2/learn">Learn v2</Link>
              <Link to="/v2/playground">Playground v2</Link>
              <Link to="/v2/docs">Docs v2</Link>
              <Link to="/v2/profile">Profile v2</Link>
              <Link to="/v2/onboarding">Onboarding v2</Link>
              <Link to="/sample-lesson">Sample lesson</Link>
              <Link to="/playground">Playground hiện tại</Link>
            </div>
          </div>
          <div>
            <div className="mb-3 text-sm font-black uppercase tracking-widest text-slate-400">Nguyên tắc</div>
            <p className="text-sm leading-6 text-slate-600">Chạy thử chỉ xem output. Kiểm tra mới chấm bài. Progress chỉ lưu sau khi backend xác nhận.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
