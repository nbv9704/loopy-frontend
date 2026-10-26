import { checkAdminLayout } from './fixtures/admin-layout'
import { expect, test, type Page } from '@playwright/test'
import { mockApi, reply, replyRaw } from './fixtures/api'
import { practiceSet, practiceQuestion, practiceSavedFromPayload } from '../src/test-utils/practice'

async function editorFixture(page: Page) {
  const state = {
    loadFailure: false,
    saveFailure: false,
    pendingSave: Promise.resolve(),
    committedReadFail: false,
    recoveryReadFail: false,
    practiceRequirements: {} as Record<string, unknown>,
    writes: [] as Record<string, unknown>[],
    questions: [{ id: 'question', type: 'true_false', prompt: 'True?', correct_answer: 'true' }],
  }
  await mockApi(page, async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    if (path === '/api/content/batch') return reply(route, { items: {}, missingKeys: [] })
    if (path === '/api/admin-auth/me')
      return replyRaw(route, {
        success: true,
        user: { id: 'admin', role: 'admin', is_admin: true },
      })
    if (path === '/api/auth/me' || path === '/api/auth/refresh') return reply(route, {}, 401)
    if (request.method() === 'POST' || request.method() === 'PUT') {
      state.writes.push(request.postDataJSON())
      await state.pendingSave
      if (path.startsWith('/api/admin/practice/') && state.committedReadFail)
        return reply(
          route,
          {
            code: 'PRACTICE_SAVED_READ_FAILED',
            message: 'Saved but read-back failed',
            details: { setId: path.split('/').pop() },
          },
          503
        )
      return state.saveFailure
        ? reply(route, { message: 'Save temporarily unavailable' }, 503)
        : reply(
            route,
            path.startsWith('/api/admin/practice/')
              ? practiceSavedFromPayload(
                  state.writes[state.writes.length - 1],
                  path.split('/').pop() === 'sets' ? 'saved' : path.split('/').pop()
                )
              : { id: 'saved' }
          )
    }
    if (path === '/api/admin/chapters') return reply(route, [{ id: 'chapter', title: 'Chapter' }])
    if (
      path === '/api/admin/lessons/lesson' ||
      path === '/api/admin/practice/sets/set' ||
      path === '/api/admin/practice/sets/11111111-1111-4111-8111-111111111111'
    ) {
      if (state.loadFailure) return reply(route, { message: 'Editor load unavailable' }, 503)
      if (path.startsWith('/api/admin/practice/sets/')) {
        const savedId = path.split('/').pop()!
        if (state.writes.length && state.recoveryReadFail)
          return reply(route, { message: 'Read-back still unavailable' }, 503)
        if (state.writes.length)
          return reply(
            route,
            practiceSavedFromPayload(state.writes[state.writes.length - 1], savedId)
          )
        return reply(
          route,
          practiceSet({
            id: savedId,
            title: 'Existing title',
            topic: 'basics',
            difficulty: 'medium',
            visibility: 'official',
            status: 'draft',
            requirements: state.practiceRequirements,
            questions: state.questions.map((question, index) =>
              practiceQuestion({
                id: question.id,
                setId: savedId,
                type: 'true_false',
                prompt: question.prompt,
                options: ['true', 'false'],
                correctAnswer: question.correct_answer,
                points: 10,
                orderIndex: index,
              })
            ),
            questionCount: state.questions.length,
          })
        )
      }
      return reply(route, {
        id: path.endsWith('/lesson') ? 'lesson' : 'set',
        title: 'Existing title',
        chapter_id: 'chapter',
        lesson_id: 'lesson-slug',
        topic: 'basics',
        qa_checklist: [{ id: 'qa', label: 'Review output', checked: false, order: 1 }],
        questions: state.questions,
      })
    }
    if (path.endsWith('/test-cases') || path.endsWith('/steps')) return reply(route, [])
    if (path === '/api/admin/practice/sets') return reply(route, { items: [], total: 0 })
    return reply(route, {})
  })
  return state
}

