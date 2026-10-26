import { expect, test } from '@playwright/test'
import { mockApi, reply } from './fixtures/api'

test('an output lesson with a note then code_prompt has an answer panel and only completes after check/save', async ({
  page,
}) => {
  const writes: string[] = []
  await page.addInitScript(() => localStorage.setItem('language', 'vi'))
  await mockApi(page, async route => {
    const path = new URL(route.request().url()).pathname
    if (route.request().method() !== 'GET') writes.push(path)
    if (path === '/api/auth/me')
      return reply(route, {
        user: {
          id: 'learner',
          email: 'learner@example.test',
          profile: { id: 'learner', onboardingCompleted: true, preferredLanguage: 'javascript' },
        },
      })
    if (path === '/api/admin-auth/me' || path === '/api/auth/refresh') return reply(route, {}, 401)
    if (path === '/api/content/batch') return reply(route, { items: {}, missingKeys: [] })
    if (path.endsWith('/curriculum'))
      return reply(route, {
        chapters: [{ id: 'chapter', title: 'Chapter' }],
        lessons: [
          {
            id: 'lesson',
            lessonId: 'output',
            chapterId: 'chapter',
            lessonType: 'code_output',
            title: 'Dự đoán output',
            steps: [
              { id: 'note', type: 'note', prompt: 'Read first', orderIndex: 0 },
              {
                id: 'prompt',
                type: 'code_prompt',
                title: 'Output question',
                prompt: 'console.log("Hello") in ra gì?',
                orderIndex: 1,
              },
            ],
          },
        ],
      })
    if (path === '/api/progress/me') return reply(route, { progress: [] })
    if (path.endsWith('/check'))
      return reply(route, {
        submissionId: '11111111-1111-4111-8111-111111111111',
        passed: true,
        score: 100,
        output: 'Đúng',
        checks: [],
      })
    if (path.endsWith('/complete')) return reply(route, { progress: { status: 'completed' } })
    if (path === '/api/profile/me')
      return reply(route, {
        profile: { id: 'learner', onboardingCompleted: true, preferredLanguage: 'javascript' },
      })
    return reply(route, {})
  })
  await page.goto('/learn/javascript/output')
  await expect(page.getByRole('heading', { name: 'Output question', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Bắt đầu trả lời', exact: true }).click()
  await page.getByPlaceholder('Nhập output bạn dự đoán').fill('Hello')
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Lưu hoàn thành', exact: true })).toBeVisible()
  expect(writes).not.toContain('/api/execute')
  expect(writes).not.toContain('/api/progress/me/lesson/complete')
  await page.getByRole('button', { name: 'Lưu hoàn thành', exact: true }).click()
  await expect(page.getByText('Tuyệt vời! Progress đã được lưu.', { exact: true })).toBeVisible()
})

test('default true/false choices send canonical boolean values to the checker', async ({
  page,
}) => {
  const answers: string[] = []
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
    if (path === '/api/admin-auth/me' || path === '/api/auth/refresh') return reply(route, {}, 401)
    if (path === '/api/content/batch') return reply(route, { items: {}, missingKeys: [] })
    if (path.endsWith('/curriculum'))
      return reply(route, {
        chapters: [{ id: 'chapter', title: 'Chapter' }],
        lessons: [
          {
            id: 'lesson',
            lessonId: 'boolean',
            chapterId: 'chapter',
            lessonType: 'true_false',
            title: 'Đúng hay sai',
            steps: [
              {
                id: 'question',
                type: 'true_false',
                prompt: 'Một bằng hai?',
                options: [],
                orderIndex: 0,
              },
            ],
          },
        ],
      })
    if (path === '/api/progress/me') return reply(route, { progress: [] })
    if (path.endsWith('/check')) {
      const answer = route.request().postDataJSON().code
      answers.push(answer)
      return reply(route, {
        submissionId: '11111111-1111-4111-8111-111111111111',
        passed: answer === 'false',
        score: answer === 'false' ? 100 : 0,
        output: '',
        checks: [],
      })
    }
    return reply(route, {})
  })
  await page.goto('/learn/javascript/boolean')
  await page.getByRole('button', { name: 'Bắt đầu trả lời', exact: true }).click()
  await page.getByRole('button', { name: 'Sai', exact: true }).click()
  await page.getByRole('button', { name: 'Kiểm tra câu trả lời', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Lưu hoàn thành', exact: true })).toBeVisible()
  expect(answers).toEqual(['false'])
})
