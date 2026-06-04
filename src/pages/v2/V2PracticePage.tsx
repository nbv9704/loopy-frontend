import React, { useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpenCheck, Swords, Users, Library, Lock, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import SEO from '../../components/common/SEO'
import { V2PublicShell } from '../../components/v2/V2PublicShell'
import { LoadingScreen } from '../../components/v2/LoadingScreen'
import { useAuth } from '../../contexts/AuthContext'
import { useContentPreloader } from '../../hooks/useContentPreloader'

const V2PracticePage: React.FC = () => {
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading } = useAuth()
  const { i18n } = useTranslation()

  const contentKeys = [
    'nav.learn',
    'nav.playground',
    'nav.practice',
    'nav.docs',
    'nav.settings',
    'nav.logout',
    'practice.title',
    'practice.subtitle',
    'practice.compete.title',
    'practice.compete.desc',
    'practice.compete.cta',
    'practice.sets.title',
    'practice.sets.desc',
    'practice.sets.cta',
    'practice.sets.badge',
    'practice.official.title',
    'practice.official.desc',
    'practice.user.title',
    'practice.user.desc',
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

  const { content, loading } = useContentPreloader(contentKeys, i18n.language)

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/auth', { state: { from: location } })
    }
  }, [authLoading, location, navigate, user])

  if (loading) {
    return <LoadingScreen message="Loading practice..." />
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

  const cards = [
    {
      title: content['practice.compete.title'] || 'Thi đấu',
      desc: content['practice.compete.desc'] || 'Vào phòng 1v1 realtime để luyện phản xạ với câu hỏi ngắn sau khi học.',
      cta: content['practice.compete.cta'] || 'Vào phòng thi đấu',
      icon: Swords,
      to: '/practice/compete',
      available: true,
    },
    {
      title: content['practice.sets.title'] || 'Bộ bài tập',
      desc: content['practice.sets.desc'] || 'Làm bộ câu hỏi có sẵn hoặc tự tạo bộ luyện tập tối đa 30 câu.',
      cta: content['practice.sets.cta'] || 'Duyệt bộ bài tập',
      icon: Library,
      to: '/practice/sets',
      available: true,
    },
  ]

  return (
    <V2PublicShell headerContent={headerContent} footerContent={footerContent}>
      <SEO title="Practice | Loopy" description={content['practice.subtitle'] || undefined} />
      <main className="flex-grow pb-16 pt-8 md:pt-10">
        <section className="mx-auto max-w-6xl px-6">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="max-w-3xl"
          >
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-brand-teal">
              <BookOpenCheck className="h-4 w-4" />
              Practice
            </div>
            <h1 className="text-4xl font-black tracking-normal text-slate-950 md:text-5xl">
              {content['practice.title'] || 'Luyện tập sau khi học.'}
            </h1>
            <p className="mt-5 max-w-2xl text-lg font-medium leading-8 text-slate-600">
              {content['practice.subtitle'] || 'Chọn cách ôn phù hợp: thi đấu realtime để luyện phản xạ, hoặc làm bộ bài tập để củng cố từng chủ đề.'}
            </p>
          </motion.div>

          <div className="mt-10 grid gap-5 md:grid-cols-2">
            {cards.map((card, index) => {
              const Icon = card.icon
              return (
                <motion.button
                  key={card.title}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, delay: index * 0.08 }}
                  onClick={() => navigate(card.to)}
                  className="group min-h-[260px] rounded-lg border border-slate-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand-teal/40 hover:shadow-xl hover:shadow-slate-200/70"
                >
                  <div className="flex h-full flex-col justify-between">
                    <div>
                      <div className="mb-6 flex items-center justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-brand-teal/10 text-brand-teal">
                          <Icon className="h-6 w-6" />
                        </div>
                        {!card.available && <Lock className="h-5 w-5 text-slate-400" />}
                      </div>
                      <h2 className="text-2xl font-black text-slate-950">{card.title}</h2>
                      <p className="mt-3 text-base font-medium leading-7 text-slate-600">{card.desc}</p>
                    </div>
                    <div className="mt-8 inline-flex items-center gap-2 text-sm font-black uppercase tracking-wide text-brand-teal">
                      {card.cta}
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </motion.button>
              )
            })}
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <button
              onClick={() => navigate('/practice/official-sets')}
              className="group rounded-lg border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-teal/40 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <Users className="mt-1 h-5 w-5 text-brand-teal" />
                <div>
                  <h3 className="flex items-center gap-2 font-black text-slate-950 group-hover:text-brand-teal transition-colors">
                    {content['practice.official.title'] || 'Bộ chính thức'}
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  </h3>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                    {content['practice.official.desc'] || 'Đội phát triển có thể phát hành bộ bài theo ngôn ngữ, cấp độ và chủ đề.'}
                  </p>
                </div>
              </div>
            </button>
            <button 
              onClick={() => navigate('/practice/my-sets')}
              className="group rounded-lg border border-slate-200 bg-white px-5 py-4 text-left shadow-sm transition hover:-translate-y-0.5 hover:border-brand-teal/40 hover:shadow-md"
            >
              <div className="flex items-start gap-3">
                <BookOpenCheck className="mt-1 h-5 w-5 text-brand-teal" />
                <div>
                  <h3 className="flex items-center gap-2 font-black text-slate-950 group-hover:text-brand-teal transition-colors">
                    {content['practice.user.title'] || 'Quản lý bộ cá nhân'}
                    <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                  </h3>
                  <p className="mt-1 text-sm font-medium leading-6 text-slate-600">
                    {content['practice.user.desc'] || 'Xem, chỉnh sửa hoặc xoá các bộ luyện tập do chính bạn tạo ra với tối đa 30 câu hỏi.'}
                  </p>
                </div>
              </div>
            </button>
          </div>
        </section>
      </main>
    </V2PublicShell>
  )
}

export default V2PracticePage
