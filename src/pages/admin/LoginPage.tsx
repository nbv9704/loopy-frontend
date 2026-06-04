import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiFileText, FiBookOpen, FiShield, FiAlertCircle } from 'react-icons/fi'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import logoImg from '../../assets/images/logos/logo-256x256.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading: authLoading, error: authError } = useAdminAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  // Sync auth error with local error state
  useEffect(() => {
    if (authError) {
      setError(authError)
      setShake(true)
      setTimeout(() => setShake(false), 650)
    }
  }, [authError])

  // Clear error when user starts typing again after an error
  useEffect(() => {
    if (error) {
      setError('')
      setShake(false)
    }
  }, [email, password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShake(false)

    try {
      await login({ email, password, remember })
      // Login successful, navigate to admin dashboard
      navigate('/admin', { replace: true })
    } catch (err: any) {
      const errorMessage =
        err.response?.data?.message || err.message || 'An error occurred. Please try again.'
      setError(errorMessage)
      setShake(true)
      setTimeout(() => setShake(false), 650)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 relative overflow-hidden bg-gray-200 bg-[linear-gradient(rgba(59,130,246,0.05)_2px,transparent_2px),linear-gradient(90deg,rgba(59,130,246,0.05)_2px,transparent_2px),linear-gradient(rgba(59,130,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(59,130,246,0.03)_1px,transparent_1px)] bg-[length:100px_100px,100px_100px,20px_20px,20px_20px] bg-[position:-2px_-2px,-2px_-2px,-1px_-1px,-1px_-1px]">
      {/* Decorative gradient orbs */}
      <div className="absolute -top-48 -left-48 w-96 h-96 bg-[radial-gradient(circle,rgba(59,130,246,0.08)_0%,transparent_70%)] rounded-full pointer-events-none" />
      <div className="absolute -bottom-48 -right-48 w-[500px] h-[500px] bg-[radial-gradient(circle,rgba(37,99,235,0.08)_0%,transparent_70%)] rounded-full pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-[1000px] bg-white rounded-xl shadow-2xl border border-gray-300 overflow-hidden flex relative z-10">
        {/* Left Side - Branding */}
        <div className="hidden md:flex flex-1 bg-white p-12 flex-col justify-between min-h-[600px]">
          {/* Logo & Title */}
          <div>
            <div className="mb-10">
              <img src={logoImg} alt="Loopy" className="h-10 w-auto" />
            </div>

            <h1 className="text-[32px] font-bold gradient-text leading-tight mb-4">
              Loopy Admin
            </h1>
            <p className="text-base text-gray-600 leading-relaxed mb-10">
              Công cụ nội bộ để quản lý bài học, import nội dung và theo dõi vận hành học tập.
            </p>

            {/* Features List */}
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 bg-gradient-to-br from-primary/15 to-accent/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiFileText className="w-[18px] h-[18px] text-secondary" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
                    Lesson Operations
                  </h3>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    Tạo và chỉnh nội dung bài học theo flow See-Change-Build
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 bg-gradient-to-br from-primary/15 to-accent/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiBookOpen className="w-[18px] h-[18px] text-secondary" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
                    Curriculum Control
                  </h3>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    Quản lý chapter, lesson, starter code và test cases
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 bg-gradient-to-br from-primary/15 to-accent/15 rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiShield className="w-[18px] h-[18px] text-secondary" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900 mb-1">Admin-only Access</h3>
                  <p className="text-[13px] text-gray-600 leading-relaxed">
                    Chỉ tài khoản được cấp quyền mới vào được console
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Info */}
          <div className="pt-6 border-t border-gray-200">
            <p className="text-[13px] text-gray-600">
              &copy; {new Date().getFullYear()} Loopy. Internal console.
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 gradient-brand p-12 flex items-center justify-center">
          <div
            className={`w-full max-w-[380px] transition-transform ${shake ? 'animate-shake' : ''}`}
          >
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-[26px] font-bold text-white mb-2">Đăng nhập admin</h2>
              <p className="text-sm text-white/90">
                Nhập tài khoản đã được cấp quyền quản trị.
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-5 p-4 bg-red-500/10 border border-red-500/20 rounded-lg animate-slideDown">
                <div className="flex items-start gap-2">
                  <FiAlertCircle className="w-5 h-5 text-white flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-white font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-white mb-2">
                  Email
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="admin@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white/95 border border-white/30 rounded-lg text-sm text-gray-900 outline-none transition-all focus:border-white/60 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.1)] focus:bg-white"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-white mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white/95 border border-white/30 rounded-lg text-sm text-gray-900 outline-none transition-all focus:border-white/60 focus:shadow-[0_0_0_3px_rgba(255,255,255,0.1)] focus:bg-white"
                  />
                </div>
              </div>

              {/* Remember Me */}
              <div>
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={e => setRemember(e.target.checked)}
                    className="w-4 h-4 mr-2 accent-primary cursor-pointer"
                  />
                  <span className="text-sm text-white/90">Ghi nhớ đăng nhập trên thiết bị này</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={authLoading}
                className="w-full px-4 py-2.5 text-white font-medium text-sm border-none rounded-lg cursor-pointer bg-white/20 backdrop-blur-[10px] transition-all hover:bg-white/30 hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(0,0,0,0.15)] active:bg-white/25 active:translate-y-0 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {authLoading ? 'Đang xử lý...' : 'Đăng nhập'}
              </button>
            </form>

            {/* Footer Links */}
            <div className="mt-8 pt-8 border-t border-white/20">
              <p className="text-sm text-white/90 text-center">
                <a
                  href="/"
                  className="text-white no-underline font-medium hover:underline"
                >
                  ← Về trang Loopy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
