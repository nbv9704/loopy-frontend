import { checkAdminLayout } from './fixtures/admin-layout'
import { expect, test, type Page } from '@playwright/test'
import type { AdminLesson } from '../src/features/admin-lessons/catalog.service'
import { mockApi, reply, replyRaw } from './fixtures/api'

const chapter = { id: 'chapter', title: 'Chapter', language_id: 'javascript', order_index: 0 }
const lesson: AdminLesson = {
  id: 'lesson',
  chapter_id: chapter.id,
  lesson_id: 'intro',
  title: 'Lesson',
  lesson_type: 'code_build',
  status: 'published',
  order_index: 0,
  starter_code: 'let x',
  task_description: 'Task',
  solution_code: 'let x=1',
  test_case_count: 2,
  hint: 'Hint',
}
const practice = {
  id: 'set',
  title: 'Set',
  status: 'draft',
  visibility: 'public',
  difficulty: 'easy',
  questionCount: 2,
}
const submission = {
  id: 'submission',
  lesson_id: 'lesson',
  code: 'learner code',
  is_correct: true,
  execution_time: 0,
  lessons: { id: 'lesson', title: 'Submitted lesson' },
  submitted_at: '2026-10-23T00:00:00Z',
}

async function fixture(page: Page) {
  const state = {
    admin: 'admin',
    checks: 0,
    chapterError: false,
    lessonError: false,
    practiceErrorOffset: -1,
    statsError: false,
    submissionError: false,
    malformed: false,
    writeError: false,
    conflict: false,
    pending: Promise.resolve(),
    oldRead: Promise.resolve(),
    oldReadsStarted: 0,
    delayOld: false,
    lessons: [{ ...lesson }] as AdminLesson[],
    sets: [{ ...practice }],
    attempts: [{ ...submission }],
    cap: 20,
    offsets: [] as number[],
    writes: [] as Array<{ method: string; path: string; body: Record<string, unknown> }>,
  }
  await mockApi(page, async route => {
    const request = route.request(),
      url = new URL(request.url()),
      method = request.method(),
      path = url.pathname
    if (path === '/api/admin-auth/me') {
      state.checks++
      return replyRaw(route, {
        success: true,
        user: { id: state.admin, role: 'admin', is_admin: true },
      })
    }
    if (path === '/api/auth/me' || path === '/api/auth/refresh') return reply(route, {}, 401)
    if (path === '/api/admin/chapters')
      return state.chapterError
        ? reply(route, { message: 'Chapter unavailable' }, 503)
        : reply(route, [chapter])
    if (path === '/api/admin/lessons' && method === 'GET') {
      const status = url.searchParams.get('status'),
        chapterId = url.searchParams.get('chapter_id')
      const rows = state.lessons.filter(
        item =>
          (chapterId === 'all' || item.chapter_id === chapterId) &&
          (status === 'all' ||
            (status === 'active' ? item.status !== 'archived' : item.status === status))
      )
      return state.lessonError
        ? reply(route, { message: 'Lessons unavailable' }, 503)
        : reply(route, rows)
    }
    if (path === '/api/admin/practice/stats')
      return state.statsError
        ? reply(route, { message: 'Stats unavailable' }, 503)
        : reply(route, {
            totalSets: state.sets.length,
            officialSets: state.sets.filter(item => item.visibility === 'official').length,
            publishedSets: state.sets.filter(item => item.status === 'published').length,
            draftSets: state.sets.filter(item => item.status === 'draft').length,
            totalAttempts: 0,
            totalSubmissions: 0,
          })
    if (path === '/api/admin/practice/sets' && method === 'GET') {
      const offset = Number(url.searchParams.get('offset') || 0),
        status = url.searchParams.get('status'),
        visibility = url.searchParams.get('visibility'),
        difficulty = url.searchParams.get('difficulty')
      state.offsets.push(offset)
      const rows = state.sets.filter(
        item =>
          (status === 'all' ||
            (status === 'active' ? item.status !== 'archived' : item.status === status)) &&
          (!visibility || item.visibility === visibility) &&
          (!difficulty || item.difficulty === difficulty)
      )
      if (offset === state.practiceErrorOffset)
        return reply(route, { message: 'Practice page unavailable' }, 503)
      return reply(route, {
        items: rows.slice(offset, offset + state.cap),
        total: rows.length,
        offset,
        limit: 50,
      })
    }
    if (path === '/api/admin/submissions') {
      const status = url.searchParams.get('status'),
        owner = state.admin
      const rows = state.attempts
        .filter(item => status === 'all' || item.is_correct === (status === 'pass'))
        .map(item => ({ ...item, code: `${owner}: ${item.code}` }))
      if (state.delayOld && status === 'all' && owner === 'admin') {
        state.oldReadsStarted++
        await state.oldRead
      }
      return state.submissionError
        ? reply(route, { message: 'Submissions unavailable' }, 503)
        : reply(route, {
            items: rows.slice(
              Number(url.searchParams.get('offset') || 0),
              Number(url.searchParams.get('offset') || 0) +
                Number(url.searchParams.get('limit') || 20)
            ),
            total: rows.length,
            limit: Number(url.searchParams.get('limit') || 20),
            offset: Number(url.searchParams.get('offset') || 0),
          })
    }
    if (
      (path.startsWith('/api/admin/practice/sets/') || path.startsWith('/api/admin/lessons/')) &&
      method !== 'GET'
    ) {
      const body =
        method === 'DELETE' ? Object.fromEntries(url.searchParams) : request.postDataJSON()
      state.writes.push({ method, path, body })
      await state.pending
      if (state.writeError) return reply(route, { message: 'Catalog save unavailable' }, 503)
      if (state.conflict) return reply(route, { message: 'State changed; reload' }, 409)
      if (state.malformed) return reply(route, {})
      if (path.startsWith('/api/admin/lessons/')) {
        state.lessons[0].status = 'archived'
        return reply(route, { id: state.lessons[0].id, archived: true })
      }
      const item = state.sets.find(row => path.includes(`/${row.id}`))!
      if (method === 'DELETE') item.status = 'archived'
      else if (path.endsWith('/status')) item.status = body.status
      else item.visibility = body.visibility
      return reply(route, item)
    }
    return reply(route, [])
  })
  return state
}

