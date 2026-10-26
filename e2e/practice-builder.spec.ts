import { expect, test, type Page } from '@playwright/test'
import { mockApi, reply } from './fixtures/api'
import { practiceSet, practiceQuestion, practiceSavedFromPayload } from '../src/test-utils/practice'

const copies = {
  'nav.practice': 'Practice',
  'practice.create.main.update_set': 'Update set',
  'practice.create.main.publish_set': 'Publish set',
  'practice.create.main.publishing': 'Saving set...',
  'practice.create.main.settings': 'Settings',
  'practice.create.main.create_question': 'Create question',
  'practice.create.toast.updated': 'Set saved',
  'practice.create.toast.created': 'Set created',
  'practice.create.editor.type': 'Question type',
  'practice.create.editor.prompt': 'Question prompt',
  'practice.create.editor.correct_blank': 'Correct answer',
  'practice.create.editor.save_question': 'Save question',
  'practice.create.settings.set_title': 'Set title',
  'practice.create.main.empty_title': 'No questions yet',
}
const recoveredId = '11111111-1111-4111-8111-111111111111'

async function fixture(page: Page, options: { keywords?: string[]; count?: number } = {}) {
  const state = {
    failLoad: false,
    failSave: false,
    pendingSave: Promise.resolve(),
    committedReadFail: false,
    recoveryReadFail: false,
    recoveryReads: 0,
    owner: 'learner',
    writes: [] as Record<string, unknown>[],
  }
  await page.addInitScript(() => localStorage.setItem('language', 'en'))
  await mockApi(page, async route => {
    const path = new URL(route.request().url()).pathname
    const method = route.request().method()
    if (path === '/api/auth/me')
      return reply(route, {
        user: {
          id: 'learner',
          email: 'learner@example.test',
          profile: { id: 'learner', onboardingCompleted: true },
        },
      })
    if (path === '/api/content/batch') return reply(route, { items: copies, missingKeys: [] })
    if (path === '/api/moderation/keywords') return reply(route, options.keywords || [])
    if (path === '/api/languages')
      return reply(route, { languages: [{ id: 'javascript', name: 'JavaScript' }] })
    if (path === `/api/practice/sets/${recoveredId}` && method === 'GET') {
      ++state.recoveryReads
      if (state.recoveryReadFail)
        return reply(route, { message: 'Read-back still unavailable' }, 503)
      return reply(
        route,
        practiceSavedFromPayload(state.writes[state.writes.length - 1], recoveredId)
      )
    }
    if (path === '/api/practice/sets/set-one' && method === 'GET') {
      if (state.failLoad) return reply(route, { message: 'Builder service unavailable' }, 503)
      return reply(
        route,
        practiceSet({
          id: 'set-one',
          createdBy: state.owner,
          title: 'Existing set',
          difficulty: 'easy',
          status: 'draft',
          visibility: 'private',
          requirements: {},
          questionCount: options.count || 1,
          questions: Array.from({ length: options.count || 1 }, (_, index) =>
            practiceQuestion({
              id: `q-${index}`,
              type: 'fill_blank',
              prompt: `Question ${index + 1}`,
              correctAnswer: 'hello',
              points: 1,
            })
          ),
        })
      )
    }
    if (
      (path === '/api/practice/sets/set-one' && method === 'PUT') ||
      (path === '/api/practice/sets' && method === 'POST')
    ) {
      state.writes.push(route.request().postDataJSON())
      await state.pendingSave
      if (state.committedReadFail)
        return reply(
          route,
          {
            code: 'PRACTICE_SAVED_READ_FAILED',
            message: 'Saved but read-back failed',
            details: { setId: recoveredId },
          },
          503
        )
      return state.failSave
        ? reply(route, { message: 'Cannot save this set now' }, 503)
        : reply(route, practiceSavedFromPayload(state.writes[state.writes.length - 1]))
    }
    if (path === '/api/practice/sets')
      return reply(route, { items: [], total: 0, limit: 24, offset: 0 })
    return reply(route, {})
  })
  return state
}

const titleField = (page: Page) => page.getByRole('textbox', { name: 'Set title', exact: true })

test('literal moderation keywords cannot crash the learner builder', async ({ page }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await fixture(page, { keywords: ['c++', '[blocked]', 'a.b', ' đĩ '] })
  await page.goto('/practice/sets/set-one/edit')
  await expect(titleField(page)).toHaveValue('Existing set')
  await titleField(page).fill('Study c++')
  await expect(page.getByText(/Found restricted keyword/)).toContainText('c++')
  expect(errors).toEqual([])
})

test('failed builder loads stay on the route with retry and no writable empty draft', async ({
  page,
}) => {
  const state = await fixture(page)
  state.failLoad = true
  await page.goto('/practice/sets/set-one/edit')
  await expect(page.getByRole('alert')).toContainText('Builder service unavailable')
  await expect(page.getByRole('button', { name: 'Update set', exact: true })).toHaveCount(0)
  await expect(page).toHaveURL(/\/set-one\/edit$/)
  state.failLoad = false
  await page.getByRole('button', { name: /Thử lại|Try again/ }).click()
  await expect(titleField(page)).toHaveValue('Existing set')
  expect(state.writes).toEqual([])
})

