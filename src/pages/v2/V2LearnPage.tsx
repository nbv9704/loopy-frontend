import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiArrowLeft, FiBookOpen, FiCode, FiCompass, FiTerminal, FiZap } from 'react-icons/fi'
import SEO from '../../components/common/SEO'
import LessonViewer from '../../components/learn/LessonViewer'
import { LoadingScreen } from '../../components/v2/LoadingScreen'
import { V2PublicShell } from '../../components/v2/V2PublicShell'
import { useAuth } from '../../contexts/AuthContext'
import { useContentPreloader } from '../../hooks/useContentPreloader'
import { getLanguageMetadata } from '../../utils/seo'

const V2LearnPage: React.FC = () => {
  const { language = 'javascript', '*': splat } = useParams<{ language: string; '*': string }>()
  const lessonId = splat || undefined
  const navigate = useNavigate()
  const { i18n } = useTranslation()
  const { user, loading: authLoading } = useAuth()

  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth', {
          state: {
            from: { pathname: `/learn/${language}${lessonId ? '/' + lessonId : ''}` },
            intendedLanguage: language,
          },
        })
      } else if (!user.onboardingCompleted) {
        navigate('/onboarding', { state: { intendedLanguage: language } })
      }
    }
  }, [user, authLoading, navigate, language, lessonId])

  const contentKeys = [
    'nav.learn',
    'nav.playground',
    'nav.pvp',
    'nav.docs',
    'nav.settings',
    'nav.logout',
    'learn.title',
    'learn.subtitle',
    'learn.badge',
    'learn.back_btn',
    'learn.feat1.title',
    'learn.feat1.desc',
    'learn.feat2.title',
    'learn.feat2.desc',
    'learn.feat3.title',
    'learn.feat3.desc',
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
  const metadata = getLanguageMetadata(language)

  if (authLoading || contentLoading) {
    return <LoadingScreen message="Loading learn..." />
  }

  if (!user || !user.onboardingCompleted) return null

  const headerContent = {
    'nav.learn': content['nav.learn'],
    'nav.playground': content['nav.playground'],
    'nav.pvp': content['nav.pvp'],
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

  const learnTitle = content['learn.title'] || 'Màn học phải chỉ rõ việc cần làm ngay bây giờ.'
  const learnSubtitle = content['learn.subtitle'] || 'Học từng bước: quan sát code mẫu, sửa một yêu cầu nhỏ, kiểm tra bằng rule deterministic, chạy thử output rồi lưu progress khi backend xác nhận.'
  const learnBadge = content['learn.badge'] || 'Learn v2 cockpit'
  const learnBackBtn = content['learn.back_btn'] || 'Quay lại Journey Map'
  const feat1Title = content['learn.feat1.title'] || 'Chạy thử'
  const feat1Desc = content['learn.feat1.desc'] || 'Execute code và hiển thị output. Không chấm bài.'
  const feat2Title = content['learn.feat2.title'] || 'Kiểm tra'
  const feat2Desc = content['learn.feat2.desc'] || 'Validate bằng rule/test case deterministic.'
  const feat3Title = content['learn.feat3.title'] || 'Hoàn thành'
  const feat3Desc = content['learn.feat3.desc'] || 'Chỉ lưu khi completeLesson thành công.'

  return (
    <>
      <SEO {...metadata} />
      <V2PublicShell headerContent={headerContent} footerContent={footerContent}>
        <main className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-[-8rem] top-20 h-80 w-80 rounded-full bg-brand-teal/20 blur-3xl" />
          <div className="pointer-events-none absolute right-[-10rem] top-64 h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl" />

          <section className="relative px-4 py-8 md:px-6 md:py-12">
            <div className="mx-auto max-w-[1800px]">
              <button
                onClick={() => navigate(`/library/${language}`)}
                className="mb-6 inline-flex items-center gap-2 text-sm font-black text-slate-500 transition hover:-translate-x-1 hover:text-slate-950"
              >
                <FiArrowLeft /> {learnBackBtn}
              </button>

              <div className="mb-6 grid gap-5 xl:grid-cols-[1fr,420px] xl:items-end">
                <div>
                  <div className="mb-4 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                    {learnBadge}
                  </div>
                  <h1 className="max-w-5xl text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
                    {learnTitle}
                  </h1>
                  <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600 md:text-lg">
                    {learnSubtitle}
                  </p>
                </div>

                <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/80">
                  <div className="flex items-center gap-3 text-brand-ocean">
                    <FiCompass />
                    <span className="text-sm font-black uppercase tracking-[0.2em]">{language} lesson</span>
                  </div>
                  <div className="mt-4 grid gap-3">
                    {[
                      [FiTerminal, feat1Title, feat1Desc],
                      [FiCode, feat2Title, feat2Desc],
                      [FiBookOpen, feat3Title, feat3Desc],
                    ].map(([Icon, title, description]) => {
                      const CardIcon = Icon as typeof FiZap
                      return (
                        <div key={title as string} className="flex gap-3 rounded-2xl border border-slate-200 bg-[#f8fafc] p-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-brand-teal">
                            <CardIcon />
                          </div>
                          <div>
                            <div className="font-black text-slate-950">{title as string}</div>
                            <p className="mt-1 text-xs leading-5 text-slate-600">{description as string}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </aside>
              </div>

              <section className="rounded-[2.25rem] border border-slate-200 bg-slate-950 p-2 shadow-2xl shadow-slate-300/70 md:p-4">
                <div className="min-h-[760px] overflow-hidden rounded-[1.75rem] bg-[#0a0e1a] p-3 md:p-4">
                  <LessonViewer language={language} initialLessonId={lessonId} />
                </div>
              </section>
            </div>
          </section>
        </main>
      </V2PublicShell>
    </>
  )
}

export default V2LearnPage
