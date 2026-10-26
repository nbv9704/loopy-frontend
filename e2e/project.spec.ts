import { test, expect, type Page } from '@playwright/test'
import { mockApi, reply, replyRaw } from './fixtures/api'

async function fixture(
  page: Page,
  options: { admin?: boolean; pendingPython?: Promise<void> } = {}
) {
  const state = { adminFailure: false, admin: Boolean(options.admin), adminId: 'admin', checks: 0 }
  await page.addInitScript(() => localStorage.setItem('language', 'vi'))
  await mockApi(page, async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (path === '/api/auth/me' || path === '/api/auth/refresh')
      return reply(route, { code: 'AUTH_REQUIRED', message: 'Not authenticated' }, 401)
    if (path === '/api/admin-auth/me') {
      ++state.checks
      if (state.adminFailure) return reply(route, { message: 'Session check unavailable' }, 503)
      return replyRaw(
        route,
        state.admin
          ? {
              success: true,
              user: {
                id: state.adminId,
                email: 'admin@example.test',
                role: 'admin',
                is_admin: true,
              },
            }
          : { success: false },
        state.admin ? 200 : 401
      )
    }
    if (path === '/api/content/batch') return reply(route, { items: {}, missingKeys: [] })
    if (path === '/api/languages')
      return reply(route, {
        languages: [
          {
            id: 'javascript',
            name: 'JavaScript',
            displayName: 'JavaScript',
            canRunInBrowser: true,
          },
          { id: 'python', name: 'Python', displayName: 'Python', canRunInBrowser: false },
        ],
      })
    if (path === '/api/paths')
      return reply(route, {
        paths: [
          { id: 'js-path', languageId: 'javascript', goalId: 'start_from_zero', title: 'Beginner' },
        ],
      })
    if (path.startsWith('/api/paths/'))
      return reply(route, { chapters: [{ id: 'chapter', title: 'First chapter', lessonCount: 1 }] })
    if (path.startsWith('/api/languages/javascript'))
      return reply(route, {
        language: { id: 'javascript', name: 'JavaScript' },
        chapters: [],
        lessons: [],
      })
    if (path === '/api/admin/chapters')
      return reply(route, [{ id: 'chapter', title: 'First chapter', language_id: 'javascript' }])
    if (path === '/api/execute/capabilities')
      return reply(route, {
        capabilities: Object.fromEntries(
          ['javascript', 'python', 'cpp', 'java', 'go', 'rust'].map(id => [
            id,
            {
              supported: true,
              runner: id === 'javascript' ? 'local' : 'piston',
              requiresRunner: id !== 'javascript',
              reason: null,
            },
          ])
        ),
      })
    if (path === '/api/execute') {
      const language = request.postDataJSON().language
      if (language === 'python' && options.pendingPython) await options.pendingPython
      return reply(route, {
        output: language === 'python' ? 'Old Python result' : 'Fresh JavaScript result',
        error: null,
        executionTime: 1,
      })
    }
    return reply(route, {})
  })
  return state
}

