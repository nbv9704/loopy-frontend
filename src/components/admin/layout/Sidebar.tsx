import { NavLink } from 'react-router-dom'
import {
  FiHome,
  FiFileText,
  FiBookOpen,
  FiActivity,
  FiStar,
  FiClock,
  FiUpload,
} from 'react-icons/fi'
import { cn } from '../../../utils/admin/cn'
import logoImg from '../../../assets/images/logos/logo-256x256.png'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: FiHome },
  { name: 'Lessons', href: '/admin/lessons', icon: FiBookOpen, section: 'Content' },
  { name: 'Content Manager', href: '/admin/content', icon: FiFileText },
  { name: 'Bulk Import', href: '/admin/import', icon: FiFileText },
  { name: 'Import History', href: '/admin/import-history', icon: FiUpload },
  { name: 'New Lesson', href: '/admin/lessons/new', icon: FiStar },
  { name: 'Submissions', href: '/admin/submissions', icon: FiActivity, section: 'Monitoring' },
  { name: 'Audit Logs', href: '/admin/audit-logs', icon: FiClock, section: 'System' },
]

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col border-r border-slate-200 bg-white text-slate-900 shadow-sm scrollbar-thin">
      {/* Logo */}
      <div className="border-b border-slate-200 p-6">
        <img src={logoImg} alt="Loopy Admin" className="h-8 w-auto" />
        <p className="mt-3 text-xs font-bold uppercase tracking-widest text-slate-500">Admin Console</p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {navigation.map((item, index) => {
          const showSection =
            item.section && (index === 0 || navigation[index - 1].section !== item.section)

          return (
            <div key={item.name}>
              {showSection && (
                <div className="mt-3 px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  {item.section}
                </div>
              )}
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'relative flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-all',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2',
                    isActive
                      ? 'bg-teal-50 text-teal-800 shadow-sm ring-1 ring-teal-100 before:absolute before:left-0 before:top-1/2 before:h-3/5 before:w-0.5 before:-translate-y-1/2 before:rounded-r before:bg-teal-600'
                      : 'text-slate-600 hover:translate-x-0.5 hover:bg-slate-50 hover:text-slate-950'
                  )
                }
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                <span>{item.name}</span>
              </NavLink>
            </div>
          )
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-slate-200 p-4">
        <p className="text-center text-xs text-slate-400">
          &copy; {new Date().getFullYear()} Loopy
        </p>
      </div>
    </aside>
  )
}
