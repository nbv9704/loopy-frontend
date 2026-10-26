import { useCallback, useMemo, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  FiAlertCircle,
  FiArrowRight,
  FiCheckCircle,
  FiCompass,
  FiGlobe,
  FiLayers,
  FiMap,
  FiSave,
  FiTarget,
} from 'react-icons/fi'
import { SiCplusplus, SiGo, SiJavascript, SiPython } from 'react-icons/si'
import { PublicShell } from '../components/PublicShell'
import { useContentPreloader } from '../hooks/useContentPreloader'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../contexts/AuthContext'
import { useAsyncResource } from '../hooks/useAsyncResource'
import { useAsyncAction } from '../hooks/useAsyncAction'
import ResourceLoadError from '../components/common/ResourceLoadError'
import {
  loadOnboardingCatalog,
  loadPathChapters,
  saveOnboarding,
} from '../features/onboarding/onboarding.service'
import type {
  OnboardingLanguage as Language,
  LearningPath,
} from '../features/onboarding/onboarding.types'

type OnboardingDraft = {
  selectedLanguageId?: string
  selectedLevelId?: string
}

type LanguageCard = Language & { disabled?: boolean; comingSoon?: boolean }

const normalizeDisplayName = (language: Language) =>
  language.displayName || language.display_name || language.name || language.id
const normalizeGoalId = (path: LearningPath) => path.goalId || path.goal_id || 'guided-path'
const normalizePathLanguage = (path: LearningPath) => path.languageId || path.language_id || ''

