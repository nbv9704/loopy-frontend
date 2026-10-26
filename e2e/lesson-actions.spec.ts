import { expect, test, type Page } from '@playwright/test'
import { mockApi, reply } from './fixtures/api'

async function fixture(page: Page, answerLesson = false) {
  const state = {
    checks: [] as string[],
    executions: 0,
    saves: 0,
    failCheck: false,
    missingAck: false,
    staleReceipt: false,
    missingReceipt: false,
    savedReceipts: [] as string[],
    catalogReads: 0,
    pending: Promise.resolve(),
    pendingProfile: Promise.resolve(),
    pendingHint: Promise.resolve(),
    hints: [] as Record<string, unknown>[],
    hintResult: { hint: 'Gợi ý của bài cũ' } as unknown,
    failHint: false,
  }
  const lesson = {
    id: 'lesson',
    lessonId: 'intro',
    chapterId: 'chapter',
    title: 'Action test',
    lessonType: answerLesson ? 'short_answer' : 'code_build',
    starterCode: 'console.log(1)',
    taskDescription: 'In ra 1',
    steps: answerLesson
      ? [{ id: 'step', type: 'short_answer', prompt: 'Đáp án là gì?', orderIndex: 0 }]
      : [],
  }
  await page.addInitScript(() => localStorage.setItem('language', 'vi'))
  await mockApi(page, async route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/me')
      return reply(route, {
        user: {
          id: 'learner',
          email: 'learner@example.test',
          profile: { id: 'learner', onboardingCompleted: true, preferredLanguage: 'javascript' },
        },
      })
    if (path === '/api/admin-auth/me' || path === '/api/auth/refresh')
      return reply(route, { code: 'AUTH_REQUIRED' }, 401)
    if (path === '/api/content/batch') return reply(route, { items: {}, missingKeys: [] })
    if (path.endsWith('/curriculum')) {
      ++state.catalogReads
      return reply(route, {
        chapters: [{ id: 'chapter', title: 'Chapter' }],
        lessons: [lesson, { ...lesson, id: 'lesson-next', lessonId: 'next' }],
      })
    }
    if (path === '/api/progress/me') return reply(route, { progress: [] })
    if (path === '/api/profile/me') {
      await state.pendingProfile
      return reply(route, {
        profile: { id: 'learner', onboardingCompleted: true, preferredLanguage: 'javascript' },
      })
    }
    if (path.endsWith('/hint')) {
      state.hints.push(route.request().postDataJSON())
      await state.pendingHint
      return reply(route, state.hintResult, state.failHint ? 503 : 200)
    }
    if (path === '/api/execute') {
      ++state.executions
      await state.pending
      return reply(route, { output: '1', error: null, executionTime: 1 })
    }
    if (path.endsWith('/check')) {
      const code = route.request().postDataJSON().code as string
      state.checks.push(code)
      await state.pending
      if (state.failCheck) return reply(route, { message: 'Checker temporarily unavailable' }, 503)
      const passed = code === 'console.log(1)' || code === 'right'
      return reply(route, {
        submissionId: state.missingReceipt ? undefined : `check-${state.checks.length}`,
        passed,
        score: passed ? 100 : 0,
        output: passed ? 'Đã chấm đúng' : '',
        hint: 'Code chưa đúng yêu cầu',
        checks: [],
        validationType: 'rule',
      })
    }
    if (path.endsWith('/complete')) {
      ++state.saves
      state.savedReceipts.push(route.request().postDataJSON().submissionId)
      await state.pending
      if (state.staleReceipt)
        return reply(
          route,
          { code: 'LESSON_CHECK_STALE', message: 'Bài học đã thay đổi. Hãy tải lại bài.' },
          409
        )
      return reply(route, state.missingAck ? {} : { progress: { status: 'completed' } })
    }
    return reply(route, {})
  })
  return state
}

