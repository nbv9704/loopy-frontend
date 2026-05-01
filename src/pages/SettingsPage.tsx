import { useState } from 'react'
import { User, Settings as SettingsIcon, TrendingUp } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import Header from '../components/common/Header'
import Footer from '../components/common/Footer'
import SEO from '../components/common/SEO'
import { pageMetadata } from '../utils/seo'
import ProfileSettings from '../components/settings/ProfileSettings'
import PreferencesSettings from '../components/settings/PreferencesSettings'
import ProgressStats from '../components/settings/ProgressStats'

const SettingsPage = () => {
  const { t } = useTranslation()
  const [activeTab, setActiveTab] = useState('profile')

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
