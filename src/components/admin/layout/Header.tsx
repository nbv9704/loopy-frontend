import AdminButton from '../AdminButton'
import { FiLogOut, FiMenu, FiUser } from 'react-icons/fi'
import { useAdminAuth } from '../../../hooks/useAdminAuth'
import { useNavigate } from 'react-router-dom'

export default function Header({
  onOpenNavigation,
  navigationOpen,
}: {
  onOpenNavigation: () => void
  navigationOpen: boolean
}) {
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
    <header className="fixed left-0 right-0 top-0 z-10 flex h-16 items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-4 shadow-sm backdrop-blur sm:px-6 lg:left-64 lg:px-8">
      {/* Page Title */}
      <div className="flex min-w-0 items-center gap-2">
        <AdminButton
          size="icon"
          className="lg:hidden"
          type="button"
          onClick={onOpenNavigation}
          aria-label="Mở điều hướng quản trị"
          aria-haspopup="dialog"
          aria-controls="admin-navigation"
          aria-expanded={navigationOpen}
        >
          <FiMenu aria-hidden="true" />
        </AdminButton>
        <div className="min-w-0">
          <h1 className="text-lg font-black text-slate-950">Loopy Admin</h1>
          <p className="hidden text-xs font-medium text-slate-500 sm:block">
            Content, lessons, imports and operations
          </p>
        </div>
      </div>

      {/* User Menu */}
      <div className="flex items-center gap-4">
        <div className="hidden items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 md:flex">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-teal-50 ring-1 ring-teal-100">
            <FiUser className="h-4 w-4 text-teal-700" />
          </div>
          <div className="text-sm">
            <p className="max-w-[180px] truncate font-bold text-slate-950">{user?.email}</p>
            <p className="text-xs font-medium capitalize text-slate-500">{user?.role || 'Admin'}</p>
          </div>
        </div>

        <AdminButton variant="danger" onClick={handleLogout} aria-label="Logout">
          <FiLogOut className="w-4 h-4" />
          <span>Đăng xuất</span>
        </AdminButton>
      </div>
    </header>
  )
}
