import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BookOpenCheck, Edit, Lock, Plus, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import SEO from '../components/common/SEO'
import { PublicShell } from '../components/PublicShell'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../contexts/AuthContext'
import { useContentPreloader } from '../hooks/useContentPreloader'
import { practiceService } from '../services/practice.service'
import type { PracticeSet } from '../types/practice.types'

const MyPracticeSetsPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { i18n } = useTranslation()
  const [sets, setSets] = useState<PracticeSet[]>([])
  const [setsLoading, setSetsLoading] = useState(true)

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

  const { content, loading: contentLoading } = useContentPreloader(contentKeys, i18n.language)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: location } })
    }
  }, [authLoading, location, navigate, user])

  const loadSets = async () => {
    setSetsLoading(true)
    try {
      const result = await practiceService.listSets({
        limit: 50, // Backend max limit is 50
        mine: true,
      })
      setSets(result.items)
    } finally {
      setSetsLoading(false)
    }
  }

  useEffect(() => {
    if (user) {
      loadSets()
    }
  }, [user])

  const handleDelete = async (setId: string) => {
    if (window.confirm('Bạn có chắc chắn muốn xoá bộ bài tập này không? Hành động này không thể hoàn tác, và tất cả lịch sử làm bài của người học sẽ bị xoá.')) {
      try {
        await practiceService.deleteSet(setId)
        toast.success('Xoá thành công')
        loadSets() // Refresh list
      } catch (error) {
        toast.error(error instanceof Error ? error.message : 'Không thể xoá')
      }
    }
  }

  if (contentLoading) {
    return <LoadingScreen message="Loading practice sets..." />
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
              <h1 className="text-4xl font-black tracking-normal text-slate-950">
                Bộ bài tập của tôi
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600">
                Xem, chỉnh sửa hoặc xoá các bộ bài tập bạn đã tạo.
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

          {setsLoading ? (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="h-48 animate-pulse rounded-lg border border-slate-200 bg-white" />
              ))}
            </div>
          ) : sets.length === 0 ? (
            <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <Lock className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-xl font-black text-slate-950">
                Bạn chưa tạo bộ bài tập nào
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">
                Nhấn nút "Tạo mới" để bắt đầu soạn thảo bộ bài tập của riêng mình.
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {sets.map(set => (
                <div
                  key={set.id}
                  className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm flex flex-col"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-600">
                      {set.difficulty}
                    </span>
                    <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-wide ${set.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                      {set.status}
                    </span>
                  </div>
                  <h2 className="text-lg font-black text-slate-950 line-clamp-1" title={set.title}>{set.title}</h2>
                  <p className="mt-2 line-clamp-2 text-sm font-medium leading-6 text-slate-600 flex-grow">{set.description}</p>
                  <div className="mt-4 text-xs font-bold text-slate-500">{set.questionCount || 0} câu hỏi</div>
                  
                  <div className="mt-5 flex items-center gap-2 pt-4 border-t border-slate-100">
                    <button
                      onClick={() => navigate(`/practice/sets/${set.id}`, { state: { from: 'my-sets' } })}
                      className="flex-grow rounded bg-slate-100 py-2 text-sm font-bold text-slate-700 hover:bg-slate-200 transition"
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
                      onClick={() => handleDelete(set.id)}
                      className="flex items-center justify-center rounded bg-red-50 p-2 text-red-600 hover:bg-red-100 transition"
                      title="Xoá"
                    >
                      <Trash2 className="h-4 w-4" />
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
