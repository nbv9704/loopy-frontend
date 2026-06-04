import { FiLogOut, FiUser } from 'react-icons/fi'
import { useAdminAuth } from '../../../hooks/useAdminAuth'
import { useNavigate } from 'react-router-dom'

export default function Header() {
  const { user, logout } = useAdminAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/admin/login')
    } catch (error) {
      // Even if logout fails, navigate to login
      navigate('/admin/login')
    }
  }

  return (
    <header className="fixed left-64 right-0 top-0 z-10 flex h-16 items-center justify-between border-b border-slate-200 bg-white/95 px-6 shadow-sm backdrop-blur lg:px-8">
      {/* Page Title */}
      <div>
        <h1 className="text-lg font-black text-slate-950">Loopy Admin</h1>
        <p className="text-xs font-medium text-slate-500">Content, lessons, imports and operations</p>
      </div>

      {/* User Menu */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 ring-1 ring-teal-100">
            <FiUser className="h-4 w-4 text-teal-700" />
          </div>
          <div className="text-sm">
            <p className="font-bold text-slate-950">{user?.email}</p>
            <p className="text-xs font-medium capitalize text-slate-500">{user?.role || 'Admin'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-bold text-slate-700 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          aria-label="Logout"
        >
          <FiLogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </button>
      </div>
    </header>
  )
}
