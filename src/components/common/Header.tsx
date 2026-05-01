import React, { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { User, LogOut, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../../contexts/AuthContext'
import LanguageSwitcher from './LanguageSwitcher'
import headerLogo from '../../assets/images/logos/header/logo-w256.png'

// Static navigation items (no need for API)
const NAV_ITEMS = [
  { id: 'learn', label: 'Học tập', path: '/select-language' },
  { id: 'playground', label: 'Playground', path: '/playground' },
  { id: 'docs', label: 'Tài liệu', path: '/docs' },
]

const Header: React.FC = () => {
  const { user, signOut } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const [showDropdown, setShowDropdown] = useState(false)
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
    navigate('/')
  }

  const isActive = (path: string) => {
    // Special case for "Học tập" - highlight if on /select-language or /learn
    if (path === '/select-language') {
      return location.pathname === '/select-language' || location.pathname.startsWith('/learn')
    }
    return location.pathname === path || location.pathname.startsWith(path + '/')
  }

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
              {NAV_ITEMS.map(item => (
                <Link
                  key={item.id}
                  to={item.path}
                  className={`relative px-5 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 cursor-pointer ${
                    isActive(item.path)
                      ? 'text-brand-teal bg-brand-teal/10'
                      : 'text-slate-300 hover:text-brand-teal hover:bg-white/5'
                  }`}
                >
                  {item.label}
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
          </div>
        </div>
      </div>
    </header>
  )
}

export default Header
