import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { LogIn, UserPlus, Mail, Lock, User, AlertCircle, ArrowLeft } from 'lucide-react'
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

  const from = (location.state as any)?.from?.pathname || '/playground'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
        navigate(from, { replace: true })
      } else {
        const result = await signUp(email, password, displayName)

        // Check if email confirmation is required (production mode)
        if (result.requiresEmailConfirmation) {
          setError('') // Clear any errors
          // Show success message
          alert(result.message || 'Vui lòng kiểm tra email để xác nhận tài khoản')
          // Switch to login form
          setIsLogin(true)
          setPassword('') // Clear password for security
        } else {
          // Development mode: auto logged in
          navigate(from, { replace: true })
        }
      }
    } catch (err: any) {
      setError(err.message || 'Đã xảy ra lỗi')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <SEO {...pageMetadata.auth} />
      <div className="min-h-screen bg-[#0a0e1a] flex items-center justify-center p-4 relative overflow-hidden">
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
          onClick={() => navigate(-1)}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2.5 bg-white/5 backdrop-blur-sm border border-white/10 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-300 group"
        >
          <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
          <span className="font-medium">{t('common.back')}</span>
        </motion.button>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md relative z-10"
        >
          <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8 shadow-2xl">
            {/* Header */}
            <div className="text-center mb-10">
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2 }}
              >
                <h1 className="text-4xl font-bold text-white mb-3">
                  {isLogin ? t('auth.login') : t('auth.signup')}
                </h1>
                <p className="text-slate-400 text-base">
                  {isLogin ? t('auth.welcomeBack') : t('auth.createAccount')}
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
                  setIsLogin(!isLogin)
                  setError('')
                }}
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
          </div>
        </motion.div>
      </div>
    </>
  )
}

export default AuthPage