async function reachDebug(page: Page) {
  await page.getByRole('button', { name: 'Chạy code mẫu', exact: true }).click()
  await page.getByRole('button', { name: 'Kiểm tra thay đổi', exact: true }).click()
  await page.getByRole('button', { name: 'Chạy thử output', exact: true }).click()
}

test('switching interface language preserves the learner draft and current check step', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/learn/javascript/intro')
  await page.getByRole('button', { name: 'Chạy code mẫu', exact: true }).click()
  const editor = page.locator('.cm-content[contenteditable=true]')
  await editor.fill('console.log("keep my draft")')
  await page.getByTitle('Switch to English', { exact: true }).click()
  await expect(page.getByTestId('interface-preparation')).toHaveCount(0)
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  await expect(page.getByRole('button', { name: 'Check changes', exact: true })).toBeVisible()
  await expect(editor).toHaveText('console.log("keep my draft")')
  await page.getByTitle('Chuyển sang Tiếng Việt', { exact: true }).click()
  await expect(page.getByTestId('interface-preparation')).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Kiểm tra thay đổi', exact: true })).toBeVisible()
  await expect(editor).toHaveText('console.log("keep my draft")')
  expect(state.executions).toBe(1)
  expect(state.checks).toEqual([])
  expect(state.saves).toBe(0)
  expect(state.catalogReads).toBe(1)
})

test('completion uses the final debug receipt, never the earlier change check', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/learn/javascript/intro')
  await reachDebug(page)
  await page.locator('.cm-content[contenteditable=true]').fill('console.log(1)')
  await page.getByRole('button', { name: 'Kiểm tra sửa lỗi', exact: true }).click()
  await page.getByRole('button', { name: 'Lưu hoàn thành', exact: true }).click()
  await expect(page.getByText('Tuyệt vời! Progress đã được lưu.', { exact: true })).toBeVisible()
  expect(state.savedReceipts).toEqual(['check-2'])
})

