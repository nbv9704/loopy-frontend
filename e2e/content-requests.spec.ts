import { expect, test, type Page } from '@playwright/test'
import { mockApi, reply } from './fixtures/api'

async function fixture(
  page: Page,
  mode: 'normal' | 'failure' | 'ambiguous' | 'missing' | 'placeholder' = 'normal'
) {
  const state = {
    loggedIn: mode !== 'failure',
    paths: [] as string[],
    batches: [] as Array<{ keys: string[]; language: string }>,
  }
  const profile = {
    id: 'learner',
    preferredLanguage: 'javascript',
    onboardingCompleted: true,
    learningPath: 'first_steps',
  }
  await page.addInitScript(() => localStorage.setItem('language', 'vi'))
  await mockApi(page, async route => {
    const path = new URL(route.request().url()).pathname
    state.paths.push(path)
    if (path === '/api/auth/me')
      return state.loggedIn
        ? reply(route, { user: { id: 'learner', email: 'learner@example.test', profile } })
        : reply(route, { code: 'AUTH_REQUIRED' }, 401)
    if (path === '/api/auth/refresh' || path === '/api/admin-auth/me')
      return reply(route, { code: 'AUTH_REQUIRED' }, 401)
    if (path === '/api/auth/login') {
      state.loggedIn = true
      return reply(route, { user: { id: 'learner', email: 'learner@example.test' } })
    }
    if (path === '/api/profile/me') return reply(route, { profile })
    if (path === '/api/content/batch') {
      const body = route.request().postDataJSON() as { keys: string[]; language: string }
      state.batches.push(body)
      if (mode === 'failure')
        return reply(route, { code: 'DATABASE_ERROR', message: 'CMS unavailable' }, 500)
      return reply(route, {
        items: {
          ...(body.keys.includes('nav.docs')
            ? {
                'nav.docs':
                  mode === 'ambiguous' ? 'Never choose this category' : `CMS ${body.language} docs`,
              }
            : {}),
          ...(body.keys.includes('nav.logout') && mode !== 'missing'
            ? { 'nav.logout': `CMS ${body.language} logout` }
            : {}),
          ...(mode === 'placeholder'
            ? Object.fromEntries(
                body.keys.map(key => [key, `${key.toUpperCase()} ${body.language.toUpperCase()}`])
              )
            : {}),
        },
        missingKeys: [],
        ambiguousKeys:
          mode === 'ambiguous'
            ? ['nav.docs', 'nav.logout'].filter(key => body.keys.includes(key))
            : [],
      })
    }
    if (path === '/api/execute/capabilities') return reply(route, { capabilities: {} })
    return reply(route, {})
  })
  return state
}
const docsLink = (page: Page) => page.locator('header nav a[href="/docs"]')

for (const language of ['vi', 'en'] as const) {
  for (const mode of ['normal', 'ambiguous', 'missing', 'failure', 'placeholder'] as const) {
    test(`account menu has translated labels in ${language} when CMS is ${mode}`, async ({
      page,
    }) => {
      const state = await fixture(page, mode)
      state.loggedIn = true
      await page.addInitScript(language => localStorage.setItem('language', language), language)
      await page.goto('/')
      await page.locator('#v2-user-menu-button').click()
      await expect(
        page.getByRole('menuitem', {
          name:
            mode === 'normal'
              ? `CMS ${language} logout`
              : language === 'vi'
                ? 'Đăng xuất'
                : 'Logout',
          exact: true,
        })
      ).toBeVisible()
      await expect(
        page.getByRole('menuitem', {
          name: language === 'vi' ? 'Cài đặt' : 'Settings',
          exact: true,
        })
      ).toBeVisible()
      if (mode === 'failure') expect(state.batches).toHaveLength(1)
      else expect(state.batches.filter(batch => batch.keys.includes('nav.logout'))).toHaveLength(1)
      expect(
        state.paths.filter(
          path => path.startsWith('/api/content/') && path !== '/api/content/batch'
        )
      ).toEqual([])
      await expect(page.getByText('nav.logout', { exact: true })).toHaveCount(0)
      if (mode === 'placeholder') {
        await expect(page.locator('main')).not.toContainText('LANDING.STEP1.TITLE')
        await expect(
          page.getByText(language === 'vi' ? 'Quan sát' : 'Observe', { exact: true })
        ).toBeVisible()
        await docsLink(page).click()
        await expect(page).toHaveURL('/docs')
        await expect(page.getByRole('contentinfo')).toBeVisible()
        await expect(
          page.getByText(
            language === 'vi'
              ? 'console.log dùng để xem output nhanh.'
              : 'Use console.log to inspect output.',
            { exact: true }
          )
        ).toBeVisible()
        await expect(page.locator('main')).not.toContainText('DOCS.REF.TITLE')
      }
      if (mode === 'ambiguous') {
        await page.setViewportSize({ width: 390, height: 844 })
        await expect(
          page.getByRole('menuitem', {
            name: language === 'vi' ? 'Đăng xuất' : 'Logout',
            exact: true,
          })
        ).toBeVisible()
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
          true
        )
      }
    })
  }
}

