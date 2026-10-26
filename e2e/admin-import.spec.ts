import { checkAdminLayout } from './fixtures/admin-layout'
import { expect, test, type Page } from '@playwright/test'
import { mockApi, reply, replyRaw } from './fixtures/api'

const payload = {
  chapterId: '11111111-1111-4111-8111-111111111111',
  lessons: [{ lessonId: 'intro', title: 'Intro', lessonType: 'concept', orderIndex: 0 }],
}
const receipt = {
  lessonsCreated: 1,
  testCasesCreated: 0,
  testCasesReplaced: 0,
  stepsCreated: 0,
  stepsReplaced: 0,
  errors: [],
}
const record = (id: string, status = 'success') => ({
  id,
  admin_id: 'admin',
  chapter_id: payload.chapterId,
  file_name: `${id}.json`,
  lessons_count: 1,
  test_cases_count: 0,
  errors_count: 0,
  status,
  created_at: '2026-10-23T00:00:00Z',
  chapters: { id: payload.chapterId, title: 'Chapter', language_id: 'javascript' },
})

async function fixture(page: Page) {
  const state = {
    writes: [] as Record<string, unknown>[],
    pending: Promise.resolve(),
    importError: false,
    invalidReceipt: false,
    historyError: false,
    statsError: false,
    delayOldFilter: false,
    oldFilter: Promise.resolve(),
    historyTotal: 51,
    longHistory: false,
  }
  await mockApi(page, async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname === '/api/admin-auth/me')
      return replyRaw(route, {
        success: true,
        user: { id: 'admin', role: 'admin', is_admin: true },
      })
    if (url.pathname === '/api/auth/me' || url.pathname === '/api/auth/refresh')
      return reply(route, {}, 401)
    if (url.pathname === '/api/admin/import') {
      state.writes.push(request.postDataJSON())
      await state.pending
      if (state.importError)
        return replyRaw(
          route,
          {
            success: false,
            error: { code: 'SCHEMA_NOT_READY', message: 'Database chưa sẵn sàng để import.' },
          },
          503
        )
      return reply(route, state.invalidReceipt ? { ...receipt, lessonsCreated: 0 } : receipt)
    }
    if (url.pathname === '/api/admin/import-history/stats') {
      if (state.statsError)
        return replyRaw(
          route,
          { success: false, error: { message: 'Thống kê tạm gián đoạn' } },
          500
        )
      return reply(route, {
        totalImports: 51,
        successfulImports: 50,
        failedImports: 1,
        totalLessonsImported: 50,
        totalTestCasesImported: 0,
      })
    }
    if (url.pathname === '/api/admin/import-history') {
      const status = url.searchParams.get('status')
      if (state.delayOldFilter && !status) await state.oldFilter
      if (state.historyError)
        return replyRaw(route, { success: false, error: { message: 'Lịch sử tạm gián đoạn' } }, 500)
      const offset = Number(url.searchParams.get('offset') ?? 0),
        limit = Number(url.searchParams.get('limit') ?? 50)
      const total = status ? 1 : state.historyTotal
      return reply(route, {
        imports: Array.from({ length: Math.min(limit, Math.max(0, total - offset)) }, (_, index) =>
          record(
            state.longHistory
              ? 'x'.repeat(120) + (index || '')
              : status || `page-${offset + index}`,
            status || 'success'
          )
        ),
        total,
        limit,
        offset,
      })
    }
    if (url.pathname === '/api/admin/practice/sets') return reply(route, { items: [], total: 0 })
    return reply(route, [])
  })
  return state
}

