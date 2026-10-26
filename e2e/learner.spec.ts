import { test, expect, type Page } from '@playwright/test'

const lesson = {
  id: 'lesson-one',
  lessonId: 'intro',
  chapterId: 'chapter-one',
  title: 'Bài học test',
  lessonType: 'code_build',
  starterCode: 'console.log(1)',
  description: 'Nội dung kiểm thử',
  taskDescription: 'In ra 1',
  orderIndex: 0,
  steps: [],
}
const profile = {
  id: 'learner',
  displayName: 'Người học test',
  preferredLanguage: 'javascript',
  learningPath: 'first_steps',
  onboardingCompleted: true,
  points: 0,
}

async function mockAPI(
  page: Page,
  options: { loggedIn?: boolean; failSave?: boolean; catalogFailure?: () => boolean } = {}
) {
  let loggedIn = options.loggedIn !== false
  let saved = false
  const calls: string[] = []
  await page.addInitScript(() => localStorage.setItem('language', 'vi'))
  await page.route('**/api/**', async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    calls.push(`${request.method()} ${path}`)
    const respond = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        json: status < 400 ? { success: true, data } : { success: false, error: data },
        headers: {
          'Access-Control-Allow-Origin': 'http://127.0.0.1:5180',
          'Access-Control-Allow-Credentials': 'true',
        },
      })
    if (request.method() === 'OPTIONS')
      return route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': 'http://127.0.0.1:5180',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE',
          'Access-Control-Allow-Headers': 'content-type',
        },
      })
    if (path === '/api/auth/me')
      return loggedIn
        ? respond({ user: { id: profile.id, email: 'learner@example.test', profile } })
        : respond({ code: 'AUTH_REQUIRED' }, 401)
    if (path === '/api/auth/refresh') return respond({ code: 'AUTH_REQUIRED' }, 401)
    if (path === '/api/auth/login') {
      loggedIn = true
      return respond({ user: { id: profile.id, email: 'learner@example.test' } })
    }
    if (path === '/api/profile/me')
      return respond({ profile: { ...profile, points: saved ? 100 : 0 } })
    if (path === '/api/admin-auth/me') return respond({ code: 'AUTH_REQUIRED' }, 401)
    if (path === '/api/content/batch') return respond({ items: {}, missingKeys: [] })
    if (path.endsWith('/curriculum')) {
      // Explicit failure state is independent of aborted StrictMode requests.
      if (options.catalogFailure?.())
        return respond({ code: 'OFFLINE', message: 'Không tải được bài học test' }, 503)
      return respond({
        lessons: [lesson],
        chapters: [{ id: 'chapter-one', title: 'Chương test', orderIndex: 0 }],
      })
    }
    if (path === '/api/progress/me')
      return respond({ progress: saved ? [{ lessonId: lesson.id, status: 'completed' }] : [] })
    if (path === '/api/execute')
      return respond({
        output: '1',
        error: request.postDataJSON()?.code?.includes('tenChuaKhaiBao')
          ? 'Undefined variable'
          : null,
        executionTime: 1,
      })
    if (path.endsWith('/check'))
      return respond({
        submissionId: '11111111-1111-4111-8111-111111111111',
        passed: true,
        score: 100,
        output: 'Đúng',
        checks: [{ label: 'Yêu cầu', passed: true }],
        validationType: 'rule',
      })
    if (path.endsWith('/complete')) {
      if (options.failSave)
        return respond({ code: 'DATABASE_ERROR', message: 'Không lưu được tiến độ test' }, 503)
      saved = true
      return respond({ progress: { status: 'completed' }, gamification: { pointsEarned: 100 } })
    }
    // Catch-all is mocked too: a missing fixture can never write to a live backend.
    return respond({})
  })
  return calls
}

async function reachSave(page: Page) {
  await page.getByRole('button', { name: 'Chạy code mẫu', exact: true }).click()
  await page.getByRole('button', { name: 'Kiểm tra thay đổi', exact: true }).click()
  await page.getByRole('button', { name: 'Chạy thử output', exact: true }).click()
  await page.locator('.cm-content[contenteditable=true]').fill('console.log(1)')
  await page.getByRole('button', { name: 'Kiểm tra sửa lỗi', exact: true }).click()
}

