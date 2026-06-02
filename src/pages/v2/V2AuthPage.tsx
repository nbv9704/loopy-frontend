import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertCircle, ArrowLeft, CheckCircle2, Compass, Flame, Lock, LogIn, Mail, Map, Save, User, UserPlus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useContentPreloader } from '../../hooks/useContentPreloader'
import { LoadingScreen } from '../../components/v2/LoadingScreen'
import { useAuth } from '../../contexts/AuthContext'
import SEO from '../../components/common/SEO'
import { pageMetadata } from '../../utils/seo'
import { api } from '../../lib/api'

const V2AuthPage: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, signUp, refreshUser } = useAuth()

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // Define all content keys needed for this page
  const contentKeys = [
    'auth.ctx.onboarding',
    'auth.ctx.pvp',
    'auth.ctx.learn',
    'auth.ctx.onboarding2',
    'auth.ctx.default',
    'auth.title.login1',
    'auth.title.signup1',
    'auth.title.login2',
    'auth.title.signup2',
    'auth.feat1',
    'auth.feat2',
    'auth.feat3',
    'auth.feat4',
  ]

  // Preload all content at once
  const { content, loading: contentLoading } = useContentPreloader(contentKeys, i18n.language)

  // Show loading screen while content is being fetched
  if (contentLoading) {
    return <LoadingScreen message="Loading auth page..." />
  }

  // Extract content values with fallbacks
  const ctxOnboarding = content['auth.ctx.onboarding'] || 'Lưu bài học đầu tiên của bạn và học tiếp đúng lộ trình.'
  const ctxPvp = content['auth.ctx.pvp'] || 'Đăng nhập để tham gia thử thách và lưu kết quả.'
  const ctxLearn = content['auth.ctx.learn'] || 'Đăng nhập để lưu tiến độ và tiếp tục bài đang học.'
  const ctxOnboarding2 = content['auth.ctx.onboarding2'] || 'Tạo lộ trình học phù hợp với mục tiêu của bạn.'
  const ctxDefault = content['auth.ctx.default'] || 'Tiếp tục hành trình học code của bạn.'
  const titleLogin1 = content['auth.title.login1'] || 'Chào mừng trở lại.'
  const titleSignup1 = content['auth.title.signup1'] || 'Tạo tài khoản để lưu hành trình.'
  const titleLogin2 = content['auth.title.login2'] || 'Chào mừng trở lại'
  const titleSignup2 = content['auth.title.signup2'] || 'Tạo tài khoản Loopy'
  const feat1 = content['auth.feat1'] || 'Lưu tiến độ bài học'
  const feat2 = content['auth.feat2'] || 'Tiếp tục đúng bước tiếp theo'
  const feat3 = content['auth.feat3'] || 'Theo dõi streak, điểm và thử thách'
  const feat4 = content['auth.feat4'] || 'Lộ trình cốt lõi miễn phí để bắt đầu'

  const locationState = location.state as {
    from?: { pathname?: string } | string
    intendedLanguage?: string
    onboardingDraft?: {
      preferredLanguage?: 'python' | 'javascript' | 'cpp'
      learningGoal?: string
      experienceLevel?: string
    }
  } | null
  const fromValue = locationState?.from
  const from = typeof fromValue === 'string' ? fromValue : fromValue?.pathname || '/'

  const contextCopy = (() => {
    if (from.includes('onboarding')) return ctxOnboarding
    if (from.includes('pvp')) return ctxPvp
    if (from.includes('library') || from.includes('learn')) return ctxLearn
    if (from.includes('onboarding')) return ctxOnboarding2
    return ctxDefault
  })()

  const finishOnboardingDraft = async () => {
    const draft = locationState?.onboardingDraft
    if (!draft?.preferredLanguage || !draft.learningGoal || !draft.experienceLevel) return false

    const response = await api.updateProfile({
      preferredLanguage: draft.preferredLanguage,
      learningGoal: draft.learningGoal,
      experienceLevel: draft.experienceLevel,
      onboardingCompleted: true,
    })

    if (!response.success) {
      throw new Error(response.error?.message || 'Không lưu được onboarding. Vui lòng thử lại.')
    }

    await refreshUser()
    navigate(`/library/${draft.preferredLanguage}`, { replace: true })
    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        const res = await signIn(email, password)
        const savedDraft = await finishOnboardingDraft()
        if (savedDraft) return

        const isCompleted = res.user?.onboardingCompleted
        
        if (isCompleted) {
          navigate(from, { replace: true })
        } else {
          navigate('/onboarding', { 
            state: { intendedLanguage: locationState?.intendedLanguage }
          })
        }
      } else {
        const result = await signUp(email, password, displayName)

        if (result.requiresEmailConfirmation) {
          setError(result.message || t('auth.checkEmail'))
          setIsLogin(true)
          setPassword('')
        } else {
          const savedDraft = await finishOnboardingDraft()
          if (savedDraft) return

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
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f7fbff] p-4 py-24">
        {/* Ambient background - light theme */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-brand-teal/5 rounded-full blur-[120px] animate-pulse" />
          <div
            className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-brand-cyan/5 rounded-full blur-[100px] animate-pulse"
            style={{ animationDelay: '1s' }}
          />
        </div>

        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          onClick={() => navigate('/', { replace: true })}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-200 hover:border-slate-300 transition-all duration-300 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium">{t('common.back')}</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 grid w-full max-w-6xl overflow-hidden rounded-[2rem] border border-slate-200 bg-white shadow-xl lg:grid-cols-[0.95fr,1.05fr]"
        >
          <div className="relative hidden overflow-hidden border-r border-slate-200 bg-gradient-to-br from-brand-teal/10 via-white to-transparent p-10 lg:block">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-teal/10 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-sm font-bold text-brand-teal">
                  <Compass className="h-4 w-4" />
                  Loopy Journey
                </div>
                <h2 className="text-4xl font-black leading-tight text-slate-900">
                  {isLogin ? titleLogin1 : titleSignup1}
                </h2>
                <p className="mt-5 text-lg leading-8 text-slate-600">{contextCopy}</p>
              </div>

              <div className="mt-10 space-y-4">
                {[
                  { icon: Save, title: feat1 },
                  { icon: Map, title: feat2 },
                  { icon: Flame, title: feat3 },
                  { icon: CheckCircle2, title: feat4 },
                ].map(item => (
                  <div key={item.title} className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="font-semibold text-slate-900">{item.title}</span>
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
                <h1 className="text-4xl font-black text-slate-900 mb-3">
                  {isLogin ? titleLogin2 : titleSignup2}
                </h1>
                <p className="text-slate-600 text-base leading-6">
                  {contextCopy}
                </p>
              </motion.div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
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
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-brand-teal focus:bg-white focus:outline-none transition-all duration-300"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-brand-teal focus:bg-white focus:outline-none transition-all duration-300"
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
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3.5 text-slate-900 placeholder:text-slate-400 focus:border-brand-teal focus:bg-white focus:outline-none transition-all duration-300"
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="relative w-full mt-8 px-6 py-4 bg-brand-teal text-white font-bold text-lg rounded-xl cursor-pointer hover:shadow-lg hover:shadow-brand-teal/30 transition-all duration-300 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed overflow-hidden group"
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
                className="text-slate-600 hover:text-brand-teal text-sm transition-all duration-300 cursor-pointer"
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
              <div className="mt-6 pt-6 border-t border-slate-200">
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
                        const draft = locationState?.onboardingDraft
                        if (draft?.preferredLanguage && draft.learningGoal && draft.experienceLevel) {
                          const response = await api.updateProfile({
                            preferredLanguage: draft.preferredLanguage,
                            learningGoal: draft.learningGoal,
                            experienceLevel: draft.experienceLevel,
                            onboardingCompleted: true,
                          })
                          if (!response.success) {
                            throw new Error(response.error?.message || 'Không lưu được onboarding. Vui lòng thử lại.')
                          }
                          window.location.href = `/library/${draft.preferredLanguage}`
                        } else {
                          window.location.href = from
                        }
                      } else {
                        setError(data.error || 'Dev login failed')
                      }
                    } catch (err: any) {
                      setError(err.message || 'Dev login failed')
                    } finally {
                      setLoading(false)
                    }
                  }}
                  className="w-full px-4 py-3 bg-amber-50 border border-amber-200 text-amber-700 font-semibold rounded-xl cursor-pointer hover:bg-amber-100 hover:border-amber-300 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
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

export default V2AuthPage
