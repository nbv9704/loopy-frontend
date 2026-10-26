import { expect, test, type Page } from '@playwright/test'
import { mockApi, reply } from './fixtures/api'

const selectedPath = '11111111-1111-4111-8111-111111111111'
const lessons = [
  { id: 'a1', lessonId: 'intro', chapterId: 'a', title: 'Bài mở đầu', orderIndex: 1 },
  { id: 'a2', lessonId: 'variables', chapterId: 'a', title: 'Biến số', orderIndex: 2 },
  { id: 'b1', lessonId: 'conditions', chapterId: 'b', title: 'Điều kiện', orderIndex: 1 },
  { id: 'b2', lessonId: 'loops', chapterId: 'b', title: 'Vòng lặp', orderIndex: 2 },
]

async function fixture(page: Page, loggedIn = true) {
  const state = {
    catalogOverride: null as unknown,
    progressOverride: null as unknown,
    failProgress: false,
    failCurriculum: false,
    completed: ['a1'],
    reads: [] as string[],
  }
  await page.addInitScript(() => localStorage.setItem('language', 'vi'))
  await mockApi(page, async route => {
    const url = new URL(route.request().url())
    state.reads.push(url.pathname + url.search)
    if (url.pathname === '/api/auth/me')
      return loggedIn
        ? reply(route, {
            user: {
              id: 'learner',
              email: 'learner@example.test',
              profile: {
                id: 'learner',
                preferredLanguage: 'javascript',
                currentPathId: selectedPath,
                onboardingCompleted: true,
                learningPath: 'first_steps',
              },
            },
          })
        : reply(route, { code: 'AUTH_REQUIRED' }, 401)
    if (url.pathname === '/api/auth/refresh' || url.pathname === '/api/admin-auth/me')
      return reply(route, { code: 'AUTH_REQUIRED' }, 401)
    if (url.pathname === '/api/content/batch') return reply(route, { items: {}, missingKeys: [] })
    if (url.pathname.endsWith('/curriculum'))
      return state.failCurriculum
        ? reply(route, { message: 'Không tải được lộ trình test' }, 503)
        : reply(
            route,
            state.catalogOverride || {
              chapters: [
                { id: 'a', title: 'Chương đầu', orderIndex: 1 },
                { id: 'b', title: 'Chương sau', orderIndex: 2 },
              ],
              lessons,
            }
          )
    if (url.pathname === '/api/progress/me')
      return state.failProgress
        ? reply(route, { message: 'Không tải được tiến độ test' }, 503)
        : reply(
            route,
            state.progressOverride || {
              progress: state.completed.map(lessonId => ({ lessonId, status: 'completed' })),
            }
          )
    if (url.pathname === '/api/profile/me')
      return reply(route, {
        profile: {
          id: 'learner',
          learningPath: 'first_steps',
        },
      })
    return reply(route, {})
  })
  return state
}

test('next lesson follows chapter order and uses the selected onboarding path', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/library/javascript')
  await expect(page.getByRole('link', { name: 'Vào bài học', exact: true })).toHaveAttribute(
    'href',
    '/learn/javascript/variables'
  )
  expect(state.reads.some(path => path.includes(`curriculum?pathId=${selectedPath}`))).toBe(true)
  expect(state.reads).not.toContain('/api/profile/me')
  await expect(page.getByText('25%', { exact: true })).toBeVisible()
})

test('failed progress has a retry and cannot pretend to unlock the first lesson', async ({
  page,
}) => {
  const state = await fixture(page)
  state.failProgress = true
  await page.goto('/library/javascript')
  await expect(page.getByRole('alert')).toContainText('Không tải được tiến độ test')
  await expect(page.getByRole('link', { name: 'Vào bài học', exact: true })).toHaveCount(0)
  await expect(page.getByText('0%', { exact: true })).toHaveCount(0)
  state.failProgress = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Vào bài học', exact: true })).toHaveAttribute(
    'href',
    '/learn/javascript/variables'
  )
})

test('failed curriculum is retryable rather than an empty journey', async ({ page }) => {
  const state = await fixture(page)
  state.failCurriculum = true
  await page.goto('/library/javascript')
  await expect(page.getByRole('alert')).toContainText('Không tải được lộ trình test')
  state.failCurriculum = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Vào bài học', exact: true })).toBeVisible()
})

test('completed lessons can be reopened from their journey node', async ({ page }) => {
  await fixture(page)
  await page.goto('/library/javascript')
  const completedLesson = page.getByRole('link', { name: 'Bài mở đầu', exact: true })
  await expect(completedLesson).toBeVisible()
  await completedLesson.click()
  await expect(page).toHaveURL('/learn/javascript/intro')
})

