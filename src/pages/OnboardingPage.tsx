import { useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiAlertCircle, FiArrowRight, FiBookOpen, FiCheckCircle, FiCompass, FiGlobe, FiLayers, FiMap, FiSave, FiTarget } from 'react-icons/fi'
import { SiCplusplus, SiGo, SiJavascript, SiPython } from 'react-icons/si'
import { PublicShell } from '../components/PublicShell'
import { useContentPreloader } from '../hooks/useContentPreloader'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'

type Language = {
  id: string
  name: string
  displayName?: string
  display_name?: string
  icon?: string
  canRunInBrowser?: boolean
  can_run_in_browser?: boolean
}

type LearningPath = {
  id: string
  languageId?: string
  language_id?: string
  title: string
  description?: string
  goalId?: string
  goal_id?: string
  icon?: string
  color?: string
}

type PathChapter = {
  id: string
  title: string
  description?: string
  orderIndex?: number
  order_index?: number
  lessonCount?: number
  lesson_count?: number
}

type OnboardingDraft = {
  selectedLanguageId?: string
  selectedLevelId?: string
}

type LanguageCard = Language & { disabled?: boolean; comingSoon?: boolean }

const fallbackLanguages: Language[] = [
  { id: 'python', name: 'python', displayName: 'Python', canRunInBrowser: false },
  { id: 'javascript', name: 'javascript', displayName: 'JavaScript', canRunInBrowser: true },
  { id: 'cpp', name: 'cpp', displayName: 'C++', canRunInBrowser: false },
]

const normalizeDisplayName = (language: Language) => language.displayName || language.display_name || language.name || language.id
const normalizeGoalId = (path: LearningPath) => path.goalId || path.goal_id || 'guided-path'
const normalizePathLanguage = (path: LearningPath) => path.languageId || path.language_id || ''

function StepBar({ step }: { step: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map(item => (
        <div key={item} className={`h-2 rounded-full ${step >= item ? 'bg-brand-teal' : 'loopy-skeleton'}`} />
      ))}
    </div>
  )
}

function LanguageIcon({ languageId, comingSoon }: { languageId: string; comingSoon?: boolean }) {
  if (comingSoon) return <SiGo />
  if (languageId === 'python') return <SiPython />
  if (languageId === 'javascript') return <SiJavascript />
  if (languageId === 'cpp') return <SiCplusplus />
  return <FiGlobe />
}

