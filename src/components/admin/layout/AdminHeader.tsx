import { useAuth } from '../../../contexts/AuthContext'
import { LogOut, User, Shield } from 'lucide-react'

const AdminHeader: React.FC = () => {
  const { user, signOut } = useAuth()

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <header className="bg-[#0B0F19] border-b border-white/10 px-8 py-4 sticky top-0 z-10">
      {/* Subtle gradient line */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-teal/50 to-transparent" />

      <div className="flex items-center justify-between">
        {/* Left: Title & Breadcrumbs */}
        <div>
          <div className="flex items-center gap-3 mb-1">
            <Shield className="w-6 h-6 text-brand-teal" />
            <h2 className="text-2xl font-bold text-white">Quản lý nội dung</h2>
          </div>
          <p className="text-sm text-slate-400">Cập nhật và quản lý nội dung website</p>
        </div>

        {/* Right: User Info & Actions */}
        <div className="flex items-center gap-4">
          {/* User Info Card */}
          <div className="flex items-center gap-3 px-4 py-2.5 bg-white/5 rounded-xl border border-white/10 hover:border-brand-teal/30 transition-all duration-300">
            <div className="w-9 h-9 bg-gradient-to-br from-brand-teal to-brand-cyan rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg ring-2 ring-brand-teal/20">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <User className="w-5 h-5" />
              )}
            </div>
            <div className="text-left">
              <p className="text-sm font-semibold text-white">{user?.displayName || 'Admin'}</p>
              <p className="text-xs text-slate-400">{user?.email}</p>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleSignOut}
            className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all duration-300 group"
            title="Đăng xuất"
          >
            <LogOut className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
          </button>
        </div>
      </div>
    </header>
  )
}

export default AdminHeader
