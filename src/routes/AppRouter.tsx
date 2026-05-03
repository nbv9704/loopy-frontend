import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import AuthPage from '../pages/AuthPage'
import DocsPage from '../pages/DocsPage'
import LanguageSelectorPage from '../pages/LanguageSelectorPage'
import LearnPage from '../pages/LearnPage'
import PlaygroundPage from '../pages/PlaygroundPage'
import SettingsPage from '../pages/SettingsPage'
import PvPLobbyPage from '../pages/PvPLobbyPage'
import PvPMatchPage from '../pages/PvPMatchPage'
import ProtectedRoute from '../components/admin/ProtectedRoute'
import AdminLayout from '../components/admin/layout/AdminLayout'

// Lazy load admin pages for code splitting
const AdminLoginPage = lazy(() => import('../pages/admin/LoginPage'))
const AdminDashboardPage = lazy(() => import('../pages/admin/DashboardPage'))

// Loading fallback component for lazy-loaded admin pages
function AdminLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mb-4"></div>
        <p className="text-slate-400 text-lg">Loading admin panel...</p>
      </div>
    </div>
  )
}

/**
 * Centralized routing configuration
 * Extracted from App.tsx to follow Single Responsibility Principle
 * REVIEW: All route definitions are now isolated from the root App component
 */
const AppRouter: React.FC = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/docs" element={<DocsPage />} />
        <Route path="/select-language" element={<LanguageSelectorPage />} />
        <Route path="/learn/:language/*" element={<LearnPage />} />
        <Route path="/playground" element={<PlaygroundPage />} />
        <Route path="/settings" element={<SettingsPage />} />

        {/* PvP routes */}
        <Route path="/pvp" element={<PvPLobbyPage />} />
        <Route path="/pvp/match/:roomCode" element={<PvPMatchPage />} />

        {/* Admin login route (not protected) */}
        <Route
          path="/admin/login"
          element={
            <Suspense fallback={<AdminLoadingFallback />}>
              <AdminLoginPage />
            </Suspense>
          }
        />

        {/* Protected admin routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <AdminLayout>
                <Suspense fallback={<AdminLoadingFallback />}>
                  <Routes>
                    <Route path="/" element={<AdminDashboardPage />} />
                    <Route path="dashboard" element={<AdminDashboardPage />} />
                    {/* TODO: Add more admin routes (Lesson Management, Submissions, etc.) */}
                  </Routes>
                </Suspense>
              </AdminLayout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  )
}

export default AppRouter
