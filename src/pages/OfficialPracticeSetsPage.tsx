import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Filter, Lock, Play, ArrowLeft } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SEO from '../components/common/SEO'
import { PublicShell } from '../components/PublicShell'
import { LoadingScreen } from '../components/LoadingScreen'
import { useContentPreloader } from '../hooks/useContentPreloader'
import { practiceService } from '../services/practice.service'
import type { PracticeSet } from '../types/practice.types'

const OfficialPracticeSetsPage: React.FC = () => {
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const [sets, setSets] = useState<PracticeSet[]>([])
  const [setsLoading, setSetsLoading] = useState(true)
  const [topicFilter, setTopicFilter] = useState('')
  const [languageFilter, setLanguageFilter] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'easy' | 'medium' | 'hard'>('all')

  const contentKeys = [
    'nav.learn',
    'nav.playground',
    'nav.practice',
    'nav.docs',
    'nav.settings',
    'nav.logout',
    'practice.sets.start',
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
    let mounted = true
    const loadSets = async () => {
      setSetsLoading(true)
      try {
        const result = await practiceService.listSets({
          limit: 24,
          topic: topicFilter.trim() || undefined,
          languageId: languageFilter.trim() || undefined,
          difficulty: difficultyFilter === 'all' ? undefined : difficultyFilter,
          official: true,
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
  }, [difficultyFilter, languageFilter, topicFilter])

  if (contentLoading) {
    return <LoadingScreen message="Loading official sets..." />
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
      <SEO title="Official Sets | Loopy" description="Bộ bài tập chính thức từ đội ngũ Loopy" />
      <main className="flex-grow pb-16 pt-8 md:pt-10">
        <section className="mx-auto max-w-6xl px-6">
          <button
            onClick={() => navigate('/practice')}
            className="mb-6 inline-flex items-center gap-2 text-sm font-black text-slate-600 hover:text-brand-teal"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to practice
          </button>

          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-blue-600">
                <ShieldCheck className="h-4 w-4" />
                Official
              </div>
              <h1 className="text-4xl font-black tracking-normal text-slate-950">
                Bộ bài tập chính thức
              </h1>
              <p className="mt-4 max-w-2xl text-base font-medium leading-7 text-slate-600">
                Các bộ bài tập chuẩn do đội ngũ phát triển xây dựng để đánh giá chính xác kiến thức của bạn.
              </p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setTopicFilter('')
                  setLanguageFilter('')
                  setDifficultyFilter('all')
                }}
                className="inline-flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-700"
              >
                <Filter className="h-4 w-4" />
                Reset
              </button>
            </div>
          </div>

          <div className="mt-6 grid gap-3 rounded-lg border border-slate-200 bg-white p-4 md:grid-cols-3">
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
                Chưa có bộ bài tập chính thức nào
              </h2>
              <p className="mx-auto mt-2 max-w-xl text-sm font-medium leading-6 text-slate-600">
                Đội ngũ phát triển hiện đang chuẩn bị các nội dung chính thức. Bạn hãy quay lại sau nhé!
              </p>
            </div>
          ) : (
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {sets.map(set => (
                <button
                  key={set.id}
                  onClick={() => navigate(`/practice/sets/${set.id}`, { state: { from: 'official-sets' } })}
                  className="rounded-lg border border-blue-100 bg-white p-5 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg relative overflow-hidden"
                >
                  <div className="absolute top-0 right-0 h-16 w-16 -translate-y-8 translate-x-8 rounded-full bg-blue-50"></div>
                  
                  <div className="relative mb-4 flex items-center justify-between">
                    <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-black uppercase tracking-wide text-blue-600 border border-blue-100 flex items-center gap-1">
                      <ShieldCheck className="h-3 w-3" />
                      {set.difficulty}
                    </span>
                    <span className="text-xs font-bold text-slate-500">{set.questionCount || 0} câu</span>
                  </div>
                  <h2 className="relative text-lg font-black text-slate-950">{set.title}</h2>
                  <p className="relative mt-2 line-clamp-3 text-sm font-medium leading-6 text-slate-600">{set.description}</p>
                  <div className="relative mt-5 inline-flex items-center gap-2 text-sm font-black text-blue-600">
                    <Play className="h-4 w-4" />
                    {content['practice.sets.start'] || 'Bắt đầu'}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </main>
    </PublicShell>
  )
}

export default OfficialPracticeSetsPage
