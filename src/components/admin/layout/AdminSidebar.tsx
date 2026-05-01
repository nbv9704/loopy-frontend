import { Link } from 'react-router-dom'
import { FileText, Layout, Menu, Activity, Home } from 'lucide-react'

interface AdminSidebarProps {
  activeSection: string
  onSectionChange: (section: string) => void
}

const AdminSidebar: React.FC<AdminSidebarProps> = ({ activeSection, onSectionChange }) => {
  const sections = [
    {
      id: 'documentation',
      label: 'Tài liệu',
      icon: FileText,
      description: 'Quản lý công nghệ và tài liệu',
    },
    {
      id: 'landing',
      label: 'Landing Page',
      icon: Layout,
      description: 'Nội dung trang chủ',
    },
    {
      id: 'navigation',
      label: 'Điều hướng',
      icon: Menu,
      description: 'Menu và liên kết',
    },
    {
      id: 'audit',
      label: 'Nhật ký',
      icon: Activity,
      description: 'Lịch sử thay đổi',
    },
  ]

  return (
    <aside className="w-64 bg-[#0B0F19] border-r border-white/10 flex flex-col">
      {/* Logo & Title */}
      <div className="p-6 border-b border-white/10">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 bg-gradient-to-br from-brand-teal to-brand-cyan rounded-xl flex items-center justify-center">
            <Layout className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Admin Panel</h1>
          </div>
        </div>
        <p className="text-sm text-slate-400">Quản lý nội dung</p>
      </div>

      {/* Navigation Sections */}
      <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
        {sections.map(section => {
          const Icon = section.icon
          const isActive = activeSection === section.id

          return (
            <button
              key={section.id}
              onClick={() => onSectionChange(section.id)}
              className={`w-full flex items-start gap-3 px-4 py-3 rounded-xl transition-all duration-300 group ${
                isActive
                  ? 'bg-brand-teal/10 text-brand-teal shadow-lg shadow-brand-teal/5'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon
                className={`w-5 h-5 mt-0.5 transition-transform duration-300 ${
                  isActive ? 'scale-110' : 'group-hover:scale-110'
                }`}
              />
              <div className="flex-1 text-left">
                <div className="font-semibold">{section.label}</div>
                <div
                  className={`text-xs mt-0.5 ${isActive ? 'text-brand-teal/70' : 'text-slate-500'}`}
                >
                  {section.description}
                </div>
              </div>
              {isActive && <div className="w-1 h-8 bg-brand-teal rounded-full" />}
            </button>
          )
        })}
      </nav>

      {/* Back to Site Link */}
      <div className="p-4 border-t border-white/10">
        <Link
          to="/"
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all duration-300 group"
        >
          <Home className="w-5 h-5 group-hover:scale-110 transition-transform duration-300" />
          <span className="font-medium">Về trang chủ</span>
        </Link>
      </div>
    </aside>
  )
}

export default AdminSidebar
