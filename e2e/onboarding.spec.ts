import { expect, test, type Page } from '@playwright/test'
import { mockApi, reply } from './fixtures/api'

const pythonPath = '11111111-1111-4111-8111-111111111111'
const javascriptPath = '22222222-2222-4222-8222-222222222222'

async function fixture(page: Page, loggedIn = true) {
  const state = {
    loggedIn,
    catalogOverride: null as unknown,
    previewOverride: null as unknown,
    failCatalog: false,
    failPath: false,
    failSave: false,
    missingAck: false,
    emptyPreview: false,
    lessonCount: 1,
    pendingSave: Promise.resolve(),
    pendingLogin: Promise.resolve(),
    writes: [] as Record<string, unknown>[],
    logins: 0,
    saved: false,
  }
  const profile = () => ({
    id: 'learner',
    displayName: state.saved ? 'Completed learner' : 'New learner',
    onboardingCompleted: state.saved,
    preferredLanguage: state.saved ? 'python' : undefined,
    learningPath: state.saved ? 'start_from_zero' : undefined,
    currentPathId: state.saved ? pythonPath : undefined,
  })
  await page.addInitScript(() => localStorage.setItem('language', 'vi'))
  await mockApi(page, async route => {
    const path = new URL(route.request().url()).pathname
    const method = route.request().method()
    if (path === '/api/auth/me')
      return state.loggedIn
        ? reply(route, {
            user: { id: 'learner', email: 'learner@example.test', profile: profile() },
          })
        : reply(route, { code: 'AUTH_REQUIRED' }, 401)
    if (path === '/api/auth/refresh' || path === '/api/admin-auth/me')
      return reply(route, { code: 'AUTH_REQUIRED' }, 401)
    if (path === '/api/auth/login') {
      ++state.logins
      await state.pendingLogin
      state.loggedIn = true
      return reply(route, { user: { id: 'learner', email: 'learner@example.test' } })
    }
    if (path === '/api/auth/signup')
      return reply(route, {
        requiresEmailConfirmation: true,
        message: 'Vui lòng kiểm tra email test',
        user: { id: 'learner', email: 'learner@example.test' },
      })
    if (path === '/api/moderation/keywords') return reply(route, [])
    if (path === '/api/content/batch')
      return reply(route, { items: { 'nav.practice': 'Practice' }, missingKeys: [] })
    if (path === '/api/languages')
      return state.failCatalog
        ? reply(route, { message: 'Catalog temporarily unavailable' }, 503)
        : reply(route, {
            languages: [
              { id: 'python', name: 'Python' },
              { id: 'javascript', name: 'JavaScript' },
            ],
          })
    if (path === '/api/paths')
      return reply(
        route,
        state.catalogOverride || {
          paths: [
            {
              id: pythonPath,
              languageId: 'python',
              goalId: 'start_from_zero',
              title: 'Bắt đầu với Python',
            },
            {
              id: javascriptPath,
              languageId: 'javascript',
              goalId: 'start_from_zero',
              title: 'Bắt đầu với JavaScript',
            },
          ],
        }
      )
    if (path.startsWith('/api/paths/'))
      return state.failPath
        ? reply(route, { message: 'Path preview unavailable' }, 503)
        : reply(
            route,
            state.previewOverride || {
              chapters: state.emptyPreview
                ? []
                : [{ id: 'chapter', title: 'First real chapter', lessonCount: state.lessonCount }],
            }
          )
    if (path === '/api/profile/me' && method === 'PUT') {
      state.writes.push(route.request().postDataJSON())
      await state.pendingSave
      if (state.failSave) return reply(route, { message: 'Cannot save onboarding now' }, 503)
      state.saved = true
      return reply(route, state.missingAck ? {} : { profile: profile() })
    }
    if (path === '/api/profile/me') return reply(route, { profile: profile() })
    if (path.endsWith('/curriculum')) return reply(route, { lessons: [], chapters: [] })
    if (path === '/api/progress/me') return reply(route, { progress: [] })
    if (path === '/api/practice/sets') return reply(route, { items: [], total: 0 })
    return reply(route, {})
  })
  return state
}

async function preview(page: Page) {
  await page.goto('/onboarding')
  await page.getByRole('button', { name: /Python/ }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
}

async function guestLogin(page: Page) {
  await preview(page)
  await page.getByRole('button', { name: 'Đăng nhập để lưu lộ trình', exact: true }).click()
  await page.getByLabel('Email', { exact: true }).fill('learner@example.test')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('test-only-password')
}

test('onboarding catalog errors have retry without accepting a fallback catalog as loaded', async ({
  page,
}) => {
  const state = await fixture(page)
  state.failCatalog = true
  await page.goto('/onboarding')
  await expect(page.getByRole('alert')).toContainText('Catalog temporarily unavailable')
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toHaveCount(0)
  state.failCatalog = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('button', { name: /Python/ })).toBeVisible()
})

test('failed path previews can retry and cannot be treated as an empty ready journey', async ({
  page,
}) => {
  const state = await fixture(page)
  state.failPath = true
  await preview(page)
  await expect(page.getByRole('alert')).toContainText('Path preview unavailable')
  await expect(
    page.getByRole('button', { name: 'Lưu và mở Journey Map', exact: true })
  ).toBeDisabled()
  state.failPath = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByText('First real chapter', { exact: true })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
})

