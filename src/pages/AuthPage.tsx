import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2, Compass, Flame, Lock, LogIn, Mail, Map, Save, User, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'
import SEO from '../components/common/SEO'
import { pageMetadata } from '../utils/seo'

const AuthPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp } = useAuth()

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const locationState = location.state as { from?: { pathname?: string } | string; intendedLanguage?: string } | null
  const fromValue = locationState?.from
  const from = typeof fromValue === 'string' ? fromValue : fromValue?.pathname || '/'

  const contextCopy = (() => {
    if (from.includes('onboarding')) return 'Lưu bài học đầu tiên của bạn và học tiếp đúng lộ trình.'
    if (from.includes('pvp')) return 'Đăng nhập để tham gia thử thách và lưu kết quả.'
    if (from.includes('library') || from.includes('learn')) return 'Đăng nhập để lưu tiến độ và tiếp tục bài đang học.'
    if (from.includes('onboarding')) return 'Tạo lộ trình học phù hợp với mục tiêu của bạn.'
    return 'Tiếp tục hành trình học code của bạn.'
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const res = await signIn(email, password)
        const isCompleted = res.user?.onboardingCompleted
        
        if (isCompleted) {
          navigate(from, { replace: true })
        } else {
          // Pass the intended language route to onboarding if available
          navigate('/onboarding', { 
            state: { intendedLanguage: locationState?.intendedLanguage }
          })
        }
      } else {
        const result = await signUp(email, password, displayName)

        // Check if email confirmation is required (production mode)
        if (result.requiresEmailConfirmation) {
          // Show confirmation message inline in the form
          setError(result.message || t('auth.checkEmail'))
          // Switch to login form
          setIsLogin(true)
          setPassword('') // Clear password for security
        } else {
          // Development mode: auto logged in, go to onboarding
          navigate('/onboarding', { 
            state: { intendedLanguage: locationState?.intendedLanguage }
          })
        }
      }
    } catch (err: any) {
      setError(err.message || t('common.unexpectedError'))
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO {...pageMetadata.auth} />
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0a0e1a] p-4 py-24">
        {/* Ambient background */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-teal/10 rounded-full blur-[120px] animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-cyan/10 rounded-full blur-[100px] animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        </div>

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate('/', { replace: true })}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium">{t('common.back')}</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl backdrop-blur-xl lg:grid-cols-[0.95fr,1.05fr]"
        >
          <div className="relative hidden overflow-hidden border-r border-white/10 bg-gradient-to-br from-brand-teal/[0.12] via-white/[0.04] to-transparent p-10 lg:block">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-teal/20 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-sm font-bold text-brand-teal">
                  <Compass className="h-4 w-4" />
                  Loopy Journey
                </div>
                <h2 className="text-4xl font-black leading-tight text-white">
                  {isLogin ? 'Chào mừng trở lại.' : 'Tạo tài khoản để lưu hành trình.'}
                </h2>
                <p className="mt-5 text-lg leading-8 text-slate-300">{contextCopy}</p>
              </div>

              <div className="mt-10 space-y-4">
                {[
                  { icon: Save, title: 'Lưu tiến độ bài học' },
                  { icon: Map, title: 'Tiếp tục đúng bước tiếp theo' },
                  { icon: Flame, title: 'Theo dõi streak, điểm và thử thách' },
                  { icon: CheckCircle2, title: 'Lộ trình cốt lõi miễn phí để bắt đầu' },
                ].map(item => (
                  <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/20 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-white">{item.title}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8 lg:p-10">
            {/* Header */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-4xl font-black text-white mb-3">
                  {isLogin ? 'Chào mừng trở lại' : 'Tạo tài khoản Loopy'}
                </h1>
                <p className="text-slate-400 text-base leading-6">
                  {contextCopy}
                </p>
              </motion.div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 backdrop-blur-sm border border-red-500/30 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <p className="text-red-400 text-sm">{error}</p>
              </motion.div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              <AnimatePresence mode="wait">
                {!isLogin && (
                  <motion.div
                    key="displayName"
                    initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginBottom: '1.25rem' }}
                    exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                    transition={{ duration: 0.3, ease: 'easeInOut' }}
                    style={{ overflow: 'hidden' }}
                  >
                    <label className="block text-brand-teal text-sm font-semibold mb-2.5 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {t('auth.displayName')}
                    </label>
                    <input
                      type="text"
                      value={displayName}
                      onChange={e => setDisplayName(e.target.value)}
                      className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-brand-teal focus:bg-white/10 focus:outline-none transition-all duration-300"
                      placeholder={t('auth.displayName')}
                      required={!isLogin}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <div>
                <label className="block text-brand-teal text-sm font-semibold mb-2.5 flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  {t('auth.email')}
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-brand-teal focus:bg-white/10 focus:outline-none transition-all duration-300"
                  placeholder="your@email.com"
                  required
                />
              </div>

              <div>
                <label className="block text-brand-teal text-sm font-semibold mb-2.5 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  {t('auth.password')}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-white/5 backdrop-blur-sm border border-white/20 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-500 focus:border-brand-teal focus:bg-white/10 focus:outline-none transition-all duration-300"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full mt-8 px-6 py-4 bg-brand-teal text-[#0a0e1a] font-bold text-lg rounded-xl cursor-pointer hover:shadow-lg hover:shadow-brand-teal/30 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
              >
                <span className="relative z-10 flex items-center gap-3">
                  {loading ? (
                    t('auth.processing')
                  ) : (
                    <>
                      {isLogin ? <LogIn className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
                      {isLogin ? t('auth.login') : t('auth.signup')}
                    </>
                  )}
                </span>
                {/* Liquid fill effect */}
                <div className="absolute inset-0 bg-brand-cyan transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
              </button>
            </form>

            {/* Toggle */}
            <div className="mt-8 text-center">
              <button
                onClick={() => {
                  if (loading) return
                  setIsLogin(!isLogin)
                  setError('')
                }}
                disabled={loading}
                className="text-slate-400 hover:text-brand-teal text-sm transition-all duration-300 cursor-pointer"
              >
                {isLogin ? (
                  <>
                    {t('auth.noAccount')}{' '}
                    <span className="text-brand-teal font-semibold">{t('auth.signupNow')}</span>
                  </>
                ) : (
                  <>
                    {t('auth.alreadyHaveAccount')}{' '}
                    <span className="text-brand-teal font-semibold">{t('auth.loginNow')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Dev Login - only in development */}
            {import.meta.env.DEV && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <button
                  type="button"
                  disabled={loading}
                  onClick={async () => {
                    setLoading(true)
                    setError('')
                    try {
                      const API_URL = import.meta.env.PROD && !import.meta.env.VITE_API_URL 
                        ? (() => { throw new Error('VITE_API_URL is missing in production environment') })() 
                        : (import.meta.env.VITE_API_URL || 'http://localhost:3000')
                      const res = await fetch(`${API_URL}/api/auth/dev-login`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        credentials: 'include',
                      })
                      const data = await res.json()
                      if (data.success) {
                        window.location.href = from
                      } else {
                        setError(data.error || 'Dev login failed')
                      }
                    } catch (err: any) {
                      setError(err.message || 'Dev login failed')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="w-full px-4 py-3 bg-amber-500/15 border border-amber-500/30 text-amber-400 font-semibold rounded-xl cursor-pointer hover:bg-amber-500/25 hover:border-amber-400 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  ⚡ Dev Login (dev-admin)
                </button>
                <p className="text-slate-500 text-xs text-center mt-2">
                  {t('auth.devLoginOnly')}
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default AuthPage