function StepBar({ step }: { step: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map(item => (
        <div
          key={item}
          className={`h-2 rounded-full ${step >= item ? 'bg-brand-teal' : 'loopy-skeleton'}`}
        />
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

const OnboardingFlow = ({
  catalog,
}: {
  catalog: Awaited<ReturnType<typeof loadOnboardingCatalog>>
}) => {
  const { i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, refreshUser } = useAuth()
  const locationState = location.state as {
    intendedLanguage?: string
    onboardingDraft?: OnboardingDraft
  } | null

  const [step, setStep] = useState(1)
  const { languages, paths } = catalog
  const [selectedLanguageId, setSelectedLanguageId] = useState(
    locationState?.onboardingDraft?.selectedLanguageId ||
      locationState?.intendedLanguage ||
      languages[0].id
  )
  const [selectedLevelId, setSelectedLevelId] = useState(
    locationState?.onboardingDraft?.selectedLevelId || (paths[0] ? normalizeGoalId(paths[0]) : '')
  )
  const { pending: saving, run: saveSelection } = useAsyncAction()
  const [saveError, setSaveError] = useState('')

  const selectedLanguage = useMemo(
    () => languages.find(language => language.id === selectedLanguageId) || languages[0],
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
    return paths.find(
      path =>
        normalizeGoalId(path) === levelId && normalizePathLanguage(path) === selectedLanguageId
    )
  }, [paths, selectedLanguageId, selectedLevel])

  const selectedPathId = selectedPath?.id || ''
  const loadChapters = useCallback(
    (signal: AbortSignal) => loadPathChapters(selectedPathId, signal),
    [selectedPathId]
  )
  const preview = useAsyncResource(selectedPathId || null, loadChapters)
  const chapters = preview.data || []
  const chaptersLoading = preview.loading
  const loadError = preview.error
  const canFinish = Boolean(
    selectedPathId &&
    !preview.loading &&
    !preview.error &&
    chapters.some(chapter => (chapter.lessonCount ?? chapter.lesson_count ?? 0) > 0)
  )

  const contentKeys = [
    'nav.learn',
    'nav.playground',
    'nav.practice',
    'nav.docs',
    'nav.settings',
    'nav.logout',
    'onboarding.title',
    'onboarding.intro.description',
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
    'onboarding.preview.description',
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
    'onboarding.sidebar.summary',
    'onboarding.sidebar.why.title',
    'onboarding.sidebar.why.desc',
    'onboarding.sidebar.language',
    'onboarding.sidebar.path',
    'onboarding.sidebar.not_selected',
    'onboarding.sidebar.chapters',
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

  const { content, initialLoading: loading } = useContentPreloader(contentKeys, i18n.language)
  const t = (key: string, fallback: string) => content[key] || fallback

  if (loading) {
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

  const onboardingTitle = t(
    'onboarding.title',
    'Chọn đúng lộ trình học trước khi vào bài đầu tiên.'
  )
  const onboardingSubtitle = t(
    'onboarding.intro.description',
    i18n.language.startsWith('vi')
      ? 'Chọn ngôn ngữ và mục tiêu, xem trước bài học rồi bắt đầu theo từng bước.'
      : 'Choose a language and goal, preview the lessons, then begin one step at a time.'
  )
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
  const sidebarDesc = t(
    'onboarding.sidebar.summary',
    i18n.language.startsWith('vi')
      ? 'Lựa chọn này sẽ được lưu vào hồ sơ để bạn học tiếp đúng lộ trình.'
      : 'Your selection is saved to your profile so you can continue along this path.'
  )
  const sidebarWhyTitle = t('onboarding.sidebar.why.title', 'Vì sao flow này đúng hơn?')
  const sidebarWhyDesc = t(
    'onboarding.sidebar.why.desc',
    'Người mới chọn ngôn ngữ trước, rồi chọn cấp độ/lộ trình phù hợp. Loopy không đẩy họ vào catalog chung quá sớm.'
  )

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

  const canGoNext =
    step === 1
      ? languages.some(language => language.id === selectedLanguageId)
      : step === 2
        ? Boolean(selectedLevelId && selectedPathId)
        : true

  const handleNext = () => {
    if (!canGoNext) return
    setStep(prev => Math.min(3, prev + 1))
  }

  const handleFinish = () => {
    setSaveError('')

    if (!selectedPath || !canFinish) {
      setSaveError(
        t('onboarding.error.select_path', 'Bạn cần chọn một learning path trước khi lưu.')
      )
      return
    }

    if (!user) {
      navigate('/auth', {
        state: {
          from: '/onboarding',
          intendedLanguage: selectedLanguageId,
          onboardingDraft: {
            preferredLanguage: selectedLanguageId,
            learningGoal: normalizeGoalId(selectedPath),
            experienceLevel: normalizeGoalId(selectedPath),
            currentPathId: selectedPath.id,
          },
        },
      })
      return
    }

    void saveSelection(
      () =>
        saveOnboarding(
          {
            preferredLanguage: selectedLanguageId,
            learningGoal: normalizeGoalId(selectedPath),
            experienceLevel: normalizeGoalId(selectedPath),
            currentPathId: selectedPath.id,
          },
          user.id
        ),
      {
        onSuccess: profile => {
          void refreshUser(profile)
          navigate(`/library/${selectedLanguageId}`, { replace: true })
        },
        onError: error =>
          setSaveError(
            error instanceof Error
              ? error.message
              : t('onboarding.error.save_failed', 'Không lưu được onboarding. Vui lòng thử lại.')
          ),
      }
    )
  }

  return (
    <PublicShell headerContent={headerContent} footerContent={footerContent}>
      <main className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid grid-cols-1 gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                {badge}
              </div>
              <h1 className="loopy-heading max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
                {onboardingTitle}
              </h1>
              <p className="loopy-body mt-6 max-w-2xl text-lg leading-8">{onboardingSubtitle}</p>
            </div>
            <div className="loopy-card rounded-[2rem] border p-5 shadow-xl">
              <div className="mb-4 flex items-center gap-2 text-sm font-black text-brand-ocean">
                <FiMap /> {progressLabel}
              </div>
              <StepBar step={step} />
              <div className="mt-4 text-sm font-bold loopy-muted">
                {t('onboarding.progress.step_prefix', 'Bước')} {step}/3 ·{' '}
                {step === 1 ? stepLanguage : step === 2 ? stepPath : stepChapters}
              </div>
            </div>
          </div>

          {loadError && <ResourceLoadError message={loadError} onRetry={preview.retry} />}

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
            <section className="loopy-card rounded-[2rem] border p-6 shadow-sm md:p-8">
              {step === 1 && (
                <div>
                  <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                    {t('onboarding.language.title', 'Chọn ngôn ngữ bạn muốn học trước')}
                  </h2>
                  <p className="mt-3 text-sm leading-6 loopy-body">
                    {t(
                      'onboarding.language.desc',
                      'Ngôn ngữ quyết định môi trường chạy code; cấp độ học ở bước sau sẽ được giữ đồng bộ.'
                    )}
                  </p>
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
                            <LanguageIcon
                              languageId={language.id}
                              comingSoon={language.comingSoon}
                            />
                          </div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-xl font-black">{normalizeDisplayName(language)}</h3>
                            {language.comingSoon && (
                              <span className="rounded-full bg-slate-950 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-brand-teal">
                                {t('onboarding.language.coming_badge', 'Coming soon')}
                              </span>
                            )}
                          </div>
                          <p className="mt-2 text-sm leading-6 loopy-body">
                            {language.comingSoon
                              ? t(
                                  'onboarding.language.coming_desc',
                                  'Sắp mở thêm khi Loopy có đủ lesson và practice set phù hợp.'
                                )
                              : language.canRunInBrowser || language.can_run_in_browser
                                ? t(
                                    'onboarding.language.browser',
                                    'Có thể chạy trực tiếp trong trình duyệt.'
                                  )
                                : t(
                                    'onboarding.language.backend',
                                    'Dùng runner backend khi thực hành.'
                                  )}
                          </p>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                    {t('onboarding.path.title', 'Chọn cấp độ học')}
                  </h2>
                  <p className="mt-3 text-sm leading-6 loopy-body">
                    {t(
                      'onboarding.path.desc',
                      'Các cấp độ được hiển thị giống nhau cho mọi ngôn ngữ để user không bị lệch trải nghiệm onboarding.'
                    )}
                  </p>
                  {levelOptions.length === 0 ? (
                    <div className="mt-6 rounded-[1.5rem] border border-dashed border-brand-teal/30 p-6 text-sm font-bold loopy-muted">
                      {i18n.language.startsWith('vi')
                        ? 'Chưa có lộ trình sẵn sàng. Vui lòng quay lại sau.'
                        : 'No learning paths are available yet. Please check again later.'}
                    </div>
                  ) : (
                    <div className="mt-6 grid gap-3">
                      {levelOptions.map(path => {
                        const levelId = normalizeGoalId(path)
                        const active = selectedLevelId === levelId
                        const languageSpecificPath = paths.find(
                          item =>
                            normalizeGoalId(item) === levelId &&
                            normalizePathLanguage(item) === selectedLanguageId
                        )
                        return (
                          <button
                            key={levelId}
                            type="button"
                            onClick={() => setSelectedLevelId(levelId)}
                            className={`flex items-start gap-4 rounded-[1.5rem] border p-5 text-left transition ${active ? 'border-brand-teal bg-brand-teal/10' : 'border-brand-teal/30 loopy-card-soft hover:border-brand-teal'}`}
                          >
                            <div
                              className={`mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-brand-teal text-slate-950' : 'loopy-surface text-[color:var(--loopy-text-muted)]'}`}
                            >
                              {active ? <FiCheckCircle /> : <FiCompass />}
                            </div>
                            <div>
                              <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                                {levelId}
                              </div>
                              <h3 className="mt-1 text-xl font-black">{path.title}</h3>
                              <p className="mt-2 text-sm leading-6 loopy-body">
                                {path.description ||
                                  t('onboarding.path.default_desc', 'Guided path cho người học.')}
                              </p>
                              {!languageSpecificPath && (
                                <div className="mt-3 inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-black text-amber-700">
                                  <FiAlertCircle />{' '}
                                  {t(
                                    'onboarding.path.missing_language',
                                    'Path này chưa có bản riêng cho ngôn ngữ đã chọn.'
                                  )}
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
                  <h2 className="text-3xl font-black tracking-tight md:text-4xl">
                    {t('onboarding.chapters.title', 'Preview chapters của path')}
                  </h2>
                  <p className="mt-3 text-sm leading-6 loopy-body">
                    {t(
                      'onboarding.preview.description',
                      i18n.language.startsWith('vi')
                        ? 'Xem trước các chương và số bài học đang sẵn sàng trong lộ trình bạn chọn.'
                        : 'Preview the chapters and available lessons in your selected path.'
                    )}
                  </p>
                  <div className="mt-6 rounded-[1.5rem] border border-brand-teal/30 bg-brand-teal/10 p-6">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                      {t('onboarding.chapters.badge', 'Selected path')}
                    </div>
                    <h3 className="mt-3 text-4xl font-black">
                      {selectedPath?.title || `${normalizeDisplayName(selectedLanguage)} Starter`}
                    </h3>
                    <p className="mt-3 text-sm leading-6 loopy-body">
                      {selectedPath?.description ||
                        t('onboarding.chapters.default_desc', 'Path này chưa có mô tả.')}
                    </p>
                    <div className="mt-5 grid gap-3">
                      {chaptersLoading ? (
                        Array.from({ length: 3 }).map((_, index) => (
                          <div key={index} className="h-20 rounded-2xl loopy-skeleton" />
                        ))
                      ) : chapters.length === 0 ? (
                        <div className="loopy-surface rounded-2xl border loopy-border p-4 text-sm font-bold loopy-muted">
                          {i18n.language.startsWith('vi')
                            ? 'Lộ trình chưa có bài học sẵn sàng. Bạn có thể chọn lộ trình khác.'
                            : 'This path has no available lessons yet. You can choose another path.'}
                        </div>
                      ) : (
                        chapters.map((chapter, index) => (
                          <div
                            key={chapter.id}
                            className="loopy-surface rounded-2xl border loopy-border p-4"
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-brand-teal">
                                {index + 1}
                              </div>
                              <div>
                                <h4 className="text-base font-black">{chapter.title}</h4>
                                <p className="mt-1 text-sm leading-6 loopy-body">
                                  {chapter.description ||
                                    t(
                                      'onboarding.chapters.default_desc',
                                      'Chapter trong lộ trình này.'
                                    )}
                                </p>
                                <div className="mt-2 text-xs font-black uppercase tracking-wider text-brand-ocean">
                                  {chapter.lessonCount ?? chapter.lesson_count ?? 0}{' '}
                                  {t('onboarding.chapters.lesson_count', 'lessons')}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                  {!chaptersLoading && !loadError && chapters.length > 0 && !canFinish && (
                    <p role="status" className="mt-5 font-semibold loopy-muted">
                      {i18n.language.startsWith('vi')
                        ? 'Lộ trình này chưa có bài học sẵn sàng. Bạn có thể quay lại để chọn lộ trình khác.'
                        : 'This path has no available lessons yet. You can go back and choose another path.'}
                    </p>
                  )}
                  {saveError && (
                    <div
                      role="alert"
                      className="mt-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm font-bold text-rose-700"
                    >
                      <FiAlertCircle className="mt-0.5 shrink-0" />
                      <span>{saveError}</span>
                    </div>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-col justify-between gap-3 border-t loopy-border pt-6 sm:flex-row">
                <button
                  onClick={() => setStep(prev => Math.max(1, prev - 1))}
                  className="loopy-subtle-button rounded-2xl border px-5 py-3 text-sm font-black shadow-[0_4px_0_rgba(15,23,42,0.22)] disabled:opacity-40"
                  disabled={step === 1 || saving}
                >
                  {btnBack}
                </button>
                {step < 3 ? (
                  <button
                    onClick={handleNext}
                    disabled={!canGoNext}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-teal px-5 py-3 text-sm font-black text-slate-950 shadow-[0_5px_0_#0b889c] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {btnNext} <FiArrowRight />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleFinish}
                    disabled={saving || !canFinish}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-teal px-5 py-3 text-sm font-black text-slate-950 shadow-[0_5px_0_#0b889c] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <FiSave /> {saving ? t('onboarding.saving', 'Đang lưu...') : btnJourney}
                  </button>
                )}
              </div>
            </section>

            <aside className="grid gap-4 lg:self-start">
              <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-6 text-white shadow-xl">
                <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-teal">
                  <FiTarget /> {sidebarBadge}
                </div>
                <h2 className="text-3xl font-black">
                  {selectedPath?.title || normalizeDisplayName(selectedLanguage)}
                </h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">{sidebarDesc}</p>
                <div className="mt-5 grid gap-2">
                  {[
                    `${t('onboarding.sidebar.language', 'Language')}: ${normalizeDisplayName(selectedLanguage)}`,
                    `${t('onboarding.sidebar.path', 'Path')}: ${selectedPath?.title || t('onboarding.sidebar.not_selected', 'Chưa chọn')}`,
                    `${t('onboarding.sidebar.chapters', 'Chapters')}: ${chapters.length}`,
                  ].map(item => (
                    <div
                      key={item}
                      className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300"
                    >
                      <FiCheckCircle className="text-brand-teal" /> {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="loopy-card rounded-[2rem] border p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-brand-ocean">
                  <FiLayers /> {sidebarWhyTitle}
                </div>
                <p className="text-sm leading-6 loopy-body">{sidebarWhyDesc}</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </PublicShell>
  )
}

export default function OnboardingPage() {
  const { user } = useAuth()
  const location = useLocation()
  const catalog = useAsyncResource('onboarding-catalog', loadOnboardingCatalog)
  if (catalog.error)
    return (
      <PublicShell>
        <main className="mx-auto max-w-3xl px-6 py-12">
          <ResourceLoadError message={catalog.error} onRetry={catalog.retry} />
        </main>
      </PublicShell>
    )
  if (!catalog.data) return <LoadingScreen />
  return <OnboardingFlow key={`${user?.id || 'guest'}:${location.key}`} catalog={catalog.data} />
}
