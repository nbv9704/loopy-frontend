import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiArrowLeft, FiBookOpen, FiCode, FiCompass, FiTerminal, FiZap } from 'react-icons/fi'
import SEO from '../components/common/SEO'
import LessonViewer from '../components/learn/LessonViewer'
import { LoadingScreen } from '../components/LoadingScreen'
import { PublicShell } from '../components/PublicShell'
import Header from '../components/Header'
import { useAuth } from '../contexts/AuthContext'
import { useContentPreloader } from '../hooks/useContentPreloader'
import { getLanguageMetadata } from '../utils/seo'

const LearnPage: React.FC = () => {
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
    'nav.practice',
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
    'learn.viewer.empty_title',
    'learn.viewer.empty_desc',
    'learn.viewer.back_to_journey',
    'learn.viewer.lesson_fallback_title',
    'learn.viewer.completed_badge',
    'learn.viewer.progress_label',
    'learn.viewer.current_task_label',
    'learn.viewer.rules_label',
    'learn.viewer.rules_body',
    'learn.viewer.lesson_content_label',
    'learn.viewer.mini_checkpoint_title',
    'learn.viewer.mini_checkpoint_desc',
    'learn.viewer.hints_title',
    'learn.viewer.hint_count',
    'learn.viewer.no_authored_hint',
    'learn.viewer.common_mistakes_prefix',
    'learn.viewer.reveal_more_hint',
    'learn.viewer.ai_hint_title',
    'learn.viewer.ai_busy',
    'learn.viewer.ask_ai_hint',
    'learn.viewer.ai_unavailable',
    'learn.viewer.editor_current_step',
    'learn.viewer.editor_hint_button',
    'learn.viewer.output_check_title',
    'learn.viewer.output_check_desc',
    'learn.viewer.close_check_result',
    'learn.viewer.check_result_title',
    'learn.viewer.checker_desc',
    'learn.viewer.no_check_result',
    'learn.viewer.check_lesson_prefix',
    'learn.viewer.back_button',
    'learn.viewer.next_button',
    'learn.viewer.progress_saved',
    'learn.viewer.aha_complete_desc',
    'learn.viewer.complete_desc',
    'learn.viewer.next_lesson_button',
    'learn.viewer.step.see.label',
    'learn.viewer.step.see.title',
    'learn.viewer.step.see.body',
    'learn.viewer.step.change.label',
    'learn.viewer.step.change.title',
    'learn.viewer.step.change.body',
    'learn.viewer.step.run.label',
    'learn.viewer.step.run.title',
    'learn.viewer.step.run.body',
    'learn.viewer.step.fix.label',
    'learn.viewer.step.fix.title',
    'learn.viewer.step.fix.body',
    'learn.viewer.step.build.label',
    'learn.viewer.step.build.title',
    'learn.viewer.step.build.body',
    'learn.sidebar.continue',
    'learn.sidebar.aha',
    'learn.sidebar.next',
    'learn.action.current_step',
    'learn.action.see.label',
    'learn.action.see.helper',
    'learn.action.change.label',
    'learn.action.change.helper',
    'learn.action.run.label',
    'learn.action.run.helper',
    'learn.action.fix.label',
    'learn.action.fix.helper',
    'learn.action.build.label',
    'learn.action.build.helper',
    'learn.action.change_passed',
    'learn.action.debug_passed',
    'learn.action.hint_button',
    'learn.action.processing',
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

  if (lessonId) {
    return (
      <>
        <SEO {...metadata} />
        <div className="loopy-page flex h-screen flex-col overflow-hidden">
          <Header headerContent={headerContent} />
          <main className="min-h-0 flex-1 overflow-hidden">
            <LessonViewer language={language} initialLessonId={lessonId} content={content} />
          </main>
        </div>
      </>
    )
  }

  return (
    <>
      <SEO {...metadata} />
      <PublicShell headerContent={headerContent} footerContent={footerContent}>
        <main className="relative overflow-hidden">
          <div className="pointer-events-none absolute left-[-8rem] top-20 h-80 w-80 rounded-full bg-brand-teal/20 blur-3xl" />
          <div className="pointer-events-none absolute right-[-10rem] top-64 h-96 w-96 rounded-full bg-cyan-200/30 blur-3xl" />

          <section className="relative px-4 py-8 md:px-6 md:py-12">
            <div className="mx-auto max-w-[1800px]">
              <button
                onClick={() => navigate(`/library/${language}`)}
                className="mb-6 inline-flex items-center gap-2 text-sm font-black loopy-muted transition hover:-translate-x-1 hover:loopy-text"
              >
                <FiArrowLeft /> {learnBackBtn}
              </button>

              <div className="mb-6 grid gap-5 xl:grid-cols-[1fr,420px] xl:items-end">
                <div>
                  <div className="mb-4 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                    {learnBadge}
                  </div>
                  <h1 className="loopy-heading max-w-5xl text-4xl font-black tracking-tight md:text-6xl">
                    {learnTitle}
                  </h1>
                  <p className="loopy-body mt-5 max-w-3xl text-base leading-8 md:text-lg">
                    {learnSubtitle}
                  </p>
                </div>

                <aside className="loopy-card rounded-[2rem] border p-5 shadow-xl">
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
                        <div key={title as string} className="loopy-card-soft flex gap-3 rounded-2xl border p-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-brand-teal">
                            <CardIcon />
                          </div>
                          <div>
                            <div className="font-black loopy-heading">{title as string}</div>
                            <p className="loopy-body mt-1 text-xs leading-5">{description as string}</p>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </aside>
              </div>

              <section className="rounded-[2.25rem] border loopy-border bg-slate-950 p-2 shadow-2xl shadow-black/30 md:p-4">
                <div className="min-h-[760px] overflow-hidden rounded-[1.75rem] bg-[#0a0e1a] p-3 md:p-4">
                  <LessonViewer language={language} initialLessonId={lessonId} content={content} />
                </div>
              </section>
            </div>
          </section>
        </main>
      </PublicShell>
    </>
  )
}

export default LearnPage
