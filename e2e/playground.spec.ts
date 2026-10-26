import { expect, test, type Page } from '@playwright/test'
import { mockApi, reply } from './fixtures/api'

async function fixture(page: Page) {
  const state = {
    failCapabilities: false,
    python: true,
    reads: 0,
    executions: [] as Array<{ language: string; code: string }>,
    pending: Promise.resolve(),
    failed: false,
    result: { output: 'Result', error: null, executionTime: 0 } as unknown,
  }
  await page.addInitScript(() => localStorage.setItem('language', 'vi'))
  await mockApi(page, async route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/content/batch') return reply(route, { items: {}, missingKeys: [] })
    if (path === '/api/auth/me' || path === '/api/auth/refresh' || path === '/api/admin-auth/me')
      return reply(route, { code: 'AUTH_REQUIRED' }, 401)
    if (path === '/api/execute/capabilities') {
      ++state.reads
      return reply(
        route,
        {
          capabilities: Object.fromEntries(
            ['javascript', 'python', 'cpp', 'java', 'go', 'rust'].map(language => [
              language,
              {
                supported: language === 'javascript' || (language === 'python' && state.python),
                runner:
                  language === 'javascript'
                    ? 'local'
                    : language === 'python' && state.python
                      ? 'glot'
                      : null,
                requiresRunner: language !== 'javascript',
                reason:
                  language === 'javascript' || (language === 'python' && state.python)
                    ? null
                    : 'Runner chưa sẵn sàng. Hãy chọn JavaScript.',
              },
            ])
          ),
        },
        state.failCapabilities ? 503 : 200
      )
    }
    if (path === '/api/execute') {
      state.executions.push(route.request().postDataJSON())
      await state.pending
      return reply(
        route,
        state.failed
          ? { code: 'RUNNER_UNAVAILABLE', message: 'Runner đang tạm dừng' }
          : state.result,
        state.failed ? 503 : 200
      )
    }
    return reply(route, {})
  })
  return state
}

test('capability failures block execution and retry preserves the draft', async ({ page }) => {
  const state = await fixture(page)
  state.failCapabilities = true
  await page.goto('/playground')
  await expect(page.getByRole('alert')).toContainText('trạng thái runner')
  await page.getByLabel('Code editor Python').fill('print("draft")')
  await expect(page.getByRole('button', { name: 'Chạy thử', exact: true })).toBeDisabled()
  state.failCapabilities = false
  await page.getByRole('button', { name: 'Thử lại trạng thái runner', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Chạy thử', exact: true })).toBeEnabled()
  await expect(page.getByLabel('Code editor Python')).toHaveValue('print("draft")')
  expect(state.executions).toHaveLength(0)
})
test('an unavailable external language stays editable and JavaScript offers a real executable alternative', async ({
  page,
}) => {
  const state = await fixture(page)
  state.python = false
  await page.goto('/playground')
  await expect(
    page.getByText('Runner chưa sẵn sàng. Hãy chọn JavaScript.', { exact: true })
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Chạy thử', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'JavaScript', exact: true }).click()
  await page.getByRole('button', { name: 'Chạy thử', exact: true }).click()
  await expect(page.getByRole('log', { name: 'Playground output' })).toHaveText('Result')
  expect(state.executions.map(run => run.language)).toEqual(['javascript'])
})
test('pending runs lock their source and cannot be duplicated', async ({ page }) => {
  const state = await fixture(page)
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/playground')
  await page.getByRole('button', { name: 'Chạy thử', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Đang chạy...', exact: true })).toBeDisabled()
  await expect(page.getByLabel('Code editor Python')).toHaveAttribute('readonly', '')
  expect(state.executions).toHaveLength(1)
  release()
  await expect(page.getByRole('log', { name: 'Playground output' })).toHaveText('Result')
  await expect(page.getByLabel('Code editor Python')).not.toHaveAttribute('readonly', '')
})
test('runtime errors preserve preceding stdout, while a service failure is retryable', async ({
  page,
}) => {
  const state = await fixture(page)
  state.result = { output: 'Before failure', error: 'RuntimeError', executionTime: 1 }
  await page.goto('/playground')
  await page.getByRole('button', { name: 'Chạy thử', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('RuntimeError')
  await expect(page.getByRole('log', { name: 'Playground output' })).toHaveText('Before failure')
  state.failed = true
  await page.getByRole('button', { name: 'Chạy thử', exact: true }).click()
  await expect(page.getByRole('alert')).toHaveText('Runner đang tạm dừng')
  await expect(page.getByRole('log', { name: 'Playground output' })).toBeEmpty()
  state.failed = false
  state.result = { output: '', error: null, executionTime: 0 }
  await page.getByRole('button', { name: 'Chạy thử', exact: true }).click()
  await expect(page.getByRole('log', { name: 'Playground output' })).toHaveText(
    'Chạy xong, không có output.'
  )
})
test('malformed execution success is an error instead of an empty successful run', async ({
  page,
}) => {
  const state = await fixture(page)
  state.result = { output: 0, error: false }
  await page.goto('/playground')
  await page.getByRole('button', { name: 'Chạy thử', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('kết quả chạy code hợp lệ')
  await expect(page.getByRole('log', { name: 'Playground output' })).toBeEmpty()
})
test('editing a completed run removes its old output and blank code cannot be submitted', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/playground')
  await page.getByRole('button', { name: 'Chạy thử', exact: true }).click()
  await expect(page.getByRole('log', { name: 'Playground output' })).toHaveText('Result')
  await page.getByLabel('Code editor Python').fill(' ')
  await expect(page.getByRole('log', { name: 'Playground output' })).toBeEmpty()
  await expect(page.getByRole('button', { name: 'Chạy thử', exact: true })).toBeDisabled()
  expect(state.executions).toHaveLength(1)
})
test('long output stays inside a phone viewport', async ({ page }) => {
  const state = await fixture(page)
  state.result = { output: 'x'.repeat(12000), error: null, executionTime: 0 }
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/playground')
  await page.getByRole('button', { name: 'Chạy thử', exact: true }).click()
  await expect(page.getByRole('log', { name: 'Playground output' })).toHaveText('x'.repeat(12000))
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  )
})
