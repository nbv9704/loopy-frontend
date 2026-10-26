import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Compass,
  Flame,
  Lock,
  LogIn,
  Mail,
  Map,
  Save,
  User,
  UserPlus,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useContentPreloader } from '../hooks/useContentPreloader'
import { LoadingScreen } from '../components/LoadingScreen'
import { useAuth } from '../contexts/AuthContext'
import SEO from '../components/common/SEO'
import { pageMetadata } from '../utils/seo'
import { api } from '../lib/api'
import { useAsyncAction } from '../hooks/useAsyncAction'
import { getOnboardingDraft } from '../features/onboarding/onboarding.types'
import { saveOnboarding } from '../features/onboarding/onboarding.service'
import { getAuthDestination } from '../features/auth/authDestination'
import type { UserProfileSnapshot } from '../features/auth/profileSnapshot'

type AuthOutcome =
  | { to: string; profile?: UserProfileSnapshot; fullReload?: boolean; intendedLanguage?: string }
  | { confirmation: string }
  | null

const AuthForm: React.FC = () => {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()
  const { user, signIn, signUp, refreshUser } = useAuth()

  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const { pending: loading, run } = useAsyncAction()
  const [notice, setNotice] = useState('')
  const [draftOwner, setDraftOwner] = useState<string | null>(null)

  // Define all content keys needed for this page
  const contentKeys = [
    'auth.ctx.onboarding',
    'auth.ctx.pvp',
    'auth.ctx.learn',
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
  const { content, initialLoading: contentLoading } = useContentPreloader(contentKeys, i18n.language)

  // Show loading screen while content is being fetched
  if (contentLoading) {
    return <LoadingScreen />
  }

  // Extract content values with fallbacks
  const ctxOnboarding =
    content['auth.ctx.onboarding'] || 'Lưu bài học đầu tiên của bạn và học tiếp đúng lộ trình.'
  const ctxPvp = content['auth.ctx.pvp'] || 'Đăng nhập để tham gia thử thách và lưu kết quả.'
  const ctxLearn = content['auth.ctx.learn'] || 'Đăng nhập để lưu tiến độ và tiếp tục bài đang học.'
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
    from?: { pathname?: string; search?: string; hash?: string } | string
    intendedLanguage?: string
    onboardingDraft?: {
      preferredLanguage?: string
      learningGoal?: string
      experienceLevel?: string
      currentPathId?: string
    }
  } | null
  const from = getAuthDestination(locationState?.from)
  const draft = getOnboardingDraft(locationState?.onboardingDraft)
  const canResumeDraft = Boolean(draft && draftOwner && user?.id === draftOwner)

  const contextCopy = (() => {
    if (from.includes('onboarding')) return ctxOnboarding
    if (from.includes('pvp') || from.includes('/practice/compete')) return ctxPvp
    if (from.includes('library') || from.includes('learn')) return ctxLearn
    return ctxDefault
  })()

  const finishDraft = async (userId: string): Promise<AuthOutcome> => {
    if (!draft) return null
    const profile = await saveOnboarding(draft, userId)
    return { to: `/library/${draft.preferredLanguage}`, profile }
  }

  const onSuccess = (outcome: AuthOutcome) => {
    if (!outcome) return
    if ('confirmation' in outcome) {
      setNotice(outcome.confirmation)
      setIsLogin(true)
      setPassword('')
      return
    }
    if (outcome.profile) void refreshUser(outcome.profile)
    if (outcome.fullReload) window.location.assign(outcome.to)
    else
      navigate(outcome.to, { replace: true, state: { intendedLanguage: outcome.intendedLanguage } })
  }
  const onError = (error: unknown) =>
    setError(error instanceof Error ? error.message : t('common.unexpectedError'))

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setNotice('')
    void run<AuthOutcome>(
      async isCurrent => {
        const result = isLogin
          ? await signIn(email, password)
          : await signUp(email, password, displayName)
        if (!isCurrent()) return null
        if (result.requiresEmailConfirmation)
          return { confirmation: result.message || t('auth.checkEmail') }
        if (draft) {
          const userId = result.user?.id
          if (typeof userId !== 'string')
            throw new Error('Không xác nhận được tài khoản để lưu lộ trình.')
          setDraftOwner(userId)
          return finishDraft(userId)
        }
        return {
          to: isLogin && result.user?.onboardingCompleted ? from : '/onboarding',
          intendedLanguage: locationState?.intendedLanguage,
        }
      },
      { onSuccess, onError }
    )
  }

  const retryDraft = () => {
    if (!canResumeDraft || !draftOwner) return
    setError('')
    void run(() => finishDraft(draftOwner), { onSuccess, onError })
  }

  const handleDevLogin = () => {
    setError('')
    void run<AuthOutcome>(
      async isCurrent => {
        const response = await api.request<{ user: { id: string } }>('/api/auth/dev-login', {
          method: 'POST',
        })
        if (!isCurrent()) return null
        if (!response.success) throw new Error(response.error?.message || 'Dev login failed')
        if (draft) {
          if (!response.data?.user?.id)
            throw new Error('Không xác nhận được tài khoản để lưu lộ trình.')
          const outcome = await finishDraft(response.data.user.id)
          return outcome && 'to' in outcome ? { ...outcome, fullReload: true } : null
        }
        return { to: from, fullReload: true }
      },
      { onSuccess, onError }
    )
  }

  return (
    <>
      <SEO {...pageMetadata.auth} />
      <div className="loopy-page relative flex min-h-screen items-center justify-center overflow-hidden p-4 py-24">
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
          className="loopy-subtle-button absolute left-6 top-6 z-20 flex items-center gap-2 rounded-xl border px-4 py-2.5 transition-all duration-300 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium">{t('common.back')}</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="loopy-card relative z-10 grid grid-cols-1 w-full max-w-6xl overflow-hidden rounded-[2rem] border shadow-xl lg:grid-cols-[0.95fr_1.05fr]"
        >
          <div className="relative hidden overflow-hidden border-r loopy-border bg-gradient-to-br from-brand-teal/10 via-[color:var(--loopy-surface)] to-transparent p-10 lg:block">
            <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-brand-teal/10 blur-3xl" />
            <div className="relative flex h-full flex-col justify-between">
              <div>
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-sm font-bold text-brand-teal">
                  <Compass className="h-4 w-4" />
                  Loopy Journey
                </div>
                <h2 className="loopy-heading text-4xl font-black leading-tight">
                  {isLogin ? titleLogin1 : titleSignup1}
                </h2>
                <p className="loopy-body mt-5 text-lg leading-8">{contextCopy}</p>
              </div>

              <div className="mt-10 space-y-4">
                {[
                  { icon: Save, title: feat1 },
                  { icon: Map, title: feat2 },
                  { icon: Flame, title: feat3 },
                  { icon: CheckCircle2, title: feat4 },
                ].map(item => (
                  <div
                    key={item.title}
                    className="loopy-card-soft flex items-center gap-3 rounded-2xl border p-4"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
                      <item.icon className="h-5 w-5" />
                    </div>
                    <span className="font-semibold loopy-heading">{item.title}</span>
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
                <h1 className="loopy-heading mb-3 text-4xl font-black">
                  {isLogin ? titleLogin2 : titleSignup2}
                </h1>
                <p className="loopy-body text-base leading-6">{contextCopy}</p>
              </motion.div>
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                role="alert"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-red-700 text-sm">{error}</p>
              </motion.div>
            )}

            {notice && (
              <div
                role="status"
                className="mb-6 rounded-xl border border-teal-200 bg-teal-50 p-4 text-sm text-teal-900"
              >
                {notice}
              </div>
            )}

            {/* Form */}
            {canResumeDraft ? (
              <div className="space-y-4">
                <p className="loopy-body">
                  {i18n.language.startsWith('vi')
                    ? 'Bạn đã đăng nhập. Lựa chọn lộ trình vẫn được giữ để thử lưu lại.'
                    : 'You are signed in. Your selected path is preserved so you can retry saving.'}
                </p>
                <button
                  type="button"
                  disabled={loading}
                  onClick={retryDraft}
                  className="w-full rounded-xl bg-brand-teal px-6 py-4 font-bold text-slate-950 disabled:opacity-50"
                >
                  {loading
                    ? t('auth.processing')
                    : i18n.language.startsWith('vi')
                      ? 'Thử lại lưu lộ trình'
                      : 'Retry saving your path'}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <fieldset disabled={loading} className="min-w-0 space-y-5">
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
                        <label
                          htmlFor="auth-display-name"
                          className="block text-brand-teal text-sm font-semibold mb-2.5 flex items-center gap-2"
                        >
                          <User className="w-4 h-4" />
                          {t('auth.displayName')}
                        </label>
                        <input
                          id="auth-display-name"
                          autoComplete="nickname"
                          type="text"
                          value={displayName}
                          onChange={e => setDisplayName(e.target.value)}
                          className="w-full rounded-xl border loopy-border loopy-surface px-4 py-3.5 text-[color:var(--loopy-text)] placeholder:text-slate-400 transition-all duration-300 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
                          placeholder={t('auth.displayName')}
                          required={!isLogin}
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div>
                    <label
                      htmlFor="auth-email"
                      className="block text-brand-teal text-sm font-semibold mb-2.5 flex items-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      {t('auth.email')}
                    </label>
                    <input
                      id="auth-email"
                      autoComplete="email"
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full rounded-xl border loopy-border loopy-surface px-4 py-3.5 text-[color:var(--loopy-text)] placeholder:text-slate-400 transition-all duration-300 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
                      placeholder="your@email.com"
                      required
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="auth-password"
                      className="block text-brand-teal text-sm font-semibold mb-2.5 flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      {t('auth.password')}
                    </label>
                    <input
                      id="auth-password"
                      autoComplete={isLogin ? 'current-password' : 'new-password'}
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="w-full rounded-xl border loopy-border loopy-surface px-4 py-3.5 text-[color:var(--loopy-text)] placeholder:text-slate-400 transition-all duration-300 focus:border-brand-teal focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
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
                          {isLogin ? (
                            <LogIn className="w-5 h-5" />
                          ) : (
                            <UserPlus className="w-5 h-5" />
                          )}
                          {isLogin ? t('auth.login') : t('auth.signup')}
                        </>
                      )}
                    </span>
                    <div className="absolute inset-0 bg-brand-cyan transform -translate-x-full group-hover:translate-x-0 transition-transform duration-500 ease-out" />
                  </button>
                </fieldset>
              </form>
            )}

            {/* Toggle */}
            {!canResumeDraft && (
              <div className="mt-8 text-center">
                <button
                  onClick={() => {
                    if (loading) return
                    setIsLogin(!isLogin)
                    setError('')
                    setNotice('')
                  }}
                  disabled={loading}
                  className="loopy-muted cursor-pointer text-sm transition-all duration-300 hover:text-brand-teal"
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
            )}

            {/* Dev Login - only in development */}
            {!canResumeDraft &&
              import.meta.env.DEV &&
              import.meta.env.VITE_ENABLE_DEV_LOGIN === 'true' && (
                <div className="mt-6 border-t loopy-border pt-6">
                  <button
                    type="button"
                    disabled={loading}
                    onClick={handleDevLogin}
                    className="w-full px-4 py-3 bg-amber-50 border border-amber-200 text-amber-700 font-semibold rounded-xl cursor-pointer hover:bg-amber-100 hover:border-amber-300 transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    ⚡ Dev Login (dev-admin)
                  </button>
                  <p className="loopy-muted mt-2 text-center text-xs">{t('auth.devLoginOnly')}</p>
                </div>
              )}
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default function AuthPage() {
  const location = useLocation()
  return <AuthForm key={location.key} />
}
