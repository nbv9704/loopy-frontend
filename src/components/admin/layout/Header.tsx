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
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 fixed top-0 right-0 left-64 z-10">
      {/* Page Title */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>

      {/* User Menu */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-accent rounded-full flex items-center justify-center">
            <FiUser className="w-4 h-4 text-white" />
          </div>
          <div className="text-sm">
            <p className="font-semibold text-gray-900">{user?.email}</p>
            <p className="text-xs text-gray-500 capitalize">{user?.role || 'Admin'}</p>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
          aria-label="Logout"
        >
          <FiLogOut className="w-4 h-4" />
          <span>Logout</span>
        </button>
      </div>
    </header>
  )
}