test('lesson chapter and list failures stay distinct from confirmed empty data and retry', async ({
  page,
}) => {
  const state = await fixture(page)
  state.chapterError = true
  await page.goto('/admin/lessons')
  await expect(page.getByRole('alert')).toContainText('Chapter unavailable')
  await expect(page.getByText('Lesson trong bộ lọc', { exact: true })).toHaveCount(0)
  state.chapterError = false
  state.lessonError = true
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Lessons unavailable')
  await expect(page.getByText('Không có lesson phù hợp.', { exact: true })).toHaveCount(0)
  state.lessonError = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Sửa lesson Lesson', exact: true })).toBeVisible()
})
test('all-chapter lessons have a learner link for each published row and never label metadata as Ready', async ({
  page,
}) => {
  const state = await fixture(page)
  state.lessons.push({
    ...lesson,
    id: 'draft',
    title: 'Draft',
    status: 'draft',
    lesson_id: 'draft',
  })
  await page.goto('/admin/lessons')
  await expect(
    page.getByRole('link', { name: 'Mở lesson người học Lesson', exact: true })
  ).toHaveAttribute('href', '/learn/javascript/intro')
  await expect(
    page.getByRole('link', { name: 'Mở lesson người học Draft', exact: true })
  ).toHaveCount(0)
  await expect(page.getByText('Ready', { exact: true })).toHaveCount(0)
})
test('lesson search covers later local pages and resets the visible page', async ({ page }) => {
  const state = await fixture(page)
  state.lessons = Array.from({ length: 41 }, (_, index) => ({
    ...lesson,
    id: `lesson-${index}`,
    title: index === 40 ? 'Needle lesson' : `Lesson ${index}`,
  }))
  await page.goto('/admin/lessons')
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Sửa lesson Lesson 20', exact: true })).toBeVisible()
  await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Needle')
  await expect(
    page.getByRole('link', { name: 'Sửa lesson Needle lesson', exact: true })
  ).toBeVisible()
  await expect(page.getByRole('button', { name: 'Trước', exact: true })).toBeDisabled()
})
test('a pending lesson archive locks actions; malformed acknowledgement does not remove the row', async ({
  page,
}) => {
  const state = await fixture(page)
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  state.malformed = true
  page.on('dialog', prompt => prompt.accept())
  await page.goto('/admin/lessons')
  await page.getByRole('button', { name: 'Lưu trữ lesson Lesson', exact: true }).click()
  await expect.poll(() => state.writes.length).toBe(1)
  await expect(page.getByRole('combobox', { name: 'Status', exact: true })).toBeDisabled()
  release()
  await expect(page.getByRole('alert')).toContainText('chưa được xác nhận')
  await expect(page.getByRole('link', { name: 'Sửa lesson Lesson', exact: true })).toBeVisible()
})
test('an archived lesson remains visible in the explicit all-status view', async ({ page }) => {
  await fixture(page)
  page.on('dialog', prompt => prompt.accept())
  await page.goto('/admin/lessons?status=all')
  await page.getByRole('button', { name: 'Lưu trữ lesson Lesson', exact: true }).click()
  await expect(page.getByRole('status').filter({ hasText: 'Đã lưu trữ lesson.' })).toBeVisible()
  await expect(
    page.getByRole('button', { name: 'Lưu trữ lesson Lesson', exact: true })
  ).toBeDisabled()
})
test('Practice loads all capped API pages before global catalog search', async ({ page }) => {
  const state = await fixture(page)
  state.sets = Array.from({ length: 52 }, (_, index) => ({
    ...practice,
    id: `set-${index}`,
    title: index === 51 ? 'Needle set' : `Set ${index}`,
  }))
  await page.goto('/admin/practice')
  await expect(page.getByText('Đã tải 52 set trong bộ lọc.', { exact: false })).toBeVisible()
  expect(state.offsets).toEqual([0, 20, 40])
  await page.getByRole('textbox', { name: 'Search', exact: true }).fill('Needle')
  await expect(
    page.getByRole('link', { name: 'Sửa practice set Needle set', exact: true })
  ).toBeVisible()
})
test('a failing later Practice API page cannot expose a partial catalog as complete', async ({
  page,
}) => {
  const state = await fixture(page)
  state.sets = Array.from({ length: 21 }, (_, index) => ({
    ...practice,
    id: `set-${index}`,
    title: `Set ${index}`,
  }))
  state.practiceErrorOffset = 20
  await page.goto('/admin/practice')
  await expect(page.getByRole('alert')).toContainText('Practice page unavailable')
  await expect(page.getByRole('link', { name: 'Sửa practice set Set 0', exact: true })).toHaveCount(
    0
  )
  state.practiceErrorOffset = -1
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(
    page.getByRole('link', { name: 'Sửa practice set Set 0', exact: true })
  ).toBeVisible()
})
test('Practice stats failures do not use a filtered page as fake totals and retry independently', async ({
  page,
}) => {
  const state = await fixture(page)
  state.statsError = true
  await page.goto('/admin/practice')
  const stats = page.getByRole('region', { name: 'Thống kê Practice' })
  await expect(stats.getByRole('alert')).toContainText('Stats unavailable')
  await expect(page.getByText('Tổng practice sets', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Sửa practice set Set', exact: true })).toBeVisible()
  state.statsError = false
  await stats.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByText('Tổng practice sets', { exact: true })).toBeVisible()
})
test('Practice quick status locks all writes, sends expected status and preserves old state on conflict', async ({
  page,
}) => {
  const state = await fixture(page)
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  state.conflict = true
  await page.goto('/admin/practice')
  await page
    .getByRole('combobox', { name: 'Trạng thái Set', exact: true })
    .selectOption('published')
  await expect.poll(() => state.writes.length).toBe(1)
  await expect(page.getByRole('combobox', { name: 'Visibility Set', exact: true })).toBeDisabled()
  expect(state.writes[0].body).toEqual({ status: 'published', expectedStatus: 'draft' })
  release()
  await expect(page.getByRole('alert')).toContainText('State changed; reload')
  await expect(page.getByRole('combobox', { name: 'Trạng thái Set', exact: true })).toHaveValue(
    'draft'
  )
})
test('visibility acknowledgement reloads the filtered catalog instead of retaining a foreign row', async ({
  page,
}) => {
  await fixture(page)
  await page.goto('/admin/practice')
  await page.getByRole('combobox', { name: 'Visibility', exact: true }).selectOption('public')
  await page.getByRole('combobox', { name: 'Visibility Set', exact: true }).selectOption('official')
  await expect(page.getByText('Đã cập nhật visibility.', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sửa practice set Set', exact: true })).toHaveCount(0)
  await expect(page.getByText('Không có practice set phù hợp.', { exact: true })).toBeVisible()
})
test('Practice archive needs an acknowledgement and keeps archived rows in all-status view', async ({
  page,
}) => {
  const state = await fixture(page)
  state.malformed = true
  page.on('dialog', prompt => prompt.accept())
  await page.goto('/admin/practice')
  await page.getByRole('combobox', { name: 'Trạng thái', exact: true }).selectOption('all')
  await page.getByRole('button', { name: 'Lưu trữ practice set Set', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('chưa được xác nhận')
  await expect(page.getByRole('link', { name: 'Sửa practice set Set', exact: true })).toBeVisible()
  state.malformed = false
  await page.getByRole('button', { name: 'Lưu trữ practice set Set', exact: true }).click()
  await expect(page.getByRole('combobox', { name: 'Trạng thái Set', exact: true })).toHaveValue(
    'archived'
  )
})
test('a late old-admin Practice write cannot overwrite the next admin catalog', async ({
  page,
}) => {
  await page.clock.install()
  const state = await fixture(page)
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/admin/practice')
  await page
    .getByRole('combobox', { name: 'Trạng thái Set', exact: true })
    .selectOption('published')
  await expect.poll(() => state.writes.length).toBe(1)
  state.admin = 'second-admin'
  await page.clock.fastForward(121000)
  await expect.poll(() => state.checks).toBeGreaterThan(1)
  await expect(page.getByRole('combobox', { name: 'Trạng thái Set', exact: true })).toBeEnabled()
  const response = page.waitForResponse(result => result.request().method() === 'PUT')
  release()
  await response
  await expect(page.getByText('Đã cập nhật trạng thái.', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('combobox', { name: 'Trạng thái Set', exact: true })).toHaveValue(
    'draft'
  )
})
test('submission failures do not show fake zero counts or an empty result', async ({ page }) => {
  const state = await fixture(page)
  state.submissionError = true
  await page.goto('/admin/submissions')
  await expect(page.getByRole('alert')).toContainText('Submissions unavailable')
  await expect(page.getByText('Đang xem', { exact: true })).toHaveCount(0)
  await expect(page.getByText('Chưa có submission phù hợp.', { exact: true })).toHaveCount(0)
  state.submissionError = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('article')).toContainText('0ms')
})
test('the old all-submissions response cannot replace a selected fail filter', async ({ page }) => {
  const state = await fixture(page)
  let release!: () => void
  state.attempts.push({ ...submission, id: 'failed', is_correct: false, code: 'failure code' })
  state.delayOld = true
  state.oldRead = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/admin/submissions')
  await page.getByRole('button', { name: 'fail', exact: true }).click()
  await expect(page.getByRole('article')).toHaveCount(1)
  await expect(page.getByRole('article')).toContainText('failure code')
  release()
  await expect(page.getByRole('article')).not.toContainText('learner code')
})
test('changing admin hides the previous private submission code and ignores its delayed response', async ({
  page,
}) => {
  await page.clock.install()
  const state = await fixture(page)
  let release!: () => void
  state.delayOld = true
  state.oldRead = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/admin/submissions')
  // Advance the session clock only after the old account's read is actually pending.
  await expect.poll(() => state.oldReadsStarted).toBe(1)
  state.admin = 'second-admin'
  await page.clock.fastForward(121000)
  await expect.poll(() => state.checks).toBeGreaterThan(1)
  await expect(page.getByRole('article')).toContainText('second-admin:')
  release()
  await expect(page.locator('article pre')).toHaveText('second-admin: learner code')
})
test('catalogs and code monitor fit a phone with long content', async ({ page }) => {
  const state = await fixture(page)
  state.lessons[0].title = 'Lesson ' + 'long'.repeat(80)
  state.sets[0].title = 'Practice ' + 'long'.repeat(80)
  state.attempts[0].code = 'x'.repeat(3000)
  await page.setViewportSize({ width: 390, height: 844 })
  for (const path of ['/admin/lessons', '/admin/practice', '/admin/submissions']) {
    await page.goto(path)
    await expect(page.locator('main').getByRole('heading', { level: 1 })).toBeVisible()
    await expect(page.getByRole('status')).toHaveCount(0)
    const layout = await page.evaluate(() => ({
      width: document.documentElement.scrollWidth,
      overflow: Array.from(
        document.querySelectorAll('main input, main select, main label, main > div > div')
      )
        .map(element => ({
          tag: element.tagName,
          cls: element.className,
          right: element.getBoundingClientRect().right,
          width: element.getBoundingClientRect().width,
        }))
        .filter(item => item.right > innerWidth)
        .slice(0, 8),
    }))
    expect(layout.width, JSON.stringify({ path, ...layout })).toBeLessThanOrEqual(392)
  }
})

test('a lesson missing all searchable metadata stays visible in an empty-search quality review', async ({
  page,
}) => {
  const state = await fixture(page)
  state.lessons = [
    {
      ...lesson,
      id: 'missing',
      title: null,
      lesson_id: null,
      starter_code: null,
      task_description: null,
      solution_code: null,
    },
  ]
  await page.goto('/admin/lessons?filter=missing-required-fields&status=all')
  await expect(page.getByText('Chưa có title', { exact: false })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Sửa lesson missing', exact: true })).toBeVisible()
})

test('admin layout: admin-catalogs handles desktop and mobile', async ({ page }, info) => {
  const state = await fixture(page)
  state.lessons[0].title = 'Lesson-' + 'long'.repeat(35)
  state.sets[0].title = 'Practice-' + 'long'.repeat(35)
  state.attempts[0].lessons.title = 'Submitted-' + 'long'.repeat(35)
  await checkAdminLayout(page, info, '/admin/lessons', 'Lessons')
  await checkAdminLayout(page, info, '/admin/practice', 'Practice Sets')
  await checkAdminLayout(page, info, '/admin/submissions', 'Submissions')
  expect(state.writes).toEqual([])
})

test('submissions paginate the full filtered history beyond 75 rows and filters reset the page', async ({
  page,
}) => {
  const state = await fixture(page)
  state.attempts = Array.from({ length: 95 }, (_, index) => ({
    ...submission,
    id: `submission-${index}`,
    code: `code-${index}`,
    is_correct: index % 2 === 0,
  }))
  await page.goto('/admin/submissions')
  const articles = page.getByRole('article')
  await expect(articles).toHaveCount(20)
  for (let index = 1; index <= 4; index++) {
    await page.getByRole('button', { name: 'Tiếp', exact: true }).click()
    await expect(page.locator('article pre').first()).toHaveText(`admin: code-${index * 20}`)
  }
  await expect(articles).toHaveCount(15)
  await expect(page.getByRole('button', { name: 'Tiếp', exact: true })).toBeDisabled()
  await page.getByRole('button', { name: 'fail', exact: true }).click()
  await expect(articles).toHaveCount(20)
  await expect(page.locator('article pre').first()).toHaveText('admin: code-1')
  await expect(page.getByRole('button', { name: 'Trước', exact: true })).toBeDisabled()
  await expect(page.getByText('Hiển thị 1–20 / 47', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'all', exact: true }).click()
  await expect(page.locator('article pre').first()).toHaveText('admin: code-0')
  expect(state.writes).toEqual([])
})
