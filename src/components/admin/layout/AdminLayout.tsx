import { ReactNode } from 'react'
import Header from './Header'
import Sidebar from './Sidebar'

interface AdminLayoutProps {
  children: ReactNode
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  return (
    <div className="admin-layout min-h-screen bg-gray-50">
      {/* Sidebar - Fixed left */}
      <Sidebar />

      {/* Header - Fixed top, offset by sidebar width */}
      <Header />

      {/* Main Content - Offset by sidebar and header */}
      <main className="ml-64 pt-16">
        <div className="p-8">{children}</div>
      </main>
    </div>
  )
}
