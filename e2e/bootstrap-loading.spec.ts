import { expect, test } from '@playwright/test'
import { mockApi, reply } from './fixtures/api'

test.use({ locale: 'vi-VN' })

test('loading keeps its animation phase across HTML, Auth and preparation, with seamless loops', async ({
  page,
}) => {
  await page.emulateMedia({ colorScheme: 'dark', reducedMotion: 'no-preference' })
  await page.route('https://fonts.googleapis.com/**', route => route.abort())
  let releaseMain!: () => void
  let releaseAuth!: () => void
  let releaseCopy!: () => void
  const mainGate = new Promise<void>(resolve => {
    releaseMain = resolve
  })
  const authGate = new Promise<void>(resolve => {
    releaseAuth = resolve
  })
  const copyGate = new Promise<void>(resolve => {
    releaseCopy = resolve
  })
  await page.route('**/src/main.tsx', async route => {
    await mainGate
    await route.continue()
  })
  await mockApi(page, async route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/me') await authGate
    if (['/api/auth/me', '/api/auth/refresh', '/api/admin-auth/me'].includes(path))
      return reply(route, { code: 'AUTH_REQUIRED' }, 401)
    if (path === '/api/content/batch') {
      await copyGate
      return reply(route, { items: {}, missingKeys: [] })
    }
    return reply(route, {})
  })
  await page.goto('/docs', { waitUntil: 'commit' })
  await expect(page.getByTestId('bootstrap-loading')).toBeVisible()
  await expect(page.getByTestId('bootstrap-loading').locator('.animate-pulse').first()).toHaveCSS(
    'animation-name',
    'loopyLoadingPulse'
  )
  // Put the visible HTML skeleton mid-cycle so restarting at zero would cause a clear flash.
  const epoch = await page.evaluate(async () => {
    await new Promise(requestAnimationFrame)
    const now = document.timeline.currentTime
    if (typeof now !== 'number') throw new Error('Missing animation timeline')
    const start = now - 1200
    for (const animation of document
      .querySelector('.loopy-loading-screen')!
      .getAnimations({ subtree: true }))
      animation.startTime = start
    return start
  })
  const expectSamePhase = async () => {
    await expect
      .poll(() =>
        page.evaluate(expected => {
          const root = document.querySelector(
            '[data-testid="interface-preparation"] .loopy-loading-screen'
          )
          const animations = root?.getAnimations({ subtree: true }) ?? []
          return {
            hasAnimations: animations.length > 0,
            invalid: animations
              .filter(
                animation =>
                  typeof animation.startTime !== 'number' ||
                  Math.abs(animation.startTime - expected) >= 1 ||
                  animation.effect?.getTiming().duration !== 3200
              )
              .map(animation => ({
                name: (animation as CSSAnimation).animationName,
                start: animation.startTime,
                expected,
                duration: animation.effect?.getTiming().duration,
              })),
          }
        }, epoch)
      )
      .toEqual({ hasAnimations: true, invalid: [] })
  }
  releaseMain()
  const preparation = page.getByTestId('interface-preparation')
  await expect(preparation).toBeVisible({ timeout: 15000 })
  await expectSamePhase()
  const authScreen = await preparation.locator('.loopy-loading-screen').elementHandle()
  releaseAuth()
  await expect.poll(() => authScreen!.evaluate(node => node.isConnected)).toBe(false)
  await expectSamePhase()

  const edges = await preparation.locator('.loopy-loading-screen').evaluate(root =>
    root.getAnimations({ subtree: true }).map(animation => {
      animation.pause()
      const { duration, delay } = animation.effect!.getTiming()
      const target = (animation.effect as KeyframeEffect).target as HTMLElement
      const read = () => {
        const style = getComputedStyle(target)
        return {
          opacity: Number(style.opacity),
          transform: style.transform,
          shadow: style.textShadow,
        }
      }
      animation.currentTime = Number(duration) + (delay ?? 0) - 1
      const before = read()
      animation.currentTime = Number(duration) + (delay ?? 0) + 1
      return { before, after: read() }
    })
  )
  expect(edges.length).toBeGreaterThan(0)
  for (const { before, after } of edges) {
    expect(Math.abs(before.opacity - after.opacity)).toBeLessThan(0.005)
    expect(after.transform).toBe(before.transform)
    expect(after.shadow).toBe(before.shadow)
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const selector of ['.animate-pulse', '.animate-v2-loading-glow', '.loopy-loading-message'])
    await expect(preparation.locator(selector).first()).toHaveCSS('animation-name', 'none')
  releaseCopy()
  await expect(preparation).toHaveCount(0, { timeout: 15000 })
  await expect(page.locator('header')).toBeVisible()
})

