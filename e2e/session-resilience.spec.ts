import { expect, test, type Page } from '@playwright/test'
import { mockApi, reply } from './fixtures/api'

async function fixture(page: Page, options: { unavailable?: boolean } = {}) {
  const state = {
    unavailable: !!options.unavailable,
    sessionReads: 0,
    contentReads: 0,
    pendingContent: Promise.resolve(),
  }
  await mockApi(page, async route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/me') {
      ++state.sessionReads
      return state.unavailable
        ? reply(
            route,
            { code: 'AUTH_UNAVAILABLE', message: 'Chưa kiểm tra được phiên đăng nhập.' },
            503
          )
        : reply(route, {
            user: {
              id: 'learner',
              email: 'learner@example.test',
              profile: {
                id: 'learner',
                onboardingCompleted: true,
                preferredLanguage: 'javascript',
              },
            },
          })
    }
    if (path === '/api/admin-auth/me' || path === '/api/auth/refresh')
      return reply(route, { code: 'AUTH_REQUIRED' }, 401)
    if (path === '/api/content/batch') {
      ++state.contentReads
      await state.pendingContent
      return reply(route, { items: {}, missingKeys: [] })
    }
    if (path === '/api/languages') return reply(route, { languages: [] })
    if (path === '/api/execute/capabilities') return reply(route, { capabilities: {} })
    return reply(route, {})
  })
  return state
}

for (const mode of ['blocked', 'quota'] as const) {
  test(`app boots and theme/language/editor remain usable with ${mode} storage`, async ({
    page,
  }) => {
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    await fixture(page)
    await page.addInitScript(mode => {
      if (mode === 'blocked') {
        for (const key of ['localStorage', 'sessionStorage'])
          Object.defineProperty(window, key, {
            configurable: true,
            get() {
              throw new DOMException('Blocked', 'SecurityError')
            },
          })
      } else {
        localStorage.setItem('editor_font_size', 'not-a-number')
        localStorage.setItem('language', 'invalid-locale')
        Storage.prototype.setItem = () => {
          throw new DOMException('Full', 'QuotaExceededError')
        }
      }
    }, mode)
    await page.goto('/playground')
    const editor = page.getByRole('textbox', { name: 'Code editor Python' })
    await expect(editor).toBeVisible()
    await editor.fill('console.log("draft preserved")')
    await expect(editor).toHaveCSS('font-size', '14px')
    const theme = await page.locator('html').getAttribute('data-theme')
    await page.getByRole('button', { name: /Chuyển sang giao diện/ }).click()
    await expect(page.locator('html')).toHaveAttribute(
      'data-theme',
      theme === 'dark' ? 'light' : 'dark'
    )
    await expect(editor).toHaveValue('console.log("draft preserved")')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await page.getByTitle('Chuyển sang Tiếng Việt', { exact: true }).click()
    await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
    await expect(editor).toHaveValue('console.log("draft preserved")')
    expect(errors).toEqual([])
  })
}

for (const path of [
  '/settings',
  '/learn/javascript/lesson',
  '/practice/sets/test',
  '/practice/compete',
  '/pvp/match/test',
]) {
  test(`session outage preserves ${path} and retries without a request loop`, async ({ page }) => {
    const state = await fixture(page, { unavailable: true })
    await page.goto(path)
    await expect(page.getByRole('alert')).toContainText('Chưa kiểm tra được phiên đăng nhập.')
    await expect(page).toHaveURL(path)
    expect(state.sessionReads).toBe(1)
    state.unavailable = false
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
    await expect(
      page.getByText('Chưa kiểm tra được phiên đăng nhập.', { exact: true })
    ).toHaveCount(0)
    await expect(page).toHaveURL(path)
    expect(state.sessionReads).toBe(2)
  })
}

test('learner auth outage does not block the independent admin login', async ({ page }) => {
  await fixture(page, { unavailable: true })
  await page.goto('/admin/login')
  await expect(page.getByRole('button', { name: /Đăng nhập|Sign in|Login/i })).toBeVisible()
  await expect(page).toHaveURL('/admin/login')
})

test('CMS invalidation keeps the mounted playground and its unsaved code during a delayed refresh', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/playground')
  const editor = page.getByRole('textbox', { name: 'Code editor Python' })
  await editor.fill('print("keep this draft")')
  const reads = state.contentReads
  let release!: () => void
  state.pendingContent = new Promise<void>(done => {
    release = done
  })
  await page.evaluate(() =>
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'loopy_content_revision', newValue: 'confirmed-edit' })
    )
  )
  await expect.poll(() => state.contentReads).toBe(reads + 1)
  await expect(editor).toBeVisible()
  await expect(editor).toHaveValue('print("keep this draft")')
  release()
  await expect(editor).toHaveValue('print("keep this draft")')
})
