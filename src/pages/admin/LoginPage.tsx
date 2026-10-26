import AdminButton from '../../components/admin/AdminButton'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { FiMail, FiLock, FiFileText, FiBookOpen, FiShield, FiAlertCircle } from 'react-icons/fi'
import { useAdminAuth } from '../../hooks/useAdminAuth'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import logoImg from '../../assets/images/logos/logo-256x256.png'

export default function LoginPage() {
  const navigate = useNavigate()
  const { login, isLoading: authLoading } = useAdminAuth()
  const { pending, run } = useAsyncAction()
  const busy = authLoading || pending
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [remember, setRemember] = useState(false)
  const [error, setError] = useState('')
  const [shake, setShake] = useState(false)

  useEffect(() => {
    if (!shake) return
    const timer = setTimeout(() => setShake(false), 650)
    return () => clearTimeout(timer)
  }, [shake])

  // Clear error when user starts typing again after an error
  useEffect(() => {
    if (error) {
      setError('')
      setShake(false)
    }
  }, [email, password])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setShake(false)

    void run(() => login({ email, password, remember }), {
      onSuccess: () => navigate('/admin', { replace: true }),
      onError: error => {
        setError(error instanceof Error ? error.message : 'Không đăng nhập được. Vui lòng thử lại.')
        setShake(true)
      },
    })
  }

  return (
    <div
      className="relative flex min-h-screen items-center justify-center bg-slate-50 p-4 text-slate-900 sm:p-8"
      style={{ colorScheme: 'light' }}
    >
      {/* Login Card */}
      <div className="relative z-10 flex w-full min-w-0 max-w-4xl overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        {/* Left Side - Branding */}
        <div className="hidden min-w-0 flex-1 flex-col justify-between border-r border-teal-100 bg-teal-50/60 p-10 lg:flex">
          {/* Logo & Title */}
          <div>
            <div className="mb-10">
              <img src={logoImg} alt="Loopy" className="h-10 w-auto" />
            </div>

            <p className="mb-4 text-3xl font-bold leading-tight text-teal-800">Loopy Admin</p>
            <p className="text-base text-gray-600 leading-relaxed mb-10">
              Công cụ nội bộ để quản lý bài học, import nội dung và theo dõi vận hành học tập.
            </p>

            {/* Features List */}
            <div className="flex flex-col gap-4">
              <div className="flex items-start gap-3.5">
                <div className="w-9 h-9 border border-teal-100 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                  <FiFileText className="w-[18px] h-[18px] text-teal-700" />
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
                  <FiBookOpen className="w-[18px] h-[18px] text-teal-700" />
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
                  <FiShield className="w-[18px] h-[18px] text-teal-700" />
                </div>
                <div>
                  <h3 className="text-[15px] font-semibold text-gray-900 mb-1">
                    Admin-only Access
                  </h3>
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
        <div className="flex min-w-0 flex-1 items-center justify-center bg-white p-6 sm:p-10">
          <div
            className={`w-full max-w-[380px] transition-transform ${shake ? 'animate-shake' : ''}`}
          >
            {/* Header */}
            <div className="mb-8">
              <h1 className="mb-2 text-2xl font-bold tracking-tight text-slate-950">
                Đăng nhập admin
              </h1>
              <p className="text-sm text-slate-500">Nhập tài khoản đã được cấp quyền quản trị.</p>
            </div>

            {/* Error Message */}
            {error && (
              <div
                role="alert"
                className="mb-5 p-4 bg-red-50 border border-red-200 rounded-lg animate-slideDown"
              >
                <div className="flex items-start gap-2">
                  <FiAlertCircle className="w-5 h-5 text-red-700 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-800 font-medium">{error}</p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} aria-busy={busy} className="space-y-5">
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <FiMail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    disabled={busy}
                    onChange={e => setEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="admin@example.com"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-gray-900 outline-none transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-2">
                  Mật khẩu
                </label>
                <div className="relative">
                  <FiLock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    disabled={busy}
                    onChange={e => setPassword(e.target.value)}
                    required
                    autoComplete="current-password"
                    placeholder="Nhập mật khẩu"
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-200 rounded-lg text-sm text-gray-900 outline-none transition-all focus:border-teal-600 focus:ring-2 focus:ring-teal-600/15"
                  />
                </div>
              </div>

              {/* Remember Me */}
              <div>
                <label className="flex items-center cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={remember}
                    disabled={busy}
                    onChange={e => setRemember(e.target.checked)}
                    className="mr-2 h-4 w-4 shrink-0 accent-teal-700"
                  />
                  <span className="text-sm text-slate-500">
                    Ghi nhớ đăng nhập trên thiết bị này
                  </span>
                </label>
              </div>

              {/* Submit Button */}
              <AdminButton variant="primary" type="submit" disabled={busy} className="w-full">
                {busy ? 'Đang xử lý...' : 'Đăng nhập'}
              </AdminButton>
            </form>

            {/* Footer Links */}
            <div className="mt-8 pt-8 border-t border-slate-200">
              <p className="text-sm text-slate-500 text-center">
                <a href="/" className="text-slate-700 no-underline font-medium hover:underline">
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