test('pending save freezes its draft and a failed save keeps it for retry', async ({ page }) => {
  const state = await fixture(page)
  let release!: () => void
  state.pendingSave = new Promise(resolve => {
    release = resolve
  })
  state.failSave = true
  await page.goto('/practice/sets/set-one/edit')
  await titleField(page).fill('Keep my draft')
  await page.getByRole('button', { name: 'Update set', exact: true }).click()
  await expect.poll(() => state.writes.length).toBe(1)
  await expect(titleField(page)).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Create question', exact: true })).toBeDisabled()
  release()
  await expect(page.getByText('Cannot save this set now', { exact: true })).toBeVisible()
  await expect(titleField(page)).toHaveValue('Keep my draft')
  await expect(titleField(page)).toBeEnabled()
  state.failSave = false
  await page.getByRole('button', { name: 'Update set', exact: true }).click()
  await expect(page).toHaveURL(/\/practice\/my-sets$/)
  expect(state.writes).toHaveLength(2)
  expect(state.writes[1].title).toBe('Keep my draft')
})

test('a late builder save cannot navigate or toast after the learner leaves', async ({ page }) => {
  const state = await fixture(page)
  let release!: () => void
  state.pendingSave = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/practice/sets/set-one/edit')
  await page.getByRole('button', { name: 'Update set', exact: true }).click()
  await expect.poll(() => state.writes.length).toBe(1)
  await page.getByRole('banner').getByRole('link', { name: 'Practice', exact: true }).click()
  await expect(page).toHaveURL(/\/practice$/)
  const response = page.waitForResponse(result => result.request().method() === 'PUT')
  release()
  await response
  await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => resolve())))
  await expect(page).toHaveURL(/\/practice$/)
  await expect(page.getByText('Set saved', { exact: true })).toHaveCount(0)
})

test('duplicate actions cannot grow a full set beyond thirty questions', async ({ page }) => {
  const state = await fixture(page, { count: 30 })
  await page.goto('/practice/sets/set-one/edit')
  await expect(page.locator('article')).toHaveCount(30)
  const duplicate = page.locator('article').first().getByRole('button').first()
  if (await duplicate.isEnabled()) await duplicate.click()
  await expect(page.locator('article')).toHaveCount(30)
  await expect(duplicate).toBeDisabled()
  await page.getByRole('button', { name: 'Update set', exact: true }).click()
  await expect.poll(() => state.writes.length).toBe(1)
  expect(state.writes[0].questions).toHaveLength(30)
})

test('a learner can create their first set from a new draft and save its answer key', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/practice/sets/new')
  await expect(titleField(page)).toHaveValue('Untitled Quiz')
  await titleField(page).fill('My first practice set')
  await page.getByRole('button', { name: 'Create question', exact: true }).click()
  await page
    .getByRole('combobox', { name: 'Question type', exact: true })
    .selectOption('fill_blank')
  await page.getByRole('textbox', { name: 'Question prompt', exact: true }).fill('Write hello')
  await page.getByRole('textbox', { name: 'Correct answer', exact: true }).fill('hello')
  await page.getByRole('button', { name: 'Save question', exact: true }).click()
  await page.getByRole('button', { name: 'Publish set', exact: true }).click()
  await expect(page).toHaveURL(/\/practice\/my-sets$/)
  expect(state.writes).toHaveLength(1)
  expect(state.writes[0]).toMatchObject({
    title: 'My first practice set',
    questions: [{ type: 'fill_blank', prompt: 'Write hello', correctAnswer: 'hello' }],
  })
})

async function draftNewSet(page: Page) {
  await page.goto('/practice/sets/new')
  await titleField(page).fill('Recover this saved set')
  await page.getByRole('button', { name: 'Create question', exact: true }).click()
  await page
    .getByRole('combobox', { name: 'Question type', exact: true })
    .selectOption('fill_blank')
  await page.getByRole('textbox', { name: 'Question prompt', exact: true }).fill('Write hello')
  await page.getByRole('textbox', { name: 'Correct answer', exact: true }).fill('hello')
  await page.getByRole('button', { name: 'Save question', exact: true }).click()
}

test('a committed create recovers using reads only, retains its draft, and cannot create twice', async ({
  page,
}) => {
  const state = await fixture(page)
  state.committedReadFail = true
  state.recoveryReadFail = true
  await draftNewSet(page)
  await page.getByRole('button', { name: 'Publish set', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Bộ bài đã được lưu')
  await expect(titleField(page)).toHaveValue('Recover this saved set')
  await expect(titleField(page)).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Publish set', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'Tải lại kết quả', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Read-back still unavailable')
  expect(state.writes).toHaveLength(1)
  state.recoveryReadFail = false
  await page.getByRole('button', { name: 'Tải lại kết quả', exact: true }).click()
  await expect(page).toHaveURL(/\/practice\/my-sets$/)
  expect(state.writes).toHaveLength(1)
  expect(state.recoveryReads).toBe(2)
})

test('a learner cannot open another owner public set as a writable draft', async ({ page }) => {
  const state = await fixture(page)
  state.owner = 'another-learner'
  await page.goto('/practice/sets/set-one/edit')
  await expect(page.getByRole('alert')).toContainText('không có quyền chỉnh sửa')
  await expect(titleField(page)).toHaveCount(0)
  expect(state.writes).toEqual([])
})