const OnboardingPage: React.FC = () => {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, loading: authLoading, refreshUser } = useAuth()
  const locationState = location.state as { intendedLanguage?: string; onboardingDraft?: OnboardingDraft } | null

  const [step, setStep] = useState(1)
  const [languages, setLanguages] = useState<Language[]>([])
  const [paths, setPaths] = useState<LearningPath[]>([])
  const [chapters, setChapters] = useState<PathChapter[]>([])
  const [selectedLanguageId, setSelectedLanguageId] = useState(locationState?.onboardingDraft?.selectedLanguageId || locationState?.intendedLanguage || '')
  const [selectedLevelId, setSelectedLevelId] = useState(locationState?.onboardingDraft?.selectedLevelId || '')
  const [bootLoading, setBootLoading] = useState(true)
  const [chaptersLoading, setChaptersLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [loadError, setLoadError] = useState('')

  const selectedLanguage = useMemo(
    () => languages.find(language => language.id === selectedLanguageId) || languages[0] || fallbackLanguages[0],
    [languages, selectedLanguageId]
  )

  const levelOptions = useMemo(() => {
    const seen = new Set<string>()
    return paths.filter(path => {
      const levelId = normalizeGoalId(path)
      if (seen.has(levelId)) return false
      seen.add(levelId)
      return true
    })
  }, [paths])

  const selectedLevel = useMemo(
    () => levelOptions.find(path => normalizeGoalId(path) === selectedLevelId) || levelOptions[0],
    [levelOptions, selectedLevelId]
  )

  const selectedPath = useMemo(() => {
    if (!selectedLevel) return undefined
    const levelId = normalizeGoalId(selectedLevel)
    return paths.find(path => normalizeGoalId(path) === levelId && normalizePathLanguage(path) === selectedLanguageId)
      || paths.find(path => normalizeGoalId(path) === levelId)
  }, [paths, selectedLanguageId, selectedLevel])

  const selectedPathId = selectedPath?.id || ''

  const contentKeys = [
    'nav.learn',
    'nav.playground',
    'nav.practice',
    'nav.docs',
    'nav.settings',
    'nav.logout',
    'onboarding.title',
    'onboarding.subtitle',
    'onboarding.badge',
    'onboarding.progress',
    'onboarding.step.language',
    'onboarding.step.path',
    'onboarding.step.chapters',
    'onboarding.language.title',
    'onboarding.language.desc',
    'onboarding.language.browser',
    'onboarding.language.backend',
    'onboarding.language.coming_title',
    'onboarding.language.coming_desc',
    'onboarding.language.coming_badge',
    'onboarding.path.title',
    'onboarding.path.desc',
    'onboarding.path.empty',
    'onboarding.path.default_desc',
    'onboarding.chapters.title',
    'onboarding.chapters.desc',
    'onboarding.chapters.badge',
    'onboarding.chapters.empty',
    'onboarding.chapters.default_desc',
    'onboarding.chapters.lesson_count',
    'onboarding.error.languages',
    'onboarding.error.paths',
    'onboarding.error.chapters',
    'onboarding.error.select_path',
    'onboarding.error.save_failed',
    'onboarding.preview.btn_back',
    'onboarding.preview.btn_next',
    'onboarding.preview.btn_journey',
    'onboarding.preview.btn_login',
    'onboarding.saving',
    'onboarding.sidebar.badge',
    'onboarding.sidebar.desc',
    'onboarding.sidebar.why.title',
    'onboarding.sidebar.why.desc',
    'onboarding.sidebar.language',
    'onboarding.sidebar.path',
    'onboarding.sidebar.not_selected',
    'onboarding.sidebar.chapters',
    'onboarding.seed.title',
    'onboarding.seed.desc',
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
  const t = (key: string, fallback: string) => content[key] || fallback

  useEffect(() => {
    let isMounted = true

    const loadInitialData = async () => {
      setBootLoading(true)
      setLoadError('')
      const [languagesResponse, pathsResponse] = await Promise.all([
        api.getLanguages(),
        api.getPaths(),
      ])

      if (!isMounted) return

      if (languagesResponse.success && languagesResponse.data && (languagesResponse.data as any).languages?.length) {
        const nextLanguages = (languagesResponse.data as any).languages as Language[]
        setLanguages(nextLanguages)
        setSelectedLanguageId(current => current || nextLanguages[0].id)
      } else {
        setLanguages(fallbackLanguages)
        setSelectedLanguageId(current => current || fallbackLanguages[0].id)
        setLoadError(languagesResponse.error?.message || t('onboarding.error.languages', 'Không tải được danh sách ngôn ngữ, đang dùng lựa chọn mặc định.'))
      }

      if (pathsResponse.success && pathsResponse.data) {
        const nextPaths = ((pathsResponse.data as any).paths || []) as LearningPath[]
        setPaths(nextPaths)
        setSelectedLevelId(current => current || (nextPaths[0] ? normalizeGoalId(nextPaths[0]) : ''))
      } else {
        setPaths([])
        setLoadError(pathsResponse.error?.message || t('onboarding.error.paths', 'Không tải được learning paths.'))
      }

      setBootLoading(false)
    }

    loadInitialData()

    return () => {
      isMounted = false
    }
  }, [])

  useEffect(() => {
    if (!selectedPathId) {
      setChapters([])
      return
    }
    let isMounted = true

    const loadPathDetail = async () => {
      setChaptersLoading(true)
      const response = await api.getPath(selectedPathId)

      if (!isMounted) return

      if (response.success && response.data) {
        setChapters(((response.data as any).chapters || []) as PathChapter[])
      } else {
        setChapters([])
        setLoadError(response.error?.message || t('onboarding.error.chapters', 'Không tải được chapters của path này.'))
      }
      setChaptersLoading(false)
    }

    loadPathDetail()

    return () => {
      isMounted = false
    }
  }, [selectedPathId])

  if (loading || authLoading || bootLoading) {
    return <LoadingScreen message="Loading onboarding..." />
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

  const onboardingTitle = t('onboarding.title', 'Chọn đúng lộ trình học trước khi vào bài đầu tiên.')
  const onboardingSubtitle = t('onboarding.subtitle', 'Loopy bắt đầu từ ngôn ngữ, sau đó là cấp độ học chung, rồi preview các chapter thật được map trong database.')
  const badge = t('onboarding.badge', 'Journey Builder')
  const progressLabel = t('onboarding.progress', 'Tiến trình')
  const stepLanguage = t('onboarding.step.language', 'Ngôn ngữ')
  const stepPath = t('onboarding.step.path', 'Cấp độ')
  const stepChapters = t('onboarding.step.chapters', 'Chapters')
  const btnBack = t('onboarding.preview.btn_back', 'Quay lại')
  const btnNext = t('onboarding.preview.btn_next', 'Tiếp tục')
  const btnJourney = user
    ? t('onboarding.preview.btn_journey', 'Lưu và mở Journey Map')
    : t('onboarding.preview.btn_login', 'Đăng nhập để lưu lộ trình')
  const sidebarBadge = t('onboarding.sidebar.badge', 'Path đang chọn')
  const sidebarDesc = t('onboarding.sidebar.desc', 'Cấp độ học được giữ đồng bộ giữa các ngôn ngữ; chapters vẫn lấy theo path thật trong database.')
  const sidebarWhyTitle = t('onboarding.sidebar.why.title', 'Vì sao flow này đúng hơn?')
  const sidebarWhyDesc = t('onboarding.sidebar.why.desc', 'Người mới chọn ngôn ngữ trước, rồi chọn cấp độ/lộ trình phù hợp. Loopy không đẩy họ vào catalog chung quá sớm.')

  const languageCards: LanguageCard[] = [
    ...languages,
    {
      id: 'go',
      name: 'go',
      displayName: t('onboarding.language.coming_title', 'Go'),
      disabled: true,
      comingSoon: true,
    },
  ]

  const canGoNext = step === 1 ? Boolean(selectedLanguageId) : step === 2 ? Boolean(selectedLevelId && selectedPathId) : true

  const handleNext = () => {
    if (!canGoNext) return
    setStep(prev => Math.min(3, prev + 1))
  }

  const handleFinish = async () => {
    setSaveError('')

    if (!selectedPath) {
      setSaveError(t('onboarding.error.select_path', 'Bạn cần chọn một learning path trước khi lưu.'))
      return
    }

    if (!user) {
      navigate('/auth', {
        state: {
          from: '/onboarding',
          intendedLanguage: selectedLanguageId,
          onboardingDraft: {
            selectedLanguageId,
            selectedLevelId,
          },
        },
      })
      return
    }

    setSaving(true)

    try {
      const response = await api.updateProfile({
        preferredLanguage: selectedLanguageId,
        learningPath: normalizeGoalId(selectedPath),
        experienceLevel: normalizeGoalId(selectedPath),
        currentPathId: selectedPath.id,
        onboardingCompleted: true,
      })

      if (!response.success) {
        throw new Error(response.error?.message || t('onboarding.error.save_failed', 'Không lưu được onboarding. Vui lòng thử lại.'))
      }

      await refreshUser()
      navigate(`/library/${selectedLanguageId}`, { replace: true })
    } catch (err: any) {
      setSaveError(err.message || t('onboarding.error.save_failed', 'Không lưu được onboarding. Vui lòng thử lại.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <PublicShell headerContent={headerContent} footerContent={footerContent}>
      <main className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                {badge}
              </div>
              <h1 className="loopy-heading max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
                {onboardingTitle}
              </h1>
              <p className="loopy-body mt-6 max-w-2xl text-lg leading-8">
                {onboardingSubtitle}
              </p>
            </div>
            <div className="loopy-card rounded-[2rem] border p-5 shadow-xl">
              <div className="mb-4 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiMap /> {progressLabel}</div>
              <StepBar step={step} />
              <div className="mt-4 text-sm font-bold loopy-muted">
                {t('onboarding.progress.step_prefix', 'Bước')} {step}/3 · {step === 1 ? stepLanguage : step === 2 ? stepPath : stepChapters}
              </div>
            </div>
          </div>

          {loadError && (
            <div className="mb-5 flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-700">
              <FiAlertCircle className="mt-0.5 shrink-0" />
              <span>{loadError}</span>
            </div>
          )}

          <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
            <section className="loopy-card rounded-[2rem] border p-6 shadow-sm md:p-8">
              {step === 1 && (
                <div>
                  <h2 className="text-3xl font-black tracking-tight md:text-4xl">{t('onboarding.language.title', 'Chọn ngôn ngữ bạn muốn học trước')}</h2>
                  <p className="mt-3 text-sm leading-6 loopy-body">{t('onboarding.language.desc', 'Ngôn ngữ quyết định môi trường chạy code; cấp độ học ở bước sau sẽ được giữ đồng bộ.')}</p>
                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    {languageCards.map(language => {
                      const active = selectedLanguageId === language.id
                      return (
                        <button
                          key={language.id}
                          type="button"
                          disabled={language.disabled}
                          onClick={() => {
                            if (language.disabled) return
                            setSelectedLanguageId(language.id)
                            setStep(1)
                          }}
                          className={`rounded-[1.5rem] border p-5 text-left transition ${active ? 'border-brand-teal bg-brand-teal/10 shadow-[0_4px_0_rgba(11,136,156,0.2)]' : 'border-brand-teal/30 loopy-card-soft hover:border-brand-teal'} ${language.disabled ? 'cursor-not-allowed opacity-60 grayscale' : ''}`}
                        >
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-2xl font-black text-brand-teal">
                            <LanguageIcon languageId={language.id} comingSoon={language.comingSoon} />
                          </div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black">{normalizeDisplayName(language)}</h3>
                            {language.comingSoon && <span className="rounded-full bg-slate-950 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-brand-teal">{t('onboarding.language.coming_badge', 'Coming soon')}</span>}
                          </div>
                          <p className="mt-2 text-sm leading-6 loopy-body">
                            {language.comingSoon
                              ? t('onboarding.language.coming_desc', 'Sắp mở thêm khi Loopy có đủ lesson và practice set phù hợp.')
                              : language.canRunInBrowser || language.can_run_in_browser
                                ? t('onboarding.language.browser', 'Có thể chạy trực tiếp trong trình duyệt.')
                                : t('onboarding.language.backend', 'Dùng runner backend khi thực hành.')}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-3xl font-black tracking-tight md:text-4xl">{t('onboarding.path.title', 'Chọn cấp độ học')}</h2>
                  <p className="mt-3 text-sm leading-6 loopy-body">
                    {t('onboarding.path.desc', 'Các cấp độ được hiển thị giống nhau cho mọi ngôn ngữ để user không bị lệch trải nghiệm onboarding.')}
                  </p>
                  {levelOptions.length === 0 ? (
                    <div className="mt-6 rounded-[1.5rem] border border-dashed border-brand-teal/30 p-6 text-sm font-bold loopy-muted">
                      {t('onboarding.path.empty', 'Chưa có learning path active. Cần seed `learning_paths` trước.')}
                    </div>
                  ) : (
                    <div className="mt-6 grid gap-3">
                      {levelOptions.map(path => {
                        const levelId = normalizeGoalId(path)
                        const active = selectedLevelId === levelId
                        const languageSpecificPath = paths.find(item => normalizeGoalId(item) === levelId && normalizePathLanguage(item) === selectedLanguageId)
                        return (
                          <button
                            key={levelId}
                            type="button"
                            onClick={() => setSelectedLevelId(levelId)}
                            className={`flex items-start gap-4 rounded-[1.5rem] border p-5 text-left transition ${active ? 'border-brand-teal bg-brand-teal/10' : 'border-brand-teal/30 loopy-card-soft hover:border-brand-teal'}`}
                          >
                            <div className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-brand-teal text-slate-950' : 'loopy-surface text-[color:var(--loopy-text-muted)]'}`}>
                              {active ? <FiCheckCircle /> : <FiCompass />}
                            </div>
                            <div>
                              <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">{levelId}</div>
                              <h3 className="mt-1 text-xl font-black">{path.title}</h3>
                              <p className="mt-2 text-sm leading-6 loopy-body">{path.description || t('onboarding.path.default_desc', 'Guided path cho người học.')}</p>
                              {!languageSpecificPath && (
                                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                                  <FiAlertCircle /> {t('onboarding.path.missing_language', 'Path này chưa có bản riêng cho ngôn ngữ đã chọn.')}
                                </div>
                              )}
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-3xl font-black tracking-tight md:text-4xl">{t('onboarding.chapters.title', 'Preview chapters của path')}</h2>
                  <p className="mt-3 text-sm leading-6 loopy-body">
                    {t('onboarding.chapters.desc', 'Đây là các chapter được link với path qua `path_chapters`, không phải toàn bộ catalog của language.')}
                  </p>
                  <div className="mt-6 rounded-[1.5rem] border border-brand-teal/30 bg-brand-teal/10 p-6">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">{t('onboarding.chapters.badge', 'Selected path')}</div>
                    <h3 className="mt-3 text-4xl font-black">{selectedPath?.title || `${normalizeDisplayName(selectedLanguage)} Starter`}</h3>
                    <p className="mt-3 text-sm leading-6 loopy-body">{selectedPath?.description || t('onboarding.chapters.default_desc', 'Path này chưa có mô tả.')}</p>
                    <div className="mt-5 grid gap-3">
                      {chaptersLoading ? (
                        Array.from({ length: 3 }).map((_, index) => <div key={index} className="h-20 rounded-2xl loopy-skeleton" />)
                      ) : chapters.length === 0 ? (
                        <div className="loopy-surface rounded-2xl border loopy-border p-4 text-sm font-bold loopy-muted">
                          {t('onboarding.chapters.empty', 'Path này chưa có chapter. Cần seed `path_chapters` trước khi onboarding hữu ích.')}
                        </div>
                      ) : (
                        chapters.map((chapter, index) => (
                          <div key={chapter.id} className="loopy-surface rounded-2xl border loopy-border p-4">
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-brand-teal">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="text-base font-black">{chapter.title}</h4>
                                <p className="mt-1 text-sm leading-6 loopy-body">{chapter.description || t('onboarding.chapters.default_desc', 'Chapter trong lộ trình này.')}</p>
                                <div className="mt-2 text-xs font-black uppercase tracking-wider text-brand-ocean">
                                  {chapter.lessonCount ?? chapter.lesson_count ?? 0} {t('onboarding.chapters.lesson_count', 'lessons')}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
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

              <div className="mt-8 flex flex-col justify-between gap-3 border-t loopy-border pt-6 sm:flex-row">
                <button onClick={() => setStep(prev => Math.max(1, prev - 1))} className="loopy-subtle-button rounded-2xl border px-5 py-3 text-sm font-black shadow-[0_4px_0_rgba(15,23,42,0.22)] disabled:opacity-40" disabled={step === 1 || saving}>
                  {btnBack}
                </button>
                {step < 3 ? (
                  <button onClick={handleNext} disabled={!canGoNext} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-teal px-5 py-3 text-sm font-black text-slate-950 shadow-[0_5px_0_#0b889c] disabled:cursor-not-allowed disabled:opacity-60">
                    {btnNext} <FiArrowRight />
                  </button>
                ) : (
                  <button type="button" onClick={handleFinish} disabled={saving || !selectedPathId} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-teal px-5 py-3 text-sm font-black text-slate-950 shadow-[0_5px_0_#0b889c] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60">
                    <FiSave /> {saving ? t('onboarding.saving', 'Đang lưu...') : btnJourney}
                  </button>
                )}
              </div>
            </section>

            <aside className="grid gap-4 lg:self-start">
              <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-6 text-white shadow-xl">
                <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-teal"><FiTarget /> {sidebarBadge}</div>
                <h2 className="text-3xl font-black">{selectedPath?.title || normalizeDisplayName(selectedLanguage)}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{sidebarDesc}</p>
                <div className="mt-5 grid gap-2">
                  {[
                    `${t('onboarding.sidebar.language', 'Language')}: ${normalizeDisplayName(selectedLanguage)}`,
                    `${t('onboarding.sidebar.path', 'Path')}: ${selectedPath?.title || t('onboarding.sidebar.not_selected', 'Chưa chọn')}`,
                    `${t('onboarding.sidebar.chapters', 'Chapters')}: ${chapters.length}`,
                  ].map(item => (
                    <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300"><FiCheckCircle className="text-brand-teal" /> {item}</div>
                  ))}
                </div>
              </div>

              <div className="loopy-card rounded-[2rem] border p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiLayers /> {sidebarWhyTitle}</div>
                <p className="text-sm leading-6 loopy-body">{sidebarWhyDesc}</p>
              </div>

              <div className="loopy-card rounded-[2rem] border p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiBookOpen /> {t('onboarding.seed.title', 'Dữ liệu cần seed')}</div>
                <p className="text-sm leading-6 loopy-body">{t('onboarding.seed.desc', 'Nếu màn hình thiếu path/chapter, hãy seed theo thứ tự: languages → learning_paths → chapters → path_chapters → lessons.')}</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </PublicShell>
  )
}

export default OnboardingPage