for (const editor of [
  { path: '/admin/lessons/lesson', save: 'Lưu lesson' },
  { path: '/admin/practice/set', save: 'Lưu practice set' },
]) {
  test(`${editor.path}: failed load cannot expose a writable empty form and can retry`, async ({
    page,
  }) => {
    const state = await editorFixture(page)
    state.loadFailure = true
    await page.setViewportSize({ width: 320, height: 960 })
    await page.goto(editor.path)
    await expect(page.getByText('Editor load unavailable', { exact: true })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Title', exact: true })).toHaveCount(0)
    await expect(page.getByRole('button', { name: editor.save, exact: true })).toHaveCount(0)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    expect(state.writes).toEqual([])
    state.loadFailure = false
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
    await expect(page.getByRole('textbox', { name: 'Title', exact: true }).first()).toHaveValue(
      'Existing title'
    )
  })

  test(`${editor.path}: save failure keeps the draft and reports the server message`, async ({
    page,
  }) => {
    const state = await editorFixture(page)
    state.saveFailure = true
    await page.goto(editor.path)
    const title = page.getByRole('textbox', { name: 'Title', exact: true }).first()
    await title.fill('Keep this draft')
    await page.getByRole('button', { name: editor.save, exact: true }).click()
    await expect(page.getByText('Save temporarily unavailable', { exact: true })).toBeVisible()
    await expect(title).toHaveValue('Keep this draft')
    state.saveFailure = false
    await page.getByRole('button', { name: editor.save, exact: true }).click()
    await expect(page.getByText(/^Đã lưu (lesson|practice set)\.$/)).toBeVisible()
    expect(state.writes).toHaveLength(2)
    expect(state.writes[1].title).toBe('Keep this draft')
  })
}

test('QA changes stay in the draft until the explicit lesson save', async ({ page }) => {
  const state = await editorFixture(page)
  await page.goto('/admin/lessons/lesson')
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('Unfinished title')
  const checklist = page
    .locator('section')
    .filter({ has: page.getByRole('heading', { name: 'QA Checklist' }) })
  await checklist.getByRole('checkbox').check()
  // A browser task boundary lets the request interceptor observe any implicit write.
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())))
  expect(state.writes).toEqual([])
  await page.getByRole('button', { name: 'Lưu lesson', exact: true }).click()
  await expect(page.getByText('Đã lưu lesson.', { exact: true })).toBeVisible()
  expect(state.writes).toHaveLength(1)
  expect(state.writes[0]).toMatchObject({
    title: 'Unfinished title',
    qa_checklist: [{ id: 'qa', checked: true }],
  })
})

test('a late create response cannot navigate away from the editor opened afterwards', async ({
  page,
}) => {
  const state = await editorFixture(page)
  let release!: () => void
  state.pendingSave = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/admin/lessons/new')
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('First editor')
  await page.getByRole('button', { name: 'Lưu lesson', exact: true }).click()
  await expect.poll(() => state.writes.length).toBe(1)
  await page.getByRole('link', { name: 'Practice Sets', exact: true }).click()
  await expect(page).toHaveURL(/\/admin\/practice$/)
  await page.getByRole('link', { name: 'New Lesson', exact: true }).click()
  const title = page.getByRole('textbox', { name: 'Title', exact: true })
  await title.fill('Second editor')
  const response = page.waitForResponse(
    result => result.request().method() === 'POST' && result.url().endsWith('/api/admin/lessons')
  )
  release()
  await response
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())))
  await expect(title).toHaveValue('Second editor')
  await expect(page).toHaveURL(/\/admin\/lessons\/new$/)
})

for (const change of ['delete-before', 'move-edited', 'move-neighbour'] as const) {
  test(`practice question draft follows its question after ${change}`, async ({ page }) => {
    const state = await editorFixture(page)
    state.questions = ['a', 'b', 'c'].map(id => ({
      id,
      type: 'true_false',
      prompt: `Prompt ${id}`,
      correct_answer: 'true',
    }))
    await page.goto('/admin/practice/set')
    await page.getByRole('button', { name: 'Sửa câu hỏi', exact: true }).nth(1).click()
    await page.getByRole('textbox', { name: 'Prompt', exact: true }).fill('Revised b')
    const rows = page
      .locator('section')
      .filter({ has: page.getByRole('heading', { name: 'Questions', exact: true }) })
    if (change === 'delete-before') {
      await rows.getByRole('button', { name: 'Xóa câu hỏi', exact: true }).first().click()
    } else if (change === 'move-edited') {
      await rows.getByRole('button', { name: '↑', exact: true }).nth(1).click()
    } else {
      await rows.getByRole('button', { name: '↓', exact: true }).first().click()
    }
    await page.getByRole('button', { name: 'Cập nhật', exact: true }).click()
    await page.getByRole('button', { name: 'Lưu practice set', exact: true }).click()
    await expect(page.getByText('Đã lưu practice set.', { exact: true })).toBeVisible()
    expect(state.writes[0].questions).toEqual(
      (change === 'delete-before' ? ['b', 'c'] : ['b', 'a', 'c']).map((id, orderIndex) =>
        expect.objectContaining({
          orderIndex,
          prompt: id === 'b' ? 'Revised b' : `Prompt ${id}`,
        })
      )
    )
  })
}

