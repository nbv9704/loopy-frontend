import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BookOpenCheck, Edit, Lock, Plus, Archive } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import SEO from '../components/common/SEO'
import { PublicShell } from '../components/PublicShell'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../contexts/AuthContext'
import { useContentPreloader } from '../hooks/useContentPreloader'
import { practiceService } from '../services/practice.service'
import { usePracticeSets } from '../hooks/usePracticeSets'
import { useAsyncAction } from '../hooks/useAsyncAction'
import type { PracticeSet } from '../types/practice.types'

const MyPracticeSetsPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { i18n } = useTranslation()
  const { sets, setsLoading, setsError, retrySets } = usePracticeSets(
    { limit: 50, mine: true },
    user?.id,
    Boolean(user)
  )
  const archive = useAsyncAction(user?.id)
  const [archiveError, setArchiveError] = useState<string | null>(null)
  useEffect(() => {
    setArchiveError(null)
  }, [user?.id])

  const contentKeys = [
    'nav.learn',
    'nav.playground',
    'nav.practice',
    'nav.docs',
    'nav.settings',
    'nav.logout',
    'footer.aboutLoopy',
    'footer.about',
    'footer.team',
    'footer.contact',
    'footer.resources',
    'footer.docs',
    'footer.blog',
    'footer.faq',
    'footer.description',
    'footer.allRightsReserved',
    'footer.privacy',
    'footer.terms',
  ]

  const { content, initialLoading: contentLoading } = useContentPreloader(
    contentKeys,
    i18n.language
  )

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: location } })
    }
  }, [authLoading, location, navigate, user])

  const handleArchive = (item: PracticeSet) => {
    if (archive.pending) return
    void archive.run(
      async () => {
        if (
          !window.confirm(
            'Lưu trữ bộ bài tập này? Bộ sẽ được ẩn khỏi danh sách, tiến độ và lịch sử làm bài vẫn được giữ lại.'
          )
        )
          return false
        setArchiveError(null)
        await practiceService.deleteSet(item.id, item.status)
        return true
      },
      {
        onSuccess: confirmed => {
          if (confirmed) {
            toast.success('Đã lưu trữ bộ bài tập')
            retrySets()
          }
        },
        onError: error => {
          setArchiveError(error instanceof Error ? error.message : 'Không thể lưu trữ')
        },
      }
    )
  }

  if (contentLoading) {
    return <LoadingScreen />
  }

  const headerContent = {
    'nav.learn': content['nav.learn'],
    'nav.playground': content['nav.playground'],
    'nav.practice': content['nav.practice'],
    'nav.docs': content['nav.docs'],
    'nav.settings': content['nav.settings'],
    'nav.logout': content['nav.logout'],
  }

  const footerContent = {
    'footer.aboutLoopy': content['footer.aboutLoopy'],
    'footer.about': content['footer.about'],
    'footer.team': content['footer.team'],
    'footer.contact': content['footer.contact'],
    'footer.resources': content['footer.resources'],
    'footer.docs': content['footer.docs'],
    'footer.blog': content['footer.blog'],
    'footer.faq': content['footer.faq'],
    'footer.description': content['footer.description'],
    'footer.allRightsReserved': content['footer.allRightsReserved'],
    'footer.privacy': content['footer.privacy'],
    'footer.terms': content['footer.terms'],
  }

  return (
    <PublicShell headerContent={headerContent} footerContent={footerContent}>
      <SEO title="My Sets | Loopy" description="Manage your practice sets" />
      <main className="flex-grow pb-16 pt-8 md:pt-10">
        <section className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-brand-teal">
                <BookOpenCheck className="h-4 w-4" />
                Quản lý
              </div>
              <h1 className="loopy-heading text-4xl font-black tracking-normal">
                Bộ bài tập của tôi
              </h1>
              <p className="loopy-body mt-4 max-w-2xl text-base font-medium leading-7">
                Xem, chỉnh sửa hoặc lưu trữ các bộ bài tập bạn đã tạo.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => navigate('/practice/sets/new')}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-3 text-sm font-black text-slate-950 hover:bg-teal-400"
              >
                <Plus className="h-4 w-4" />
                Tạo mới
              </button>
            </div>
          </div>

          {archiveError && (
            <div role="alert" className="loopy-card mt-6 rounded-xl border p-4">
              <p>{archiveError}</p>
              <button
                type="button"
                onClick={() => {
                  setArchiveError(null)
                  retrySets()
                }}
                className="mt-3 rounded-lg border px-4 py-2 font-bold"
              >
                Tải lại danh sách
              </button>
            </div>
          )}
          {setsLoading ? (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div
                  key={index}
                  className="loopy-skeleton h-48 animate-pulse rounded-lg border loopy-border"
                />
              ))}
            </div>
          ) : setsError ? (
            <div role="alert" className="loopy-card mt-8 rounded-lg border px-6 py-12 text-center">
              <p>{setsError}</p>
              <button
                onClick={retrySets}
                className="mt-4 rounded-lg bg-brand-teal px-5 py-3 font-bold text-slate-950"
              >
                {i18n.language.startsWith('vi') ? 'Thử lại' : 'Retry'}
              </button>
            </div>
          ) : sets.length === 0 ? (
            <div className="loopy-card mt-8 rounded-lg border border-dashed px-6 py-12 text-center">
              <Lock className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="loopy-heading mt-4 text-xl font-black">Bạn chưa tạo bộ bài tập nào</h2>
              <p className="loopy-body mx-auto mt-2 max-w-xl text-sm font-medium leading-6">
                Nhấn nút "Tạo mới" để bắt đầu soạn thảo bộ bài tập của riêng mình.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {sets.map(set => (
                <div
                  key={set.id}
                  className="loopy-card flex flex-col rounded-lg border p-5 text-left shadow-sm"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="loopy-surface-soft rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide loopy-muted">
                      {set.difficulty}
                    </span>
                    <span
                      className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${set.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}
                    >
                      {set.status}
                    </span>
                  </div>
                  <h2 className="loopy-heading line-clamp-1 text-lg font-black" title={set.title}>
                    {set.title}
                  </h2>
                  <p className="loopy-body mt-2 line-clamp-2 flex-grow text-sm font-medium leading-6">
                    {set.description}
                  </p>
                  <div className="mt-4 text-xs font-bold text-slate-500">
                    {set.questionCount || 0} câu hỏi
                  </div>

                  <div className="mt-5 flex items-center gap-2 border-t loopy-border pt-4">
                    <button
                      onClick={() =>
                        navigate(`/practice/sets/${set.id}`, { state: { from: 'my-sets' } })
                      }
                      className="loopy-subtle-button flex-grow rounded border py-2 text-sm font-bold transition"
                    >
                      Xem
                    </button>
                    <button
                      onClick={() => navigate(`/practice/sets/${set.id}/edit`)}
                      className="flex items-center justify-center rounded bg-brand-teal/10 p-2 text-brand-teal hover:bg-brand-teal/20 transition"
                      title="Chỉnh sửa"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleArchive(set)}
                      disabled={archive.pending}
                      className="flex items-center justify-center rounded bg-red-50 p-2 text-red-600 hover:bg-red-100 transition"
                      title="Lưu trữ"
                    >
                      <Archive className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </PublicShell>
  )
}

export default MyPracticeSetsPage
