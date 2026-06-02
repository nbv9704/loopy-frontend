import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiActivity, FiAward, FiBell, FiCheckCircle, FiCompass, FiGlobe, FiPlay, FiRefreshCw, FiSettings, FiTarget, FiUser, FiZap } from 'react-icons/fi'
import { V2PressedButton, V2PublicShell } from '../../components/v2/V2PublicShell'
import { useAuth } from '../../contexts/AuthContext'
import { api } from '../../lib/api'
import { useContentPreloader } from '../../hooks/useContentPreloader'
import { LoadingScreen } from '../../components/v2/LoadingScreen'

type ProfileTab = 'overview' | 'journey' | 'goals' | 'notifications' | 'settings'

const sideNav: Array<{ id: ProfileTab; labelKey: string; fallback: string; icon: typeof FiActivity }> = [
  { id: 'overview', labelKey: 'profile.tab.overview', fallback: 'Overview', icon: FiActivity },
  { id: 'journey', labelKey: 'profile.tab.journey', fallback: 'Journey', icon: FiCompass },
  { id: 'goals', labelKey: 'profile.tab.goals', fallback: 'Goals', icon: FiTarget },
  { id: 'notifications', labelKey: 'profile.tab.notifications', fallback: 'Notifications', icon: FiBell },
  { id: 'settings', labelKey: 'profile.tab.settings', fallback: 'Settings', icon: FiSettings },
]

const goalLabels: Record<string, string> = {
  start_from_zero: 'Start from zero',
  build_web: 'Build web apps',
  school_work: 'School work',
  explore: 'Explore coding',
}

