import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiActivity, FiAward, FiBell, FiCheckCircle, FiCompass, FiGlobe, FiPlay, FiSettings, FiTarget, FiZap } from 'react-icons/fi'
import { PressedButton, PublicShell } from '../components/PublicShell'
import { useAuth } from '../contexts/AuthContext'
import { emptyStats } from '../features/profile/profile.model'
import { useProfileOverview } from '../features/profile/useProfileOverview'
import { ProfileSettings } from '../features/profile/ProfileSettings'
import { selectionLabel, selectionLabelContentKeys } from '../features/onboarding/selectionLabels'
import { useContentPreloader } from '../hooks/useContentPreloader'
import { LoadingScreen } from '../components/LoadingScreen'

type ProfileTab = 'overview' | 'journey' | 'goals' | 'settings'

const sideNav: Array<{ id: ProfileTab; labelKey: string; fallback: string; icon: typeof FiActivity }> = [
  { id: 'overview', labelKey: 'profile.tab.overview', fallback: 'Overview', icon: FiActivity },
  { id: 'journey', labelKey: 'profile.tab.journey', fallback: 'Journey', icon: FiCompass },
  { id: 'goals', labelKey: 'profile.tab.goals', fallback: 'Goals', icon: FiTarget },
  { id: 'settings', labelKey: 'profile.tab.settings', fallback: 'Settings', icon: FiSettings },
]


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

const ProfileSession: React.FC = () => {
  const { user, refreshUser } = useAuth()
  const { i18n } = useTranslation()
  const [activeTab, setActiveTab] = useState<ProfileTab>('overview')
  const overview = useProfileOverview(user?.id)
  const stats = overview.data ?? emptyStats

  const contentKeys = [
    ...selectionLabelContentKeys,
    'nav.learn', 'nav.playground', 'nav.practice', 'nav.docs', 'nav.settings', 'nav.logout',
    'profile.retry', 'profile.toast.saved', 'profile.settings.save_basic_desc', 'profile.settings.path_help', 'profile.settings.basic_desc', 'profile.settings.processing_avatar',
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

  const { content, initialLoading: contentLoading } = useContentPreloader(contentKeys, i18n.language)

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

  const userName = user?.displayName || user?.email?.split('@')[0] || 'Loopy learner'
  const userInitial = userName.charAt(0).toUpperCase()
  const preferredLanguage = user?.preferredLanguage || 'javascript'
  const journeyHref = `/library/${preferredLanguage}`

  const metricCards = useMemo(() => [
    { label: text('profile.stats.saved', 'Progress saved'), value: stats.completedLessons.toString(), icon: FiCheckCircle, note: text('profile.metric.note.complete_lesson', 'Completed and saved') },
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
      user?.onboardingCompleted ? text('profile.activity.onboarding_done_title', 'Onboarding đã hoàn tất') : text('profile.activity.onboarding_missing_title', 'Onboarding chưa hoàn tất'),
      user?.onboardingCompleted ? text('profile.activity.onboarding_done_desc', 'Mục tiêu học và ngôn ngữ ưu tiên đã được lưu trong profile.') : text('profile.activity.onboarding_missing_desc', 'Chạy onboarding để Loopy gợi ý lộ trình đầu tiên.'),
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
        <div className="relative grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px] lg:items-end">
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

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_380px]">
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
        [text('profile.goals.current_goal', 'Current goal'), selectionLabel('goal', user?.learningGoal, text), FiTarget],
        [text('profile.goals.preferred_language', 'Preferred language'), selectionLabel('language', user?.preferredLanguage, text), FiGlobe],
        [text('profile.goals.experience_level', 'Experience level'), selectionLabel('experience', user?.experienceLevel, text), FiCheckCircle],
      ]} />
      <div className="loopy-card rounded-[2rem] border p-6 shadow-sm">
        <h3 className="loopy-heading text-2xl font-black">{text('profile.goals.newbie_path_title', 'Newbie-first path')}</h3>
        <p className="loopy-body mt-3 text-sm leading-6">{text('profile.goals.newbie_path_desc', 'Loopy ưu tiên một bước tiếp theo rõ ràng thay vì bắt bạn tự chọn giữa nhiều chủ đề.')}</p>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row"><PressedButton to="/onboarding">{text('profile.goals.update_btn', 'Update my path')}</PressedButton><PressedButton to="/languages" variant="secondary">{text('profile.goals.view_all_paths', 'View all paths')}</PressedButton></div>
      </div>
    </TabPanel>
  )



  const renderSettings = () => (
    <TabPanel icon={FiSettings} title={text('profile.settings.tab.title', 'Cài đặt tài khoản')} desc={text('profile.settings.basic_desc', 'Cập nhật thông tin cá nhân và quản lý lộ trình học.')}>
      {user && <ProfileSettings userId={user.id} email={user.email} initial={userInitial} text={text} onSaved={refreshUser} />}
    </TabPanel>
  )

  const renderActiveTab = () => {
    if (activeTab === 'settings') return renderSettings()
    if (activeTab === 'goals') return renderGoals()
    if (overview.loading) return <p role="status" className="loopy-body py-12 text-center">{text('profile.loading', 'Đang tải hồ sơ…')}</p>
    if (overview.error) return <div role="alert" className="loopy-card rounded-2xl border p-6">
      <p>{overview.error}</p><button onClick={overview.retry} className="mt-4 rounded-lg bg-brand-teal px-5 py-3 font-bold text-slate-950">{text('profile.retry', 'Thử lại')}</button>
    </div>
    return activeTab === 'journey' ? renderJourney() : renderOverview()
  }

  const activeTabLabel = sideNav.find(item => item.id === activeTab)?.fallback || 'Overview'

  return (
    <PublicShell headerContent={headerContent} footerContent={footerContent}>
      <main className="px-4 py-10 md:px-6">
        <div className="mx-auto grid grid-cols-1 max-w-7xl gap-6 lg:grid-cols-[260px_1fr]">
          <aside className="lg:sticky lg:top-24 lg:self-start">
            <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-4 text-white shadow-xl shadow-black/20">
              <div className="mb-5 flex items-center gap-3 border-b border-white/10 pb-5">
                <div className={`flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-2xl bg-brand-teal text-xl font-black text-slate-950 ${user?.avatarUrl ? 'border-2 border-brand-teal/20' : 'shadow-[0_4px_0_#0b889c]'}`}>
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
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

const ProfilePage: React.FC = () => {
  const { user } = useAuth()
  return <ProfileSession key={user?.id || 'guest'} />
}

export default ProfilePage
