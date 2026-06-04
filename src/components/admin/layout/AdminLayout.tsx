import { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-layout min-h-screen bg-[#f4f7fb] text-slate-900">
      <Sidebar />
      <Header />
      <main className="ml-64 pt-16">
        <div className="mx-auto max-w-[1500px] p-6 lg:p-8">{children}</div>
      </main>
    </div>
  )
}
