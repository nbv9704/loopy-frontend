import { Link } from 'react-router-dom'
import { Home, Search } from 'lucide-react'
import SEO from '../components/common/SEO'

const NotFoundPage: React.FC = () => {
  return (
    <>
      <SEO
        title="404 | Loopy"
        description="Trang bạn đang tìm không tồn tại hoặc đã được chuyển sang nơi khác."
        noIndex
      />
      <main className="loopy-page flex min-h-screen items-center justify-center px-4 py-12">
        <section className="mx-auto w-full max-w-2xl text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-3xl border border-brand-teal/30 bg-brand-teal/10 text-brand-ocean shadow-[0_6px_0_rgba(15,23,42,0.18)]">
            <Search className="h-7 w-7" />
          </div>

          <p className="text-sm font-black uppercase tracking-[0.24em] text-brand-ocean">
            404 - Không tìm thấy
          </p>

          <h1 className="loopy-heading mt-4 text-4xl font-black md:text-6xl">
            Trang này không tồn tại.
          </h1>

          <p className="loopy-body mx-auto mt-5 max-w-xl text-base leading-8 md:text-lg">
            Đường dẫn có thể đã đổi, bị gõ sai hoặc chưa được mở trong Loopy.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <Link
              to="/"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-teal px-5 py-3 text-sm font-black uppercase tracking-wide text-[#111827] shadow-[0_5px_0_#0b889c] transition-all hover:-translate-y-0.5 active:translate-y-1 active:shadow-[0_1px_0_#0b889c]"
            >
              <Home className="h-4 w-4" />
              Về trang chủ
            </Link>
          </div>
        </section>
      </main>
    </>
  )
}

export default NotFoundPage
