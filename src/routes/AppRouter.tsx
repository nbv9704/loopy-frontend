import { lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/admin/ProtectedRoute'
import UserProtectedRoute from '../components/UserProtectedRoute'
import AdminLayout from '../components/admin/layout/AdminLayout'
import { LoadingScreen } from '../components/LoadingScreen'

// Lazy load heavier product pages for code splitting
// V2 production pages
const LandingPage = lazy(() => import('../pages/LandingPage'))
const LanguagesPage = lazy(() => import('../pages/LanguagesPage'))
const LanguageDetailPage = lazy(() => import('../pages/LanguageDetailPage'))
const LibraryPage = lazy(() => import('../pages/LibraryPage'))
const PlaygroundPage = lazy(() => import('../pages/PlaygroundPage'))
const DocsPage = lazy(() => import('../pages/DocsPage'))
const ProfilePage = lazy(() => import('../pages/ProfilePage'))
const OnboardingPage = lazy(() => import('../pages/OnboardingPage'))
const AuthPage = lazy(() => import('../pages/AuthPage'))
const PracticePage = lazy(() => import('../pages/PracticePage'))
const PracticeSetsPage = lazy(() => import('../pages/PracticeSetsPage'))
const MyPracticeSetsPage = lazy(() => import('../pages/MyPracticeSetsPage'))
const OfficialPracticeSetsPage = lazy(() => import('../pages/OfficialPracticeSetsPage'))
const PracticeSetCreatePage = lazy(() => import('../pages/PracticeSetCreatePage'))
const PracticeSetDetailPage = lazy(() => import('../pages/PracticeSetDetailPage'))
const PvPLobbyPage = lazy(() => import('../pages/PvPLobbyPage'))
const PvPMatchPage = lazy(() => import('../pages/PvPMatchPage'))
const LearnPage = lazy(() => import('../pages/LearnPage'))

// Other pages (legacy - kept for backward compatibility)
// const PvPLobbyPage = lazy(() => import('../pages/PvPLobbyPage'))
// const PvPMatchPage = lazy(() => import('../pages/PvPMatchPage'))

// Lazy load admin pages for code splitting
const AdminLoginPage = lazy(() => import('../pages/admin/LoginPage'))
const AdminDashboardPage = lazy(() => import('../pages/admin/DashboardPage'))
const AdminBulkImportPage = lazy(() => import('../pages/admin/BulkImportPage'))
const AdminLessonsPage = lazy(() => import('../pages/admin/LessonsPage'))
const AdminLessonEditorPage = lazy(() => import('../pages/admin/LessonEditorPage'))
const AdminSubmissionsPage = lazy(() => import('../pages/admin/SubmissionsPage'))
const AdminAuditLogsPage = lazy(() => import('../pages/admin/AuditLogsPage'))
const AdminImportHistoryPage = lazy(() => import('../pages/admin/ImportHistoryPage'))
const AdminContentManagerPage = lazy(() => import('../pages/admin/ContentManagerPage'))
const AdminModerationPage = lazy(() => import('../pages/admin/ModerationPage'))
const AdminPracticePage = lazy(() => import('../pages/admin/AdminPracticePage'))
const AdminPracticeEditorPage = lazy(() => import('../pages/admin/AdminPracticeEditorPage'))

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
        <Route path="/" element={<Suspense fallback={<LoadingScreen />}><LandingPage /></Suspense>} />
        <Route path="/auth" element={<Suspense fallback={<LoadingScreen />}><AuthPage /></Suspense>} />
        <Route path="/docs" element={<Suspense fallback={<LoadingScreen />}><DocsPage /></Suspense>} />
        <Route path="/languages" element={<Suspense fallback={<LoadingScreen />}><LanguagesPage /></Suspense>} />
        <Route path="/languages/:language" element={<Suspense fallback={<LoadingScreen />}><LanguageDetailPage /></Suspense>} />
        <Route path="/onboarding" element={<Suspense fallback={<LoadingScreen />}><OnboardingPage /></Suspense>} />
        <Route path="/library/:language" element={<Suspense fallback={<LoadingScreen />}><LibraryPage /></Suspense>} />
        <Route path="/learn/:language/*" element={<Suspense fallback={<LoadingScreen />}><LearnPage /></Suspense>} />
        <Route path="/playground" element={<Suspense fallback={<LoadingScreen />}><PlaygroundPage /></Suspense>} />
        <Route
          path="/settings"
          element={
            <UserProtectedRoute>
              <Suspense fallback={<LoadingScreen />}>
                <ProfilePage />
              </Suspense>
            </UserProtectedRoute>
          }
        />
        
        {/* Practice routes */}
        <Route path="/practice" element={<Suspense fallback={<LoadingScreen />}><PracticePage /></Suspense>} />
        <Route path="/practice/sets" element={<Suspense fallback={<LoadingScreen />}><PracticeSetsPage /></Suspense>} />
        <Route path="/practice/sets/new" element={<UserProtectedRoute><Suspense fallback={<LoadingScreen />}><PracticeSetCreatePage /></Suspense></UserProtectedRoute>} />
        <Route path="/practice/sets/:setId/edit" element={<UserProtectedRoute><Suspense fallback={<LoadingScreen />}><PracticeSetCreatePage /></Suspense></UserProtectedRoute>} />
        <Route path="/practice/my-sets" element={<UserProtectedRoute><Suspense fallback={<LoadingScreen />}><MyPracticeSetsPage /></Suspense></UserProtectedRoute>} />
        <Route path="/practice/official-sets" element={<Suspense fallback={<LoadingScreen />}><OfficialPracticeSetsPage /></Suspense>} />
        <Route path="/practice/sets/:setId" element={<Suspense fallback={<LoadingScreen />}><PracticeSetDetailPage /></Suspense>} />
        <Route path="/practice/compete" element={<Suspense fallback={<LoadingScreen />}><PvPLobbyPage /></Suspense>} />
        <Route path="/practice/compete/match/:roomCode" element={<Suspense fallback={<LoadingScreen />}><PvPMatchPage /></Suspense>} />

        {/* Legacy PvP routes */}
        <Route path="/pvp" element={<Navigate to="/practice/compete" replace />} />
        <Route path="/pvp/match/:roomCode" element={<Suspense fallback={<LoadingScreen />}><PvPMatchPage /></Suspense>} />

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
                    <Route path="content" element={<AdminContentManagerPage />} />
                    <Route path="moderation" element={<AdminModerationPage />} />
                    <Route path="practice" element={<AdminPracticePage />} />
                    <Route path="practice/new" element={<AdminPracticeEditorPage />} />
                    <Route path="practice/:id" element={<AdminPracticeEditorPage />} />
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
