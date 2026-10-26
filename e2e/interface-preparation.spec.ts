import { expect, test, type Page } from '@playwright/test'
import { mockApi, reply } from './fixtures/api'

test.use({ locale: 'vi-VN' })

async function fixture(page: Page, mode: 'normal' | 'failure' = 'normal') {
  const state = {
    batches: [] as Array<{ language: string; keys: string[] }>,
    paths: [] as string[],
    languageGate: 'en',
    gate: Promise.resolve(),
  }
  await mockApi(page, async route => {
    const path = new URL(route.request().url()).pathname
    state.paths.push(path)
    if (['/api/auth/me', '/api/auth/refresh', '/api/admin-auth/me'].includes(path))
      return reply(route, { code: 'AUTH_REQUIRED' }, 401)
    if (path === '/api/content/batch') {
      const body = route.request().postDataJSON() as { language: string; keys: string[] }
      state.batches.push(body)
      if (mode === 'failure') return reply(route, { code: 'CMS_UNAVAILABLE' }, 503)
      if (body.language === state.languageGate && body.keys.includes('profile.goal'))
        await state.gate
      return reply(route, { items: {}, missingKeys: body.keys })
    }
    if (path === '/api/execute/capabilities') return reply(route, { capabilities: {} })
    return reply(route, {})
  })
  return state
}

test('first visit waits for all English UI copy and page modules, then navigation reuses them', async ({
  page,
}) => {
  const state = await fixture(page)
  let release!: () => void
  state.gate = new Promise(done => {
    release = done
  })
  const modules: string[] = []
  page.on('request', request => {
    const path = new URL(request.url()).pathname
    if (path.startsWith('/src/pages/')) modules.push(path)
  })
  await page.goto('/')
  await expect
    .poll(() => state.batches.some(batch => batch.keys.includes('profile.goal')))
    .toBe(true)
  await expect(page.getByTestId('interface-preparation')).toBeVisible()
  await expect(page.locator('header')).toHaveCount(0)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await page.screenshot({
    path: '../artifacts/interface-preparation/loading-en.png',
    animations: 'disabled',
  })
  release()
  await expect(page.getByTestId('interface-preparation')).toHaveCount(0)
  const firstBatches = state.batches.length
  expect(firstBatches).toBeGreaterThan(1)
  expect(state.batches.every(batch => batch.language === 'en' && batch.keys.length <= 200)).toBe(
    true
  )
  expect(new Set(state.batches.flatMap(batch => batch.keys)).size).toBe(
    state.batches.flatMap(batch => batch.keys).length
  )
  expect(modules).toContain('/src/pages/DocsPage.tsx')
  expect(modules).toContain('/src/pages/PlaygroundPage.tsx')
  expect(modules).toContain('/src/pages/admin/LessonEditorPage.tsx')
  expect(
    state.paths.filter(path => path.startsWith('/api/admin/') || path.startsWith('/api/progress/'))
  ).toEqual([])
  const firstModules = modules.length
  await page.clock.setFixedTime(new Date(Date.now() + 6 * 60 * 1000))
  await page.locator('header nav a[href="/docs"]').click()
  await expect(page.locator('main')).toBeVisible()
  await page.locator('header nav a[href="/playground"]').click()
  await expect(page.getByRole('textbox', { name: 'Code editor Python' })).toBeVisible()
  expect(state.batches).toHaveLength(firstBatches)
  expect(modules).toHaveLength(firstModules)
})

test('Vietnamese waits for the whole locale before commit, retains drafts, and English is reused', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/playground')
  const editor = page.getByRole('textbox', { name: 'Code editor Python' })
  await editor.fill('print("keep my draft")')
  const before = state.batches.length
  state.languageGate = 'vi'
  let release!: () => void
  state.gate = new Promise(done => {
    release = done
  })
  await page.getByTitle('Chuyển sang Tiếng Việt', { exact: true }).click()
  await expect
    .poll(() =>
      state.batches.some(batch => batch.language === 'vi' && batch.keys.includes('profile.goal'))
    )
    .toBe(true)
  await expect(page.getByTestId('interface-preparation')).toContainText('Đang chuẩn bị giao diện')
  await page.screenshot({
    path: '../artifacts/interface-preparation/loading-vi.png',
    animations: 'disabled',
  })
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  expect(await page.locator('[aria-label="Code editor Python"]').inputValue()).toBe(
    'print("keep my draft")'
  )
  release()
  await expect(page.getByTestId('interface-preparation')).toHaveCount(0)
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
  await expect(editor).toHaveValue('print("keep my draft")')
  expect(state.batches.filter(batch => batch.language === 'vi')).toHaveLength(before)
  const allBatches = state.batches.length
  await page.getByTitle('Switch to English', { exact: true }).click()
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByTestId('interface-preparation')).toHaveCount(0)
  expect(state.batches).toHaveLength(allBatches)
  await expect(editor).toHaveValue('print("keep my draft")')
})

test('CMS outage still prepares complete English fallback without request fan-out on navigation', async ({
  page,
}) => {
  const state = await fixture(page, 'failure')
  await page.goto('/')
  await expect(page.getByTestId('interface-preparation')).toHaveCount(0)
  await expect(page.locator('header')).toBeVisible()
  await page.locator('header nav a[href="/docs"]').click()
  await expect(page.getByRole('contentinfo')).toBeVisible()
  expect(state.batches).toHaveLength(1)
  expect(
    state.paths.filter(path => path.startsWith('/api/content/') && path !== '/api/content/batch')
  ).toEqual([])
})

test('an explicit saved Vietnamese preference is prepared on reload', async ({ page }) => {
  const state = await fixture(page)
  await page.addInitScript(() => localStorage.setItem('language', 'vi'))
  await page.goto('/docs')
  await expect(page.locator('header')).toBeVisible()
  await expect(page.locator('html')).toHaveAttribute('lang', 'vi')
  expect(state.batches.every(batch => batch.language === 'vi')).toBe(true)
})
