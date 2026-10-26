import { expect, test, type Page } from '@playwright/test'
import { mockApi, reply } from './fixtures/api'
import { pvpQuestion, pvpSubmission } from '../src/test-utils/pvp'
import type { PvPSubmission } from '../src/types/pvp.types'

const actor = '11111111-1111-4111-8111-111111111111'
const matchId = '22222222-2222-4222-8222-222222222222'
const questionId = '33333333-3333-4333-8333-333333333333'
const player = (id: string) => ({
  id,
  match_id: matchId,
  user_id: id,
  is_ready: false,
  is_connected: true,
  total_score: 0,
  questions_answered: 0,
  correct_answers: 0,
  joined_at: '2026-10-22T00:00:00Z',
  display_name: id === actor ? 'Người học test' : 'Đối thủ test',
})

async function fixture(page: Page, points = 0) {
  let sendEvent: ((event: string, payload: unknown) => void) | null = null
  const profile = { id: actor, onboardingCompleted: true, preferredLanguage: 'javascript', points }
  const state = {
    eligible: true,
    failEligibility: false,
    failAction: false,
    failRead: false,
    missingAck: false,
    pending: Promise.resolve(),
    readyAck: Promise.resolve(),
    submissionAck: Promise.resolve(),
    failSubmission: false,
    savedSubmission: null as PvPSubmission | null,
    emit: (event: string, payload: unknown) => {
      if (!sendEvent) throw new Error('Socket not connected')
      sendEvent(event, payload)
    },
    writes: [] as string[],
    selections: [] as unknown[],
    socketEvents: [] as string[],
    match: {
      id: matchId,
      room_code: 'ROOM01',
      mode: '1v1',
      status: 'waiting',
      language_id: 'javascript',
      difficulty: 'medium',
      question_ids: [questionId],
      current_question_index: 0,
      max_players: 2,
      time_per_question: 30,
      created_at: '2026-10-22T00:00:00Z',
      updated_at: '2026-10-22T00:00:00Z',
      participants: [player(actor), player('44444444-4444-4444-8444-444444444444')],
    },
  }
  await page.addInitScript(() => localStorage.setItem('language', 'vi'))
  // Local Engine.IO/Socket.IO protocol fixture: no websocket reaches the deployed backend.
  await page.routeWebSocket('**/socket.io/**', ws => {
    sendEvent = (event, payload) => ws.send(`42${JSON.stringify([event, payload])}`)
    ws.onMessage(async raw => {
      const message = raw.toString()
      if (message.startsWith('40')) {
        ws.send('40{"sid":"pvp-test"}')
        return
      }
      if (!message.startsWith('42')) return
      const [event] = JSON.parse(message.slice(2)) as [string, unknown]
      state.socketEvents.push(event)
      if (event === 'match:join') {
        ws.send(`42${JSON.stringify(['match:updated', { match: state.match }])}`)
        if (state.match.status === 'in_progress')
          sendEvent?.('match:question_changed', {
            match: state.match,
            question: pvpQuestion(),
            timeRemaining: 30,
            submission: state.savedSubmission || undefined,
          })
      }
      if (event === 'match:ready') {
        await state.readyAck
        state.match.participants[0].is_ready = true
        ws.send(`42${JSON.stringify(['participant:ready', state.match.participants[0]])}`)
      }
      if (event === 'submission:answer') {
        await state.submissionAck
        if (state.failSubmission) {
          state.failSubmission = false
          sendEvent?.('error', { message: 'Không lưu được đáp án test. Hãy thử lại.' })
        } else {
          state.savedSubmission = pvpSubmission()
          sendEvent?.('submission:received', state.savedSubmission)
        }
      }
    })
    ws.send('0{"sid":"pvp-engine-test","upgrades":[],"pingInterval":25000,"pingTimeout":20000}')
  })
  await mockApi(page, async route => {
    const path = new URL(route.request().url()).pathname
    if (path === '/api/auth/me')
      return reply(route, { user: { id: actor, email: 'learner@example.test', profile } })
    if (path === '/api/admin-auth/me' || path === '/api/auth/refresh') return reply(route, {}, 401)
    if (path === '/api/profile/me') return reply(route, { profile })
    if (path === '/api/content/batch') return reply(route, { items: {}, missingKeys: [] })
    if (path === '/api/pvp/eligibility')
      return state.failEligibility
        ? reply(route, { message: 'Không tải được điều kiện PvP' }, 503)
        : reply(route, {
            eligible: state.eligible,
            onboardingCompleted: true,
            hasCompletedLesson: state.eligible,
          })
    if (route.request().method() === 'POST') {
      state.writes.push(path)
      if (path === '/api/pvp/matchmaking') state.selections.push(route.request().postDataJSON())
      await state.pending
      if (state.failAction)
        return reply(
          route,
          { code: 'SCHEMA_NOT_READY', message: 'Dịch vụ PvP đang bận, vui lòng thử lại.' },
          503
        )
      return reply(route, state.missingAck ? {} : { match: state.match })
    }
    if (path.startsWith('/api/pvp/matches/'))
      return state.failRead
        ? reply(route, { message: 'Không tải được phòng test' }, 503)
        : reply(route, { match: state.match })
    return reply(route, {})
  })
  return state
}