test('deleting the question being edited clears that question draft', async ({ page }) => {
  await editorFixture(page)
  await page.goto('/admin/practice/set')
  await page.getByRole('button', { name: 'Sửa câu hỏi', exact: true }).click()
  await page.getByRole('textbox', { name: 'Prompt', exact: true }).fill('Abandoned question')
  await page.getByRole('button', { name: 'Xóa câu hỏi', exact: true }).click()
  await expect(page.getByRole('textbox', { name: 'Prompt', exact: true })).toHaveValue('')
  await expect(page.getByRole('button', { name: 'Cập nhật', exact: true })).toHaveCount(0)
})

test('a pending save from an existing lesson cannot assign its ID to a new lesson draft', async ({
  page,
}) => {
  const state = await editorFixture(page)
  let release!: () => void
  state.pendingSave = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/admin/lessons/lesson')
  await page.getByRole('button', { name: 'Lưu lesson', exact: true }).click()
  await expect.poll(() => state.writes.length).toBe(1)
  await page.getByRole('link', { name: 'New Lesson', exact: true }).click()
  await page.getByRole('textbox', { name: 'Title', exact: true }).fill('New independent lesson')
  const response = page.waitForResponse(
    result => result.request().method() === 'POST' && result.url().endsWith('/api/admin/lessons')
  )
  release()
  await response
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())))
  await page.getByRole('button', { name: 'Lưu lesson', exact: true }).click()
  await expect.poll(() => state.writes.length).toBe(2)
  expect(state.writes[1]).not.toHaveProperty('id')
  expect(state.writes[1].title).toBe('New independent lesson')
})

test('admin layout: admin-editors handles desktop and mobile', async ({ page }, info) => {
  const state = await editorFixture(page)
  await checkAdminLayout(page, info, '/admin/lessons/new', 'Tạo lesson')
  await checkAdminLayout(page, info, '/admin/lessons/lesson', 'Chỉnh lesson')
  await checkAdminLayout(page, info, '/admin/practice/new', 'Tạo practice set')
  await checkAdminLayout(page, info, '/admin/practice/set', 'Chỉnh practice set')
  expect(state.writes).toEqual([])
})

test('editor section navigation preserves unsaved drafts on desktop and mobile', async ({
  page,
}) => {
  const state = await editorFixture(page)
  await page.goto('/admin/lessons/lesson')
  const lessonTitle = page.getByRole('textbox', { name: 'Title', exact: true })
  await lessonTitle.fill('Keep lesson draft')
  await page.setViewportSize({ width: 1440, height: 960 })
  await page
    .getByRole('navigation', { name: 'Các phần trong editor' })
    .getByRole('button', { name: 'Settings', exact: true })
    .click()
  await expect(page.locator('#lesson-settings')).toBeInViewport()
  await expect(lessonTitle).toHaveValue('Keep lesson draft')
  await expect(page).toHaveURL('/admin/lessons/lesson')
  await page.goto('/admin/practice/set')
  const practiceTitle = page.getByRole('textbox', { name: 'Title', exact: true }).first()
  await practiceTitle.fill('Keep practice draft')
  await page.setViewportSize({ width: 390, height: 960 })
  await page
    .getByRole('combobox', { name: 'Đi đến mục', exact: true })
    .selectOption('practice-question-editor')
  await expect(page.locator('#practice-question-editor')).toBeInViewport()
  await expect(practiceTitle).toHaveValue('Keep practice draft')
  await expect(page).toHaveURL('/admin/practice/set')
  expect(state.writes).toEqual([])
})