test('public navigation has implemented destinations and pages fit desktop/mobile', async ({
  page,
}) => {
  test.setTimeout(60000)
  await fixture(page)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of [
      '/',
      '/languages',
      '/languages/javascript',
      '/docs',
      '/playground',
      '/onboarding',
      '/practice',
    ]) {
      await page.goto(path)
      await expect(page.getByRole('heading', { level: 1 }).first()).toBeVisible()
      await expect(page.getByRole('contentinfo')).toBeVisible()
      await page.evaluate(async () => {
        await document.fonts.ready
        await Promise.all(
          document
            .getAnimations()
            .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
            .map(animation => animation.finished.catch(() => undefined))
        )
      })
      await expect(page.getByText('Trang này không tồn tại.', { exact: true })).toHaveCount(0)
      if (path === '/docs') {
        expect(
          await page
            .locator('a[href^="#"]')
            .evaluateAll(links =>
              links.every(link =>
                Boolean(document.getElementById(link.getAttribute('href')!.slice(1)))
              )
            )
        ).toBe(true)
      }
      if (path === '/')
        await expect(page.getByRole('button', { name: 'Kiểm tra', exact: true })).toHaveCount(0)
      const layout = await page.evaluate(() => ({
        width: innerWidth,
        scroll: document.documentElement.scrollWidth,
        overflow: [...document.querySelectorAll('body *')]
          .filter(element => element.scrollWidth > element.clientWidth + 2)
          .slice(0, 16)
          .map(element => ({
            tag: element.tagName,
            class: element.className,
            client: element.clientWidth,
            scroll: element.scrollWidth,
            text: element.textContent?.slice(0, 60),
          })),
        wide: [...document.querySelectorAll('body *')]
          .filter(element => element.getBoundingClientRect().right > innerWidth + 1)
          .slice(0, 10)
          .map(element => ({
            tag: element.tagName,
            class: element.className,
            width: element.getBoundingClientRect().width,
            text: element.textContent?.slice(0, 60),
          })),
      }))
      expect(
        layout.scroll <= layout.width,
        `${path} at ${width}px: ${JSON.stringify(layout)}`
      ).toBe(true)
      const destinations = await page
        .getByRole('contentinfo')
        .getByRole('link')
        .evaluateAll(links => links.map(link => link.getAttribute('href')))
      expect(
        destinations.every(href =>
          ['/', '/languages', '/onboarding', '/practice', '/docs', '/playground'].includes(
            href || ''
          )
        )
      ).toBe(true)
    }
  }
  expect(errors).toEqual([])
})

test('a previous Playground run cannot overwrite another language or claim sample output as execution', async ({
  page,
}) => {
  let release!: () => void
  const pendingPython = new Promise<void>(resolve => {
    release = resolve
  })
  await fixture(page, { pendingPython })
  await page.goto('/playground')
  await expect(page.getByLabel('Code editor Python')).toBeVisible()
  await page.getByRole('button', { name: 'Chạy thử', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Đang chạy...', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'JavaScript', exact: true }).click()
  await expect(page.getByLabel('Code editor JavaScript')).toBeVisible()
  await page.getByRole('button', { name: 'Chạy thử', exact: true }).click()
  await expect(page.getByText('Fresh JavaScript result', { exact: true })).toBeVisible()
  const response = page.waitForResponse(
    result =>
      result.url().endsWith('/api/execute') && result.request().postDataJSON().language === 'python'
  )
  release()
  await response
  await expect(page.getByText('Old Python result', { exact: true })).toHaveCount(0)
})

test('onboarding cannot continue with a path belonging to another language', async ({ page }) => {
  await fixture(page)
  await page.goto('/onboarding')
  await page.getByRole('button', { name: /Python/ }).click()
  await page.getByRole('button', { name: 'Tiếp tục', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Tiếp tục', exact: true })).toBeDisabled()
})

test('a failed background admin check preserves unsaved editor content', async ({ page }) => {
  await page.clock.install()
  const state = await fixture(page, { admin: true })
  await page.goto('/admin/lessons/new')
  const title = page.getByRole('textbox', { name: 'Title', exact: true })
  await title.fill('Unsaved lesson')
  state.adminFailure = true
  await page.clock.fastForward(121000)
  await expect.poll(() => state.checks).toBeGreaterThan(1)
  await expect(title).toHaveValue('Unsaved lesson')
  await expect(page).toHaveURL(/\/admin\/lessons\/new$/)
})

test('admin bootstrap service failure has retry rather than a false logout', async ({ page }) => {
  const state = await fixture(page, { admin: true })
  state.adminFailure = true
  await page.goto('/admin/lessons/new')
  await expect(page.getByRole('alert')).toContainText('Session check unavailable')
  state.adminFailure = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Title', exact: true })).toBeVisible()
})

test('switching the shared admin session does not retain the previous account editor draft', async ({
  page,
}) => {
  await page.clock.install()
  const state = await fixture(page, { admin: true })
  await page.goto('/admin/lessons/new')
  const title = page.getByRole('textbox', { name: 'Title', exact: true })
  await title.fill('First account private draft')
  state.adminId = 'second-admin'
  await page.clock.fastForward(121000)
  await expect.poll(() => state.checks).toBeGreaterThan(1)
  await expect(title).toHaveValue('')
})