test('run, check and save are separate; completion survives reload', async ({ page }) => {
  const calls = await mockAPI(page)
  await page.goto('/learn/javascript/intro')
  await page.getByRole('button', { name: 'Chạy code mẫu', exact: true }).click()
  expect(calls.some(call => call.endsWith('/check'))).toBe(false)
  expect(calls.some(call => call.endsWith('/complete'))).toBe(false)
  await expect(page.getByText('Tuyệt vời! Progress đã được lưu.', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Kiểm tra thay đổi', exact: true }).click()
  await page.getByRole('button', { name: 'Chạy thử output', exact: true }).click()
  await page.locator('.cm-content[contenteditable=true]').fill('console.log(1)')
  await page.getByRole('button', { name: 'Kiểm tra sửa lỗi', exact: true }).click()
  expect(calls.some(call => call.endsWith('/complete'))).toBe(false)
  await page.getByRole('button', { name: 'Lưu hoàn thành', exact: true }).click()
  await expect(page.getByText('Tuyệt vời! Progress đã được lưu.', { exact: true })).toBeVisible()
  await page.reload()
  await expect(page.getByText('Đã hoàn thành', { exact: true })).toBeVisible()
})

test('failed save never shows completion celebration', async ({ page }) => {
  await mockAPI(page, { failSave: true })
  await page.goto('/learn/javascript/intro')
  await reachSave(page)
  await page.getByRole('button', { name: 'Lưu hoàn thành', exact: true }).click()
  await expect(page.getByText('Không lưu được tiến độ test', { exact: true })).toBeVisible()
  await expect(page.getByText('Tuyệt vời! Progress đã được lưu.', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Đã hoàn thành', { exact: true })).toHaveCount(0)
})

test('catalog errors expose a working retry', async ({ page }) => {
  let failing = true
  await mockAPI(page, { catalogFailure: () => failing })
  await page.goto('/learn/javascript/intro')
  await expect(page.getByRole('alert')).toContainText('Không tải được bài học test')
  failing = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Bài học test', exact: true })).toBeVisible()
})

test('login fields have accessible labels and successful login restores the learner', async ({
  page,
}) => {
  await mockAPI(page, { loggedIn: false })
  await page.goto('/auth')
  await page.getByLabel('Email', { exact: true }).fill('learner@example.test')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('fake-password')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page).not.toHaveURL(/\/auth/)
})

test('save must finish before celebration appears', async ({ page }) => {
  await mockAPI(page)
  let release!: () => void
  const gate = new Promise<void>(resolve => {
    release = resolve
  })
  await page.route('**/api/progress/me/*/complete', async route => {
    await gate
    await route.fulfill({
      json: {
        success: true,
        data: { progress: { status: 'completed' }, gamification: { pointsEarned: 100 } },
      },
    })
  })
  await page.goto('/learn/javascript/intro')
  await reachSave(page)
  await page.getByRole('button', { name: 'Lưu hoàn thành', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Đang xử lý...', exact: true })).toBeDisabled()
  await expect(page.getByText('Tuyệt vời! Progress đã được lưu.', { exact: true })).toHaveCount(0)
  release()
  await expect(page.getByText('Tuyệt vời! Progress đã được lưu.', { exact: true })).toBeVisible()
})

test('lesson actions remain reachable on a phone', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 })
  await mockAPI(page)
  await page.goto('/learn/javascript/intro')
  await page.getByRole('button', { name: 'Chạy code mẫu', exact: true }).click()
  await page.getByRole('button', { name: 'Kiểm tra thay đổi', exact: true }).click()
  const horizontalOverflow = await page.evaluate(
    () => document.documentElement.scrollWidth > window.innerWidth
  )
  expect(horizontalOverflow).toBe(false)
  const editor = await page.locator('.cm-editor').boundingBox()
  expect(editor?.height).toBeGreaterThan(100)
})
