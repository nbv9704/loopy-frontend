import React, { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { BookOpenCheck, Filter, Lock, Play, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SEO from '../../components/common/SEO'
import { V2PublicShell } from '../../components/v2/V2PublicShell'
import { LoadingScreen } from '../../components/v2/LoadingScreen'
import { useAuth } from '../../contexts/AuthContext'
import { useContentPreloader } from '../../hooks/useContentPreloader'
import { practiceService } from '../../services/practice.service'
import type { PracticeSet } from '../../types/practice.types'

const V2PracticeSetsPage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { i18n } = useTranslation()
  const [sets, setSets] = useState<PracticeSet[]>([])
  const [setsLoading, setSetsLoading] = useState(true)
  const [topicFilter, setTopicFilter] = useState('')
  const [languageFilter, setLanguageFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')
  const [mineOnly, setMineOnly] = useState(false)

  const contentKeys = [
    'nav.learn',
    'nav.playground',
    'nav.practice',
    'nav.docs',
    'nav.settings',
    'nav.logout',
    'practice.sets.page.title',
    'practice.sets.page.subtitle',
    'practice.sets.empty.title',
    'practice.sets.empty.desc',
    'practice.sets.create',
    'practice.sets.start',
    'practice.sets.locked',
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

  useEffect(() => {
    if (!user) return

    let mounted = true
    const loadSets = async () => {
      setSetsLoading(true)
      try {
        const result = await practiceService.listSets({
          limit: 24,
          topic: topicFilter.trim() || undefined,
          languageId: languageFilter.trim() || undefined,
          difficulty: difficultyFilter === 'all' ? undefined : difficultyFilter,
          mine: mineOnly,
        })
        if (mounted) setSets(result.items)
      } finally {
        if (mounted) setSetsLoading(false)
      }
    }

    loadSets()
    return () => {
      mounted = false
    }
  }, [difficultyFilter, languageFilter, mineOnly, topicFilter, user])

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
    <V2PublicShell headerContent={headerContent} footerContent={footerContent}>
      <SEO title="Practice Sets | Loopy" description={content['practice.sets.page.subtitle'] || undefined} />
      <main className="flex-grow pb-16 pt-8 md:pt-10">
        <section className="mx-auto max-w-6xl px-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-brand-teal">
                <BookOpenCheck className="h-4 w-4" />
                {content['practice.sets.badge'] || 'Practice sets'}
              </div>
              <h1 className="text-4xl font-black tracking-normal text-slate-950">
                {content['practice.sets.page.title'] || 'Bộ bài tập'}
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600">
                {content['practice.sets.page.subtitle'] || 'Duyệt bộ bài tập chính thức hoặc bộ công khai do người học tạo để ôn theo chủ đề.'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setTopicFilter('')
                  setLanguageFilter('')
                  setDifficultyFilter('all')
                  setMineOnly(false)
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700"
              >
                <Filter className="h-4 w-4" />
                Reset
              </button>
              <button
                onClick={() => navigate('/practice/sets/new')}
                className="inline-flex items-center gap-2 rounded-lg bg-brand-teal px-4 py-3 text-sm font-black text-slate-950"
              >
                <Plus className="h-4 w-4" />
                {content['practice.sets.create'] || 'Tạo bộ'}
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-[1.2fr,1fr,1fr,auto]">
            <input
              value={topicFilter}
              onChange={event => setTopicFilter(event.target.value)}
              placeholder="Chủ đề"
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-brand-teal"
            />
            <input
              value={languageFilter}
              onChange={event => setLanguageFilter(event.target.value)}
              placeholder="Ngôn ngữ, ví dụ javascript"
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-brand-teal"
            />
            <select
              value={difficultyFilter}
              onChange={event => setDifficultyFilter(event.target.value as 'all' | 'easy' | 'medium' | 'hard')}
              className="rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-semibold outline-none focus:border-brand-teal"
            >
              <option value="all">Tất cả độ khó</option>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
            <label className="inline-flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2.5 text-sm font-black text-slate-700">
              <input
                type="checkbox"
                checked={mineOnly}
                onChange={event => setMineOnly(event.target.checked)}
                className="h-4 w-4 accent-brand-teal"
              />
              Của tôi
            </label>
          </div>

          {setsLoading ? (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="h-48 animate-pulse rounded-lg border border-slate-200 bg-white" />
              ))}
            </div>
          ) : sets.length === 0 ? (
            <div className="mt-8 rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
              <Lock className="mx-auto h-10 w-10 text-slate-400" />
              <h2 className="mt-4 text-xl font-black text-slate-950">
                {content['practice.sets.empty.title'] || 'Chưa có bộ bài tập công khai'}
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">
                {content['practice.sets.empty.desc'] || 'Backend đã sẵn sàng cho bộ bài tập. Khi team hoặc người dùng publish bộ public, danh sách sẽ hiển thị tại đây.'}
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {sets.map(set => (
                <button
                  key={set.id}
                  onClick={() => navigate(`/practice/sets/${set.id}`)}
                  className="rounded-lg border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-teal/40 hover:shadow-lg"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-slate-600">
                      {set.difficulty}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{set.questionCount || 0} câu</span>
                  </div>
                  <h2 className="text-lg font-black text-slate-950">{set.title}</h2>
                  <p className="mt-2 line-clamp-3 text-sm font-medium leading-6 text-slate-600">{set.description}</p>
                  <div className="mt-5 inline-flex items-center gap-2 text-sm font-black text-brand-teal">
                    <Play className="h-4 w-4" />
                    {content['practice.sets.start'] || 'Bắt đầu'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </V2PublicShell>
  )
}

export default V2PracticeSetsPage