const V2ProfilePage: React.FC = () => {
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

  const contentKeys = [
    'nav.learn', 'nav.playground', 'nav.pvp', 'nav.docs', 'nav.settings', 'nav.logout',
    'profile.title', 'profile.subtitle', 'profile.badge',
    'profile.tab.overview', 'profile.tab.journey', 'profile.tab.goals', 'profile.tab.notifications', 'profile.tab.settings',
    'profile.journey.badge', 'profile.journey.title', 'profile.journey.lessons_done',
    'profile.stats.saved', 'profile.stats.streak', 'profile.stats.points',
    'profile.next.title', 'profile.next.badge', 'profile.next.headline', 'profile.next.desc', 'profile.next.btn_path', 'profile.next.btn_journey',
    'profile.today.badge', 'profile.today.title', 'profile.today.desc', 'profile.today.progress',
    'profile.notify.badge', 'profile.notice.title', 'profile.notice.desc',
    'profile.journey.tab.title', 'profile.journey.tab.desc', 'profile.journey.tab.card1', 'profile.journey.tab.card2', 'profile.journey.tab.card3',
    'profile.goals.tab.title', 'profile.goals.tab.desc', 'profile.goals.current_goal', 'profile.goals.preferred_language', 'profile.goals.update_btn',
    'profile.notifications.tab.title', 'profile.notifications.tab.desc', 'profile.notifications.item1', 'profile.notifications.item2', 'profile.notifications.item3',
    'profile.settings.tab.title', 'profile.settings.tab.desc', 'profile.settings.account', 'profile.settings.onboarding', 'profile.settings.language',
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

  const text = (key: string, fallback: string) => content[key] || fallback

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

  const userName = (user as any)?.name || (user as any)?.displayName || (user as any)?.email?.split('@')[0] || 'Loopy learner'
  const userInitial = userName.charAt(0).toUpperCase()
  const preferredLanguage = (user as any)?.preferredLanguage || (user as any)?.preferred_language || 'javascript'
  const learningGoal = (user as any)?.learningGoal || (user as any)?.learning_goal || 'start_from_zero'
  const journeyHref = `/library/${preferredLanguage}`

  const metricCards = useMemo(() => [
    { label: text('profile.stats.saved', 'Progress saved'), value: stats.completedLessons.toString(), icon: FiCheckCircle, note: 'completeLesson' },
    { label: text('profile.stats.streak', 'Streak'), value: stats.currentStreak.toString(), icon: FiZap, note: 'daily habit' },
    { label: text('profile.stats.points', 'Points'), value: stats.totalPoints.toString(), icon: FiAward, note: 'saved lessons' },
  ], [content, stats])

  const savedLessonsLabel = stats.completedLessons === 1 ? '1 saved lesson' : `${stats.completedLessons} saved lessons`
  const todayCompleted = stats.completedToday > 0
  const todayProgressWidth = todayCompleted ? '100%' : '0%'

  const activities = [
    stats.hasProgressData
      ? ['Progress đã lưu', `${savedLessonsLabel} đã được backend ghi nhận qua progress.`]
      : ['Chưa có progress đã lưu', 'Hoàn thành một lesson bằng nút Kiểm tra để backend ghi nhận tiến độ.'],
    [(user as any)?.onboardingCompleted ? 'Onboarding đã hoàn tất' : 'Onboarding chưa hoàn tất', (user as any)?.onboardingCompleted ? 'Mục tiêu học và ngôn ngữ ưu tiên đã được lưu trong profile.' : 'Chạy onboarding để Loopy gợi ý lộ trình đầu tiên.'],
    ['Lộ trình hiện tại', `Journey Map đang mở theo ${preferredLanguage}.`],
  ]

  if (contentLoading) {
    return <LoadingScreen message="Loading profile..." />
  }

  const renderOverview = () => (
    <div className="grid gap-6">
      <div className="relative overflow-hidden rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 md:p-8">
        <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-brand-teal/20 blur-3xl" />
        <div className="relative grid gap-8 lg:grid-cols-[1fr,360px] lg:items-end">
          <div>
            <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
              {text('profile.badge', 'Profile')}
            </div>
            <h1 className="max-w-3xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
              {text('profile.title', 'Your learning profile.')}
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
              {text('profile.subtitle', 'Review your progress, streak, points, and the next lesson in your Loopy journey.')}
            </p>
          </div>
          <div className="rounded-[1.5rem] border border-slate-200 bg-[#f8fafc] p-5">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{text('profile.journey.badge', 'Journey progress')}</div>
            <h2 className="mt-2 text-2xl font-black">{text('profile.journey.title', 'You are building a coding habit one step at a time.')}</h2>
            {stats.hasProgressData ? (
              <div className="mt-4 rounded-2xl border border-brand-teal/30 bg-white p-4 text-sm font-black text-brand-ocean">
                {savedLessonsLabel}
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-500">
                Chưa có lesson nào được lưu. Hãy hoàn thành bài đầu tiên bằng nút Kiểm tra.
              </div>
            )}
            <p className="mt-3 text-sm text-slate-600">{stats.completedLessons} {text('profile.journey.lessons_done', 'lessons completed')}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {metricCards.map(stat => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-200/80">
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-brand-teal shadow-[0_4px_0_#54d9c4]"><Icon /></div>
              <div className="text-4xl font-black">{stat.value}</div>
              <div className="mt-1 font-black text-slate-700">{stat.label}</div>
              <div className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">{stat.note}</div>
            </div>
          )
        })}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1fr,380px]">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-5 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiPlay /> {text('profile.next.title', 'Recommended next lesson')}</div>
          <div className="rounded-[1.5rem] border border-brand-teal/30 bg-brand-teal/10 p-5">
            <div className="text-xs font-black uppercase tracking-[0.18em] text-brand-ocean">{text('profile.next.badge', 'Next lesson')}</div>
            <h2 className="mt-2 text-3xl font-black text-slate-950">{text('profile.next.headline', 'Return to the step that is already open.')}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">{text('profile.next.desc', 'Continue the active lesson instead of picking a random new topic.')}</p>
            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              <V2PressedButton to="/languages">{text('profile.next.btn_path', 'View paths')}</V2PressedButton>
              <V2PressedButton to={journeyHref} variant="secondary">{text('profile.next.btn_journey', 'Go to Journey Map')}</V2PressedButton>
            </div>
          </div>
          <div className="mt-6 grid gap-3">
            {activities.map(([title, description]) => (
              <div key={title} className="flex gap-3 rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
                <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-brand-teal text-slate-950"><FiCheckCircle /></div>
                <div><div className="font-black text-slate-800">{title}</div><div className="mt-1 text-sm leading-6 text-slate-600">{description}</div></div>
              </div>
            ))}
          </div>
        </div>
        <aside className="grid gap-4">
          <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-sm">
            <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-teal"><FiTarget /> {text('profile.today.badge', 'Today focus')}</div>
            <h2 className="text-3xl font-black">{text('profile.today.title', 'One small lesson is enough.')}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-400">{text('profile.today.desc', 'Today’s goal: complete one lesson with a successful Check.')}</p>
            <div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.04] p-4">
              <div className="flex items-center justify-between text-sm font-black"><span>{text('profile.today.progress', 'Today’s progress')}</span><span className="text-brand-teal">{stats.completedToday}/1</span></div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-brand-teal" style={{ width: todayProgressWidth }} /></div>
            </div>
          </div>
          <NoticeCard />
        </aside>
      </div>
    </div>
  )

  const NoticeCard = () => (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiBell /> {text('profile.notify.badge', 'Notice')}</div>
      <div className="grid gap-3">
        <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 text-sm leading-6 text-slate-600">
          {stats.hasProgressData ? 'Progress đang đọc từ backend. Mở Journey Map để tiếp tục đúng bước.' : 'Chưa có progress backend; hoàn thành lesson đầu tiên để profile cập nhật.'}
        </div>
        <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4 text-sm leading-6 text-slate-600">Docs là tài liệu tham khảo; progress chỉ lưu sau khi lesson được Kiểm tra thành công.</div>
      </div>
    </div>
  )

  const renderJourney = () => (
    <TabPanel icon={FiCompass} title={text('profile.journey.tab.title', 'Your saved journey')} desc={text('profile.journey.tab.desc', 'This summary uses saved progress and account data. Open Journey Map for the exact next lesson.')}>
      <div className="grid gap-4 md:grid-cols-3">
        {metricCards.map(stat => <MiniStat key={stat.label} {...stat} />)}
      </div>
      <div className="rounded-[2rem] border border-brand-teal/30 bg-brand-teal/10 p-6">
        <h3 className="text-2xl font-black text-slate-950">{text('profile.journey.tab.card1', 'Continue from the Journey Map')}</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">{text('profile.journey.tab.card2', 'The library page separates completed, current, next, and locked lessons so you do not have to guess.')}</p>
        <div className="mt-5"><V2PressedButton to={journeyHref}>{text('profile.journey.tab.card3', 'Open Journey Map')}</V2PressedButton></div>
      </div>
    </TabPanel>
  )

  const renderGoals = () => (
    <TabPanel icon={FiTarget} title={text('profile.goals.tab.title', 'Learning goals')} desc={text('profile.goals.tab.desc', 'Keep the goal small enough to act on today. You can update your path without losing saved progress.')}>
      <InfoGrid items={[
        [text('profile.goals.current_goal', 'Current goal'), goalLabels[learningGoal] || learningGoal, FiTarget],
        [text('profile.goals.preferred_language', 'Preferred language'), preferredLanguage, FiGlobe],
        ['Daily target', '1 checked lesson', FiCheckCircle],
      ]} />
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-black">Newbie-first path</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">Loopy ưu tiên một bước tiếp theo rõ ràng thay vì bắt bạn tự chọn giữa nhiều chủ đề.</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row"><V2PressedButton to="/onboarding">{text('profile.goals.update_btn', 'Update my path')}</V2PressedButton><V2PressedButton to="/languages" variant="secondary">View all paths</V2PressedButton></div>
      </div>
    </TabPanel>
  )

  const renderNotifications = () => (
    <TabPanel icon={FiBell} title={text('profile.notifications.tab.title', 'In-app notifications')} desc={text('profile.notifications.tab.desc', 'These reminders are shown inside Loopy. Email and push delivery are not enabled until backend support exists.')}>
      {[
        text('profile.notifications.item1', 'Show a reminder when the next lesson is available.'),
        text('profile.notifications.item2', 'Show a note when progress was saved successfully.'),
        text('profile.notifications.item3', 'Show guidance before entering PvP too early.'),
      ].map((item, index) => (
        <div key={item} className="flex items-center justify-between rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal/20 text-brand-ocean"><FiBell /></div><p className="font-bold text-slate-700">{item}</p></div>
          <span className={`rounded-full px-3 py-1 text-xs font-black ${index === 1 ? 'bg-brand-teal text-slate-950' : 'bg-slate-100 text-slate-500'}`}>{index === 1 ? 'Active' : 'Planned'}</span>
        </div>
      ))}
    </TabPanel>
  )

  const renderSettings = () => (
    <TabPanel icon={FiSettings} title={text('profile.settings.tab.title', 'Account settings')} desc={text('profile.settings.tab.desc', 'Only safe account summary actions are shown here. Destructive actions need backend support first.')}>
      <InfoGrid items={[
        [text('profile.settings.account', 'Account'), (user as any)?.email || userName, FiUser],
        [text('profile.settings.onboarding', 'Onboarding'), (user as any)?.onboardingCompleted ? 'Completed' : 'Not completed', FiCheckCircle],
        [text('profile.settings.language', 'Preferred language'), preferredLanguage, FiGlobe],
      ]} />
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="text-2xl font-black">Path controls</h3>
        <p className="mt-3 text-sm leading-6 text-slate-600">Bạn có thể chạy lại onboarding để cập nhật mục tiêu học và ngôn ngữ ưu tiên.</p>
        <div className="mt-5"><V2PressedButton to="/onboarding"><FiRefreshCw /> Update onboarding</V2PressedButton></div>
      </div>
    </TabPanel>
  )

  const TabPanel = ({ icon: Icon, title, desc, children }: { icon: typeof FiActivity; title: string; desc: string; children: React.ReactNode }) => (
    <div className="grid gap-6">
      <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70 md:p-8">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-brand-teal shadow-[0_4px_0_#54d9c4]"><Icon /></div>
        <h1 className="text-4xl font-black tracking-tight text-slate-950 md:text-6xl">{title}</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">{desc}</p>
      </div>
      {children}
    </div>
  )

  const MiniStat = ({ label, value, icon: Icon, note }: { label: string; value: string; icon: typeof FiActivity; note: string }) => (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-slate-950 text-brand-teal"><Icon /></div>
      <div className="text-3xl font-black">{value}</div>
      <div className="mt-1 font-black text-slate-700">{label}</div>
      <div className="mt-2 text-xs font-bold uppercase tracking-widest text-slate-400">{note}</div>
    </div>
  )

  const InfoGrid = ({ items }: { items: Array<[string, string, typeof FiActivity]> }) => (
    <div className="grid gap-4 md:grid-cols-3">
      {items.map(([label, value, Icon]) => (
        <div key={label} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal/20 text-brand-ocean"><Icon /></div>
          <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{label}</div>
          <div className="mt-2 text-2xl font-black text-slate-950">{value}</div>
        </div>
      ))}
    </div>
  )

  const renderActiveTab = () => {
    if (activeTab === 'journey') return renderJourney()
    if (activeTab === 'goals') return renderGoals()
    if (activeTab === 'notifications') return renderNotifications()
    if (activeTab === 'settings') return renderSettings()
    return renderOverview()
  }

  const activeTabLabel = sideNav.find(item => item.id === activeTab)?.fallback || 'Overview'

  return (
    <V2PublicShell headerContent={headerContent} footerContent={footerContent}>
      <main className="px-4 py-10 md:px-6">
        <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[260px,1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-4 text-white shadow-xl shadow-slate-200/70">
              <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-5">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-teal text-xl font-black text-slate-950 shadow-[0_4px_0_#0b889c]">{userInitial}</div>
                <div>
                  <div className="font-black">{userName}</div>
                  <div className="text-xs font-bold text-slate-500">Loopy learner</div>
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
    </V2PublicShell>
  )
}

export default V2ProfilePage
