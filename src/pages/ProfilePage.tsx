import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiActivity, FiAward, FiBell, FiCheckCircle, FiCompass, FiGlobe, FiPlay, FiRefreshCw, FiSave, FiSettings, FiTarget, FiUser, FiZap } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { PressedButton, PublicShell } from '../components/PublicShell'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../lib/api'
import { useContentPreloader } from '../hooks/useContentPreloader'
import { LoadingScreen } from '../components/LoadingScreen'

type ProfileTab = 'overview' | 'journey' | 'goals' | 'settings'

const sideNav: Array<{ id: ProfileTab; labelKey: string; fallback: string; icon: typeof FiActivity }> = [
  { id: 'overview', labelKey: 'profile.tab.overview', fallback: 'Overview', icon: FiActivity },
  { id: 'journey', labelKey: 'profile.tab.journey', fallback: 'Journey', icon: FiCompass },
  { id: 'goals', labelKey: 'profile.tab.goals', fallback: 'Goals', icon: FiTarget },
  { id: 'settings', labelKey: 'profile.tab.settings', fallback: 'Settings', icon: FiSettings },
]


const AVATAR_PRESETS = [
  '/images/avatar/croc.webp',
  '/images/avatar/fox.webp',
  '/images/avatar/penguin.webp',
  '/images/avatar/tiger.webp',
]

const DEFAULT_AVATAR_PRESET = AVATAR_PRESETS[0]

const normalizeAvatarUrl = (avatarUrl?: string) => {
  if (!avatarUrl) return ''
  if (avatarUrl.includes('dicebear.com') || avatarUrl.includes('bottts')) {
    return DEFAULT_AVATAR_PRESET
  }
  return avatarUrl
}

