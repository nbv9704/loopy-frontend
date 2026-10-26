import { AuthSessionBoundary } from '../features/auth/AuthSessionBoundary'
import ActionRouteBoundary from '../components/common/ActionRouteBoundary'
import { Suspense } from 'react'
import { routePages } from './pages'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import ProtectedRoute from '../components/admin/ProtectedRoute'
import UserProtectedRoute from '../components/UserProtectedRoute'
import AdminLayout from '../components/admin/layout/AdminLayout'
import { LoadingScreen } from '../components/LoadingScreen'

// Modules are prepared once before the initial interface is revealed.
const {
  LandingPage: { Page: LandingPage },
  LanguagesPage: { Page: LanguagesPage },
  LanguageDetailPage: { Page: LanguageDetailPage },
  LibraryPage: { Page: LibraryPage },
  PlaygroundPage: { Page: PlaygroundPage },
  DocsPage: { Page: DocsPage },
  ProfilePage: { Page: ProfilePage },
  OnboardingPage: { Page: OnboardingPage },
  AuthPage: { Page: AuthPage },
  PracticePage: { Page: PracticePage },
  PracticeSetsPage: { Page: PracticeSetsPage },
  MyPracticeSetsPage: { Page: MyPracticeSetsPage },
  OfficialPracticeSetsPage: { Page: OfficialPracticeSetsPage },
  PracticeSetCreatePage: { Page: PracticeSetCreatePage },
  PracticeSetDetailPage: { Page: PracticeSetDetailPage },
  PvPLobbyPage: { Page: PvPLobbyPage },
  PvPMatchPage: { Page: PvPMatchPage },
  LearnPage: { Page: LearnPage },
  NotFoundPage: { Page: NotFoundPage },
  AdminLoginPage: { Page: AdminLoginPage },
  AdminDashboardPage: { Page: AdminDashboardPage },
  AdminBulkImportPage: { Page: AdminBulkImportPage },
  AdminLessonsPage: { Page: AdminLessonsPage },
  AdminLessonEditorPage: { Page: AdminLessonEditorPage },
  AdminSubmissionsPage: { Page: AdminSubmissionsPage },
  AdminAuditLogsPage: { Page: AdminAuditLogsPage },
  AdminImportHistoryPage: { Page: AdminImportHistoryPage },
  AdminContentManagerPage: { Page: AdminContentManagerPage },
  AdminModerationPage: { Page: AdminModerationPage },
  AdminPracticePage: { Page: AdminPracticePage },
  AdminPracticeEditorPage: { Page: AdminPracticeEditorPage },
} = routePages

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
      <ActionRouteBoundary>
        <Routes>
          {/* Public routes - V2 production */}
          <Route
            path="/"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <LandingPage />
              </Suspense>
            }
          />
          <Route
            path="/auth"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <AuthPage />
              </Suspense>
            }
          />
          <Route
            path="/docs"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <DocsPage />
              </Suspense>
            }
          />
          <Route
            path="/languages"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <LanguagesPage />
              </Suspense>
            }
          />
          <Route
            path="/languages/:language"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <LanguageDetailPage />
              </Suspense>
            }
          />
          <Route
            path="/onboarding"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <OnboardingPage />
              </Suspense>
            }
          />
          <Route
            path="/library/:language"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <LibraryPage />
              </Suspense>
            }
          />
          <Route
            path="/learn/:language/*"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <AuthSessionBoundary>
                  <LearnPage />
                </AuthSessionBoundary>
              </Suspense>
            }
          />
          <Route
            path="/playground"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <PlaygroundPage />
              </Suspense>
            }
          />
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
          <Route
            path="/practice"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <PracticePage />
              </Suspense>
            }
          />
          <Route
            path="/practice/sets"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <PracticeSetsPage />
              </Suspense>
            }
          />
          <Route
            path="/practice/sets/new"
            element={
              <UserProtectedRoute>
                <Suspense fallback={<LoadingScreen />}>
                  <PracticeSetCreatePage />
                </Suspense>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/practice/sets/:setId/edit"
            element={
              <UserProtectedRoute>
                <Suspense fallback={<LoadingScreen />}>
                  <PracticeSetCreatePage />
                </Suspense>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/practice/my-sets"
            element={
              <UserProtectedRoute>
                <Suspense fallback={<LoadingScreen />}>
                  <MyPracticeSetsPage />
                </Suspense>
              </UserProtectedRoute>
            }
          />
          <Route
            path="/practice/official-sets"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <OfficialPracticeSetsPage />
              </Suspense>
            }
          />
          <Route
            path="/practice/sets/:setId"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <AuthSessionBoundary>
                  <PracticeSetDetailPage />
                </AuthSessionBoundary>
              </Suspense>
            }
          />
          <Route
            path="/practice/compete"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <AuthSessionBoundary>
                  <PvPLobbyPage />
                </AuthSessionBoundary>
              </Suspense>
            }
          />
          <Route
            path="/practice/compete/match/:roomCode"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <AuthSessionBoundary>
                  <PvPMatchPage />
                </AuthSessionBoundary>
              </Suspense>
            }
          />

          {/* Legacy PvP routes */}
          <Route path="/pvp" element={<Navigate to="/practice/compete" replace />} />
          <Route
            path="/pvp/match/:roomCode"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <AuthSessionBoundary>
                  <PvPMatchPage />
                </AuthSessionBoundary>
              </Suspense>
            }
          />

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
                      <Route path="*" element={<Navigate to="/404" replace />} />
                    </Routes>
                  </Suspense>
                </AdminLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/404"
            element={
              <Suspense fallback={<LoadingScreen />}>
                <NotFoundPage />
              </Suspense>
            }
          />
          <Route path="*" element={<Navigate to="/404" replace />} />
        </Routes>
      </ActionRouteBoundary>
    </Router>
  )
}

export default AppRouter
