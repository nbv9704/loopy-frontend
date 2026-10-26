import { createElement, lazy, type ComponentType } from 'react'

type PageModule = { default: ComponentType }

export function preparedPage(importPage: () => Promise<PageModule>) {
  let loaded: PageModule | undefined
  let pending: Promise<PageModule> | undefined
  const preload = () => {
    pending ??= importPage()
      .then(module => {
        loaded = module
        return module
      })
      .catch(error => {
        pending = undefined
        throw error
      })
    return pending
  }
  const LazyPage = lazy(preload)
  // React.lazy still suspends once for an already resolved Promise. Read the prepared module directly.
  const Page = () => createElement(loaded?.default ?? LazyPage)
  return { Page, preload }
}

const pages = {
  LandingPage: preparedPage(() => import('../pages/LandingPage')),
  LanguagesPage: preparedPage(() => import('../pages/LanguagesPage')),
  LanguageDetailPage: preparedPage(() => import('../pages/LanguageDetailPage')),
  LibraryPage: preparedPage(() => import('../pages/LibraryPage')),
  PlaygroundPage: preparedPage(() => import('../pages/PlaygroundPage')),
  DocsPage: preparedPage(() => import('../pages/DocsPage')),
  ProfilePage: preparedPage(() => import('../pages/ProfilePage')),
  OnboardingPage: preparedPage(() => import('../pages/OnboardingPage')),
  AuthPage: preparedPage(() => import('../pages/AuthPage')),
  PracticePage: preparedPage(() => import('../pages/PracticePage')),
  PracticeSetsPage: preparedPage(() => import('../pages/PracticeSetsPage')),
  MyPracticeSetsPage: preparedPage(() => import('../pages/MyPracticeSetsPage')),
  OfficialPracticeSetsPage: preparedPage(() => import('../pages/OfficialPracticeSetsPage')),
  PracticeSetCreatePage: preparedPage(() => import('../pages/PracticeSetCreatePage')),
  PracticeSetDetailPage: preparedPage(() => import('../pages/PracticeSetDetailPage')),
  PvPLobbyPage: preparedPage(() => import('../pages/PvPLobbyPage')),
  PvPMatchPage: preparedPage(() => import('../pages/PvPMatchPage')),
  LearnPage: preparedPage(() => import('../pages/LearnPage')),
  NotFoundPage: preparedPage(() => import('../pages/NotFoundPage')),
  AdminLoginPage: preparedPage(() => import('../pages/admin/LoginPage')),
  AdminDashboardPage: preparedPage(() => import('../pages/admin/DashboardPage')),
  AdminBulkImportPage: preparedPage(() => import('../pages/admin/BulkImportPage')),
  AdminLessonsPage: preparedPage(() => import('../pages/admin/LessonsPage')),
  AdminLessonEditorPage: preparedPage(() => import('../pages/admin/LessonEditorPage')),
  AdminSubmissionsPage: preparedPage(() => import('../pages/admin/SubmissionsPage')),
  AdminAuditLogsPage: preparedPage(() => import('../pages/admin/AuditLogsPage')),
  AdminImportHistoryPage: preparedPage(() => import('../pages/admin/ImportHistoryPage')),
  AdminContentManagerPage: preparedPage(() => import('../pages/admin/ContentManagerPage')),
  AdminModerationPage: preparedPage(() => import('../pages/admin/ModerationPage')),
  AdminPracticePage: preparedPage(() => import('../pages/admin/AdminPracticePage')),
  AdminPracticeEditorPage: preparedPage(() => import('../pages/admin/AdminPracticeEditorPage')),
}

export const routePages = pages

/** Fetch modules/styles without mounting pages or issuing their private/business requests. */
export async function prepareRoutes() {
  const pending = Object.values(pages)
  let next = 0
  await Promise.all(
    Array.from({ length: 4 }, async () => {
      while (next < pending.length) await pending[next++].preload()
    })
  )
}
