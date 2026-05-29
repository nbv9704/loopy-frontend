import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { LogOut, Menu, Settings, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import LanguageSwitcher from '../common/LanguageSwitcher'
import headerLogo from '../../assets/images/logos/header/logo-w256.png'

// Static navigation items — labels resolved via i18n in render
const NAV_ITEMS = [
  { id: 'learn', labelKey: 'nav.learn', path: '/languages' },
  { id: 'playground', labelKey: 'nav.playground', path: '/playground' },
  { id: 'pvp', labelKey: 'nav.pvp', path: '/pvp' },
  { id: 'docs', labelKey: 'nav.docs', path: '/docs' },
]

const goalToLang: Record<string, string> = {
  start_from_zero: 'python',
  build_web: 'javascript',
  school_work: 'cpp',
  explore: 'python',
}

const V2Header: React.FC = () => {
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

  const visibleNavItems = NAV_ITEMS.filter(item => !(item.id === 'pvp' && !user))

  return (
    <header className="sticky top-0 left-0 right-0 bg-[#f7fbff]/90 backdrop-blur-xl border-b border-slate-200/80 z-50">
      {/* Subtle gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-teal/30 to-transparent" />

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
                      : 'text-slate-600 hover:text-brand-teal hover:bg-slate-100'
                  }`}
                >
                  {t(item.labelKey)}
                  {isActive(item.path) && (
                    <span className="absolute bottom-0 left-1/2 -translate-x-1/2 h-1 w-6 bg-brand-teal rounded-full" />
                  )}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Language Switcher + User Menu */}
          <div className="flex items-center gap-4">
            <LanguageSwitcher />

            {/* User Menu */}
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-brand-teal text-slate-950 font-bold">
                    {user.displayName?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <span className="hidden sm:inline text-sm font-semibold text-slate-700">{user.displayName || user.email?.split('@')[0]}</span>
                </button>

                {/* Dropdown Menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-slate-200 overflow-hidden z-50">
                    <Link
                      to="/settings"
                      className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors border-b border-slate-100"
                    >
                      <Settings size={16} />
                      {t('nav.settings')}
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                    >
                      <LogOut size={16} />
                      {t('nav.logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link
                to="/auth"
                className="px-5 py-2.5 rounded-xl bg-brand-teal text-slate-950 font-semibold text-sm hover:shadow-lg transition-all"
              >
                {t('nav.login')}
              </Link>
            )}

            {/* Mobile Menu Button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              {showMobileMenu ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {showMobileMenu && (
          <nav className="md:hidden mt-4 pb-4 border-t border-slate-200 pt-4 space-y-2">
            {visibleNavItems.map(item => (
              <Link
                key={item.id}
                to={getItemPath(item)}
                className={`block px-4 py-2 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-brand-teal/10 text-brand-teal font-semibold'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
                onClick={() => setShowMobileMenu(false)}
              >
                {t(item.labelKey)}
              </Link>
            ))}
          </nav>
        )}
      </div>
    </header>
  )
}

export default V2Header
