import { checkAdminLayout } from './fixtures/admin-layout'
import { expect, test, type Page } from '@playwright/test'
import { mockApi, reply, replyRaw } from './fixtures/api'

async function fixture(page: Page) {
  const state = { attempts: 0, loggedIn: false, failure: 503, pending: Promise.resolve() }
  const user = { id: 'admin', email: 'admin@example.test', role: 'admin', is_admin: true }
  await mockApi(page, async route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/me' || path === '/api/auth/refresh')
      return reply(route, { code: 'AUTH_REQUIRED' }, 401)
    if (path === '/api/admin-auth/me')
      return replyRaw(
        route,
        state.loggedIn ? { success: true, user } : { success: false },
        state.loggedIn ? 200 : 401
      )
    if (path === '/api/admin-auth/login') {
      ++state.attempts
      await state.pending
      if (state.failure)
        return reply(
          route,
          {
            code: state.failure === 503 ? 'ADMIN_SESSION_UNAVAILABLE' : 'INVALID_CREDENTIALS',
            message:
              state.failure === 503
                ? 'Dịch vụ phiên admin đang mất kết nối. Vui lòng thử lại sau ít giây.'
                : 'Email hoặc mật khẩu không đúng.',
          },
          state.failure
        )
      state.loggedIn = true
      return replyRaw(route, { success: true, user })
    }
    if (path === '/api/content/batch') return reply(route, { items: {}, missingKeys: [] })
    return reply(route, {})
  })
  await page.goto('/admin/login')
  await page.getByLabel('Email', { exact: true }).fill('admin@example.test')
  await page.getByLabel('Mật khẩu', { exact: true }).fill('test-only-password')
  return state
}

test('a session-store outage explains the failure, keeps the form and supports an explicit retry', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Dịch vụ phiên admin đang mất kết nối')
  await expect(page.getByLabel('Email', { exact: true })).toHaveValue('admin@example.test')
  await expect(page.getByLabel('Mật khẩu', { exact: true })).toHaveValue('test-only-password')
  expect(state.attempts).toBe(1)
  await expect(page).toHaveURL('/admin/login')
  state.failure = 0
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page).toHaveURL('/admin')
  expect(state.attempts).toBe(2)
})
test('two immediate submit events start one login and freeze its credential snapshot', async ({
  page,
}) => {
  const state = await fixture(page)
  let finish!: () => void
  state.pending = new Promise(resolve => {
    finish = resolve
  })
  state.failure = 0
  await page.locator('form').evaluate(form => {
    if (!(form instanceof HTMLFormElement)) throw new Error('Login form missing')
    form.requestSubmit()
    form.requestSubmit()
  })
  await expect.poll(() => state.attempts).toBe(1)
  await expect(page.getByLabel('Email', { exact: true })).toBeDisabled()
  await expect(page.getByLabel('Mật khẩu', { exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Đang xử lý...', exact: true })).toBeDisabled()
  finish()
  await expect(page).toHaveURL('/admin')
  expect(state.attempts).toBe(1)
})
test('invalid credentials remain an authentication error and never grant an admin route', async ({
  page,
}) => {
  const state = await fixture(page)
  state.failure = 401
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Email hoặc mật khẩu không đúng')
  await expect(page).toHaveURL('/admin/login')
  expect(state.attempts).toBe(1)
  expect(state.loggedIn).toBe(false)
})

test('admin layout: admin-login handles desktop and mobile', async ({ page }, info) => {
  const state = await fixture(page)
  await checkAdminLayout(page, info, '/admin/login', 'Đăng nhập admin')
  expect(state.attempts).toBe(0)
})
