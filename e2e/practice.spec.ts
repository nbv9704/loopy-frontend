import { test, expect, type Page } from '@playwright/test'
import {
  practiceAttempt,
  practiceQuestion,
  practiceSet,
  practiceSubmission,
} from '../src/test-utils/practice'

const question = practiceQuestion()
const attempt = practiceAttempt()
const copies: Record<string, string> = {
  'practice.sets.start': 'Start practice',
  'practice.detail.your_answer': 'Your answer',
  'practice.detail.submit_answer': 'Submit answer',
  'practice.detail.submitting': 'Saving answer...',
  'practice.detail.completed_title': 'Practice completed',
  'practice.detail.toast.correct': 'Correct answer saved',
  'practice.detail.score_summary': 'Your score: {earned}/{max} points',
  'practice.detail.not_found': 'Practice set not found',
}

async function fixture(
  page: Page,
  options: {
    failList?: boolean
    notFound?: boolean
    failLoad?: boolean
    failStart?: boolean
    failSubmit?: boolean
    pendingSave?: Promise<void>
    pendingStart?: Promise<void>
    completed?: boolean
    feedback?: string
    twoQuestions?: boolean
    startOverride?: unknown
    submitOverride?: unknown
    setOverride?: unknown
    listOverride?: unknown
    archiveOverride?: unknown
    pendingArchive?: Promise<void>
  } = {}
) {
  const caseAttempt = options.twoQuestions
    ? {
        ...attempt,
        maxScore: 20,
        questions: [question, { ...question, id: 'question-two', prompt: 'Second question' }],
      }
    : attempt
  const state = {
    failList: Boolean(options.failList),
    archived: false,
    failLoad: Boolean(options.failLoad),
    failSubmit: Boolean(options.failSubmit),
  }
  const calls: string[] = []
  await page.addInitScript(() => localStorage.setItem('language', 'en'))
  await page.route('**/api/**', async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    calls.push(`${request.method()} ${path}`)
    const respond = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        json: status < 400 ? { success: true, data } : { success: false, error: data },
        headers: {
          'Access-Control-Allow-Origin': 'http://127.0.0.1:5180',
          'Access-Control-Allow-Credentials': 'true',
        },
      })
    if (request.method() === 'OPTIONS')
      return route.fulfill({
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': 'http://127.0.0.1:5180',
          'Access-Control-Allow-Credentials': 'true',
          'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE',
          'Access-Control-Allow-Headers': 'content-type',
        },
      })
    if (path === '/api/auth/me')
      return respond({
        user: {
          id: 'learner',
          email: 'learner@example.test',
          profile: { id: 'learner', onboardingCompleted: true },
        },
      })
    if (path === '/api/content/batch') return respond({ items: copies, missingKeys: [] })
    if (path === '/api/practice/sets') {
      if (state.failList)
        return respond(
          { code: 'DATABASE_ERROR', message: 'Unable to load the catalog. Please retry.' },
          503
        )
      const items = state.archived ? [] : [practiceSet({ questions: undefined })]
      return respond(
        options.listOverride ?? {
          items,
          total: items.length,
          limit: Number(new URL(request.url()).searchParams.get('limit') || 20),
          offset: 0,
        }
      )
    }
    if (path === '/api/practice/sets/set-one' && request.method() === 'DELETE') {
      if (options.pendingArchive) await options.pendingArchive
      state.archived = true
      return respond(options.archiveOverride ?? { id: 'set-one', status: 'archived' })
    }
    if (path.endsWith('/attempts')) {
      if (options.failStart)
        return respond(
          {
            code: 'SCHEMA_NOT_READY',
            message: 'Practice is temporarily unavailable. Try again later.',
          },
          503
        )
      if (options.pendingStart) await options.pendingStart
      return respond(options.startOverride ?? caseAttempt)
    }
    if (path.endsWith('/submit')) {
      if (options.pendingSave) await options.pendingSave
      if (state.failSubmit) {
        state.failSubmit = false
        return respond(
          { code: 'DATABASE_ERROR', message: 'Unable to save this answer. Please retry.' },
          503
        )
      }
      if (options.submitOverride) return respond(options.submitOverride)
      return respond({
        submission: {
          id: 'submission',
          attemptId: attempt.id,
          questionId: question.id,
          isCorrect: true,
          pointsEarned: 10,
          submittedAt: '2026-10-24T00:00:00Z',
          explanation: options.feedback,
        },
        attempt: {
          ...caseAttempt,
          questions: undefined,
          status: options.completed === false ? 'in_progress' : 'completed',
          score: 10,
        },
      })
    }
    if (path.startsWith('/api/practice/sets/')) {
      if (options.notFound)
        return respond({ code: 'NOT_FOUND', message: 'Practice set not found' }, 404)
      if (state.failLoad)
        return respond(
          { code: 'NETWORK_ERROR', message: 'Unable to load practice. Please retry.' },
          503
        )
      const id = path.split('/').pop()
      return respond(
        options.setOverride ??
          practiceSet({
            id,
            title: id === 'set-two' ? 'Practice two' : 'Practice one',
            questions: [practiceQuestion({ setId: id })],
          })
      )
    }
    // No unmocked API request can reach Supabase or the user's backend.
    return respond({})
  })
  return { state, calls }
}

