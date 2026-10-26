import type { Page, Route } from '@playwright/test'

const headers = {
  'Access-Control-Allow-Origin': 'http://127.0.0.1:5180',
  'Access-Control-Allow-Credentials': 'true',
}

export function replyRaw(route: Route, body: unknown, status = 200) {
  return route.fulfill({ status, headers, json: body })
}

export function reply(route: Route, data: unknown, status = 200) {
  return replyRaw(
    route,
    status < 400 ? { success: true, data } : { success: false, error: data },
    status
  )
}

/** Intercept all API requests, including preflight; no unhandled call reaches a real backend. */
export async function mockApi(page: Page, handler: (route: Route) => Promise<void>) {
  await page.route('**/api/**', async route => {
    if (route.request().method() === 'OPTIONS')
      return route.fulfill({
        status: 204,
        headers: {
          ...headers,
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE',
          'Access-Control-Allow-Headers': 'content-type',
        },
      })
    await handler(route)
  })
}
