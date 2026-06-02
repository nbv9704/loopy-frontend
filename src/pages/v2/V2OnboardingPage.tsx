import { useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiAlertCircle, FiArrowRight, FiCheckCircle, FiCode, FiCompass, FiCpu, FiGlobe, FiMap, FiPlay, FiSave, FiTarget } from 'react-icons/fi'
import { V2PublicShell } from '../../components/v2/V2PublicShell'
import { useContentPreloader } from '../../hooks/useContentPreloader'
import { LoadingScreen } from '../../components/v2/LoadingScreen'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'

type GoalId = 'zero' | 'web' | 'school' | 'try'
type ExperienceId = 'new' | 'some' | 'basic'

type GoalOption = {
  id: GoalId
  title: string
  description: string
  language: 'python' | 'javascript' | 'cpp'
  languageLabel: string
  learningGoal: string
  icon: typeof FiCompass
}

const goals: GoalOption[] = [
  { id: 'zero', title: 'Tôi bắt đầu từ số 0', description: 'Ưu tiên Python và bài đầu thật nhỏ để hiểu output.', language: 'python', languageLabel: 'Python', learningGoal: 'start_from_zero', icon: FiCompass },
  { id: 'web', title: 'Tôi muốn làm web', description: 'Bắt đầu với JavaScript và tương tác trong trình duyệt.', language: 'javascript', languageLabel: 'JavaScript', learningGoal: 'build_web', icon: FiGlobe },
  { id: 'school', title: 'Tôi học cho trường/lớp', description: 'Đi theo nền tảng input/output và tư duy giải bài.', language: 'cpp', languageLabel: 'C++', learningGoal: 'school_work', icon: FiCpu },
  { id: 'try', title: 'Tôi chỉ muốn thử trước', description: 'Vào lesson mẫu ngắn để xem mình có hợp không.', language: 'python', languageLabel: 'Python', learningGoal: 'explore', icon: FiPlay },
]

const experiences: Array<{ id: ExperienceId; title: string; description: string }> = [
  { id: 'new', title: 'Chưa từng code', description: 'Loopy sẽ giải thích bằng ví dụ nhỏ và ít thuật ngữ.' },
  { id: 'some', title: 'Đã xem qua nhưng chưa tự làm', description: 'Ưu tiên thực hành và debug lỗi dễ hiểu.' },
  { id: 'basic', title: 'Biết chút cơ bản', description: 'Đi nhanh hơn qua phần quan sát, tập trung kiểm tra.' },
]

const languageToGoal: Partial<Record<string, GoalId>> = {
  python: 'zero',
  javascript: 'web',
  cpp: 'school',
}

function StepBar({ step }: { step: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map(item => (
        <div key={item} className={`h-2 rounded-full ${step >= item ? 'bg-brand-teal' : 'bg-slate-200'}`} />
      ))}
    </div>
  )
}

