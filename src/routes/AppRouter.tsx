import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import LandingPage from '../pages/LandingPage'
import AuthPage from '../pages/AuthPage'
import ProtectedRoute from '../components/admin/ProtectedRoute'
import UserProtectedRoute from '../components/UserProtectedRoute'
import AdminLayout from '../components/admin/layout/AdminLayout'

// Lazy load heavier product pages for code splitting
// Legacy pages (kept for backward compatibility)
const DocsPage = lazy(() => import('../pages/DocsPage'))
const OnboardingPage = lazy(() => import('../pages/OnboardingPage'))
const PublicLanguagesPage = lazy(() => import('../pages/PublicLanguagesPage'))
const PublicLanguageDetailPage = lazy(() => import('../pages/PublicLanguageDetailPage'))
const LearnPage = lazy(() => import('../pages/LearnPage'))
const PlaygroundPage = lazy(() => import('../pages/PlaygroundPage'))
const SettingsPage = lazy(() => import('../pages/SettingsPage'))
const LibraryPage = lazy(() => import('../pages/LibraryPage'))

// V2 production pages
const V2LandingPage = lazy(() => import('../pages/v2/V2LandingPage'))
const V2LanguagesPage = lazy(() => import('../pages/v2/V2LanguagesPage'))
const V2LanguageDetailPage = lazy(() => import('../pages/v2/V2LanguageDetailPage'))
const V2LibraryPage = lazy(() => import('../pages/v2/V2LibraryPage'))
const V2PlaygroundPage = lazy(() => import('../pages/v2/V2PlaygroundPage'))
const V2DocsPage = lazy(() => import('../pages/v2/V2DocsPage'))
const V2ProfilePage = lazy(() => import('../pages/v2/V2ProfilePage'))
const V2OnboardingPage = lazy(() => import('../pages/v2/V2OnboardingPage'))

// Other pages
const PvPLobbyPage = lazy(() => import('../pages/PvPLobbyPage'))
const PvPMatchPage = lazy(() => import('../pages/PvPMatchPage'))
const SampleLessonPage = lazy(() => import('../pages/SampleLessonPage'))

// Lazy load admin pages for code splitting
const AdminLoginPage = lazy(() => import('../pages/admin/LoginPage'))
const AdminDashboardPage = lazy(() => import('../pages/admin/DashboardPage'))
const AdminBulkImportPage = lazy(() => import('../pages/admin/BulkImportPage'))
const AdminLessonsPage = lazy(() => import('../pages/admin/LessonsPage'))
const AdminLessonEditorPage = lazy(() => import('../pages/admin/LessonEditorPage'))
const AdminSubmissionsPage = lazy(() => import('../pages/admin/SubmissionsPage'))
const AdminAuditLogsPage = lazy(() => import('../pages/admin/AuditLogsPage'))
const AdminImportHistoryPage = lazy(() => import('../pages/admin/ImportHistoryPage'))

// Loading fallback component for lazy-loaded admin pages
function AdminLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f4f7fb]">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600 mb-4"></div>
        <p className="text-slate-600 text-lg">Loading admin panel...</p>
      </div>
    </div>
  )
}

function PageLoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#f7fbff] text-slate-600">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-brand-teal mb-4"></div>
        <p className="text-lg">Loading...</p>
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
        {/* Public routes - V2 production */}
        <Route path="/" element={<Suspense fallback={<PageLoadingFallback />}><V2LandingPage /></Suspense>} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/docs" element={<Suspense fallback={<PageLoadingFallback />}><V2DocsPage /></Suspense>} />
        <Route path="/languages" element={<Suspense fallback={<PageLoadingFallback />}><V2LanguagesPage /></Suspense>} />
        <Route path="/languages/:language" element={<Suspense fallback={<PageLoadingFallback />}><V2LanguageDetailPage /></Suspense>} />
        <Route path="/onboarding" element={<Suspense fallback={<PageLoadingFallback />}><V2OnboardingPage /></Suspense>} />
        <Route path="/library/:language" element={<Suspense fallback={<PageLoadingFallback />}><V2LibraryPage /></Suspense>} />
        <Route path="/learn/:language/*" element={<Suspense fallback={<PageLoadingFallback />}><LearnPage /></Suspense>} />
        <Route path="/playground" element={<Suspense fallback={<PageLoadingFallback />}><V2PlaygroundPage /></Suspense>} />
        <Route
          path="/settings"
          element={
            <UserProtectedRoute>
              <Suspense fallback={<PageLoadingFallback />}>
                <V2ProfilePage />
              </Suspense>
            </UserProtectedRoute>
          }
        />
        <Route path="/sample-lesson" element={<Suspense fallback={<PageLoadingFallback />}><SampleLessonPage /></Suspense>} />

        {/* Legacy routes - kept for backward compatibility, can be removed later */}
        <Route path="/legacy/landing" element={<Suspense fallback={<PageLoadingFallback />}><LandingPage /></Suspense>} />
        <Route path="/legacy/languages" element={<Suspense fallback={<PageLoadingFallback />}><PublicLanguagesPage /></Suspense>} />
        <Route path="/legacy/languages/:language" element={<Suspense fallback={<PageLoadingFallback />}><PublicLanguageDetailPage /></Suspense>} />
        <Route path="/legacy/library/:language" element={<Suspense fallback={<PageLoadingFallback />}><LibraryPage /></Suspense>} />
        <Route path="/legacy/learn/:language/*" element={<Suspense fallback={<PageLoadingFallback />}><LearnPage /></Suspense>} />
        <Route path="/legacy/playground" element={<Suspense fallback={<PageLoadingFallback />}><PlaygroundPage /></Suspense>} />
        <Route path="/legacy/docs" element={<Suspense fallback={<PageLoadingFallback />}><DocsPage /></Suspense>} />
        <Route path="/legacy/onboarding" element={<Suspense fallback={<PageLoadingFallback />}><OnboardingPage /></Suspense>} />
        <Route
          path="/legacy/settings"
          element={
            <UserProtectedRoute>
              <Suspense fallback={<PageLoadingFallback />}>
                <SettingsPage />
              </Suspense>
            </UserProtectedRoute>
          }
        />

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
                    <Route path="import-history" element={<AdminImportHistoryPage />} />
                    <Route path="lessons" element={<AdminLessonsPage />} />
                    <Route path="lessons/new" element={<AdminLessonEditorPage />} />
                    <Route path="lessons/:id" element={<AdminLessonEditorPage />} />
                    <Route path="submissions" element={<AdminSubmissionsPage />} />
                    <Route path="audit-logs" element={<AdminAuditLogsPage />} />
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
