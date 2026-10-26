import { expect, test, type Page } from '@playwright/test'
import { mockApi, reply } from './fixtures/api'

const languages = [
  { id: 'cpp', name: 'C++' },
  { id: 'javascript', name: 'JavaScript' },
  { id: 'python', name: 'Python' },
]

async function fixture(page: Page, returning = false, copy: Record<string, string> = {}) {
  const state = { reads: 0, mode: 'normal', writes: [] as string[] }
  await mockApi(page, async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (request.method() !== 'GET' && !['/api/content/batch', '/api/auth/refresh'].includes(path))
      state.writes.push(path)
    if (path === '/api/auth/me' && returning)
      return reply(route, {
        user: {
          id: 'learner',
          email: 'learner@example.test',
          profile: {
            id: 'learner',
            onboardingCompleted: true,
            preferredLanguage: 'python',
          },
        },
      })
    if (['/api/auth/me', '/api/auth/refresh', '/api/admin-auth/me'].includes(path))
      return reply(route, { code: 'AUTH_REQUIRED' }, 401)
    if (path === '/api/content/batch') {
      const keys = request.postDataJSON().keys as string[]
      return reply(route, {
        items: Object.fromEntries(keys.filter(key => key in copy).map(key => [key, copy[key]])),
        missingKeys: keys.filter(key => !(key in copy)),
      })
    }
    if (path === '/api/languages') {
      ++state.reads
      if (state.mode === 'failure') return reply(route, { code: 'UNAVAILABLE' }, 503)
      if (state.mode === 'malformed') return reply(route, { items: [] })
      return reply(route, { languages: state.mode === 'empty' ? [] : languages })
    }
    return reply(route, {})
  })
  return state
}

test('home has a clear first step, truthful preview and keyboard FAQ', async ({ page }) => {
  const state = await fixture(page, false, {
    'landing.hero.title': 'Learn one useful thing at a time.',
  })
  await page.goto('/')
  const main = page.getByRole('main')
  await expect(main.getByRole('heading', { level: 1 })).toHaveText(
    'Learn one useful thing at a time.',
    { timeout: 15000 }
  )
  await expect(main.getByRole('link', { name: 'Try the first lesson' })).toHaveAttribute(
    'href',
    '/onboarding'
  )
  await expect(main.locator('figure')).toContainText('illustrative example')
  await expect(main.locator('figure')).toContainText('Hello, Loopy!')
  await expect(main.locator('figure').getByRole('button')).toHaveCount(0)
  await expect(main).not.toContainText('Test #1')
  const question = main.locator('summary').filter({ hasText: 'How are Run and Check different?' })
  await question.focus()
  await page.keyboard.press('Enter')
  await expect(question.locator('..')).toHaveAttribute('open', '')
  await expect(question.locator('..')).toContainText('Run shows your code output')
  await page.keyboard.press('Enter')
  await expect(question.locator('..')).not.toHaveAttribute('open', '')
  expect(state.reads).toBe(0)
  expect(state.writes).toEqual([])
})

test('returning learners can continue their saved language from either entry page', async ({
  page,
}) => {
  await fixture(page, true)
  for (const path of ['/', '/languages']) {
    await page.goto(path)
    await expect(
      page.getByRole('main').getByRole('link', { name: 'Continue learning', exact: true })
    ).toHaveAttribute('href', '/library/python')
  }
})

test('catalog localizes without another catalog request and links to actual path details', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/languages')
  for (const language of languages)
    await expect(
      page.getByRole('link', { name: `Explore path: ${language.name}`, exact: true })
    ).toHaveAttribute('href', `/languages/${language.id}`)
  await expect(
    page.getByRole('main').getByRole('link', { name: 'Help me choose' })
  ).toHaveAttribute('href', '/onboarding')
  expect(state.reads).toBe(1)
  await page.getByTitle('Chuyển sang Tiếng Việt', { exact: true }).click()
  await expect(
    page.getByRole('link', { name: 'Khám phá lộ trình: Python', exact: true })
  ).toBeVisible()
  await expect(page.getByRole('main')).toContainText('cú pháp dễ đọc')
  await expect(page.getByRole('main')).not.toContainText('Not sure where')
  expect(state.reads).toBe(1)
  expect(state.writes).toEqual([])
})

for (const mode of ['failure', 'malformed']) {
  test(`catalog ${mode} stays an error and retries only on request`, async ({ page }) => {
    const state = await fixture(page)
    state.mode = mode
    await page.goto('/languages')
    await expect(page.getByRole('alert')).toContainText('could not load')
    await expect(page.getByRole('main')).not.toContainText('No learning paths are available')
    expect(state.reads).toBe(1)
    state.mode = 'normal'
    await page.getByRole('button', { name: 'Try again' }).click()
    await expect(
      page.getByRole('link', { name: 'Explore path: Python', exact: true })
    ).toBeVisible()
    expect(state.reads).toBe(2)
  })
}

test('a confirmed empty catalog has its own state and no invented paths', async ({ page }) => {
  const state = await fixture(page)
  state.mode = 'empty'
  await page.goto('/languages')
  await expect(page.getByRole('status')).toContainText('No learning paths are available yet')
  await expect(page.getByRole('alert')).toHaveCount(0)
  await expect(page.getByRole('main').getByRole('link', { name: /^Explore path:/ })).toHaveCount(0)
})

for (const language of ['en', 'vi']) {
  for (const theme of ['light', 'dark']) {
    test(`${language}/${theme} entry pages fit 320px through desktop`, async ({ page }) => {
      test.setTimeout(60000)
      await fixture(page)
      const errors: string[] = []
      page.on('pageerror', error => errors.push(error.message))
      await page.addInitScript(
        ({ language, theme }) => {
          localStorage.setItem('language', language)
          localStorage.setItem('loopy_theme', theme)
        },
        { language, theme }
      )
      for (const path of ['/', '/languages']) {
        await page.goto(path)
        await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
        await expect(page.locator('html')).toHaveAttribute('data-theme', theme)
        await expect(page.getByRole('main').locator('.learning-entry-accent').first()).toHaveCSS(
          'color',
          theme === 'dark' ? 'rgb(84, 217, 196)' : 'rgb(8, 83, 97)'
        )
        if (path === '/languages')
          await expect(page.getByRole('heading', { name: 'Python', exact: true })).toBeVisible()
        for (const width of [320, 390, 768, 1440]) {
          await page.setViewportSize({ width, height: 900 })
          await page.evaluate(async () => {
            await document.fonts.ready
            await Promise.all(
              document
                .getAnimations()
                .filter(animation => animation.effect?.getComputedTiming().iterations !== Infinity)
                .map(animation => animation.finished.catch(() => undefined))
            )
          })
          const overflow = await page.getByRole('main').evaluate(main =>
            [...main.querySelectorAll('*')]
              .filter(element => {
                const bounds = element.getBoundingClientRect()
                return (
                  !element.closest('[aria-hidden="true"]') &&
                  bounds.width > 0 &&
                  (bounds.left < -1 || bounds.right > innerWidth + 1)
                )
              })
              .map(element => element.tagName)
          )
          expect(overflow, `${path}/${width}`).toEqual([])
          if (width === 390 || width === 1440)
            await page.screenshot({
              path: `../artifacts/ui-round-1/2026-10-26/verified-${path === '/' ? 'home' : 'languages'}-${language}-${theme}-${width}.png`,
              fullPage: true,
              animations: 'disabled',
            })
        }
      }
      expect(errors).toEqual([])
    })
  }
}