test('published completion can unlock PvP with zero cached points, and matchmaking uses selected language/difficulty', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/practice/compete')
  const start = page.getByRole('button', { name: 'Bắt đầu 1v1', exact: true })
  await expect(start).toBeEnabled()
  await start.click()
  await expect(page).toHaveURL('/practice/compete/match/ROOM01')
  await expect(page.getByRole('heading', { name: 'Sảnh phòng đấu' })).toBeVisible()
  expect(state.selections).toEqual([
    { mode: '1v1', language_id: 'javascript', difficulty: 'medium' },
  ])
  expect(state.writes).toEqual(['/api/pvp/matchmaking'])
})

test('cached points cannot unlock PvP without saved published completion', async ({ page }) => {
  const state = await fixture(page, 500)
  state.eligible = false
  await page.goto('/practice/compete')
  await expect(page.getByRole('button', { name: 'Bắt đầu 1v1', exact: true })).toBeDisabled()
  expect(state.writes).toEqual([])
})

test('eligibility load failure is retryable and is never presented as a locked or ready lobby', async ({
  page,
}) => {
  const state = await fixture(page)
  state.failEligibility = true
  await page.goto('/practice/compete')
  await expect(page.getByRole('alert')).toContainText('Không tải được điều kiện PvP')
  await expect(page.getByRole('button', { name: 'Bắt đầu 1v1', exact: true })).toHaveCount(0)
  state.failEligibility = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Bắt đầu 1v1', exact: true })).toBeEnabled()
})

test('pending matchmaking locks join, input and difficulty and cannot be duplicated by submit', async ({
  page,
}) => {
  const state = await fixture(page)
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/practice/compete')
  await page.getByLabel('Mã phòng', { exact: true }).fill('room01')
  await page.getByRole('button', { name: 'Bắt đầu 1v1', exact: true }).click()
  await expect(page.getByLabel('Mã phòng', { exact: true })).toBeDisabled()
  await expect(
    page.getByRole('group', { name: 'Độ khó' }).getByRole('button').first()
  ).toBeDisabled()
  await page
    .locator('form')
    .evaluate(form => form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true })))
  release()
  await expect(page).toHaveURL('/practice/compete/match/ROOM01')
  expect(state.writes).toEqual(['/api/pvp/matchmaking'])
})

test('join errors preserve the code and the server message, then retry the same room', async ({
  page,
}) => {
  const state = await fixture(page)
  state.failAction = true
  await page.goto('/practice/compete')
  await page.getByLabel('Mã phòng', { exact: true }).fill('room01')
  await page.getByLabel('Mã phòng', { exact: true }).press('Enter')
  await expect(page.getByRole('alert')).toContainText('Dịch vụ PvP đang bận')
  await expect(page.getByLabel('Mã phòng', { exact: true })).toHaveValue('ROOM01')
  state.failAction = false
  await page.getByLabel('Mã phòng', { exact: true }).press('Enter')
  await expect(page).toHaveURL('/practice/compete/match/ROOM01')
  expect(state.writes).toEqual(['/api/pvp/matches/ROOM01/join', '/api/pvp/matches/ROOM01/join'])
})

test('late matchmaking cannot navigate back after leaving the lobby', async ({ page }) => {
  const state = await fixture(page)
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/practice/compete')
  await page.getByRole('button', { name: 'Bắt đầu 1v1', exact: true }).click()
  await expect.poll(() => state.writes.length).toBe(1)
  await page.getByRole('link', { name: 'Tài liệu', exact: true }).first().click()
  await expect(page).toHaveURL('/docs')
  const finished = page.waitForResponse(response => response.url().endsWith('/api/pvp/matchmaking'))
  release()
  await finished
  await expect(page).toHaveURL('/docs')
})