const V2OnboardingPage: React.FC = () => {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const locationState = location.state as { intendedLanguage?: string; onboardingDraft?: { selectedGoal?: GoalId; selectedExperience?: ExperienceId } } | null
  const initialGoal = languageToGoal[locationState?.intendedLanguage || ''] || 'web'

  const [step, setStep] = useState(1)
  const [selectedGoal, setSelectedGoal] = useState<GoalId>(locationState?.onboardingDraft?.selectedGoal || initialGoal)
  const [selectedExperience, setSelectedExperience] = useState<ExperienceId>(locationState?.onboardingDraft?.selectedExperience || 'new')
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const goal = goals.find(item => item.id === selectedGoal) || goals[1]
  const experience = experiences.find(item => item.id === selectedExperience) || experiences[0]

  // Define all content keys needed for this page (including header)
  const contentKeys = [
    // Header content
    'nav.learn',
    'nav.playground',
    'nav.pvp',
    'nav.docs',
    'nav.settings',
    'nav.logout',
    // Onboarding page content
    'onboarding.title',
    'onboarding.subtitle',
    'onboarding.badge',
    'onboarding.progress',
    'onboarding.step.goal',
    'onboarding.step.exp',
    'onboarding.step.preview',
    'onboarding.goal.title',
    'onboarding.goal.desc',
    'onboarding.goal.hint',
    'onboarding.exp.title',
    'onboarding.exp.desc',
    'onboarding.preview.title',
    'onboarding.preview.desc',
    'onboarding.preview.badge',
    'onboarding.preview.btn_back',
    'onboarding.preview.btn_next',
    'onboarding.preview.btn_journey',
    'onboarding.sidebar.badge',
    'onboarding.sidebar.desc',
    'onboarding.sidebar.why.title',
    'onboarding.sidebar.why.desc',
    // Footer content
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

  // Preload all content at once
  const { content, loading } = useContentPreloader(contentKeys, i18n.language)

  if (loading || authLoading) {
    return <LoadingScreen message="Loading onboarding..." />
  }

  // Extract header content
  const headerContent = {
    'nav.learn': content['nav.learn'],
    'nav.playground': content['nav.playground'],
    'nav.pvp': content['nav.pvp'],
    'nav.docs': content['nav.docs'],
    'nav.settings': content['nav.settings'],
    'nav.logout': content['nav.logout'],
  }

  // Extract footer content
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

  // Extract content values with fallbacks
  const onboardingTitle = content['onboarding.title'] || 'Chọn một lộ trình đầu tiên để bắt đầu đúng bước.'
  const onboardingSubtitle = content['onboarding.subtitle'] || 'Loopy dùng mục tiêu và kinh nghiệm của bạn để lưu hồ sơ học, rồi đưa bạn vào Journey Map phù hợp. Nếu lưu thất bại, bạn sẽ ở lại trang này để thử lại.'
  const badge = content['onboarding.badge'] || 'Journey Builder v2'
  const progressLabel = content['onboarding.progress'] || 'Tiến trình'
  const stepGoal = content['onboarding.step.goal'] || 'Mục tiêu'
  const stepExp = content['onboarding.step.exp'] || 'Kinh nghiệm'
  const stepPreview = content['onboarding.step.preview'] || 'Xác nhận lộ trình'
  const goalTitle = content['onboarding.goal.title'] || 'Bạn muốn Loopy giúp đạt điều gì trước?'
  const goalDesc = content['onboarding.goal.desc'] || 'Chọn mục tiêu gần nhất. Đây là cách Loopy gợi ý lộ trình đầu tiên.'
  const goalHint = content['onboarding.goal.hint'] || 'Gợi ý'
  const expTitle = content['onboarding.exp.title'] || 'Bạn đã từng code đến đâu?'
  const expDesc = content['onboarding.exp.desc'] || 'Câu trả lời này chỉ dùng để điều chỉnh tốc độ giải thích, không khóa lộ trình.'
  const previewTitle = content['onboarding.preview.title'] || 'Lộ trình đầu tiên đã sẵn sàng.'
  const previewDesc = content['onboarding.preview.desc'] || 'Bấm lưu để cập nhật hồ sơ học. Loopy chỉ chuyển vào Journey Map sau khi backend xác nhận thành công.'
  const previewBadge = content['onboarding.preview.badge'] || 'Recommended path'
  const btnBack = content['onboarding.preview.btn_back'] || 'Quay lại'
  const btnNext = content['onboarding.preview.btn_next'] || 'Tiếp tục'
  const btnJourney = user
    ? content['onboarding.preview.btn_journey'] || 'Lưu và mở Journey Map'
    : 'Đăng nhập để lưu lộ trình'
  const sidebarBadge = content['onboarding.sidebar.badge'] || 'Lộ trình đầu tiên'
  const sidebarDesc = content['onboarding.sidebar.desc'] || 'Loopy sẽ mở bài đầu phù hợp, thay vì đưa bạn vào catalog tự chọn.'
  const sidebarWhyTitle = content['onboarding.sidebar.why.title'] || 'Vì sao cần onboarding?'
  const sidebarWhyDesc = content['onboarding.sidebar.why.desc'] || 'Người mới không cần thấy toàn bộ catalog ngay. Họ cần một bài đầu rõ ràng và một đường quay lại nếu bị kẹt.'

  const handleFinish = async () => {
    setSaveError('')

    if (!user) {
      navigate('/auth', {
        state: {
          from: '/onboarding',
          intendedLanguage: goal.language,
          onboardingDraft: {
            selectedGoal,
            selectedExperience,
            preferredLanguage: goal.language,
            learningGoal: goal.learningGoal,
            experienceLevel: selectedExperience,
          },
        },
      })
      return
    }

    setSaving(true)

    try {
      const response = await api.updateProfile({
        preferredLanguage: goal.language,
        learningGoal: goal.learningGoal,
        experienceLevel: selectedExperience,
        onboardingCompleted: true,
      })

      if (!response.success) {
        throw new Error(response.error?.message || 'Không lưu được onboarding. Vui lòng thử lại.')
      }

      await refreshUser()
      navigate(`/library/${goal.language}`, { replace: true })
    } catch (err: any) {
      setSaveError(err.message || 'Không lưu được onboarding. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <V2PublicShell headerContent={headerContent} footerContent={footerContent}>
      <main className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                {badge}
              </div>
              <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
                {onboardingTitle}
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                {onboardingSubtitle}
              </p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/80">
              <div className="mb-4 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiMap /> {progressLabel}</div>
              <StepBar step={step} />
              <div className="mt-4 text-sm font-bold text-slate-500">Bước {step}/3 · {step === 1 ? stepGoal : step === 2 ? stepExp : stepPreview}</div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              {step === 1 && (
                <div>
                  <h2 className="text-3xl font-black tracking-tight md:text-4xl">{goalTitle}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{goalDesc}</p>
                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    {goals.map(item => {
                      const Icon = item.icon
                      const active = selectedGoal === item.id
                      return (
                        <button key={item.id} onClick={() => setSelectedGoal(item.id)} className={`rounded-[1.5rem] border p-5 text-left transition ${active ? 'border-brand-teal bg-brand-teal/10 shadow-[0_4px_0_rgba(11,136,156,0.2)]' : 'border-slate-200 bg-[#f8fafc] hover:border-brand-teal'}`}>
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-brand-teal"><Icon /></div>
                          <h3 className="text-xl font-black">{item.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                          <div className="mt-4 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-500">{goalHint}: {item.languageLabel}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-3xl font-black tracking-tight md:text-4xl">{expTitle}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{expDesc}</p>
                  <div className="mt-6 grid gap-3">
                    {experiences.map(item => {
                      const active = selectedExperience === item.id
                      return (
                        <button key={item.id} onClick={() => setSelectedExperience(item.id)} className={`flex items-start gap-4 rounded-[1.5rem] border p-5 text-left transition ${active ? 'border-brand-teal bg-brand-teal/10' : 'border-slate-200 bg-[#f8fafc] hover:border-brand-teal'}`}>
                          <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-brand-teal text-slate-950' : 'bg-white text-slate-400'}`}>
                            {active ? <FiCheckCircle /> : <FiCode />}
                          </div>
                          <div>
                            <h3 className="text-xl font-black">{item.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-3xl font-black tracking-tight md:text-4xl">{previewTitle}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{previewDesc}</p>
                  <div className="mt-6 rounded-[1.5rem] border border-brand-teal/30 bg-brand-teal/10 p-6">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">{previewBadge}</div>
                    <h3 className="mt-3 text-4xl font-black">{goal.languageLabel} Starter</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{stepGoal}: {goal.title}. {stepExp}: {experience.title}.</p>
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {['Bài đầu: chạy code mẫu', 'Flow: quan sát -> sửa -> kiểm tra', 'Progress: lưu sau completeLesson'].map(item => (
                        <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700">{item}</div>
                      ))}
                    </div>
                  </div>
                  {saveError && (
                    <div className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700">
                      <FiAlertCircle className="mt-0.5 shrink-0" />
                      <span>{saveError}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-col justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
                <button onClick={() => setStep(prev => Math.max(1, prev - 1))} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-[0_4px_0_#cbd5e1] disabled:opacity-40" disabled={step === 1 || saving}>
                  {btnBack}
                </button>
                {step < 3 ? (
                  <button onClick={() => setStep(prev => Math.min(3, prev + 1))} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-teal px-5 py-3 text-sm font-black text-slate-950 shadow-[0_5px_0_#0b889c]">
                    {btnNext} <FiArrowRight />
                  </button>
                ) : (
                  <button type="button" onClick={handleFinish} disabled={saving} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-teal px-5 py-3 text-sm font-black text-slate-950 shadow-[0_5px_0_#0b889c] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
                    <FiSave /> {saving ? 'Đang lưu...' : btnJourney}
                  </button>
                )}
              </div>
            </section>

            <aside className="grid gap-4 lg:self-start">
              <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/70">
                <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-teal"><FiTarget /> {sidebarBadge}</div>
                <h2 className="text-3xl font-black">{goal.languageLabel} Starter</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{sidebarDesc}</p>
                <div className="mt-5 grid gap-2">
                  {['Không celebration trước khi lưu', 'Không navigate nếu save profile fail', 'CTA đầu tiên là bài học thật'].map(item => (
                    <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300"><FiCheckCircle className="text-brand-teal" /> {item}</div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiPlay /> {sidebarWhyTitle}</div>
                <p className="text-sm leading-6 text-slate-600">{sidebarWhyDesc}</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </V2PublicShell>
  )
}

export default V2OnboardingPage
