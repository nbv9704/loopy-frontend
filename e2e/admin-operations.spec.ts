import { checkAdminLayout } from './fixtures/admin-layout'
import { expect, test, type Page } from '@playwright/test'
import type { DashboardStats } from '../src/services/admin/dashboard.service'
import { mockApi, reply, replyRaw } from './fixtures/api'

const id = '11111111-1111-4111-8111-111111111111'
const keyword = {
  id,
  keyword: 'blocked',
  category: 'general',
  language: 'all',
  is_active: true,
  created_at: '2026-10-23T00:00:00Z',
}
const stats: DashboardStats = {
  totalUsers: 3,
  totalLessons: 1,
  totalLessonsAll: 2,
  draftLessons: 1,
  archivedLessons: 0,
  totalSubmissions: 0,
  submissionsToday: 0,
  submissionsThisWeek: 0,
  completionRate: null,
  totalPvPMatches: 0,
  averageExecutionTime: null,
  executionSamples: 0,
  generatedAt: '2026-10-23T00:00:00Z',
  timeZone: 'Asia/Ho_Chi_Minh',
  contentQuality: {
    lessonsMissingRequiredFields: 1,
    lessonsWithoutHint: 1,
    lessonsWithoutTestCases: 1,
  },
  recentLessons: [],
  recentFailedSubmissions: [],
}
async function fixture(page: Page) {
  const state = {
    admin: 'admin',
    checks: 0,
    listError: false,
    listReads: 0,
    writeError: false,
    malformed: false,
    conflict: false,
    rows: [{ ...keyword }],
    writes: [] as Array<{ method: string; body: Record<string, unknown> }>,
    pending: Promise.resolve(),
    auditPending: Promise.resolve(),
    delayCreate: false,
    auditTotal: 1,
    auditError: false,
    dashboardError: false,
    dashboardCalls: 0,
    snapshot: { ...stats },
  }
  await mockApi(page, async route => {
    const request = route.request(),
      url = new URL(request.url())
    if (url.pathname === '/api/admin-auth/me') {
      state.checks++
      return replyRaw(route, {
        success: true,
        user: { id: state.admin, role: 'admin', is_admin: true },
      })
    }
    if (url.pathname === '/api/auth/me' || url.pathname === '/api/auth/refresh')
      return reply(route, {}, 401)
    if (url.pathname === '/api/admin/moderation/keywords' && request.method() === 'GET') {
      state.listReads++
      return state.listError
        ? reply(route, { message: 'Keyword list unavailable' }, 503)
        : reply(route, state.rows)
    }
    if (url.pathname.startsWith('/api/admin/moderation/keywords') && request.method() !== 'GET') {
      const method = request.method(),
        body = method === 'DELETE' ? {} : request.postDataJSON()
      state.writes.push({ method, body })
      await state.pending
      if (state.writeError) return reply(route, { message: 'Keyword save unavailable' }, 503)
      if (state.malformed) return reply(route, {})
      if (state.conflict) {
        state.rows[0].is_active = false
        return reply(route, { message: 'Keyword changed; reload' }, 409)
      }
      if (method === 'POST') {
        const item = {
          ...keyword,
          id: '22222222-2222-4222-8222-222222222222',
          ...body,
          keyword: String(body.keyword).trim().toLowerCase(),
        }
        state.rows.unshift(item)
        return reply(route, item)
      }
      if (method === 'DELETE') {
        const removedId = url.pathname.split('/').pop()!
        state.rows = state.rows.filter(item => item.id !== removedId)
        return reply(route, { id: removedId })
      }
      state.rows[0].is_active = body.is_active
      return reply(route, state.rows[0])
    }
    if (url.pathname === '/api/admin/audit-logs') {
      const action = url.searchParams.get('action') || 'update',
        offset = Number(url.searchParams.get('offset') || 0)
      const total = state.auditTotal,
        limit = Number(url.searchParams.get('limit') || 50)
      if (state.delayCreate && action === 'create') await state.auditPending
      if (state.auditError) return reply(route, { message: 'Audit read unavailable' }, 503)
      return reply(route, {
        logs: Array.from({ length: Math.min(limit, Math.max(0, total - offset)) }, (_, index) => ({
          id: `log-${offset + index}`,
          admin_id: 'admin',
          action,
          resource_type: url.searchParams.get('resourceType') || 'lesson',
          resource_name: `${action} record ${offset + index}`,
          created_at: '2026-10-23T00:00:00Z',
        })),
        total,
        limit,
        offset,
      })
    }
    if (url.pathname === '/api/admin/stats/overview') {
      state.dashboardCalls++
      return state.dashboardError
        ? reply(route, { message: 'Dashboard read unavailable' }, 503)
        : reply(route, state.malformed ? { totalUsers: 0 } : state.snapshot)
    }
    return reply(route, [])
  })
  return state
}
const dialog = (page: Page) => page.getByRole('dialog', { name: 'Thêm từ khóa', exact: true })