async function startAndAnswer(page: Page) {
  await page.goto('/practice/sets/set-one')
  await page.getByRole('button', { name: 'Start practice', exact: true }).click()
  await page.getByLabel('Your answer', { exact: true }).fill('hello')
}

test('explanations arrive with the committed submission and stay hidden while it is pending', async ({
  page,
}) => {
  let release!: () => void
  const pendingSave = new Promise<void>(resolve => {
    release = resolve
  })
  await fixture(page, {
    pendingSave,
    completed: false,
    twoQuestions: true,
    feedback: 'Explanation returned after saving this answer',
  })
  await page.goto('/practice/sets/set-one')
  await page.getByRole('button', { name: 'Start practice', exact: true }).click()
  const feedback = page.getByText('Explanation returned after saving this answer', { exact: true })
  await expect(feedback).toHaveCount(0)
  await page.getByLabel('Your answer', { exact: true }).fill('hello')
  await page.getByRole('button', { name: 'Submit answer', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Saving answer...', exact: true })).toBeDisabled()
  await expect(feedback).toHaveCount(0)
  release()
  await expect(feedback).toBeVisible()
  await expect(page.getByText('Practice completed', { exact: true })).toHaveCount(0)
})

for (const path of ['/practice/sets', '/practice/official-sets', '/practice/my-sets']) {
  test(`${path} distinguishes catalog errors from empty results and retries`, async ({ page }) => {
    const { state } = await fixture(page, { failList: true })
    await page.goto(path)
    await expect(page.getByRole('alert')).toContainText('Unable to load the catalog. Please retry.')
    state.failList = false
    await page.getByRole('button', { name: 'Retry', exact: true }).click()
    await expect(page.getByText('Practice one', { exact: true })).toBeVisible()
    await expect(page.getByRole('alert')).toHaveCount(0)
  })
}

test('archiving explains that history is kept and refreshes the personal catalog', async ({
  page,
}) => {
  const { calls } = await fixture(page)
  await page.goto('/practice/my-sets')
  await expect(page.getByText('Practice one', { exact: true })).toBeVisible()
  page.once('dialog', async dialog => {
    expect(dialog.message()).toContain('tiến độ và lịch sử làm bài vẫn được giữ lại')
    await dialog.accept()
  })
  await page.getByRole('button', { name: 'Lưu trữ', exact: true }).click()
  await expect(page.getByText('Bạn chưa tạo bộ bài tập nào', { exact: true })).toBeVisible()
  expect(calls.filter(call => call === 'DELETE /api/practice/sets/set-one')).toHaveLength(1)
})

test('a service failure is shown accurately and does not start an attempt', async ({ page }) => {
  await fixture(page, { failStart: true })
  await page.goto('/practice/sets/set-one')
  await page.getByRole('button', { name: 'Start practice', exact: true }).click()
  await expect(
    page.getByText('Practice is temporarily unavailable. Try again later.', { exact: true })
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeEnabled()
  await expect(page.getByLabel('Your answer', { exact: true })).toHaveCount(0)
})

test('a load failure has retry rather than a false not-found state', async ({ page }) => {
  const { state } = await fixture(page, { failLoad: true })
  await page.goto('/practice/sets/set-one')
  await expect(page.getByRole('alert')).toContainText('Unable to load practice. Please retry.')
  await expect(page.getByText('Practice set not found', { exact: true })).toHaveCount(0)
  state.failLoad = false
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Practice one', exact: true })).toBeVisible()
})

test('a real 404 remains a not-found state', async ({ page }) => {
  await fixture(page, { notFound: true })
  await page.goto('/practice/sets/set-one')
  await expect(
    page.getByRole('heading', { name: 'Practice set not found', exact: true })
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toHaveCount(0)
})

test('a failed answer preserves the input and can be retried without claiming completion', async ({
  page,
}) => {
  const { calls } = await fixture(page, { failSubmit: true })
  await startAndAnswer(page)
  await page.getByRole('button', { name: 'Submit answer', exact: true }).click()
  await expect(
    page.getByText('Unable to save this answer. Please retry.', { exact: true })
  ).toBeVisible()
  await expect(page.getByLabel('Your answer', { exact: true })).toHaveValue('hello')
  await expect(page.getByRole('heading', { name: 'Practice completed', exact: true })).toHaveCount(
    0
  )
  await page.getByRole('button', { name: 'Submit answer', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Practice completed', exact: true })).toBeVisible()
  await expect(page.getByText('Your score: 10/10 points', { exact: true })).toBeVisible()
  expect(calls.filter(call => call.endsWith('/submit'))).toHaveLength(2)
})

test('pending save locks the submitted answer and completion waits for the server', async ({
  page,
}) => {
  let release!: () => void
  const gate = new Promise<void>(resolve => {
    release = resolve
  })
  await fixture(page, { pendingSave: gate })
  await startAndAnswer(page)
  await page.getByRole('button', { name: 'Submit answer', exact: true }).click()
  await expect(page.getByLabel('Your answer', { exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Saving answer...', exact: true })).toBeDisabled()
  await expect(page.getByRole('heading', { name: 'Practice completed', exact: true })).toHaveCount(
    0
  )
  release()
  await expect(page.getByRole('heading', { name: 'Practice completed', exact: true })).toBeVisible()
})

test('local question count alone never declares an incomplete server attempt complete', async ({
  page,
}) => {
  await fixture(page, { completed: false })
  await startAndAnswer(page)
  await page.getByRole('button', { name: 'Submit answer', exact: true }).click()
  await expect(page.getByText('Correct answer saved', { exact: true })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Practice completed', exact: true })).toHaveCount(
    0
  )
})

test('a delayed start cannot restore an attempt after navigating to another set', async ({
  page,
}) => {
  let release!: () => void
  const gate = new Promise<void>(resolve => {
    release = resolve
  })
  const { calls } = await fixture(page, { pendingStart: gate })
  await page.goto('/practice/sets/set-one')
  await page.getByRole('button', { name: 'Start practice', exact: true }).click()
  await expect.poll(() => calls.some(call => call.endsWith('/set-one/attempts'))).toBe(true)
  // Simulate a same-document history navigation so React reuses the route component.
  await page.evaluate(() => {
    history.pushState(null, '', '/practice/sets/set-two')
    dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(page.getByRole('heading', { name: 'Practice two', exact: true })).toBeVisible()
  const response = page.waitForResponse(res => res.url().endsWith('/set-one/attempts'))
  release()
  await response
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeVisible()
  await expect(page.getByLabel('Your answer', { exact: true })).toHaveCount(0)
})

test('malformed catalog data shows retry instead of crashing or inventing an empty library', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await fixture(page, { listOverride: { items: {}, total: 1, limit: 24, offset: 0 } })
  await page.goto('/practice/sets')
  await expect(page.getByRole('alert')).toContainText('Không xác nhận được dữ liệu Practice')
  await expect(page.getByRole('button', { name: 'Retry', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('a start for another account cannot open an attempt or report success', async ({ page }) => {
  await fixture(page, { startOverride: practiceAttempt({ userId: 'other' }) })
  await page.goto('/practice/sets/set-one')
  await page.getByRole('button', { name: 'Start practice', exact: true }).click()
  await expect(
    page.getByText('Không xác nhận được dữ liệu Practice. Vui lòng tải lại hoặc thử lại.', {
      exact: true,
    })
  ).toBeVisible()
  await expect(page.getByLabel('Your answer', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeEnabled()
})

test('a mismatched completed submission keeps the answer editable and cannot celebrate', async ({
  page,
}) => {
  const saved = practiceSubmission()
  await fixture(page, {
    submitOverride: { ...saved, submission: { ...saved.submission, questionId: 'foreign' } },
  })
  await startAndAnswer(page)
  await page.getByRole('button', { name: 'Submit answer', exact: true }).click()
  await expect(
    page.getByText('Không xác nhận được dữ liệu Practice. Vui lòng tải lại hoặc thử lại.', {
      exact: true,
    })
  ).toBeVisible()
  await expect(page.getByLabel('Your answer', { exact: true })).toHaveValue('hello')
  await expect(page.getByLabel('Your answer', { exact: true })).toBeEnabled()
  await expect(page.getByRole('heading', { name: 'Practice completed', exact: true })).toHaveCount(
    0
  )
})

test('same-turn start and submit clicks issue one request each while pending', async ({ page }) => {
  let releaseStart!: () => void
  let releaseSave!: () => void
  const pendingStart = new Promise<void>(resolve => {
    releaseStart = resolve
  })
  const pendingSave = new Promise<void>(resolve => {
    releaseSave = resolve
  })
  const { calls } = await fixture(page, { pendingStart, pendingSave })
  await page.goto('/practice/sets/set-one')
  await page.getByRole('button', { name: 'Start practice', exact: true }).evaluate(button => {
    ;(button as HTMLButtonElement).click()
    ;(button as HTMLButtonElement).click()
  })
  await expect.poll(() => calls.filter(call => call.endsWith('/attempts')).length).toBe(1)
  releaseStart()
  await page.getByLabel('Your answer', { exact: true }).fill('hello')
  await page.getByRole('button', { name: 'Submit answer', exact: true }).evaluate(button => {
    ;(button as HTMLButtonElement).click()
    ;(button as HTMLButtonElement).click()
  })
  await expect.poll(() => calls.filter(call => call.endsWith('/submit')).length).toBe(1)
  releaseSave()
  await expect(page.getByRole('heading', { name: 'Practice completed', exact: true })).toBeVisible()
  expect(calls.filter(call => call.endsWith('/attempts'))).toHaveLength(1)
  expect(calls.filter(call => call.endsWith('/submit'))).toHaveLength(1)
})

test('leaving a pending submit cannot restore the old attempt in another set', async ({ page }) => {
  let release!: () => void
  const pendingSave = new Promise<void>(resolve => {
    release = resolve
  })
  const { calls } = await fixture(page, { pendingSave })
  await startAndAnswer(page)
  await page.getByRole('button', { name: 'Submit answer', exact: true }).click()
  await expect.poll(() => calls.some(call => call.endsWith('/submit'))).toBe(true)
  await page.evaluate(() => {
    history.pushState(null, '', '/practice/sets/set-two')
    dispatchEvent(new PopStateEvent('popstate'))
  })
  await expect(page.getByRole('heading', { name: 'Practice two', exact: true })).toBeVisible()
  const response = page.waitForResponse(res => res.url().endsWith('/submit'))
  release()
  await response
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeEnabled()
  await expect(page.getByRole('heading', { name: 'Practice completed', exact: true })).toHaveCount(
    0
  )
})

test('an empty set explains why starting is unavailable and sends no write', async ({ page }) => {
  const { calls } = await fixture(page, {
    setOverride: practiceSet({ questions: [], questionCount: 0 }),
  })
  await page.goto('/practice/sets/set-one')
  await expect(page.getByRole('button', { name: 'Start practice', exact: true })).toBeDisabled()
  await expect(page.getByRole('status')).toContainText('not currently available')
  expect(calls.some(call => call.endsWith('/attempts'))).toBe(false)
})

test('a missing archive acknowledgement keeps the row until an explicit list reload confirms its state', async ({
  page,
}) => {
  const { calls } = await fixture(page, { archiveOverride: { success: true } })
  page.once('dialog', dialog => dialog.accept())
  await page.goto('/practice/my-sets')
  await page.getByRole('button', { name: 'Lưu trữ', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Chưa xác nhận đúng bộ bài')
  await expect(page.getByText('Practice one', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Tải lại danh sách', exact: true }).click()
  await expect(page.getByText('Bạn chưa tạo bộ bài tập nào', { exact: true })).toBeVisible()
  expect(calls.filter(call => call === 'DELETE /api/practice/sets/set-one')).toHaveLength(1)
})

test('same-turn personal archive clicks start one confirmation and one pending request', async ({
  page,
}) => {
  let release!: () => void
  const pendingArchive = new Promise<void>(resolve => {
    release = resolve
  })
  const { calls } = await fixture(page, { pendingArchive })
  let confirmations = 0
  page.on('dialog', async dialog => {
    confirmations++
    await dialog.accept()
  })
  await page.goto('/practice/my-sets')
  await page.getByRole('button', { name: 'Lưu trữ', exact: true }).evaluate(button => {
    ;(button as HTMLButtonElement).click()
    ;(button as HTMLButtonElement).click()
  })
  await expect
    .poll(() => calls.filter(call => call === 'DELETE /api/practice/sets/set-one').length)
    .toBe(1)
  await expect(page.getByRole('button', { name: 'Lưu trữ', exact: true })).toBeDisabled()
  release()
  await expect(page.getByText('Bạn chưa tạo bộ bài tập nào', { exact: true })).toBeVisible()
  expect(confirmations).toBe(1)
})