test('a stale receipt offers reload and keyboard cannot retry completion or celebrate', async ({
  page,
}) => {
  const state = await fixture(page, true)
  await page.goto('/learn/javascript/intro')
  await page.getByRole('button', { name: 'Bắt đầu trả lời', exact: true }).click()
  await page.getByPlaceholder('Viết câu trả lời ngắn của bạn').fill('right')
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời', exact: true }).click()
  state.staleReceipt = true
  await page.getByRole('button', { name: 'Lưu hoàn thành', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Tải lại bài học', exact: true })).toBeVisible()
  await expect(page.getByPlaceholder('Viết câu trả lời ngắn của bạn')).toHaveValue('right')
  await page.keyboard.press('Control+Shift+Enter')
  await expect(page.getByText('Tuyệt vời! Progress đã được lưu.', { exact: true })).toHaveCount(0)
  expect(state.saves).toBe(1)
  const reads = state.catalogReads
  await page.getByRole('button', { name: 'Tải lại bài học', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Bắt đầu trả lời', exact: true })).toBeVisible()
  expect(state.catalogReads).toBeGreaterThan(reads)
  state.staleReceipt = false
  await page.getByRole('button', { name: 'Bắt đầu trả lời', exact: true }).click()
  await page.getByPlaceholder('Viết câu trả lời ngắn của bạn').fill('right')
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời', exact: true }).click()
  await page.getByRole('button', { name: 'Lưu hoàn thành', exact: true }).click()
  await expect(page.getByText('Tuyệt vời! Progress đã được lưu.', { exact: true })).toBeVisible()
  expect(state.savedReceipts).toEqual(['check-1', 'check-2'])
})

test('a passing checker response without a saved receipt cannot reach completion', async ({
  page,
}) => {
  const state = await fixture(page, true)
  state.missingReceipt = true
  await page.goto('/learn/javascript/intro')
  await page.getByRole('button', { name: 'Bắt đầu trả lời', exact: true }).click()
  await page.getByPlaceholder('Viết câu trả lời ngắn của bạn').fill('right')
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời', exact: true }).click()
  await expect(page.getByRole('log', { name: 'Terminal' })).toContainText('kết quả kiểm tra hợp lệ')
  await expect(page.getByRole('button', { name: 'Lưu hoàn thành', exact: true })).toHaveCount(0)
  expect(state.saves).toBe(0)
})

test('a runtime-successful wrong fix must still pass the backend checker', async ({ page }) => {
  const state = await fixture(page)
  await page.goto('/learn/javascript/intro')
  await reachDebug(page)
  await page.locator('.cm-content[contenteditable=true]').fill('console.log(999)')
  await page.getByRole('button', { name: 'Kiểm tra sửa lỗi', exact: true }).click()
  await expect(page.getByRole('log', { name: 'Terminal' })).toContainText('Code chưa đúng yêu cầu')
  await expect(page.getByRole('button', { name: 'Lưu hoàn thành', exact: true })).toHaveCount(0)
  expect(state.checks).toEqual(['console.log(1)', 'console.log(999)'])
  expect(state.saves).toBe(0)
})

test('editing after a passed fix requires checking the changed code again', async ({ page }) => {
  await fixture(page)
  await page.goto('/learn/javascript/intro')
  await reachDebug(page)
  await page.locator('.cm-content[contenteditable=true]').fill('console.log(1)')
  await page.getByRole('button', { name: 'Kiểm tra sửa lỗi', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Lưu hoàn thành', exact: true })).toBeVisible()
  await page.locator('.cm-content[contenteditable=true]').fill('console.log(999)')
  await expect(page.getByRole('button', { name: 'Kiểm tra sửa lỗi', exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lưu hoàn thành', exact: true })).toHaveCount(0)
})

test('pending execution locks the action and cannot be duplicated by keyboard', async ({
  page,
}) => {
  const state = await fixture(page)
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/learn/javascript/intro')
  await page.getByRole('button', { name: 'Chạy code mẫu', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Đang xử lý...', exact: true })).toBeDisabled()
  await page.keyboard.press('Control+Enter')
  await page.keyboard.press('Control+Enter')
  release()
  await expect(page.getByRole('button', { name: 'Kiểm tra thay đổi', exact: true })).toBeVisible()
  expect(state.executions).toBe(1)
})

test('a checker service error is shown accurately and the draft remains editable for retry', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/learn/javascript/intro')
  await page.getByRole('button', { name: 'Chạy code mẫu', exact: true }).click()
  state.failCheck = true
  await page.getByRole('button', { name: 'Kiểm tra thay đổi', exact: true }).click()
  await expect(page.getByText('Checker temporarily unavailable', { exact: true })).toBeVisible()
  await expect(page.locator('.cm-content[contenteditable=true]')).toContainText('console.log(1)')
  state.failCheck = false
  await page.getByRole('button', { name: 'Kiểm tra thay đổi', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Chạy thử output', exact: true })).toBeVisible()
})

test('a success envelope without saved completion cannot show celebration', async ({ page }) => {
  const state = await fixture(page)
  await page.goto('/learn/javascript/intro')
  await reachDebug(page)
  await page.locator('.cm-content[contenteditable=true]').fill('console.log(1)')
  await page.getByRole('button', { name: 'Kiểm tra sửa lỗi', exact: true }).click()
  state.missingAck = true
  await page.getByRole('button', { name: 'Lưu hoàn thành', exact: true }).click()
  await expect(
    page.getByText('Chưa nhận được xác nhận hoàn thành. Vui lòng thử lại.', { exact: true })
  ).toBeVisible()
  await expect(page.getByText('Tuyệt vời! Progress đã được lưu.', { exact: true })).toHaveCount(0)
  state.missingAck = false
  await page.getByRole('button', { name: 'Lưu hoàn thành', exact: true }).click()
  await expect(page.getByText('Tuyệt vời! Progress đã được lưu.', { exact: true })).toBeVisible()
})

test('editing a checked answer invalidates its old feedback and completion step', async ({
  page,
}) => {
  await fixture(page, true)
  await page.goto('/learn/javascript/intro')
  await page.getByRole('button', { name: 'Bắt đầu trả lời', exact: true }).click()
  await page.getByPlaceholder('Viết câu trả lời ngắn của bạn').fill('right')
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Lưu hoàn thành', exact: true })).toBeVisible()
  await page.getByPlaceholder('Viết câu trả lời ngắn của bạn').fill('wrong')
  await expect(
    page.getByRole('button', { name: 'Kiểm tra câu trả lời', exact: true })
  ).toBeVisible()
  await expect(page.getByText('Đã chấm đúng', { exact: true })).toHaveCount(0)
})

test('pending checks lock the code snapshot and keyboard shortcuts cannot submit twice', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/learn/javascript/intro')
  await page.getByRole('button', { name: 'Chạy code mẫu', exact: true }).click()
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  await page.getByRole('button', { name: 'Kiểm tra thay đổi', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Đang xử lý...', exact: true })).toBeDisabled()
  await expect(page.locator('.cm-content')).toHaveAttribute('contenteditable', 'false')
  await page.keyboard.press('Control+Shift+Enter')
  release()
  await expect(page.getByRole('button', { name: 'Chạy thử output', exact: true })).toBeVisible()
  expect(state.checks).toEqual(['console.log(1)'])
})

test('pending completion cannot be duplicated by the save shortcut', async ({ page }) => {
  const state = await fixture(page)
  await page.goto('/learn/javascript/intro')
  await reachDebug(page)
  await page.locator('.cm-content[contenteditable=true]').fill('console.log(1)')
  await page.getByRole('button', { name: 'Kiểm tra sửa lỗi', exact: true }).click()
  // Let the runtime/checker finish before delaying only the completion phase.
  await expect(page.getByRole('button', { name: 'Lưu hoàn thành', exact: true })).toBeVisible()
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  await page.getByRole('button', { name: 'Lưu hoàn thành', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Đang xử lý...', exact: true })).toBeDisabled()
  await page.keyboard.press('Control+Shift+Enter')
  await page.keyboard.press('Control+Shift+Enter')
  release()
  await expect(page.getByText('Tuyệt vời! Progress đã được lưu.', { exact: true })).toBeVisible()
  expect(state.saves).toBe(1)
})

test('leaving a pending runtime check prevents its follow-up checker request', async ({ page }) => {
  const state = await fixture(page)
  await page.goto('/learn/javascript/intro')
  await reachDebug(page)
  await page.locator('.cm-content[contenteditable=true]').fill('console.log(1)')
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  await page.getByRole('button', { name: 'Kiểm tra sửa lỗi', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Đang xử lý...', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Quay lại Journey Map', exact: true }).click()
  await expect(page).toHaveURL('/library/javascript')
  const finished = page.waitForResponse(response => response.url().endsWith('/api/execute'))
  release()
  await finished
  await expect(page.getByRole('link', { name: 'Vào bài học', exact: true })).toBeVisible()
  expect(state.checks).toEqual(['console.log(1)'])
  expect(state.saves).toBe(0)
})

test('committed progress is acknowledged even while the secondary profile refresh is pending', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/learn/javascript/intro')
  await reachDebug(page)
  await page.locator('.cm-content[contenteditable=true]').fill('console.log(1)')
  await page.getByRole('button', { name: 'Kiểm tra sửa lỗi', exact: true }).click()
  let release!: () => void
  state.pendingProfile = new Promise(resolve => {
    release = resolve
  })
  await page.getByRole('button', { name: 'Lưu hoàn thành', exact: true }).click()
  await expect(page.getByText('Tuyệt vời! Progress đã được lưu.', { exact: true })).toBeVisible()
  release()
})

test('a late AI hint cannot appear in the lesson opened afterwards', async ({ page }) => {
  const state = await fixture(page)
  let release!: () => void
  state.pendingHint = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/learn/javascript/next')
  await page.getByRole('button', { name: 'Chạy code mẫu', exact: true }).click()
  await page.getByRole('button', { name: 'Gợi ý', exact: true }).click()
  await page.getByRole('button', { name: /Hỏi AI Mentor/ }).click()
  await expect(page.getByRole('button', { name: /Đang suy nghĩ/ })).toBeDisabled()
  await page.getByRole('button', { name: 'Back', exact: true }).click()
  await expect(page).toHaveURL('/learn/javascript/intro')
  const finished = page.waitForResponse(response => response.url().endsWith('/hint'))
  release()
  await finished
  await page.getByRole('button', { name: 'Chạy code mẫu', exact: true }).click()
  await page.getByRole('button', { name: 'Gợi ý', exact: true }).click()
  await expect(page.getByText('Gợi ý của bài cũ', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: /Hỏi AI Mentor/ })).toBeVisible()
})

test('AI failure stays an error with a working retry, without checking or saving progress', async ({
  page,
}) => {
  const state = await fixture(page)
  state.failHint = true
  await page.goto('/learn/javascript/intro')
  await page.getByRole('button', { name: 'Chạy code mẫu', exact: true }).click()
  await page.getByRole('button', { name: 'Gợi ý', exact: true }).click()
  await page.getByRole('button', { name: /Hỏi AI Mentor/ }).click()
  await expect(page.getByRole('alert')).toContainText('chưa lấy được gợi ý')
  state.failHint = false
  await page.getByRole('button', { name: 'Thử lại gợi ý AI', exact: true }).click()
  await expect(page.getByText('Gợi ý của bài cũ', { exact: true })).toBeVisible()
  await expect(page.getByRole('alert')).toHaveCount(0)
  expect(state.hints).toHaveLength(2)
  expect(Object.keys(state.hints[0]).sort()).toEqual(['code', 'language', 'outputLogs'])
  expect(state.checks).toHaveLength(0)
  expect(state.saves).toBe(0)
})

test('a malformed AI success is retryable and never shown as mentor feedback', async ({ page }) => {
  const state = await fixture(page)
  state.hintResult = { hint: { private: 'unexpected' } }
  await page.goto('/learn/javascript/intro')
  await page.getByRole('button', { name: 'Chạy code mẫu', exact: true }).click()
  await page.getByRole('button', { name: 'Gợi ý', exact: true }).click()
  await page.getByRole('button', { name: /Hỏi AI Mentor/ }).click()
  await expect(page.getByRole('alert')).toContainText('chưa hợp lệ')
  await expect(page.getByRole('button', { name: 'Thử lại gợi ý AI', exact: true })).toBeVisible()
  await expect(page.getByText('unexpected', { exact: true })).toHaveCount(0)
})

test('editing code while a hint is pending discards the old reply and permits a fresh request', async ({
  page,
}) => {
  const state = await fixture(page)
  let release!: () => void
  state.pendingHint = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/learn/javascript/intro')
  await page.getByRole('button', { name: 'Chạy code mẫu', exact: true }).click()
  await page.getByRole('button', { name: 'Gợi ý', exact: true }).click()
  await page.getByRole('button', { name: /Hỏi AI Mentor/ }).click()
  await expect(page.getByRole('button', { name: /Đang suy nghĩ/ })).toBeDisabled()
  await page.locator('.cm-content[contenteditable=true]').fill('console.log(2)')
  const finished = page.waitForResponse(response => response.url().endsWith('/hint'))
  release()
  await finished
  await expect(page.getByText('Gợi ý của bài cũ', { exact: true })).toHaveCount(0)
  state.hintResult = { hint: 'Gợi ý của code mới' }
  await page.getByRole('button', { name: /Hỏi AI Mentor/ }).click()
  await expect(page.getByText('Gợi ý của code mới', { exact: true })).toBeVisible()
  expect(state.hints.map(body => body.code)).toEqual(['console.log(1)', 'console.log(2)'])
})