const TabPanel = ({ icon: Icon, title, desc, children }: { icon: typeof FiActivity; title: string; desc: string; children: React.ReactNode }) => (
  <div className="grid gap-6">
    <div className="loopy-card rounded-[2rem] border p-6 shadow-xl md:p-8">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-brand-teal shadow-[0_4px_0_#54d9c4]"><Icon /></div>
      <h1 className="loopy-heading text-4xl font-black tracking-tight md:text-6xl">{title}</h1>
      <p className="loopy-body mt-4 max-w-3xl text-base leading-8">{desc}</p>
    </div>
    {children}
  </div>
)

const MiniStat = ({ label, value, icon: Icon, note }: { label: string; value: string; icon: typeof FiActivity; note: string }) => (
  <div className="loopy-card rounded-[2rem] border p-5 shadow-sm">
    <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-brand-teal"><Icon /></div>
    <div className="text-3xl font-black loopy-heading">{value}</div>
    <div className="mt-1 font-black loopy-muted">{label}</div>
    <div className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">{note}</div>
  </div>
)

const InfoGrid = ({ items }: { items: Array<[string, string, typeof FiActivity]> }) => (
  <div className="grid gap-4 md:grid-cols-3">
    {items.map(([label, value, Icon]) => (
      <div key={label} className="loopy-card rounded-[2rem] border p-5 shadow-sm">
        <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal/20 text-brand-ocean"><Icon /></div>
        <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
        <div className="loopy-heading mt-2 text-2xl font-black">{value}</div>
      </div>
    ))}
  </div>
)

const NoticeCard = ({ hasProgressData, text }: { hasProgressData: boolean; text: (key: string, fb: string) => string }) => (
  <div className="loopy-card rounded-[2rem] border p-6 shadow-sm">
    <div className="mb-4 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiBell /> {text('profile.notify.badge', 'Notice')}</div>
    <div className="grid gap-3">
      <div className="loopy-card-soft rounded-2xl border p-4 text-sm leading-6 loopy-body">
        {hasProgressData
          ? text('profile.notice.progress_saved', 'Progress đang đọc từ backend. Mở Journey Map để tiếp tục đúng bước.')
          : text('profile.notice.no_progress', 'Chưa có progress backend; hoàn thành lesson đầu tiên để profile cập nhật.')}
      </div>
      <div className="loopy-card-soft rounded-2xl border p-4 text-sm leading-6 loopy-body">
        {text('profile.notice.docs_rule', 'Docs là tài liệu tham khảo; progress chỉ lưu sau khi lesson được Kiểm tra thành công.')}
      </div>
    </div>
  </div>
)

const ProfilePage: React.FC = () => {
  const { user } = useAuth()
  const { i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const [stats, setStats] = useState({
    completedLessons: 0,
    currentStreak: 0,
    totalPoints: 0,
    hasProgressData: false,
    completedToday: 0,
  })

  // Profile edit state
  const [profileData, setProfileData] = useState({
    displayName: '',
    bio: '',
    preferredLanguage: 'javascript',
    learningGoal: 'start_from_zero',
    avatarUrl: '',
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)

  const contentKeys = [
    'nav.learn', 'nav.playground', 'nav.practice', 'nav.docs', 'nav.settings', 'nav.logout',
    'profile.title', 'profile.subtitle', 'profile.badge',
    'profile.tab.overview', 'profile.tab.journey', 'profile.tab.goals', 'profile.tab.notifications', 'profile.tab.settings',
    'profile.journey.badge', 'profile.journey.title', 'profile.journey.lessons_done',
    'profile.stats.saved', 'profile.stats.streak', 'profile.stats.points',
    'profile.next.title', 'profile.next.badge', 'profile.next.headline', 'profile.next.desc', 'profile.next.btn_path', 'profile.next.btn_journey',
    'profile.today.badge', 'profile.today.title', 'profile.today.desc', 'profile.today.progress',
    'profile.notify.badge', 'profile.notice.title', 'profile.notice.desc',
    'profile.journey.tab.title', 'profile.journey.tab.desc', 'profile.journey.tab.card1', 'profile.journey.tab.card2', 'profile.journey.tab.card3',
    'profile.goals.tab.title', 'profile.goals.tab.desc', 'profile.goals.current_goal', 'profile.goals.preferred_language', 'profile.goals.experience_level', 'profile.goals.experience_empty', 'profile.goals.newbie_path_title', 'profile.goals.newbie_path_desc', 'profile.goals.update_btn', 'profile.goals.view_all_paths',
    'profile.goal.start_from_zero', 'profile.goal.build_web', 'profile.goal.school_work', 'profile.goal.explore',
    'profile.settings.tab.title', 'profile.settings.tab.desc', 'profile.settings.account', 'profile.settings.onboarding', 'profile.settings.language',
    'profile.loading', 'profile.toast.save_success', 'profile.toast.save_error', 'profile.toast.connection_error', 'profile.toast.image_only',
    'profile.notice.progress_saved', 'profile.notice.no_progress', 'profile.notice.docs_rule', 'profile.journey.empty',
    'profile.metric.note.complete_lesson', 'profile.metric.note.daily_habit', 'profile.metric.note.saved_lessons', 'profile.saved_lessons.singular', 'profile.saved_lessons.plural',
    'profile.activity.progress_saved_title', 'profile.activity.progress_saved_desc', 'profile.activity.no_progress_title', 'profile.activity.no_progress_desc', 'profile.activity.onboarding_done_title', 'profile.activity.onboarding_done_desc', 'profile.activity.onboarding_missing_title', 'profile.activity.onboarding_missing_desc', 'profile.activity.current_journey_title', 'profile.activity.current_journey_desc',
    'profile.settings.avatar_title', 'profile.settings.choose_preset', 'profile.settings.remove_avatar', 'profile.settings.upload_label', 'profile.settings.upload_button', 'profile.settings.upload_help',
    'profile.settings.account_title', 'profile.settings.email_label', 'profile.settings.locked', 'profile.settings.display_name', 'profile.settings.display_name_placeholder', 'profile.settings.bio', 'profile.settings.bio_limit', 'profile.settings.bio_placeholder',
    'profile.settings.learning_path_title', 'profile.settings.preferred_language', 'profile.settings.language.javascript', 'profile.settings.language.python', 'profile.settings.language.cpp', 'profile.settings.learning_goal', 'profile.settings.goal.start_from_zero', 'profile.settings.goal.build_web', 'profile.settings.goal.school_work', 'profile.settings.goal.explore',
    'profile.settings.save_title', 'profile.settings.save_desc', 'profile.settings.saving', 'profile.settings.save_button', 'profile.settings.onboarding_title', 'profile.settings.onboarding_desc', 'profile.settings.onboarding_button', 'profile.sidebar.role',
    'footer.aboutLoopy', 'footer.about', 'footer.team', 'footer.contact', 'footer.resources', 'footer.docs', 'footer.blog', 'footer.faq', 'footer.description', 'footer.allRightsReserved', 'footer.privacy', 'footer.terms',
  ]

  const { content, loading: contentLoading } = useContentPreloader(contentKeys, i18n.language)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        if (!user) return
        const currentStreak = (user as any).current_streak || (user as any).currentStreak || 0
        const totalPoints = (user as any).total_points || (user as any).totalPoints || 0
        const progressResponse = await api.request('/api/progress/me')
        let completedLessons = 0
        let hasProgressData = false
        let completedToday = 0
        const todayKey = new Date().toISOString().slice(0, 10)

        if (progressResponse.success && progressResponse.data) {
          const progressItems = Array.isArray(progressResponse.data)
            ? progressResponse.data
            : Object.values(progressResponse.data as Record<string, any>)

          hasProgressData = progressItems.length > 0
          completedLessons = progressItems.filter((p: any) => p?.completed_at || p?.completedAt || p?.status === 'completed').length
          completedToday = progressItems.filter((p: any) => {
            const completedAt = p?.completed_at || p?.completedAt
            return completedAt ? String(completedAt).slice(0, 10) === todayKey : false
          }).length
        }

        setStats({ completedLessons, currentStreak, totalPoints, hasProgressData, completedToday })
      } catch (err) {
        console.error('Error fetching stats:', err)
      }
    }

    fetchStats()
  }, [user])

  // Fetch real profile data for Settings tab
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return
      setProfileLoading(true)
      try {
        const res = await api.request<{ profile: any }>('/api/profile/me')
        if (res.success && res.data?.profile) {
          const p = res.data.profile
          setProfileData({
            displayName: p.displayName || p.display_name || '',
            bio: p.bio || '',
            preferredLanguage: p.preferredLanguage || p.preferred_language || 'javascript',
            learningGoal: p.learningGoal || p.learning_goal || 'start_from_zero',
            avatarUrl: normalizeAvatarUrl(p.avatarUrl || p.avatar_url || ''),
          })
        }
      } catch (err) {
        console.error('Error fetching profile:', err)
      } finally {
        setProfileLoading(false)
      }
    }
    fetchProfile()
  }, [user])

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    try {
      const res = await api.request('/api/profile/me', {
        method: 'PUT',
        body: JSON.stringify(profileData),
      })
      if (res.success) {
        toast.success(text('profile.toast.save_success', 'Cập nhật thông tin thành công! Trang sẽ tự làm mới...'))
        window.setTimeout(() => {
          window.location.reload()
        }, 1200)
      } else {
        toast.error((res.error as any)?.message || text('profile.toast.save_error', 'Cập nhật thất bại'))
      }
    } catch {
      toast.error(text('profile.toast.connection_error', 'Lỗi kết nối. Vui lòng thử lại.'))
    } finally {
      setProfileSaving(false)
    }
  }

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      toast.error(text('profile.toast.image_only', 'Chỉ hỗ trợ file ảnh'))
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const MAX_SIZE = 150
        let width = img.width
        let height = img.height

        if (width > height) {
          if (width > MAX_SIZE) {
            height *= MAX_SIZE / width
            width = MAX_SIZE
          }
        } else {
          if (height > MAX_SIZE) {
            width *= MAX_SIZE / height
            height = MAX_SIZE
          }
        }

        canvas.width = width
        canvas.height = height
        const ctx = canvas.getContext('2d')
        ctx?.drawImage(img, 0, 0, width, height)

        const dataUrl = canvas.toDataURL('image/webp', 0.8)
        setProfileData(prev => ({ ...prev, avatarUrl: dataUrl }))
      }
      img.src = event.target?.result as string
    }
    reader.readAsDataURL(file)
  }

  const text = (key: string, fallback: string) => content[key] || fallback

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

  const userName = (user as any)?.name || (user as any)?.displayName || (user as any)?.email?.split('@')[0] || 'Loopy learner'
  const userInitial = userName.charAt(0).toUpperCase()
  const preferredLanguage = (user as any)?.preferredLanguage || (user as any)?.preferred_language || 'javascript'
  const learningGoal = (user as any)?.learningGoal || (user as any)?.learning_goal || 'start_from_zero'
  const journeyHref = `/library/${preferredLanguage}`
  const goalLabel = (goal: string) => {
    const fallbackMap: Record<string, string> = {
      start_from_zero: 'Start from zero',
      build_web: 'Build web apps',
      school_work: 'School work',
      explore: 'Explore coding',
    }
    return text(`profile.goal.${goal}`, fallbackMap[goal] || goal)
  }

  const metricCards = useMemo(() => [
    { label: text('profile.stats.saved', 'Progress saved'), value: stats.completedLessons.toString(), icon: FiCheckCircle, note: text('profile.metric.note.complete_lesson', 'completeLesson') },
    { label: text('profile.stats.streak', 'Streak'), value: stats.currentStreak.toString(), icon: FiZap, note: text('profile.metric.note.daily_habit', 'daily habit') },
    { label: text('profile.stats.points', 'Points'), value: stats.totalPoints.toString(), icon: FiAward, note: text('profile.metric.note.saved_lessons', 'saved lessons') },
  ], [content, stats])

  const savedLessonsLabel = stats.completedLessons === 1
    ? text('profile.saved_lessons.singular', '1 saved lesson')
    : text('profile.saved_lessons.plural', '{count} saved lessons').replace('{count}', stats.completedLessons.toString())
  const todayCompleted = stats.completedToday > 0
  const todayProgressWidth = todayCompleted ? '100%' : '0%'

  const activities = [
    stats.hasProgressData
      ? [
          text('profile.activity.progress_saved_title', 'Progress đã lưu'),
          text('profile.activity.progress_saved_desc', '{count} đã được backend ghi nhận qua progress.').replace('{count}', savedLessonsLabel),
        ]
      : [
          text('profile.activity.no_progress_title', 'Chưa có progress đã lưu'),
          text('profile.activity.no_progress_desc', 'Hoàn thành một lesson bằng nút Kiểm tra để backend ghi nhận tiến độ.'),
        ],
    [
      (user as any)?.onboardingCompleted ? text('profile.activity.onboarding_done_title', 'Onboarding đã hoàn tất') : text('profile.activity.onboarding_missing_title', 'Onboarding chưa hoàn tất'),
      (user as any)?.onboardingCompleted ? text('profile.activity.onboarding_done_desc', 'Mục tiêu học và ngôn ngữ ưu tiên đã được lưu trong profile.') : text('profile.activity.onboarding_missing_desc', 'Chạy onboarding để Loopy gợi ý lộ trình đầu tiên.'),
    ],
    [
      text('profile.activity.current_journey_title', 'Lộ trình hiện tại'),
      text('profile.activity.current_journey_desc', 'Journey Map đang mở theo {language}.').replace('{language}', preferredLanguage),
    ],
  ]

  if (contentLoading) {
    return <LoadingScreen message={text('profile.loading', 'Loading profile...')} />
  }

  const renderOverview = () => (
    <div className="grid gap-6">
      <div className="loopy-card relative overflow-hidden rounded-[2rem] border p-6 shadow-xl md:p-8">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-brand-teal/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr,360px] lg:items-end">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
              {text('profile.badge', 'Profile')}
            </div>
            <h1 className="loopy-heading max-w-3xl text-5xl font-black tracking-tight md:text-7xl">
              {text('profile.title', 'Your learning profile.')}
            </h1>
            <p className="loopy-body mt-6 max-w-2xl text-lg leading-8">
              {text('profile.subtitle', 'Review your progress, streak, points, and the next lesson in your Loopy journey.')}
            </p>
          </div>
          <div className="loopy-card-soft rounded-[1.5rem] border p-5">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{text('profile.journey.badge', 'Journey progress')}</div>
            <h2 className="loopy-heading mt-2 text-2xl font-black">{text('profile.journey.title', 'You are building a coding habit one step at a time.')}</h2>
            {stats.hasProgressData ? (
              <div className="mt-4 rounded-2xl border border-brand-teal/30 loopy-surface p-4 text-sm font-black text-brand-ocean">
                {savedLessonsLabel}
              </div>
            ) : (
              <div className="loopy-surface mt-4 rounded-2xl border loopy-border p-4 text-sm font-bold loopy-muted">
                {text('profile.journey.empty', 'Chưa có lesson nào được lưu. Hãy hoàn thành bài đầu tiên bằng nút Kiểm tra.')}
              </div>
            )}
            <p className="loopy-body mt-3 text-sm">{stats.completedLessons} {text('profile.journey.lessons_done', 'lessons completed')}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metricCards.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="loopy-card rounded-[2rem] border p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-brand-teal shadow-[0_4px_0_#54d9c4]"><Icon /></div>
              <div className="loopy-heading text-4xl font-black">{stat.value}</div>
              <div className="mt-1 font-black loopy-muted">{stat.label}</div>
              <div className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">{stat.note}</div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,380px]">
        <div className="loopy-card rounded-[2rem] border p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiPlay /> {text('profile.next.title', 'Recommended next lesson')}</div>
          <div className="rounded-[1.5rem] border border-brand-teal/30 bg-brand-teal/10 p-5">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-brand-ocean">{text('profile.next.badge', 'Next lesson')}</div>
            <h2 className="loopy-heading mt-2 text-3xl font-black">{text('profile.next.headline', 'Return to the step that is already open.')}</h2>
            <p className="loopy-body mt-3 text-sm leading-6">{text('profile.next.desc', 'Continue the active lesson instead of picking a random new topic.')}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <PressedButton to="/languages">{text('profile.next.btn_path', 'View paths')}</PressedButton>
              <PressedButton to={journeyHref} variant="secondary">{text('profile.next.btn_journey', 'Go to Journey Map')}</PressedButton>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {activities.map(([title, description]) => (
              <div key={title} className="loopy-card-soft flex gap-3 rounded-2xl border p-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-teal text-slate-950"><FiCheckCircle /></div>
                <div><div className="font-black loopy-heading">{title}</div><div className="loopy-body mt-1 text-sm leading-6">{description}</div></div>
              </div>
            ))}
          </div>
        </div>
        <aside className="grid gap-4">
          <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-6 text-white shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-teal"><FiTarget /> {text('profile.today.badge', 'Today focus')}</div>
            <h2 className="text-3xl font-black">{text('profile.today.title', 'One small lesson is enough.')}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{text('profile.today.desc', 'Today’s goal: complete one lesson with a successful Check.')}</p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between text-sm font-black"><span>{text('profile.today.progress', 'Today’s progress')}</span><span className="text-brand-teal">{stats.completedToday}/1</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-brand-teal" style={{ width: todayProgressWidth }} /></div>
            </div>
          </div>
          <NoticeCard hasProgressData={stats.hasProgressData} text={text} />
        </aside>
      </div>
    </div>
  )



  const renderJourney = () => (
    <TabPanel icon={FiCompass} title={text('profile.journey.tab.title', 'Your saved journey')} desc={text('profile.journey.tab.desc', 'This summary uses saved progress and account data. Open Journey Map for the exact next lesson.')}>
      <div className="grid gap-4 md:grid-cols-3">
        {metricCards.map(stat => <MiniStat key={stat.label} {...stat} />)}
      </div>
      <div className="rounded-[2rem] border border-brand-teal/30 bg-brand-teal/10 p-6">
        <h3 className="loopy-heading text-2xl font-black">{text('profile.journey.tab.card1', 'Continue from the Journey Map')}</h3>
        <p className="loopy-body mt-3 text-sm leading-6">{text('profile.journey.tab.card2', 'The library page separates completed, current, next, and locked lessons so you do not have to guess.')}</p>
        <div className="mt-5"><PressedButton to={journeyHref}>{text('profile.journey.tab.card3', 'Open Journey Map')}</PressedButton></div>
      </div>
    </TabPanel>
  )

  const renderGoals = () => (
    <TabPanel icon={FiTarget} title={text('profile.goals.tab.title', 'Learning goals')} desc={text('profile.goals.tab.desc', 'Keep the goal small enough to act on today. You can update your path without losing saved progress.')}>
      <InfoGrid items={[
        [text('profile.goals.current_goal', 'Current goal'), goalLabel(learningGoal), FiTarget],
        [text('profile.goals.preferred_language', 'Preferred language'), preferredLanguage, FiGlobe],
        [text('profile.goals.experience_level', 'Mức kinh nghiệm'), (user as any)?.experienceLevel || (user as any)?.experience_level || text('profile.goals.experience_empty', 'Chưa chọn'), FiCheckCircle],
      ]} />
      <div className="loopy-card rounded-[2rem] border p-6 shadow-sm">
        <h3 className="loopy-heading text-2xl font-black">{text('profile.goals.newbie_path_title', 'Newbie-first path')}</h3>
        <p className="loopy-body mt-3 text-sm leading-6">{text('profile.goals.newbie_path_desc', 'Loopy ưu tiên một bước tiếp theo rõ ràng thay vì bắt bạn tự chọn giữa nhiều chủ đề.')}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row"><PressedButton to="/onboarding">{text('profile.goals.update_btn', 'Update my path')}</PressedButton><PressedButton to="/languages" variant="secondary">{text('profile.goals.view_all_paths', 'View all paths')}</PressedButton></div>
      </div>
    </TabPanel>
  )



  const renderSettings = () => (
    <TabPanel icon={FiSettings} title={text('profile.settings.tab.title', 'Cài đặt tài khoản')} desc={text('profile.settings.tab.desc', 'Chỉnh sửa thông tin cá nhân, ngôn ngữ ưu tiên và mục tiêu học của bạn. Email đăng nhập không thể thay đổi.')}>
      {profileLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-teal border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-6">
          {/* Avatar Settings */}
          <div className="loopy-card rounded-[2rem] border p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-500">
              <FiUser className="h-4 w-4" /> {text('profile.settings.avatar_title', 'Ảnh đại diện')}
            </div>
            <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
              <div className="loopy-surface flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-2 loopy-border shadow-sm">
                {profileData.avatarUrl ? (
                  <img src={profileData.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-4xl font-black text-brand-teal">{userInitial}</div>
                )}
              </div>
              <div className="flex-1 grid gap-4">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">{text('profile.settings.choose_preset', 'Chọn ảnh có sẵn')}</label>
                  <div className="flex flex-wrap gap-3">
                    {AVATAR_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        onClick={() => setProfileData(prev => ({ ...prev, avatarUrl: preset }))}
                        className={`h-12 w-12 overflow-hidden rounded-xl border-2 transition-all hover:-translate-y-0.5 ${profileData.avatarUrl === preset ? 'border-brand-teal shadow-[0_4px_0_#54d9c4]' : 'border-transparent loopy-surface hover:border-[color:var(--loopy-border)]'}`}
                      >
                        <img src={preset} alt="Preset avatar" className="h-full w-full object-cover" />
                      </button>
                    ))}
                    {profileData.avatarUrl && (
                      <button
                        onClick={() => setProfileData(prev => ({ ...prev, avatarUrl: '' }))}
                        className="flex h-12 items-center gap-2 rounded-xl border-2 border-transparent bg-rose-50 px-3 text-xs font-bold text-rose-500 transition-all hover:bg-rose-100"
                      >
                        {text('profile.settings.remove_avatar', 'Xóa ảnh')}
                      </button>
                    )}
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">{text('profile.settings.upload_label', 'Hoặc tự tải ảnh lên')}</label>
                  <label className="loopy-subtle-button inline-flex cursor-pointer items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-bold transition-colors">
                    {text('profile.settings.upload_button', 'Chọn ảnh... (Tự nén)')}
                    <input type="file" accept="image/png, image/jpeg, image/webp" className="hidden" onChange={handleAvatarUpload} />
                  </label>
                  <p className="mt-2 text-xs text-slate-400">{text('profile.settings.upload_help', 'Ảnh sẽ được tự động nén thu nhỏ để tiết kiệm dữ liệu.')}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Email – read only */}
          <div className="loopy-card rounded-[2rem] border p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-500">
              <FiUser className="h-4 w-4" /> {text('profile.settings.account_title', 'Thông tin tài khoản')}
            </div>
            <div className="grid gap-4">
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">{text('profile.settings.email_label', 'Email (không thể thay đổi)')}</label>
                <div className="loopy-card-soft flex items-center gap-3 rounded-2xl border px-4 py-3">
                  <span className="flex-1 text-sm font-bold loopy-muted">{(user as any)?.email || '—'}</span>
                  <span className="rounded-full loopy-surface px-2 py-0.5 text-xs font-black loopy-muted">{text('profile.settings.locked', 'Khóa')}</span>
                </div>
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">{text('profile.settings.display_name', 'Tên hiển thị')}</label>
                <input
                  type="text"
                  value={profileData.displayName}
                  onChange={e => setProfileData(prev => ({ ...prev, displayName: e.target.value }))}
                  placeholder={text('profile.settings.display_name_placeholder', 'Nhập tên hiển thị...')}
                  maxLength={50}
                  className="w-full rounded-2xl border loopy-border loopy-surface px-4 py-3 text-sm font-bold text-[color:var(--loopy-text)] outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">{text('profile.settings.bio', 'Bio')} <span className="normal-case font-normal text-slate-400">{text('profile.settings.bio_limit', '(tối đa 500 ký tự)')}</span></label>
                <textarea
                  value={profileData.bio}
                  onChange={e => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder={text('profile.settings.bio_placeholder', 'Giới thiệu ngắn về bản thân...')}
                  maxLength={500}
                  rows={3}
                  className="w-full resize-none rounded-2xl border loopy-border loopy-surface px-4 py-3 text-sm font-bold text-[color:var(--loopy-text)] outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20"
                />
                <div className="mt-1 text-right text-xs text-slate-400">{profileData.bio.length}/500</div>
              </div>
            </div>
          </div>

          {/* Learning preferences */}
          <div className="loopy-card rounded-[2rem] border p-6 shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-sm font-black text-slate-500">
              <FiTarget className="h-4 w-4" /> {text('profile.settings.learning_path_title', 'Lộ trình học')}
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">{text('profile.settings.preferred_language', 'Ngôn ngữ ưu tiên')}</label>
                <select
                  value={profileData.preferredLanguage}
                  onChange={e => setProfileData(prev => ({ ...prev, preferredLanguage: e.target.value }))}
                  className="w-full rounded-2xl border loopy-border loopy-surface px-4 py-3 text-sm font-bold text-[color:var(--loopy-text)] outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 cursor-pointer"
                >
                  <option value="javascript">{text('profile.settings.language.javascript', 'JavaScript Web Starter')}</option>
                  <option value="python">{text('profile.settings.language.python', 'Python Foundations')}</option>
                  <option value="cpp">{text('profile.settings.language.cpp', 'C++ School Foundations')}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-widest text-slate-400">{text('profile.settings.learning_goal', 'Mục tiêu học')}</label>
                <select
                  value={profileData.learningGoal}
                  onChange={e => setProfileData(prev => ({ ...prev, learningGoal: e.target.value }))}
                  className="w-full rounded-2xl border loopy-border loopy-surface px-4 py-3 text-sm font-bold text-[color:var(--loopy-text)] outline-none transition focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 cursor-pointer"
                >
                  <option value="start_from_zero">{text('profile.settings.goal.start_from_zero', 'Bắt đầu từ số 0')}</option>
                  <option value="build_web">{text('profile.settings.goal.build_web', 'Làm website')}</option>
                  <option value="school_work">{text('profile.settings.goal.school_work', 'Phục vụ việc học ở trường')}</option>
                  <option value="explore">{text('profile.settings.goal.explore', 'Khám phá xem code có hợp không')}</option>
                </select>
              </div>
            </div>
          </div>

          {/* Save button */}
          <div className="loopy-card flex items-center justify-between rounded-[2rem] border p-6 shadow-sm">
            <div>
              <div className="font-black loopy-heading">{text('profile.settings.save_title', 'Lưu thay đổi')}</div>
              <div className="mt-1 text-sm loopy-muted">{text('profile.settings.save_desc', 'Cập nhật tên, bio và lộ trình học của bạn.')}</div>
            </div>
            <button
              onClick={handleSaveProfile}
              disabled={profileSaving}
              className="flex items-center gap-2 rounded-2xl bg-brand-teal px-6 py-3 text-sm font-black text-slate-950 shadow-[0_4px_0_#0b889c] transition hover:-translate-y-0.5 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {profileSaving ? (
                <><div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950 border-t-transparent" /> {text('profile.settings.saving', 'Đang lưu...')}</>
              ) : (
                <><FiSave className="h-4 w-4" /> {text('profile.settings.save_button', 'Lưu thay đổi')}</>
              )}
            </button>
          </div>

          {/* Onboarding reset */}
          <div className="loopy-card-soft rounded-[2rem] border p-6">
            <h3 className="font-black loopy-heading">{text('profile.settings.onboarding_title', 'Cập nhật onboarding')}</h3>
            <p className="mt-2 text-sm loopy-muted">{text('profile.settings.onboarding_desc', 'Chạy lại onboarding để Loopy gợi ý lại lộ trình phù hợp nhất với bạn.')}</p>
            <div className="mt-4"><PressedButton to="/onboarding" variant="secondary"><FiRefreshCw /> {text('profile.settings.onboarding_button', 'Chạy lại onboarding')}</PressedButton></div>
          </div>
        </div>
      )}
    </TabPanel>
  )



  const renderActiveTab = () => {
    if (activeTab === 'journey') return renderJourney()
    if (activeTab === 'goals') return renderGoals()
    if (activeTab === 'settings') return renderSettings()
    return renderOverview()
  }

  const activeTabLabel = sideNav.find(item => item.id === activeTab)?.fallback || 'Overview'

  return (
    <PublicShell headerContent={headerContent} footerContent={footerContent}>
      <main className="px-4 py-10 md:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px,1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-4 text-white shadow-xl shadow-black/20">
              <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-5">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-teal text-xl font-black text-slate-950 ${(user as any)?.avatarUrl ? 'border-2 border-brand-teal/20' : 'shadow-[0_4px_0_#0b889c]'}`}>
                  {(user as any)?.avatarUrl ? (
                    <img src={(user as any).avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                  ) : (
                    userInitial
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-black">{userName}</div>
                  <div className="truncate text-xs font-bold text-slate-500">{text('profile.sidebar.role', 'Loopy learner')}</div>
                </div>
              </div>
              <div className="grid gap-2">
                {sideNav.map(item => {
                  const NavIcon = item.icon
                  const isActive = activeTab === item.id
                  return (
                    <button
                      key={item.id}
                      type="button"
                      aria-current={isActive ? 'page' : undefined}
                      aria-pressed={isActive}
                      disabled={isActive}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-3 rounded-2xl px-3 py-3 text-left text-sm font-black transition-all duration-200 ${isActive ? 'cursor-default bg-brand-teal text-slate-950 shadow-[0_4px_0_#0b889c]' : 'text-slate-400 hover:bg-white/10 hover:text-white hover:translate-x-1'}`}
                    >
                      <NavIcon /> {text(item.labelKey, item.fallback)}
                    </button>
                  )
                })}
              </div>
            </div>
          </aside>

          <section
            key={activeTab}
            aria-label={`${activeTabLabel} settings tab`}
            className="grid gap-6 animate-v2-tab-panel-enter"
          >
            {renderActiveTab()}
          </section>
        </div>
      </main>
    </PublicShell>
  )
}

export default ProfilePage