test('malformed acknowledgement keeps the learner in the lobby', async ({ page }) => {
  const state = await fixture(page)
  state.missingAck = true
  await page.goto('/practice/compete')
  await page.getByRole('button', { name: 'Bắt đầu 1v1', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('thông tin phòng hợp lệ')
  await expect(page).toHaveURL('/practice/compete')
})

test('room read errors have explicit retry and loading a room does not post another join', async ({
  page,
}) => {
  const state = await fixture(page)
  state.failRead = true
  await page.goto('/practice/compete/match/ROOM01')
  await expect(page.getByRole('alert')).toContainText('Không tải được phòng test')
  await expect(page).toHaveURL('/practice/compete/match/ROOM01')
  state.failRead = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Sảnh phòng đấu' })).toBeVisible()
  expect(state.writes).toEqual([])
})

test('ready waits for a socket confirmation and pending clicks cannot send twice', async ({
  page,
}) => {
  const state = await fixture(page)
  let release!: () => void
  state.readyAck = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/practice/compete/match/ROOM01')
  await page.getByRole('button', { name: 'Tôi đã sẵn sàng', exact: true }).click()
  await expect(
    page.getByRole('button', { name: 'Đang gửi sẵn sàng...', exact: true })
  ).toBeDisabled()
  expect(state.socketEvents.filter(event => event === 'match:ready')).toHaveLength(1)
  release()
  await expect(page.getByText('Đang chờ người khác sẵn sàng', { exact: true })).toBeVisible()
})

test('PvP entry and waiting room fit a phone viewport', async ({ page }) => {
  await fixture(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/practice/compete')
  await expect(page.getByLabel('Mã phòng', { exact: true })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true
  )
  await page.getByRole('button', { name: 'Bắt đầu 1v1', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Sảnh phòng đấu' })).toBeVisible()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1)).toBe(
    true
  )
})

async function openRound(page: Page) {
  const state = await fixture(page)
  state.match.status = 'in_progress'
  await page.goto('/pvp/match/ROOM01')
  await expect(page.getByRole('heading', { name: 'Choose an answer', exact: true })).toBeVisible()
  return state
}

test('PvP locks a pending answer, sends once, and confirms only after the server acknowledgement', async ({
  page,
}) => {
  const state = await openRound(page)
  let release!: () => void
  state.submissionAck = new Promise<void>(resolve => {
    release = resolve
  })
  await page.getByRole('button', { name: 'A. First', exact: true }).click()
  await page.getByRole('button', { name: 'Gửi đáp án', exact: true }).evaluate(button => {
    ;(button as HTMLButtonElement).click()
    ;(button as HTMLButtonElement).click()
  })
  await expect(page.getByRole('button', { name: 'Đang xác nhận…', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'B. Second', exact: true })).toBeDisabled()
  await expect(page.getByText('+10 points!', { exact: true })).toHaveCount(0)
  await expect
    .poll(() => state.socketEvents.filter(event => event === 'submission:answer').length)
    .toBe(1)
  release()
  await expect(page.getByRole('button', { name: 'Đã gửi', exact: true })).toBeDisabled()
  await expect(page.getByText('+10 points!', { exact: true })).toBeVisible()
  state.emit('submission:received', state.savedSubmission)
  await expect(page.getByText('+10 points!', { exact: true })).toHaveCount(1)
})

test('PvP rejects a malformed or foreign question packet without crashing or replacing the current question', async ({
  page,
}) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const state = await openRound(page)
  state.emit('match:question_changed', {
    match: state.match,
    question: { id: questionId, options: {} },
    timeRemaining: 30,
  })
  await expect(page.getByRole('status', { name: 'Trạng thái kết nối PvP' })).toContainText(
    'Không đọc được dữ liệu realtime'
  )
  await expect(page.getByRole('heading', { name: 'Choose an answer', exact: true })).toBeVisible()
  state.emit('match:question_changed', {
    match: state.match,
    question: pvpQuestion({ id: 'foreign' }),
    timeRemaining: 30,
  })
  await expect(page.getByRole('heading', { name: 'Choose an answer', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Đồng bộ lại phòng', exact: true }).click()
  await expect(
    page.getByText('Không đọc được dữ liệu realtime PvP. Hãy đồng bộ lại phòng.', { exact: true })
  ).toHaveCount(0)
  expect(errors).toEqual([])
})

test('PvP preserves a failed answer and supports an explicit retry without claiming success', async ({
  page,
}) => {
  const state = await openRound(page)
  state.failSubmission = true
  await page.getByRole('button', { name: 'A. First', exact: true }).click()
  await page.getByRole('button', { name: 'Gửi đáp án', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Không lưu được đáp án test')
  await expect(page.getByRole('button', { name: 'Gửi đáp án', exact: true })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Đã gửi', exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Gửi đáp án', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Đã gửi', exact: true })).toBeDisabled()
  expect(state.socketEvents.filter(event => event === 'submission:answer')).toHaveLength(2)
})

test('PvP refuses a foreign saved submission and cannot fabricate completed results', async ({
  page,
}) => {
  const state = await openRound(page)
  state.emit('submission:received', pvpSubmission({ user_id: 'foreign' }))
  await expect(page.getByRole('button', { name: 'Đã gửi', exact: true })).toHaveCount(0)
  state.emit('match:completed', {
    match: { ...state.match, status: 'completed' },
    finalScores: [{ userId: actor, displayName: 'Invented', score: 999, rank: 1 }],
  })
  await expect(page.getByRole('status', { name: 'Trạng thái kết nối PvP' })).toContainText(
    'Không đọc được dữ liệu realtime'
  )
  await expect(page.getByRole('heading', { name: 'Choose an answer', exact: true })).toBeVisible()
})