test('onboarding does not navigate on a success envelope missing the saved profile', async ({
  page,
}) => {
  const state = await fixture(page)
  state.missingAck = true
  await preview(page)
  await page.getByRole('button', { name: 'Lưu và mở Journey Map', exact: true }).click()
  await expect.poll(() => state.writes.length).toBe(1)
  await expect(page.getByRole('alert')).toContainText('xác nhận')
  await expect(page).toHaveURL(/\/onboarding$/)
})

test('a late onboarding save cannot pull the learner back after leaving the flow', async ({
  page,
}) => {
  const state = await fixture(page)
  let release!: () => void
  state.pendingSave = new Promise(resolve => {
    release = resolve
  })
  await preview(page)
  await page.getByRole('button', { name: 'Lưu và mở Journey Map', exact: true }).click()
  await expect.poll(() => state.writes.length).toBe(1)
  await page.getByRole('banner').getByRole('link', { name: 'Practice', exact: true }).click()
  await expect(page).toHaveURL(/\/practice$/)
  const response = page.waitForResponse(result => result.request().method() === 'PUT')
  release()
  await response
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())))
  await expect(page).toHaveURL(/\/practice$/)
})

test('a guest draft can retry saving after login without submitting credentials twice', async ({
  page,
}) => {
  const state = await fixture(page, false)
  state.failSave = true
  await guestLogin(page)
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page.getByText('Cannot save onboarding now', { exact: true })).toBeVisible()
  state.failSave = false
  await page.getByRole('button', { name: 'Thử lại lưu lộ trình', exact: true }).click()
  await expect(page).toHaveURL(/\/library\/python$/)
  await expect(page.getByRole('banner')).toContainText('Completed learner')
  expect(state.logins).toBe(1)
  expect(state.writes).toHaveLength(2)
  expect(state.writes[1]).toMatchObject({
    preferredLanguage: 'python',
    currentPathId: pythonPath,
    onboardingCompleted: true,
  })
})

test('leaving a pending login prevents the subsequent onboarding profile write and navigation', async ({
  page,
}) => {
  const state = await fixture(page, false)
  let release!: () => void
  state.pendingLogin = new Promise(resolve => {
    release = resolve
  })
  await guestLogin(page)
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect.poll(() => state.logins).toBe(1)
  await expect(page.getByLabel('Email', { exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Quay lại', exact: true }).click()
  await expect(page).toHaveURL('/')
  const response = page.waitForResponse(result => result.url().endsWith('/api/auth/login'))
  release()
  await response
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())))
  expect(state.writes).toEqual([])
  await expect(page).toHaveURL('/')
})

for (const empty of [true, false]) {
  test(`an unavailable journey (${empty ? 'no chapters' : 'no published lessons'}) cannot complete onboarding`, async ({
    page,
  }) => {
    const state = await fixture(page)
    state.emptyPreview = empty
    state.lessonCount = 0
    await preview(page)
    await expect(
      page.getByRole('button', { name: 'Lưu và mở Journey Map', exact: true })
    ).toBeDisabled()
    await expect(page.getByText(/chưa có bài học sẵn sàng/)).toBeVisible()
    expect(state.writes).toEqual([])
    await expect(page.locator('body')).not.toContainText('path_chapters')
  })
}

test('login restores the complete protected URL including query and fragment', async ({ page }) => {
  const state = await fixture(page, false)
  state.saved = true
  await page.goto('/practice/sets/new?topic=loops#draft')
  await expect(page).toHaveURL(/\/auth$/)
  await page.getByLabel('Email', { exact: true }).fill('learner@example.test')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('test-only-password')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page).toHaveURL('/practice/sets/new?topic=loops#draft')
})

test('signup requiring email confirmation shows a success notice and does not save onboarding', async ({
  page,
}) => {
  const state = await fixture(page, false)
  await page.goto('/auth')
  await page.getByRole('button', { name: /Đăng ký ngay/ }).click()
  await page.getByLabel('Tên hiển thị', { exact: true }).fill('New learner')
  await page.getByLabel('Email', { exact: true }).fill('learner@example.test')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('test-only-password')
  await page.getByRole('button', { name: 'Đăng ký', exact: true }).click()
  await expect(page.getByRole('status')).toContainText('Vui lòng kiểm tra email test')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveValue('')
  expect(state.writes).toEqual([])
  expect(state.logins).toBe(0)
})

test('malformed path catalog stays in an explicit retry state instead of crashing onboarding', async ({
  page,
}) => {
  const state = await fixture(page)
  state.catalogOverride = { paths: [null] }
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto('/onboarding')
  await expect(page.getByRole('alert')).toContainText('Không đọc được dữ liệu lộ trình')
  state.catalogOverride = null
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('button', { name: /Python/ })).toBeVisible()
  expect(state.writes).toHaveLength(0)
  expect(errors).toEqual([])
})

test('wrong preview identity cannot enable completing onboarding', async ({ page }) => {
  const state = await fixture(page)
  state.previewOverride = {
    path: { id: 'another' },
    chapters: [{ id: 'chapter', title: 'Wrong path', lessonCount: 20 }],
  }
  await preview(page)
  await expect(page.getByRole('alert')).toContainText('Không đọc được bài học trong lộ trình')
  expect(state.writes).toHaveLength(0)
})