for (const editor of [
  { path: '/admin/lessons/lesson', read: '**/api/admin/chapters' },
  { path: '/admin/practice/set', read: '**/api/admin/practice/sets/set' },
]) {
  test(`${editor.path}: loading fits a narrow phone before exposing the form`, async ({ page }) => {
    const state = await editorFixture(page)
    let release!: () => void
    const pending = new Promise<void>(resolve => {
      release = resolve
    })
    await page.route(editor.read, async route => {
      await pending
      await route.fallback()
    })
    await page.setViewportSize({ width: 320, height: 960 })
    try {
      await page.goto(editor.path)
      await expect(page.getByRole('status', { name: 'Đang tải editor' })).toBeVisible()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(
        true
      )
      await expect(page.getByRole('textbox', { name: 'Title', exact: true })).toHaveCount(0)
    } finally {
      release()
    }
    await expect(page.getByRole('textbox', { name: 'Title', exact: true }).first()).toHaveValue(
      'Existing title'
    )
    expect(state.writes).toEqual([])
  })
}

test('admin Practice recovers a committed save with GET only and preserves unlock requirements', async ({
  page,
}) => {
  const state = await editorFixture(page)
  state.practiceRequirements = { type: 'completed_lessons_count', languageId: 'python', count: 2 }
  await page.goto('/admin/practice/11111111-1111-4111-8111-111111111111')
  const title = page.getByRole('textbox', { name: 'Title', exact: true }).first()
  await title.fill('Admin recovery draft')
  state.committedReadFail = true
  state.recoveryReadFail = true
  await page.getByRole('button', { name: 'Lưu practice set', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Bộ bài đã được lưu')
  await expect(title).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Lưu practice set', exact: true })).toBeDisabled()
  expect(state.writes[0].requirements).toEqual(state.practiceRequirements)
  await page.getByRole('button', { name: 'Tải lại kết quả', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Read-back still unavailable')
  state.recoveryReadFail = false
  await page.getByRole('button', { name: 'Tải lại kết quả', exact: true }).click()
  await expect(page.getByText('Đã xác nhận bộ bài đã lưu.', { exact: true })).toBeVisible()
  await expect(title).toHaveValue('Admin recovery draft')
  await expect(title).toBeEnabled()
  expect(state.writes).toHaveLength(1)
})

test('admin Practice preserves invalid points for correction instead of silently saving ten', async ({
  page,
}) => {
  const state = await editorFixture(page)
  await page.goto('/admin/practice/set')
  await page.getByRole('button', { name: 'Sửa câu hỏi', exact: true }).click()
  const points = page.getByRole('spinbutton', { name: 'Points', exact: true })
  await points.fill('0')
  await page.getByRole('button', { name: 'Cập nhật', exact: true }).click()
  await expect(points).toHaveValue('0')
  await expect(
    page.getByText('Thông tin bộ bài hoặc câu hỏi không hợp lệ.', { exact: false })
  ).toBeVisible()
  expect(state.writes).toHaveLength(0)
  await points.fill('7')
  await page.getByRole('button', { name: 'Cập nhật', exact: true }).click()
  await page.getByRole('button', { name: 'Lưu practice set', exact: true }).click()
  await expect(page.getByText('Đã lưu practice set.', { exact: true })).toBeVisible()
  expect(state.writes[0].questions).toEqual([expect.objectContaining({ points: 7 })])
})

test('admin Practice freezes all draft fields until its save result is acknowledged', async ({
  page,
}) => {
  const state = await editorFixture(page)
  let release!: () => void
  state.pendingSave = new Promise<void>(resolve => {
    release = resolve
  })
  await page.goto('/admin/practice/set')
  const title = page.getByRole('textbox', { name: 'Title', exact: true }).first()
  await title.fill('Frozen admin draft')
  await page.getByRole('button', { name: 'Lưu practice set', exact: true }).click()
  await expect(title).toBeDisabled()
  await expect(page.getByRole('textbox', { name: 'Prompt', exact: true })).toBeDisabled()
  release()
  await expect(page.getByText('Đã lưu practice set.', { exact: true })).toBeVisible()
  await expect(title).toBeEnabled()
})