test('a completed journey does not invent one remaining next lesson', async ({ page }) => {
  const state = await fixture(page)
  state.completed = lessons.map(lesson => lesson.id)
  await page.goto('/library/javascript')
  await expect(page.getByText('100%', { exact: true })).toBeVisible()
  await expect(page.getByText('Bạn đã hoàn thành lộ trình này.', { exact: true })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Vào bài học', exact: true })).toHaveCount(0)
})

test('guests can preview a language without reading private profile or progress', async ({
  page,
}) => {
  const state = await fixture(page, false)
  await page.goto('/library/python')
  await expect(page.getByRole('button', { name: /Chương đầu/ })).toBeVisible()
  expect(state.reads).not.toContain('/api/profile/me')
  expect(state.reads).not.toContain('/api/progress/me')
  expect(state.reads).toContain('/api/languages/python/curriculum')
})

test('Learn reads the same selected path as Journey', async ({ page }) => {
  const state = await fixture(page)
  await page.goto('/learn/javascript/variables')
  await expect(page.getByRole('heading', { name: 'Biến số', exact: true })).toBeVisible()
  expect(state.reads).toContain(`/api/languages/javascript/curriculum?pathId=${selectedPath}`)
})

test('Learn blocks a failed progress read and allows retry', async ({ page }) => {
  const state = await fixture(page)
  state.failProgress = true
  await page.goto('/learn/javascript/variables')
  await expect(page.getByRole('alert')).toContainText('Không tải được tiến độ test')
  state.failProgress = false
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Biến số', exact: true })).toBeVisible()
})

test('an unavailable lesson URL offers a return to Journey instead of showing another lesson', async ({
  page,
}) => {
  await fixture(page)
  await page.goto('/learn/javascript/missing-lesson')
  await expect(page.getByRole('alert')).toContainText(
    'Bài học này không có trong lộ trình hiện tại.'
  )
  await page.getByRole('button', { name: 'Quay lại Journey Map', exact: true }).click()
  await expect(page).toHaveURL('/library/javascript')
  await expect(page.getByRole('link', { name: 'Vào bài học', exact: true })).toHaveAttribute(
    'href',
    '/learn/javascript/variables'
  )
})

for (const mode of ['null-row', 'foreign-chapter', 'invalid-title']) {
  test(`malformed ${mode} curriculum has an explicit retry and never crashes or shows an empty journey`, async ({
    page,
  }) => {
    const state = await fixture(page)
    const errors: string[] = []
    page.on('pageerror', error => errors.push(error.message))
    const invalid =
      mode === 'null-row'
        ? null
        : {
            ...lessons[0],
            ...(mode === 'foreign-chapter'
              ? { chapterId: 'unknown' }
              : { title: { invalid: true } }),
          }
    state.catalogOverride = {
      chapters: [{ id: 'a', title: 'Chapter', orderIndex: 0 }],
      lessons: [invalid],
    }
    await page.goto('/library/javascript')
    await expect(page.getByRole('alert')).toContainText('Dữ liệu bài học')
    await expect(page.getByRole('link', { name: 'Vào bài học', exact: true })).toHaveCount(0)
    state.catalogOverride = null
    await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
    await expect(page.getByRole('link', { name: 'Vào bài học', exact: true })).toBeVisible()
    expect(errors).toEqual([])
  })
}

test('invalid completion data cannot become a fictional zero-progress map and can be retried', async ({
  page,
}) => {
  const state = await fixture(page)
  state.progressOverride = { progress: [null], completedLessons: 99 }
  await page.goto('/library/javascript')
  await expect(page.getByRole('alert')).toContainText('Không tải được tiến độ')
  await expect(page.getByText('0%', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Vào bài học', exact: true })).toHaveCount(0)
  state.progressOverride = null
  await page.getByRole('button', { name: 'Thử lại', exact: true }).click()
  await expect(page.getByRole('link', { name: 'Vào bài học', exact: true })).toHaveAttribute(
    'href',
    '/learn/javascript/variables'
  )
})

test('colliding lesson slugs link to canonical IDs and open the intended lesson', async ({
  page,
}) => {
  const state = await fixture(page)
  state.catalogOverride = {
    chapters: [{ id: 'a', title: 'Chapter', orderIndex: 0 }],
    lessons: lessons.slice(0, 2).map(lesson => ({ ...lesson, lessonId: 'intro' })),
  }
  await page.goto('/library/javascript')
  const next = page.getByRole('link', { name: 'Vào bài học', exact: true })
  await expect(next).toHaveAttribute('href', '/learn/javascript/a2')
  await next.click()
  await expect(page).toHaveURL('/learn/javascript/a2')
  await expect(page.getByRole('heading', { name: 'Biến số', exact: true })).toBeVisible()
})
