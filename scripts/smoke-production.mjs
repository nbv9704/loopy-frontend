import { preview } from 'vite'
import { chromium, expect } from '@playwright/test'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const origin = 'http://127.0.0.1:5181'
let server
let browser
try {
  server = await preview({
    configFile: false,
    root,
    preview: { host: '127.0.0.1', port: 5181, strictPort: true },
  })
  browser = await chromium.launch()
  const context = await browser.newContext({ colorScheme: 'light' })
  // Test the compiled bundle without reaching an actual configured service.
  await context.route('**/*', async route => {
    const url = new URL(route.request().url())
    if (url.pathname.startsWith('/api/')) {
      const headers = {
        'Access-Control-Allow-Origin': origin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
        'Access-Control-Allow-Headers': 'content-type',
      }
      if (route.request().method() === 'OPTIONS') return route.fulfill({ status: 204, headers })
      const unauthorized = ['/api/auth/me', '/api/auth/refresh', '/api/admin-auth/me'].includes(
        url.pathname
      )
      const data =
        url.pathname === '/api/content/batch'
          ? { items: {}, missingKeys: [] }
          : {
              items: [],
              total: 0,
              limit: Number(url.searchParams.get('limit') || 20),
              offset: Number(url.searchParams.get('offset') || 0),
            }
      return route.fulfill({
        headers,
        status: unauthorized ? 401 : 200,
        contentType: 'application/json',
        body: JSON.stringify(
          unauthorized
            ? { success: false, error: { code: 'AUTH_REQUIRED', message: 'Fixture guest' } }
            : { success: true, data }
        ),
      })
    }
    return url.origin === origin ? route.continue() : route.abort()
  })
  const page = await context.newPage()
  let releaseScripts
  const scriptsReady = new Promise(resolve => {
    releaseScripts = resolve
  })
  await page.route('**/assets/*.js', async route => {
    await scriptsReady
    await route.continue()
  })
  const errors = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('response', response => {
    if (
      response.url().startsWith(origin) &&
      ['script', 'stylesheet'].includes(response.request().resourceType()) &&
      response.status() >= 400
    )
      errors.push('Compiled asset failed to load')
  })
  for (const pathname of ['/', '/docs', '/auth', '/admin/login']) {
    if (pathname === '/') {
      await page.goto(origin + pathname, { waitUntil: 'commit' })
      const bootstrap = page.getByTestId('bootstrap-loading')
      await expect(bootstrap).toBeVisible()
      await expect(bootstrap.locator('[data-bootstrap-language="en"]')).toBeVisible()
      await expect(bootstrap.locator('.loopy-page')).toHaveCSS(
        'background-color',
        'rgb(247, 251, 255)'
      )
      await expect(page.locator('body')).toHaveCSS('margin', '0px')
      releaseScripts()
    } else await page.goto(origin + pathname)
    await expect(page.getByTestId('interface-preparation')).toHaveCount(0, { timeout: 15000 })
    await expect(page.getByTestId('bootstrap-loading')).toHaveCount(0)
    if (pathname.endsWith('auth') || pathname.endsWith('login'))
      await expect(page.locator('input[type=password]').first()).toBeVisible({ timeout: 15000 })
    else await expect(page.locator('h1').first()).toBeVisible({ timeout: 15000 })
  }
  if (errors.length) throw new Error(`Production smoke found ${errors.length} page/asset errors`)
  console.log(
    'Compiled production smoke: pre-JavaScript skeleton and 4 direct routes, 0 page/asset errors; API fixtures only.'
  )
} catch (error) {
  console.error(error instanceof Error ? error.message : 'Production smoke failed')
  process.exitCode = 1
} finally {
  await browser?.close()
  if (server) await new Promise(resolve => server.httpServer.close(resolve))
}
