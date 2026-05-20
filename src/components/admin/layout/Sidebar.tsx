import { NavLink } from 'react-router-dom'
import {
  FiHome,
  FiFileText,
  FiStar,
} from 'react-icons/fi'
import { cn } from '../../../utils/admin/cn'
import logoImg from '../../../assets/images/logos/logo-256x256.png'

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: FiHome },
  { name: 'Bulk Import', href: '/admin/import', icon: FiFileText, section: 'Content' },
  { name: 'New Lesson', href: '/admin/lessons/new', icon: FiStar },
]

export default function Sidebar() {
  return (
    <aside className="w-64 bg-gradient-to-b from-dark to-secondary text-white flex flex-col h-screen fixed left-0 top-0 scrollbar-thin">
      {/* Logo */}
      <div className="p-6 border-b border-white/10">
        <img src={logoImg} alt="Interloop" className="h-8 w-auto" />
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navigation.map((item, index) => {
          const showSection =
            item.section && (index === 0 || navigation[index - 1].section !== item.section)

          return (
            <div key={item.name}>
              {showSection && (
                <div className="px-4 py-2 text-[11px] font-bold uppercase tracking-wider text-white/40 mt-2">
                  {item.section}
                </div>
              )}
              <NavLink
                to={item.href}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all relative',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-dark',
                    isActive
                      ? 'bg-primary/15 text-white font-semibold before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:w-0.5 before:h-3/5 before:bg-primary before:rounded-r'
                      : 'text-white/75 hover:bg-white/10 hover:text-white hover:translate-x-0.5'
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
      <div className="p-4 border-t border-white/10">
        <p className="text-xs text-white/60 text-center">
          &copy; {new Date().getFullYear()} Interloop
        </p>
      </div>
    </aside>
  )
}
