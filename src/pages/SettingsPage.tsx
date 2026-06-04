import { useState } from 'react'
import { BookOpen, Flame, Map, Settings as SettingsIcon, Star, TrendingUp, User } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import SEO from '../components/common/SEO'
import { pageMetadata } from '../utils/seo'
import ProfileSettings from '../components/settings/ProfileSettings'
import PreferencesSettings from '../components/settings/PreferencesSettings'
import ProgressStats from '../components/settings/ProgressStats'
import { useAuth } from '../contexts/AuthContext'

const goalLabels: Record<string, string> = {
  start_from_zero: 'Bắt đầu từ số 0',
  build_web: 'Làm website',
  school_work: 'Phục vụ việc học ở trường',
  explore: 'Khám phá xem code có hợp không',
}

const languageLabels: Record<string, string> = {
  javascript: 'JavaScript Web Starter',
  python: 'Python Foundations',
  cpp: 'C++ School Foundations',
}

const SettingsPage = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('profile')
  const preferredLanguage = user?.preferredLanguage || 'javascript'

  const menuItems = [
    { id: 'profile', label: t('settings.profile'), Icon: User },
    { id: 'preferences', label: t('settings.preferences'), Icon: SettingsIcon },
    { id: 'progress', label: t('settings.progress'), Icon: TrendingUp },
  ]

  return (
    <>
      <SEO {...pageMetadata.settings} />
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col relative overflow-hidden">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none opacity-40">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-teal/10 rounded-full blur-[120px] animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-cyan/10 rounded-full blur-[100px] animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        </div>

        <Header />

        <main className="flex-grow pt-20 pb-8 relative z-10">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-brand-teal">
                    <Map className="h-3.5 w-3.5" /> Learning Profile
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                    Hồ sơ học tập của bạn
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400">
                    Quản lý tài khoản, chỉnh editor cho dễ đọc hơn và theo dõi hành trình học của bạn.
                  </p>
                </div>

                <button
                  onClick={() => navigate(`/library/${preferredLanguage}`)}
                  className="inline-flex items-center justify-center gap-3 rounded-2xl bg-brand-teal px-6 py-4 font-black text-[#0a0e1a] shadow-lg shadow-brand-teal/20 transition-transform hover:-translate-y-0.5"
                >
                  <BookOpen className="h-5 w-5" /> Tiếp tục lộ trình
                </button>
              </div>

              <div className="mt-6 grid gap-3 md:grid-cols-4">
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Mục tiêu</div>
                  <div className="mt-2 font-bold text-white">{goalLabels[user?.learningGoal || ''] || 'Chưa chọn'}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="text-xs font-bold uppercase tracking-widest text-slate-500">Lộ trình</div>
                  <div className="mt-2 font-bold text-white">{languageLabels[preferredLanguage] || preferredLanguage}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                    <Flame className="h-3.5 w-3.5 text-orange-400" /> Streak
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">{user?.currentStreak || 0}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-500">
                    <Star className="h-3.5 w-3.5 text-yellow-400" /> Điểm
                  </div>
                  <div className="mt-2 text-2xl font-black text-white">{user?.points || 0}</div>
                </div>
              </div>
            </div>

            <div className="flex flex-col md:flex-row gap-6">
              {/* Left Navigation */}
              <aside className="w-full md:w-64 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                <h2 className="text-white font-bold text-xl mb-6">{t('settings.title')}</h2>
                <nav className="space-y-2">
                  {menuItems.map(item => {
                    const Icon = item.Icon
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full text-left px-4 py-3.5 text-sm font-semibold cursor-pointer transition-all duration-300 flex items-center gap-3 rounded-xl ${
                          activeTab === item.id
                            ? 'bg-brand-teal/20 border-l-4 border-brand-teal text-brand-teal shadow-lg shadow-brand-teal/20'
                            : 'text-slate-400 hover:bg-white/5 hover:text-white'
                        }`}
                      >
                        <Icon className="w-5 h-5" />
                        {item.label}
                      </button>
                    )
                  })}
                </nav>
              </aside>

              {/* Main Content */}
              <div className="flex-1 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                {activeTab === 'profile' && <ProfileSettings />}
                {activeTab === 'preferences' && <PreferencesSettings />}
                {activeTab === 'progress' && <ProgressStats />}
              </div>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    </>
  )
}

export default SettingsPage
