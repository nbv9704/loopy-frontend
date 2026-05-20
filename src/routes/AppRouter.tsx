import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import AuthPage from '../pages/AuthPage'
import ProtectedRoute from '../components/admin/ProtectedRoute'
import UserProtectedRoute from '../components/UserProtectedRoute'
import AdminLayout from '../components/admin/layout/AdminLayout'

// Lazy load heavier product pages for code splitting
const DocsPage = lazy(() => import('../pages/DocsPage'))
const OnboardingPage = lazy(() => import('../pages/OnboardingPage'))
const PublicLanguagesPage = lazy(() => import('../pages/PublicLanguagesPage'))
const PublicLanguageDetailPage = lazy(() => import('../pages/PublicLanguageDetailPage'))
const LearnPage = lazy(() => import('../pages/LearnPage'))
const PlaygroundPage = lazy(() => import('../pages/PlaygroundPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const PvPLobbyPage = lazy(() => import('../pages/PvPLobbyPage'))
const PvPMatchPage = lazy(() => import('../pages/PvPMatchPage'))
const SampleLessonPage = lazy(() => import('../pages/SampleLessonPage'))
const LibraryPage = lazy(() => import('../pages/LibraryPage'))

// Lazy load admin pages for code splitting
const AdminLoginPage = lazy(() => import('../pages/admin/LoginPage'))
const AdminDashboardPage = lazy(() => import('../pages/admin/DashboardPage'))
const AdminBulkImportPage = lazy(() => import('../pages/admin/BulkImportPage'))
const AdminLessonEditorPage = lazy(() => import('../pages/admin/LessonEditorPage'))

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

function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#0a0e1a] text-slate-400">
      Loading...
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
        <Route path="/docs" element={<Suspense fallback={<PageLoadingFallback />}><DocsPage /></Suspense>} />
        <Route path="/languages" element={<Suspense fallback={<PageLoadingFallback />}><PublicLanguagesPage /></Suspense>} />
        <Route path="/languages/:language" element={<Suspense fallback={<PageLoadingFallback />}><PublicLanguageDetailPage /></Suspense>} />
        <Route path="/onboarding" element={<Suspense fallback={<PageLoadingFallback />}><OnboardingPage /></Suspense>} />
        <Route path="/library/:language" element={<Suspense fallback={<PageLoadingFallback />}><LibraryPage /></Suspense>} />
        <Route path="/learn/:language/*" element={<Suspense fallback={<PageLoadingFallback />}><LearnPage /></Suspense>} />
        <Route path="/playground" element={<Suspense fallback={<PageLoadingFallback />}><PlaygroundPage /></Suspense>} />
        <Route
          path="/settings"
          element={
            <UserProtectedRoute>
              <Suspense fallback={<PageLoadingFallback />}>
                <SettingsPage />
              </Suspense>
            </UserProtectedRoute>
          }
        />
        <Route path="/sample-lesson" element={<Suspense fallback={<PageLoadingFallback />}><SampleLessonPage /></Suspense>} />

        {/* PvP routes */}
        <Route path="/pvp" element={<Suspense fallback={<PageLoadingFallback />}><PvPLobbyPage /></Suspense>} />
        <Route path="/pvp/match/:roomCode" element={<Suspense fallback={<PageLoadingFallback />}><PvPMatchPage /></Suspense>} />

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
                    <Route path="import" element={<AdminBulkImportPage />} />
                    <Route path="lessons/new" element={<AdminLessonEditorPage />} />
                    <Route path="lessons/:id" element={<AdminLessonEditorPage />} />
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
