import { expect, test, type Page } from '@playwright/test'
import { mockApi, reply, replyRaw } from './fixtures/api'

async function fixture(page: Page) {
  const state = {
    writes: [] as { path: string; body: Record<string, unknown> }[],
    pending: Promise.resolve(),
    fail: false,
  }
  await mockApi(page, async route => {
    const path = new URL(route.request().url()).pathname
    const method = route.request().method()
    if (path === '/api/admin-auth/me')
      return replyRaw(route, {
        success: true,
        user: { id: 'admin', role: 'admin', is_admin: true },
      })
    if (path === '/api/auth/me' || path === '/api/auth/refresh') return reply(route, {}, 401)
    if (path === '/api/content/batch') return reply(route, { items: {}, missingKeys: [] })
    if (method === 'DELETE') return reply(route, { id: path.split('/').pop() })
    if (method === 'POST') {
      const body = route.request().postDataJSON()
      state.writes.push({ path, body })
      await state.pending
      return state.fail
        ? reply(route, { message: 'Detail save unavailable' }, 503)
        : reply(route, { ...body, id: body.id || 'saved-detail', lesson_id: 'lesson' })
    }
    if (path === '/api/admin/chapters') return reply(route, [{ id: 'chapter', title: 'Chapter' }])
    if (path === '/api/admin/lessons/lesson')
      return reply(route, {
        id: 'lesson',
        chapter_id: 'chapter',
        lesson_id: 'intro',
        title: 'Lesson',
        lesson_type: 'short_answer',
      })
    if (path.endsWith('/steps'))
      return reply(route, [
        {
          id: 'step',
          type: 'short_answer',
          title: 'Question',
          prompt: 'Question prompt',
          correct_answer: 'false',
          options: [],
          order_index: 1,
        },
      ])
    if (path.endsWith('/test-cases'))
      return reply(route, [
        {
          id: 'case',
          description: 'Output case',
          input: [],
          expected_output: 'null',
          order_index: 0,
        },
      ])
    if (path === '/api/admin/practice/sets') return reply(route, { items: [], total: 0 })
    return reply(route, {})
  })
  return state
}

function details(page: Page, title: string) {
  return page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: title, exact: true }) })
}

test('editing a step preserves a string answer that looks like JSON', async ({ page }) => {
  const state = await fixture(page)
  await page.goto('/admin/lessons/lesson')
  const section = details(page, 'Lesson steps')
  await section.getByRole('button', { name: 'Sửa', exact: true }).click()
  await section.getByRole('button', { name: 'Lưu step', exact: true }).click()
  await expect(page.getByText('Đã lưu lesson step.', { exact: true })).toBeVisible()
  expect(state.writes[0].body.correct_answer).toBe('false')
})

test('editing a test case preserves string output and its zero order index', async ({ page }) => {
  const state = await fixture(page)
  await page.goto('/admin/lessons/lesson')
  const section = details(page, 'Test cases')
  await section.getByRole('button', { name: 'Sửa', exact: true }).click()
  await section.getByRole('button', { name: 'Lưu test case', exact: true }).click()
  await expect(page.getByText('Đã lưu test case.', { exact: true })).toBeVisible()
  expect(state.writes[0].body.expected_output).toBe('null')
  expect(state.writes[0].body.order_index).toBe(0)
})

test('invalid JSON is shown before a detail write and keeps its draft', async ({ page }) => {
  const state = await fixture(page)
  await page.goto('/admin/lessons/lesson')
  const section = details(page, 'Lesson steps')
  await section.getByRole('button', { name: 'Sửa', exact: true }).click()
  await section.getByPlaceholder('options JSON, ví dụ ["A", "B"]').fill('[')
  await section.getByRole('button', { name: 'Lưu step', exact: true }).click()
  await expect(page.getByText(/Options phải là JSON hợp lệ/)).toBeVisible()
  await expect(section.getByPlaceholder('Prompt', { exact: true })).toHaveValue('Question prompt')
  expect(state.writes).toHaveLength(0)
})

test('pending detail save locks the draft and failed save can retry', async ({ page }) => {
  const state = await fixture(page)
  await page.goto('/admin/lessons/lesson')
  const section = details(page, 'Lesson steps')
  await section.getByRole('button', { name: 'Sửa', exact: true }).click()
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  state.fail = true
  await section.getByRole('button', { name: 'Lưu step', exact: true }).click()
  await expect(section.getByPlaceholder('Prompt', { exact: true })).toBeDisabled()
  await expect(section.getByRole('button', { name: 'Clear', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Lưu lesson', exact: true })).toBeDisabled()
  release()
  await expect(page.getByText('Detail save unavailable', { exact: true })).toBeVisible()
  await expect(section.getByPlaceholder('Prompt', { exact: true })).toHaveValue('Question prompt')
  state.fail = false
  await section.getByRole('button', { name: 'Lưu step', exact: true }).click()
  await expect(page.getByText('Đã lưu lesson step.', { exact: true })).toBeVisible()
})

for (const detail of [
  { title: 'Lesson steps', input: 'Prompt', success: 'Đã xóa lesson step.' },
  { title: 'Test cases', input: 'Mô tả test case', success: 'Đã xóa test case.' },
]) {
  test(`deleting the edited ${detail.title} clears its old row identity`, async ({ page }) => {
    const state = await fixture(page)
    await page.goto('/admin/lessons/lesson')
    const section = details(page, detail.title)
    await section.getByRole('button', { name: 'Sửa', exact: true }).click()
    await expect(section.getByPlaceholder(detail.input, { exact: true })).not.toHaveValue('')
    page.once('dialog', dialog => dialog.accept())
    await section.getByRole('button', { name: /^Xóa / }).click()
    await expect(page.getByText(detail.success, { exact: true })).toBeVisible()
    await expect(section.getByPlaceholder(detail.input, { exact: true })).toHaveValue('')
    expect(state.writes).toHaveLength(0)
  })
}

for (const detail of [
  { title: 'Lesson steps', input: 'Prompt', path: 'lesson-steps', success: 'Đã xóa lesson step.' },
  {
    title: 'Test cases',
    input: 'Mô tả test case',
    path: 'test-cases',
    success: 'Đã xóa test case.',
  },
]) {
  test(`missing delete acknowledgement retains the edited ${detail.title} draft`, async ({
    page,
  }) => {
    const state = await fixture(page)
    await page.route(`**/api/admin/${detail.path}/*`, route => reply(route, {}))
    await page.goto('/admin/lessons/lesson')
    const section = details(page, detail.title)
    await section.getByRole('button', { name: 'Sửa', exact: true }).click()
    const draft = await section.getByPlaceholder(detail.input, { exact: true }).inputValue()
    page.once('dialog', prompt => prompt.accept())
    await section.getByRole('button', { name: /^Xóa / }).click()
    await expect(
      page.getByText(
        'Dữ liệu phản hồi chưa được xác nhận. Hãy tải lại để kiểm tra trước khi gửi lại.',
        { exact: true }
      )
    ).toBeVisible()
    await expect(section.getByPlaceholder(detail.input, { exact: true })).toHaveValue(draft)
    await expect(page.getByText(detail.success, { exact: true })).toHaveCount(0)
    expect(state.writes).toHaveLength(0)
  })
}
