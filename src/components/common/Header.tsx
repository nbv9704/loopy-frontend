import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { Flame, LogOut, Menu, Settings, Star, User, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'
import headerLogo from '../../assets/images/logos/header/logo-w256.png'

// Static navigation items — labels resolved via i18n in render
const NAV_ITEMS = [
  { id: 'learn', labelKey: 'nav.learn', path: '/languages' },
  { id: 'playground', labelKey: 'nav.playground', path: '/playground' },
  { id: 'practice', labelKey: 'nav.practice', path: '/practice' },
  { id: 'docs', labelKey: 'nav.docs', path: '/docs' },
]

const goalToLang: Record<string, string> = {
  start_from_zero: 'python',
  build_web: 'javascript',
  school_work: 'cpp',
  explore: 'python',
}

const Header: React.FC = () => {
  const { user, signOut } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [showDropdown, setShowDropdown] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setShowDropdown(false)
    setShowMobileMenu(false)
    navigate('/')
  }

  const isActive = (path: string) => {
    // Special case for "Học tập" - highlight if on /select-language or /learn
    if (path === '/languages') {
      return location.pathname === '/languages' || location.pathname.startsWith('/learn') || location.pathname.startsWith('/library') || location.pathname.startsWith('/onboarding')
    }
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

  const getItemPath = (item: (typeof NAV_ITEMS)[number]) => {
    if (item.id === 'learn' && user?.onboardingCompleted) {
      return `/library/${user.preferredLanguage || goalToLang[user.learningGoal || ''] || 'javascript'}`
    }
    return item.path
  }

  const visibleNavItems = NAV_ITEMS.filter(item => !(item.id === 'practice' && !user))

  return (
    <header className="fixed top-0 left-0 right-0 bg-[#0a0e1a]/90 backdrop-blur-xl border-b border-white/10 z-50">
      {/* Subtle gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-teal/50 to-transparent" />

      <div className="max-w-[1800px] mx-auto px-6 py-3.5">
        <div className="flex items-center justify-between">
          {/* Left: Logo + Navigation */}
          <div className="flex items-center gap-8">
            {/* Logo */}
            <Link to="/" className="flex items-center group">
              <img
                src={headerLogo}
                alt="Loopy"
                className="h-10 object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </Link>

            {/* Navigation Links */}
            <nav className="hidden md:flex items-center gap-2">
              {visibleNavItems.map(item => (
                <Link
                  key={item.id}
                  to={getItemPath(item)}
                  className={`relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer ${
                    isActive(item.path)
                      ? 'text-brand-teal bg-brand-teal/10'
                      : 'text-slate-300 hover:text-brand-teal hover:bg-white/5'
                  }`}
                >
                  {t(item.labelKey)}
                  {isActive(item.path) && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-gradient-to-r from-transparent via-brand-teal to-transparent rounded-full" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Language Switcher + User Avatar */}
          <div className="flex items-center gap-3">
            <LanguageSwitcher />

            {/* Gamification badges (Mimo-inspired) */}
            {user && (
              <div className="hidden md:flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 rounded-xl text-orange-400 text-sm font-bold">
                  <Flame className="w-4 h-4" />
                  <span>{user.currentStreak || 0}</span>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-yellow-500/10 border border-yellow-500/20 rounded-xl text-yellow-400 text-sm font-bold">
                  <Star className="w-4 h-4" />
                  <span>{user.points || 0}</span>
                </div>
              </div>
            )}

            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="w-10 h-10 bg-gradient-to-br from-brand-teal to-brand-cyan rounded-full flex items-center justify-center text-white font-bold text-sm overflow-hidden shadow-lg ring-2 ring-brand-teal/30 hover:ring-brand-teal/50 hover:scale-105 transition-all duration-300 cursor-pointer"
                >
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()
                  )}
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-3 w-72 bg-[#0a0e1a]/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    {/* User Info Header */}
                    <div className="p-5 border-b border-white/10 bg-gradient-to-br from-brand-teal/10 via-brand-cyan/5 to-transparent">
                      <div className="flex items-center gap-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-brand-teal to-brand-cyan rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg ring-2 ring-brand-teal/20">
                          {user.avatarUrl ? (
                            <img
                              src={user.avatarUrl}
                              alt="Avatar"
                              className="w-full h-full object-cover rounded-full"
                            />
                          ) : (
                            user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-base font-bold truncate">
                            {user.displayName || 'User'}
                          </p>
                          <p className="text-slate-400 text-sm truncate">{user.email}</p>
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="p-2">
                      <Link
                        to="/settings"
                        onClick={() => setShowDropdown(false)}
                        className="flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-brand-teal hover:bg-white/5 transition-all duration-300 text-sm font-medium rounded-xl cursor-pointer group"
                      >
                        <Settings className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
                        {t('nav.settings')}
                      </Link>
                      <button
                        onClick={handleSignOut}
                        className="w-full flex items-center gap-3 px-4 py-3 text-slate-300 hover:text-red-400 hover:bg-red-500/5 transition-all duration-300 text-sm font-medium rounded-xl cursor-pointer"
                      >
                        <LogOut className="w-5 h-5" />
                        {t('auth.logout')}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="group relative px-6 py-2.5 bg-gradient-to-r from-brand-teal to-brand-cyan text-[#0a0e1a] text-sm font-bold rounded-full cursor-pointer hover:shadow-lg hover:shadow-brand-teal/30 transition-all duration-300 flex items-center gap-2 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan to-brand-teal opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <User className="w-4 h-4 relative z-10" />
                <span className="relative z-10">{t('auth.login')}</span>
              </Link>
            )}

            <button
              type="button"
              onClick={() => setShowMobileMenu(value => !value)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-slate-200 transition-colors hover:border-brand-teal/40 hover:text-brand-teal md:hidden"
              aria-label="Mở menu"
              aria-expanded={showMobileMenu}
            >
              {showMobileMenu ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {showMobileMenu && (
          <div className="mt-4 rounded-2xl border border-white/10 bg-[#0a0e1a]/95 p-3 shadow-2xl md:hidden">
            <nav className="space-y-1">
              {visibleNavItems.map(item => (
                <Link
                  key={item.id}
                  to={getItemPath(item)}
                  onClick={() => setShowMobileMenu(false)}
                  className={`block rounded-xl px-4 py-3 text-sm font-semibold transition-colors ${
                    isActive(item.path)
                      ? 'bg-brand-teal/10 text-brand-teal'
                      : 'text-slate-300 hover:bg-white/5 hover:text-brand-teal'
                  }`}
                >
                  {t(item.labelKey)}
                </Link>
              ))}
            </nav>

            {user ? (
              <div className="mt-3 border-t border-white/10 pt-3">
                <div className="mb-3 flex items-center gap-3 rounded-xl bg-white/[0.04] px-4 py-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-brand-teal to-brand-cyan text-sm font-bold text-white">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                    ) : (
                      user.displayName?.[0]?.toUpperCase() || user.email[0].toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-white">{user.displayName || 'User'}</p>
                    <p className="truncate text-xs text-slate-400">{user.email}</p>
                  </div>
                </div>
                <Link
                  to="/settings"
                  onClick={() => setShowMobileMenu(false)}
                  className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-slate-300 hover:bg-white/5 hover:text-brand-teal"
                >
                  <Settings className="h-4 w-4" />
                  {t('nav.settings')}
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-left text-sm font-semibold text-slate-300 hover:bg-red-500/5 hover:text-red-400"
                >
                  <LogOut className="h-4 w-4" />
                  {t('auth.logout')}
                </button>
              </div>
            ) : (
              <Link
                to="/auth"
                onClick={() => setShowMobileMenu(false)}
                className="mt-3 flex items-center justify-center gap-2 rounded-xl bg-brand-teal px-4 py-3 text-sm font-black text-[#0a0e1a]"
              >
                <User className="h-4 w-4" />
                {t('auth.login')}
              </Link>
            )}
          </div>
        )}
      </div>
    </header>
  )
}

export default Header