test('history loading fits a narrow phone before records arrive', async ({ page }) => {
  await fixture(page)
  let release!: () => void
  const pending = new Promise<void>(resolve => {
    release = resolve
  })
  await page.route('**/api/admin/import-history**', async route => {
    await pending
    await route.fallback()
  })
  await page.setViewportSize({ width: 320, height: 960 })
  try {
    await page.goto('/admin/import-history')
    await expect(page.getByRole('status', { name: 'Đang tải lịch sử import' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  } finally {
    release()
  }
  await expect(page.getByText('Chapter • page-0.json', { exact: true })).toBeVisible()
})

test('invalid JSON roots, missing chapter and invalid enum cannot be imported', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/admin/import')
  for (const source of [
    'null',
    '[]',
    '{}',
    JSON.stringify({ ...payload, lessons: [] }),
    JSON.stringify({ ...payload, lessons: [{ ...payload.lessons[0], status: 'publshed' }] }),
  ]) {
    await page.getByRole('textbox', { name: 'JSON payload', exact: true }).fill(source)
    await expect(page.getByRole('heading', { name: 'Payload chưa hợp lệ' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Import lessons', exact: true })).toBeDisabled()
  }
  expect(state.writes).toEqual([])
})

test('concept preview accepts no code, requires review and uses committed counters', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/admin/import')
  await page
    .getByRole('textbox', { name: 'JSON payload', exact: true })
    .fill(JSON.stringify(payload))
  await expect(page.getByRole('cell', { name: 'Giữ nguyên', exact: true })).toHaveCount(2)
  await expect(page.getByRole('button', { name: 'Import lessons', exact: true })).toBeDisabled()
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Import lessons', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Import thành công', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Import lessons', exact: true })).toBeDisabled()
  expect(state.writes).toHaveLength(1)
  expect(state.writes[0]).toMatchObject({
    chapter_id: payload.chapterId,
    lessons: [{ lesson_type: 'concept', order_index: 0, status: 'draft' }],
  })
  expect((state.writes[0].lessons as object[])[0]).not.toHaveProperty('test_cases')
})

test('explicit empty children preview clearing and edits reset review/success', async ({
  page,
}) => {
  await fixture(page)
  await page.goto('/admin/import')
  const editor = page.getByRole('textbox', { name: 'JSON payload', exact: true })
  await editor.fill(
    JSON.stringify({ ...payload, lessons: [{ ...payload.lessons[0], testCases: [], steps: [] }] })
  )
  await expect(page.getByRole('cell', { name: 'Xóa toàn bộ', exact: true })).toHaveCount(2)
  await page.getByRole('checkbox').check()
  await editor.fill(JSON.stringify(payload))
  await expect(page.getByRole('checkbox')).not.toBeChecked()
  await expect(page.getByRole('button', { name: 'Import lessons', exact: true })).toBeDisabled()
})

test('pending import locks source and sample button and cannot be duplicated', async ({ page }) => {
  const state = await fixture(page)
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/admin/import')
  const editor = page.getByRole('textbox', { name: 'JSON payload', exact: true })
  await editor.fill(JSON.stringify(payload))
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Import lessons', exact: true }).click()
  await expect.poll(() => state.writes.length).toBe(1)
  await expect(editor).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Load example', exact: true })).toBeDisabled()
  await expect(page.getByRole('checkbox')).toBeDisabled()
  release()
  await expect(page.getByRole('heading', { name: 'Import thành công', exact: true })).toBeVisible()
  expect(state.writes).toHaveLength(1)
})

for (const failure of ['importError', 'invalidReceipt'] as const) {
  test(`${failure} preserves the source and never reports success`, async ({ page }) => {
    const state = await fixture(page)
    state[failure] = true
    await page.goto('/admin/import')
    const editor = page.getByRole('textbox', { name: 'JSON payload', exact: true })
    await editor.fill(JSON.stringify(payload))
    await page.getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Import lessons', exact: true }).click()
    await expect(page.getByRole('alert')).toBeVisible()
    await expect(editor).toHaveValue(JSON.stringify(payload))
    await expect(page.getByRole('heading', { name: 'Import thành công', exact: true })).toHaveCount(
      0
    )
    expect(state.writes).toHaveLength(1)
    state[failure] = false
    await page.getByRole('button', { name: 'Import lessons', exact: true }).click()
    await expect(
      page.getByRole('heading', { name: 'Import thành công', exact: true })
    ).toBeVisible()
    expect(state.writes).toHaveLength(2)
  })
}

test('leaving a pending import and reopening cannot display its old success', async ({ page }) => {
  const state = await fixture(page)
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/admin/import')
  await page
    .getByRole('textbox', { name: 'JSON payload', exact: true })
    .fill(JSON.stringify(payload))
  await page.getByRole('checkbox').check()
  await page.getByRole('button', { name: 'Import lessons', exact: true }).click()
  await expect.poll(() => state.writes.length).toBe(1)
  await page.getByRole('link', { name: 'Import History', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Lịch sử nhập dữ liệu' })).toBeVisible()
  await page.getByRole('link', { name: 'Bulk Import', exact: true }).click()
  await page
    .getByRole('textbox', { name: 'JSON payload', exact: true })
    .fill(JSON.stringify(payload) + ' ')
  const response = page.waitForResponse(
    item => item.url().endsWith('/api/admin/import') && item.request().method() === 'POST'
  )
  release()
  await response
  await expect(page.getByRole('heading', { name: 'Import thành công', exact: true })).toHaveCount(0)
  await expect(page.getByRole('textbox', { name: 'JSON payload', exact: true })).toHaveValue(
    JSON.stringify(payload) + ' '
  )
})

test('history and stats fail independently with retry and no fake empty state', async ({
  page,
}) => {
  const state = await fixture(page)
  state.historyError = true
  state.statsError = true
  await page.goto('/admin/import-history')
  await expect(page.getByText('Lịch sử tạm gián đoạn', { exact: true })).toBeVisible()
  await expect(page.getByText('Thống kê tạm gián đoạn', { exact: true })).toBeVisible()
  await expect(page.getByText('Không có lịch sử import', { exact: true })).toHaveCount(0)
  state.historyError = false
  await page.getByRole('button', { name: 'Tải lại lịch sử', exact: true }).click()
  await expect(page.getByText('Chapter • page-0.json', { exact: true })).toBeVisible()
  await expect(page.getByText('Thống kê tạm gián đoạn', { exact: true })).toBeVisible()
  state.statsError = false
  await page.getByRole('button', { name: 'Tải lại thống kê', exact: true }).click()
  await expect(page.getByText('Thống kê tạm gián đoạn', { exact: true })).toHaveCount(0)
})

test('late history response cannot overwrite the selected status', async ({ page }) => {
  const state = await fixture(page)
  let release!: () => void
  state.delayOldFilter = true
  state.oldFilter = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/admin/import-history')
  await page.getByRole('combobox', { name: 'Trạng thái', exact: true }).selectOption('failed')
  await expect(page.getByText('Chapter • failed.json', { exact: true })).toBeVisible()
  release()
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())))
  await expect(page.getByText('Chapter • failed.json', { exact: true })).toBeVisible()
  await expect(page.getByText('Chapter • page-0.json', { exact: true })).toHaveCount(0)
})

test('an empty last page retains navigation back after history shrinks', async ({ page }) => {
  const state = await fixture(page)
  await page.goto('/admin/import-history')
  await expect(page.getByText('Chapter • page-0.json', { exact: true })).toBeVisible()
  state.historyTotal = 1
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await expect(page.getByText('Không có mục ở trang này.', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Trước', exact: true }).click()
  await expect(page.getByText('Chapter • page-0.json', { exact: true })).toBeVisible()
})

test('import preview and long history entries fit a phone screen', async ({ page }) => {
  const state = await fixture(page)
  state.longHistory = true
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/admin/import')
  await page.getByRole('textbox', { name: 'JSON payload', exact: true }).fill(
    JSON.stringify({
      ...payload,
      lessons: [{ ...payload.lessons[0], lessonId: 'x'.repeat(120) }],
    })
  )
  await expect(page.getByRole('region', { name: 'Preview import' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  )
  await page.goto('/admin/import-history')
  await expect(page.getByText(`Chapter • ${'x'.repeat(120)}.json`, { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  )
})

test('mobile admin navigation contains focus, closes with Escape and preserves the draft', async ({
  page,
}) => {
  await fixture(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/admin/import')
  const editor = page.getByRole('textbox', { name: 'JSON payload', exact: true })
  await editor.fill(JSON.stringify(payload))
  const trigger = page.getByRole('button', { name: 'Mở điều hướng quản trị', exact: true })
  await trigger.click()
  const dialog = page.getByRole('dialog', { name: 'Điều hướng quản trị', exact: true })
  await expect(dialog).toBeVisible()
  await expect(trigger).toHaveAttribute('aria-expanded', 'true')
  for (let index = 0; index < 15; index++) {
    await page.keyboard.press('Tab')
    const focus = await dialog.evaluate(element => ({
      inside: element.contains(document.activeElement),
      tag: document.activeElement?.tagName,
      modal: element.matches(':modal'),
    }))
    expect(focus.modal).toBe(true)
    // Chromium can send Tab to browser chrome (BODY), but never a background app control.
    expect(focus.inside || focus.tag === 'BODY', `Tab ${index}: ${JSON.stringify(focus)}`).toBe(
      true
    )
  }
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
  await expect(trigger).toBeFocused()
  await expect(trigger).toHaveAttribute('aria-expanded', 'false')
  await expect(editor).toHaveValue(JSON.stringify(payload))
  await trigger.click()
  await dialog.getByRole('link', { name: 'Import History', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Lịch sử nhập dữ liệu', exact: true })
  ).toBeVisible()
  await expect(dialog).not.toBeVisible()
})

test('resizing an open admin menu to desktop releases the modal and keeps navigation usable', async ({
  page,
}) => {
  await fixture(page)
  await page.setViewportSize({ width: 768, height: 1024 })
  await page.goto('/admin/import')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(
    true
  )
  await page.getByRole('button', { name: 'Mở điều hướng quản trị', exact: true }).click()
  await expect(page.getByRole('dialog', { name: 'Điều hướng quản trị', exact: true })).toBeVisible()
  await page.setViewportSize({ width: 1280, height: 900 })
  await expect(
    page.getByRole('dialog', { name: 'Điều hướng quản trị', exact: true })
  ).not.toBeVisible()
  await expect(page.getByRole('link', { name: 'Dashboard', exact: true })).not.toHaveAttribute(
    'aria-current',
    'page'
  )
  await page.getByRole('link', { name: 'Import History', exact: true }).click()
  await expect(
    page.getByRole('heading', { name: 'Lịch sử nhập dữ liệu', exact: true })
  ).toBeVisible()
})

test('admin layout: admin-import handles desktop and mobile', async ({ page }, info) => {
  const state = await fixture(page)
  state.longHistory = true
  await checkAdminLayout(page, info, '/admin/import', 'Bulk Import Lessons')
  await checkAdminLayout(page, info, '/admin/import-history', 'Lịch sử nhập dữ liệu')
  expect(state.writes).toEqual([])
})

test('history pages contain 20 records and filters reset the entire collection to page one', async ({
  page,
}) => {
  await fixture(page)
  await page.goto('/admin/import-history')
  await expect(page.getByText(/^Chapter • page-/)).toHaveCount(20)
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await expect(page.getByText('Chapter • page-20.json', { exact: true })).toBeVisible()
  await expect(page.getByText(/^Chapter • page-/)).toHaveCount(20)
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await expect(page.getByText(/^Chapter • page-/)).toHaveCount(11)
  await expect(page.getByRole('button', { name: 'Tiếp', exact: true })).toBeDisabled()
  await page.getByRole('combobox', { name: 'Trạng thái', exact: true }).selectOption('failed')
  await expect(page.getByText('Chapter • failed.json', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Trước', exact: true })).toBeDisabled()
})

test('import preview pages do not truncate the payload being reviewed or imported', async ({
  page,
}) => {
  const state = await fixture(page)
  const lessons = Array.from({ length: 41 }, (_, index) => ({
    ...payload.lessons[0],
    lessonId: `lesson-${index}`,
    orderIndex: index,
  }))
  await page.goto('/admin/import')
  await page
    .getByRole('textbox', { name: 'JSON payload', exact: true })
    .fill(JSON.stringify({ ...payload, lessons }))
  const rows = page.getByRole('table').locator('tbody tr')
  await expect(rows).toHaveCount(20)
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await expect(rows).toHaveCount(20)
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await expect(rows).toHaveCount(1)
  await expect(page.getByText('lesson-40', { exact: true })).toBeVisible()
  await expect(page.getByRole('textbox', { name: 'JSON payload', exact: true })).toHaveValue(
    JSON.stringify({ ...payload, lessons })
  )
  expect(state.writes).toEqual([])
})
