import { ReactNode, useCallback, useEffect, useLayoutEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import Header from './Header'
import Sidebar from './Sidebar'
import AdminNavigationDrawer from './AdminNavigationDrawer'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const [navigationOpen, setNavigationOpen] = useState(false)
  const location = useLocation()
  const closeNavigation = useCallback(() => setNavigationOpen(false), [])
  useLayoutEffect(closeNavigation, [location.key, closeNavigation])
  useEffect(() => {
    const desktop = window.matchMedia('(min-width: 1024px)')
    const resize = () => {
      if (desktop.matches) closeNavigation()
    }
    desktop.addEventListener('change', resize)
    return () => desktop.removeEventListener('change', resize)
  }, [closeNavigation])
  return (
    <div
      className="admin-layout min-h-screen bg-[#f4f7fb] text-slate-900"
      style={{ colorScheme: 'light' }}
    >
      <Sidebar />
      <AdminNavigationDrawer open={navigationOpen} onClose={closeNavigation} />
      <Header onOpenNavigation={() => setNavigationOpen(true)} navigationOpen={navigationOpen} />
      <main className="min-w-0 pt-16 lg:ml-64">
        <div className="mx-auto max-w-[1500px] p-4 sm:p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