test('CMS outage does not fan out or repeat across login and SPA navigation', async ({ page }) => {
  const state = await fixture(page, 'failure')
  await page.goto('/auth')
  await page.getByLabel('Email', { exact: true }).fill('learner@example.test')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('test-only-password')
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(docsLink(page)).toBeVisible()
  await docsLink(page).click()
  await expect(page).toHaveURL('/docs')
  await expect(page.getByRole('contentinfo')).toBeVisible()
  await page.locator('header nav a[href="/playground"]').click()
  await expect(page).toHaveURL('/playground')
  await expect(page.getByRole('contentinfo')).toBeVisible()
  expect(state.batches).toHaveLength(1)
  expect(
    state.paths.filter(path => path.startsWith('/api/content/') && path !== '/api/content/batch')
  ).toEqual([])
  expect(state.paths.filter(path => path === '/api/auth/me')).toHaveLength(1)
  expect(state.paths.filter(path => path === '/api/auth/login')).toHaveLength(1)
  expect(state.paths.filter(path => path === '/api/profile/me')).toHaveLength(1)
  expect(state.paths.filter(path => path === '/api/auth/refresh')).toHaveLength(1)
  await expect(page.getByText('Lỗi máy chủ. Vui lòng thử lại sau', { exact: true })).toHaveCount(0)
})
test('shared shell keys are requested once across pages and language switches reuse their own cache', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/')
  await expect(docsLink(page)).toHaveText('CMS vi docs')
  await docsLink(page).click()
  await expect(page).toHaveURL('/docs')
  await expect(page.getByRole('contentinfo')).toBeVisible()
  expect(
    state.batches.filter(batch => batch.language === 'vi' && batch.keys.includes('nav.docs'))
  ).toHaveLength(1)
  await page.getByTitle('Switch to English').click()
  await expect(docsLink(page)).toHaveText('CMS en docs')
  const beforeReturn = state.batches.length
  await page.getByTitle('Chuyển sang Tiếng Việt').click()
  await expect(docsLink(page)).toHaveText('CMS vi docs')
  expect(state.batches).toHaveLength(beforeReturn)
  expect(
    state.batches.every(
      batch => batch.keys.length <= 200 && new Set(batch.keys).size === batch.keys.length
    )
  ).toBe(true)
})
test('ambiguous CMS keys use translated fallback and do not trigger individual requests', async ({
  page,
}) => {
  const state = await fixture(page, 'ambiguous')
  await page.goto('/')
  await expect(docsLink(page)).toBeVisible()
  await expect(docsLink(page)).not.toContainText('Never choose')
  await docsLink(page).click()
  await expect(page.getByRole('contentinfo')).toBeVisible()
  expect(state.batches.filter(batch => batch.keys.includes('nav.docs'))).toHaveLength(1)
  expect(
    state.paths.filter(path => path.startsWith('/api/content/') && path !== '/api/content/batch')
  ).toEqual([])
})
test('one CMS revision causes one reload, while passive cache events cause none', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/')
  await expect(docsLink(page)).toHaveText('CMS vi docs')
  const preparedBatches = state.batches.length
  expect(preparedBatches).toBeGreaterThan(1)
  await page.evaluate(() => {
    for (let i = 0; i < 20; i++)
      window.dispatchEvent(new StorageEvent('storage', { key: `loopy_content_cache_${i}` }))
    window.dispatchEvent(
      new StorageEvent('storage', { key: 'loopy_content_revision', newValue: 'one confirmed edit' })
    )
  })
  await expect.poll(() => state.batches.length).toBe(preparedBatches * 2)
  expect(state.batches.filter(batch => batch.keys.includes('nav.docs'))).toHaveLength(2)
  await expect(docsLink(page)).toHaveText('CMS vi docs')
})