test('audit loading fits a narrow phone before records arrive', async ({ page }) => {
  await fixture(page)
  let release!: () => void
  const pending = new Promise<void>(resolve => {
    release = resolve
  })
  await page.route('**/api/admin/audit-logs**', async route => {
    await pending
    await route.fallback()
  })
  await page.setViewportSize({ width: 320, height: 960 })
  try {
    await page.goto('/admin/audit-logs')
    await expect(page.getByRole('status', { name: 'Đang tải nhật ký' })).toBeVisible()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  } finally {
    release()
  }
  await expect(page.getByText('update record 0', { exact: true })).toBeVisible()
})

test('moderation read errors are retryable and distinct from an empty list', async ({ page }) => {
  const state = await fixture(page)
  state.listError = true
  await page.goto('/admin/moderation')
  await expect(page.getByRole('alert')).toContainText('Keyword list unavailable')
  await expect(page.getByText('Chưa có từ khóa.', { exact: false })).toHaveCount(0)
  state.listError = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Tắt blocked', exact: true })).toBeVisible()
})
test('create locks duplicate actions and Escape, then preserves the draft on failure for retry', async ({
  page,
}) => {
  const state = await fixture(page)
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  state.writeError = true
  await page.goto('/admin/moderation')
  await page.getByRole('button', { name: 'Thêm từ khóa', exact: true }).click()
  await dialog(page).getByRole('textbox', { name: 'Từ khóa', exact: true }).fill('New word')
  await dialog(page).getByRole('button', { name: 'Lưu từ khóa' }).click()
  await expect.poll(() => state.writes.length).toBe(1)
  await expect(dialog(page).getByRole('textbox')).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Tắt blocked' })).toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(dialog(page)).toBeVisible()
  release()
  await expect(dialog(page).getByRole('alert')).toContainText('Keyword save unavailable')
  await expect(dialog(page).getByRole('textbox')).toHaveValue('New word')
  await expect(page.getByText('Đã thêm từ khóa.', { exact: true })).toHaveCount(0)
  state.writeError = false
  await dialog(page).getByRole('button', { name: 'Lưu từ khóa' }).click()
  await expect(dialog(page)).not.toBeVisible()
  await expect(page.getByRole('cell', { name: 'new word', exact: true })).toBeVisible()
  expect(state.writes).toHaveLength(2)
})
test('a malformed create acknowledgement keeps the editor open without a success toast', async ({
  page,
}) => {
  const state = await fixture(page)
  state.malformed = true
  await page.goto('/admin/moderation')
  await page.getByRole('button', { name: 'Thêm từ khóa', exact: true }).click()
  await dialog(page).getByRole('textbox').fill('Keep draft')
  await dialog(page).getByRole('button', { name: 'Lưu từ khóa' }).click()
  await expect(dialog(page).getByRole('alert')).toContainText('chưa được xác nhận')
  await expect(dialog(page).getByRole('textbox')).toHaveValue('Keep draft')
  await expect(page.getByText('Đã thêm từ khóa.', { exact: true })).toHaveCount(0)
})
test('a conflicting toggle sends the displayed state and waits for reload instead of inventing success', async ({
  page,
}) => {
  const state = await fixture(page)
  state.conflict = true
  await page.goto('/admin/moderation')
  await page.getByRole('button', { name: 'Tắt blocked', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Keyword changed; reload')
  await expect(page.getByText('Đang bật', { exact: true })).toBeVisible()
  expect(state.writes[0].body).toEqual({ is_active: false, expectedActive: true })
  await page.getByRole('button', { name: 'Tải lại', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Bật blocked', exact: true })).toBeVisible()
})
test('delete requires acknowledgement before removing the visible row', async ({ page }) => {
  const state = await fixture(page)
  state.malformed = true
  page.on('dialog', prompt => prompt.accept())
  await page.goto('/admin/moderation')
  await page.getByRole('button', { name: 'Xóa blocked', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('chưa được xác nhận')
  await expect(page.getByRole('cell', { name: 'blocked', exact: true })).toBeVisible()
  state.malformed = false
  await page.getByRole('button', { name: 'Xóa blocked', exact: true }).click()
  await expect(page.getByText('Chưa có từ khóa.', { exact: false })).toBeVisible()
})
test('the keyword dialog fits a phone and retains dirty drafts when Escape is declined', async ({
  page,
}) => {
  await fixture(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/admin/moderation')
  await page.getByRole('button', { name: 'Thêm từ khóa', exact: true }).click()
  await dialog(page).getByRole('textbox').fill('Phone draft')
  page.once('dialog', prompt => prompt.dismiss())
  await page.keyboard.press('Escape')
  await expect(dialog(page).getByRole('textbox')).toHaveValue('Phone draft')
  expect(
    await dialog(page).evaluate(element => element.getBoundingClientRect().width)
  ).toBeLessThanOrEqual(390)
  page.once('dialog', prompt => prompt.accept())
  await page.keyboard.press('Escape')
  await expect(dialog(page)).not.toBeVisible()
})
test('a late write from an old admin cannot close a new admin draft', async ({ page }) => {
  await page.clock.install()
  const state = await fixture(page)
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/admin/moderation')
  await page.getByRole('button', { name: 'Thêm từ khóa', exact: true }).click()
  await dialog(page).getByRole('textbox').fill('Old admin')
  await dialog(page).getByRole('button', { name: 'Lưu từ khóa' }).click()
  await expect.poll(() => state.writes.length).toBe(1)
  state.admin = 'second-admin'
  await page.clock.fastForward(121000)
  await expect.poll(() => state.checks).toBeGreaterThan(1)
  await expect(dialog(page)).not.toBeVisible()
  await page.getByRole('button', { name: 'Thêm từ khóa', exact: true }).click()
  await dialog(page).getByRole('textbox').fill('New admin')
  const response = page.waitForResponse(result => result.request().method() === 'POST')
  release()
  await response
  await expect(dialog(page).getByRole('textbox')).toHaveValue('New admin')
  await expect(page.getByText('Đã thêm từ khóa.', { exact: true })).toHaveCount(0)
})
test('audit read errors have retry and confirmed empty filters are explained', async ({ page }) => {
  const state = await fixture(page)
  state.auditError = true
  await page.goto('/admin/audit-logs')
  await expect(page.getByRole('alert')).toContainText('Audit read unavailable')
  await expect(page.getByText('Không có nhật ký nào', { exact: true })).toHaveCount(0)
  state.auditError = false
  state.auditTotal = 0
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByText('Không có nhật ký nào', { exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: 'Loại tài nguyên' }).selectOption('content_item')
  await expect(page.getByText('Không có nhật ký nào', { exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: 'Loại tài nguyên' }).selectOption('practice_set')
})
test('an old audit filter response cannot replace the current filter', async ({ page }) => {
  const state = await fixture(page)
  let release!: () => void
  state.delayCreate = true
  state.auditPending = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/admin/audit-logs')
  await expect(page.getByText('update record 0', { exact: true })).toBeVisible()
  await page.getByRole('combobox', { name: 'Hành động', exact: true }).selectOption('create')
  await page.getByRole('combobox', { name: 'Hành động', exact: true }).selectOption('delete')
  await expect(page.getByText('delete record 0', { exact: true })).toBeVisible()
  release()
  await expect(page.getByText('create record 0', { exact: true })).toHaveCount(0)
  await expect(page.getByText('delete record 0', { exact: true })).toBeVisible()
})
test('audit pagination advances by 20 and filters reset to the first page', async ({ page }) => {
  const state = await fixture(page)
  state.auditTotal = 41
  await page.goto('/admin/audit-logs')
  await expect(page.getByText('update record 0', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await expect(page.getByText('update record 20', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await expect(page.getByText('update record 40', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tiếp', exact: true })).toBeDisabled()
  await page.getByRole('combobox', { name: 'Hành động', exact: true }).selectOption('create')
  await expect(page.getByText('create record 0', { exact: true })).toBeVisible()
})
test('dashboard failures do not render zero statistics and can be retried', async ({ page }) => {
  const state = await fixture(page)
  state.dashboardError = true
  await page.goto('/admin/dashboard')
  await expect(page.getByRole('alert')).toContainText('Dashboard read unavailable')
  await expect(page.getByText('Tổng số người dùng', { exact: true })).toHaveCount(0)
  state.dashboardError = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByText('Tổng số người dùng', { exact: true })).toBeVisible()
})
test('dashboard labels submission accuracy, distinguishes no samples, and refreshes explicitly', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/admin/dashboard')
  await expect(page.getByText('Tỷ lệ hoàn thành', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Chưa có dữ liệu', { exact: true })).toHaveCount(2)
  state.snapshot = {
    ...stats,
    totalSubmissions: 2,
    completionRate: 50,
    averageExecutionTime: 0,
    executionSamples: 1,
  }
  await page.getByRole('button', { name: 'Tải lại thống kê', exact: true }).click()
  await expect(page.getByText('0ms (1 mẫu)', { exact: true })).toBeVisible()
  expect(state.dashboardCalls).toBe(2)
})
test('a malformed dashboard cannot turn missing fields into zeros', async ({ page }) => {
  const state = await fixture(page)
  state.malformed = true
  await page.goto('/admin/dashboard')
  await expect(page.getByRole('alert')).toContainText('chưa được xác nhận')
  await expect(page.getByText('Tổng số người dùng', { exact: true })).toHaveCount(0)
})

test('admin layout: admin-operations handles desktop and mobile', async ({ page }, info) => {
  const state = await fixture(page)
  state.rows[0].keyword = 'long_keyword_'.repeat(18)
  state.auditTotal = 51
  await checkAdminLayout(page, info, '/admin', 'Dashboard')
  await checkAdminLayout(page, info, '/admin/audit-logs', 'Nhật ký hoạt động')
  await checkAdminLayout(page, info, '/admin/moderation', 'Kiểm duyệt từ khóa')
  expect(state.writes).toEqual([])
})

test('moderation shows 20 rows per page without refetching and recovers after deleting the last page', async ({
  page,
}) => {
  const state = await fixture(page)
  state.rows = Array.from({ length: 41 }, (_, index) => ({
    ...keyword,
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    keyword: `keyword-${index}`,
  }))
  await page.goto('/admin/moderation')
  const rows = page.getByRole('table', { name: 'Từ khóa kiểm duyệt' }).locator('tbody tr')
  await expect(rows).toHaveCount(20)
  await expect(page.getByRole('button', { name: 'Trước', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await expect(page.getByText('keyword-20', { exact: true })).toBeVisible()
  await expect(rows).toHaveCount(20)
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await expect(rows).toHaveCount(1)
  await expect(page.getByRole('button', { name: 'Tiếp', exact: true })).toBeDisabled()
  expect(state.listReads).toBe(1)
  page.on('dialog', prompt => prompt.accept())
  await page.getByRole('button', { name: 'Xóa keyword-40', exact: true }).click()
  await expect(rows).toHaveCount(20)
  await expect(page.getByText('keyword-20', { exact: true })).toBeVisible()
  await expect(page.getByText('Trang 2', { exact: true })).toBeVisible()
  expect(state.listReads).toBe(2)
})