for (const scenario of [
  { name: 'en-light', language: 'en', theme: 'light', width: 1280, blocked: false },
  { name: 'vi-dark', language: 'vi', theme: 'dark', width: 390, blocked: false },
  { name: 'blocked-storage', language: 'en', theme: 'dark', width: 768, blocked: true },
] as const) {
  test(`first paint and refresh keep the existing skeleton before React: ${scenario.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: scenario.width, height: 800 })
    await page.emulateMedia({
      colorScheme: scenario.blocked ? 'dark' : scenario.theme === 'dark' ? 'light' : 'dark',
    })
    await page.addInitScript(options => {
      if (options.blocked) {
        for (const method of ['getItem', 'setItem'])
          Object.defineProperty(Storage.prototype, method, {
            configurable: true,
            value() {
              throw new DOMException('Storage blocked', 'SecurityError')
            },
          })
      } else {
        localStorage.setItem('language', options.language)
        localStorage.setItem('loopy_theme', options.theme)
      }
    }, scenario)
    await page.route('https://fonts.googleapis.com/**', route => route.abort())
    let moduleGate = Promise.resolve()
    let copyGate = Promise.resolve()
    await page.route('**/src/main.tsx', async route => {
      await moduleGate
      await route.continue()
    })
    await mockApi(page, async route => {
      const path = new URL(route.request().url()).pathname
      if (['/api/auth/me', '/api/auth/refresh', '/api/admin-auth/me'].includes(path))
        return reply(route, { code: 'AUTH_REQUIRED' }, 401)
      if (path === '/api/content/batch') {
        await copyGate
        return reply(route, { items: {}, missingKeys: [] })
      }
      return reply(route, {})
    })

    for (const refresh of [false, true]) {
      let releaseModule!: () => void
      let releaseCopy!: () => void
      moduleGate = new Promise(resolve => {
        releaseModule = resolve
      })
      copyGate = new Promise(resolve => {
        releaseCopy = resolve
      })
      if (refresh) await page.reload({ waitUntil: 'commit' })
      else await page.goto('/docs', { waitUntil: 'commit' })

      const bootstrap = page.getByTestId('bootstrap-loading')
      await expect(bootstrap).toBeVisible()
      await expect(page.locator('html')).toHaveAttribute('lang', scenario.language)
      await expect(page.locator('html')).toHaveAttribute('data-theme', scenario.theme)
      await expect(
        bootstrap.locator(`[data-bootstrap-language="${scenario.language}"]`)
      ).toBeVisible()
      await expect(
        bootstrap.locator(`[data-bootstrap-language="${scenario.language === 'en' ? 'vi' : 'en'}"]`)
      ).toBeHidden()
      await expect(bootstrap.locator('.loopy-page')).toHaveCSS(
        'background-color',
        scenario.theme === 'dark' ? 'rgb(7, 11, 20)' : 'rgb(247, 251, 255)'
      )
      await expect(page.locator('body')).toHaveCSS('margin', '0px')
      await expect(bootstrap).not.toContainText('Loopy…')
      const initialBounds = await bootstrap.locator('section').boundingBox()
      if (refresh)
        await page.screenshot({
          path: `../artifacts/interface-preparation/bootstrap-${scenario.name}.png`,
          animations: 'disabled',
        })

      releaseModule()
      const preparation = page.getByTestId('interface-preparation')
      await expect(preparation).toBeVisible({ timeout: 15000 })
      await expect(bootstrap).toHaveCount(0)
      await expect.poll(() => preparation.locator('section').boundingBox()).toEqual(initialBounds)
      await expect(preparation).toContainText(
        scenario.language === 'vi' ? 'Đang chuẩn bị giao diện' : 'Preparing your interface'
      )
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      )
      releaseCopy()
      await expect(preparation).toHaveCount(0, { timeout: 15000 })
      await expect(page.locator('header')).toBeVisible()
    }
  })
}
