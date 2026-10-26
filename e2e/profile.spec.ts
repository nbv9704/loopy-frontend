import { test, expect, type Page } from '@playwright/test'

const copies = {
  // English CMS copy; Vietnamese fixtures use the corrected stored values below.
  'profile.goals.newbie_path_title': 'Newbie-first path',
  'profile.goals.view_all_paths': 'View all paths',
  'profile.tab.settings': 'Settings',
  'profile.stats.points': 'Points',
  'profile.stats.streak': 'Streak',
  'profile.retry': 'Retry',
  'profile.settings.display_name': 'Display name',
  'profile.settings.bio': 'Bio',
  'profile.settings.upload_label': 'Upload image',
  'profile.settings.save_button': 'Save changes',
  'profile.settings.saving': 'Saving...',
  'profile.settings.onboarding_button': 'Update learning path',
  'profile.toast.saved': 'Personal details saved',
}

async function fixture(
  page: Page,
  options: {
    failProgress?: boolean
    failProfile?: boolean
    staleSave?: boolean
    failProfileAfterSave?: boolean
    failSave?: boolean
    pendingSave?: Promise<void>
    language?: 'vi' | 'en'
    selection?: { learningGoal?: string; preferredLanguage?: string; experienceLevel?: string }
    content?: Record<string, string>
  } = {}
) {
  const state = { ...options }
  const writes: Record<string, unknown>[] = []
  const calls: string[] = []
  let profile = { id: 'learner', displayName: 'Learner', bio: 'Original bio', avatarUrl: '', ...options.selection }
  await page.addInitScript(language => localStorage.setItem('language', language), options.language ?? 'en')
  // All API calls are mocked, including writes; no request reaches the real database.
  await page.route('**/api/**', async route => {
    const request = route.request()
    const path = new URL(request.url()).pathname
    calls.push(`${request.method()} ${path}`)
    const headers = {
      'Access-Control-Allow-Origin': 'http://127.0.0.1:5180',
      'Access-Control-Allow-Credentials': 'true',
    }
    const respond = (data: unknown, status = 200) =>
      route.fulfill({
        status,
        headers,
        json: status < 400 ? { success: true, data } : { success: false, error: data },
      })
    if (request.method() === 'OPTIONS')
      return route.fulfill({
        status: 204,
        headers: {
          ...headers,
          'Access-Control-Allow-Methods': 'GET,POST,PUT',
          'Access-Control-Allow-Headers': 'content-type',
        },
      })
    if (path === '/api/auth/me')
      return respond({
        user: {
          id: profile.id,
          email: 'learner@example.test',
          profile: { ...profile, onboardingCompleted: true, points: 500, currentStreak: 10 },
        },
      })
    if (path === '/api/content/batch') return respond({ items: {
      ...copies,
      ...(options.language === 'vi' ? {
        'profile.tab.settings': 'Cài đặt',
        'profile.stats.streak': 'Chuỗi ngày học',
        'profile.stats.points': 'Điểm',
        'profile.goals.newbie_path_title': 'Lộ trình cho người mới',
        'profile.goals.view_all_paths': 'Xem tất cả lộ trình',
      } : {}),
      ...options.content,
    }, missingKeys: [] })
    if (path === '/api/progress/me') {
      if (state.failProgress)
        return respond(
          { code: 'DATABASE_ERROR', message: 'Progress unavailable. Please retry.' },
          503
        )
      return respond({ progress: [], totalPoints: 0, currentStreak: 0, completedLessons: 0 })
    }
    if (path === '/api/profile/me' && request.method() === 'PUT') {
      const payload = request.postDataJSON()
      writes.push(payload)
      if (state.pendingSave) await state.pendingSave
      if (state.failSave) {
        state.failSave = false
        return respond(
          { code: 'DATABASE_ERROR', message: 'Unable to save profile. Please retry.' },
          503
        )
      }
      if (state.staleSave) return respond({ profile })
      profile = { ...profile, ...payload }
      return respond({ profile })
    }
    if (path === '/api/profile/me') {
      if (state.failProfile || (state.failProfileAfterSave && writes.length > 0))
        return respond(
          { code: 'DATABASE_ERROR', message: 'Profile unavailable. Please retry.' },
          503
        )
      return respond({ profile })
    }
    return respond({})
  })
  return { state, writes, calls }
}

async function openSettings(page: Page) {
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Settings', exact: true }).click()
}

for (const language of ['vi', 'en'] as const) {
  test(`goals show localized names for stored onboarding IDs (${language})`, async ({ page }) => {
    const { writes, calls } = await fixture(page, {
      language,
      selection: { learningGoal: 'first_steps', preferredLanguage: 'cpp', experienceLevel: 'first_steps' },
    })
    await page.goto('/settings')
    await page.getByRole('button', { name: language === 'vi' ? 'Mục tiêu' : 'Goals', exact: true }).click()
    const panel = page.getByRole('region', { name: /settings tab$/ })
    await expect(panel.getByText(language === 'vi' ? 'Mức kinh nghiệm' : 'Experience level', { exact: true })).toBeVisible()
    for (const label of [language === 'vi' ? 'Bước đầu học lập trình' : 'First steps in programming',
      'C++', language === 'vi' ? 'Mới bắt đầu' : 'Just getting started'])
      await expect(panel.getByText(label, { exact: true })).toBeVisible()
    await expect(panel.getByText('first_steps', { exact: true })).toHaveCount(0)
    await expect(panel.getByText('cpp', { exact: true })).toHaveCount(0)
    await expect(panel.getByRole('heading', {
      name: language === 'vi' ? 'Lộ trình cho người mới' : 'Newbie-first path', exact: true,
    })).toBeVisible()
    await expect(panel.getByRole('link', {
      name: language === 'vi' ? 'Xem tất cả lộ trình' : 'View all paths', exact: true,
    })).toHaveAttribute('href', '/languages')
    expect(writes).toEqual([])
    expect(calls.some(call => call.endsWith('/api/paths') || call.endsWith('/api/languages'))).toBe(false)
    if (language === 'vi') await page.screenshot({ path: 'test-results/profile-goals-vi.png', fullPage: true })
  })
}

test('Vietnamese profile fallback labels are complete and never expose the completion function name', async ({ page }) => {
  await fixture(page, { language: 'vi' })
  await page.goto('/settings')
  const main = page.getByRole('main')
  await expect(main.getByText('Hồ sơ', { exact: true })).toBeVisible()
  await expect(main.getByText('Chuỗi ngày học', { exact: true })).toBeVisible()
  await expect(main.getByText('Đã hoàn thành và lưu', { exact: true })).toBeVisible()
  await expect(main.getByText('Người học Loopy', { exact: true })).toBeVisible()
  await expect(main.getByText('completeLesson', { exact: true })).toHaveCount(0)
})

test('goal cards honor authored CMS copy instead of overriding it with a bundled label', async ({ page }) => {
  await fixture(page, { language: 'vi', content: {
    'profile.goals.newbie_path_title': 'Lộ trình của lớp mình',
    'profile.goals.view_all_paths': 'Khám phá lộ trình khác',
  } })
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Mục tiêu', exact: true }).click()
  const panel = page.getByRole('region', { name: /settings tab$/ })
  await expect(panel.getByRole('heading', { name: 'Lộ trình của lớp mình', exact: true })).toBeVisible()
  await expect(panel.getByRole('link', { name: 'Khám phá lộ trình khác', exact: true })).toHaveAttribute('href', '/languages')
})

test('legacy experience levels keep their names and unknown IDs are never shown', async ({ page }) => {
  await fixture(page, {
    selection: { learningGoal: 'old_unknown_goal', preferredLanguage: 'python', experienceLevel: 'beginner' },
  })
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Goals', exact: true }).click()
  const panel = page.getByRole('region', { name: /settings tab$/ })
  await expect(panel.getByText('Learning path needs updating', { exact: true })).toBeVisible()
  await expect(panel.getByText('Python', { exact: true })).toBeVisible()
  await expect(panel.getByText('Beginner', { exact: true })).toBeVisible()
  await expect(panel.getByText('old_unknown_goal', { exact: true })).toHaveCount(0)
})

test('an account without learning selections does not invent a saved goal', async ({ page }) => {
  await fixture(page)
  await page.goto('/settings')
  await page.getByRole('button', { name: 'Goals', exact: true }).click()
  await expect(page.getByRole('region', { name: /settings tab$/ }).getByText('Not selected', { exact: true })).toHaveCount(3)
})

test('progress failure can retry and real zeros replace stale auth totals', async ({ page }) => {
  const { state } = await fixture(page, { failProgress: true })
  await page.goto('/settings')
  await expect(page.getByRole('alert')).toContainText('Progress unavailable. Please retry.')
  await expect(page.getByText('Points', { exact: true })).toHaveCount(0)
  state.failProgress = false
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  const points = page.getByText('Points', { exact: true }).locator('..')
  await expect(points).toContainText('0')
  await expect(page.getByRole('main').getByText('500', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('main').getByText('10', { exact: true })).toHaveCount(0)
})

test('profile load failure never opens an empty editable form and can retry', async ({ page }) => {
  const { state } = await fixture(page, { failProfile: true, failProgress: true })
  await openSettings(page)
  await expect(page.getByRole('alert')).toContainText('Profile unavailable. Please retry.')
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toHaveCount(0)
  state.failProfile = false
  await page.getByRole('button', { name: 'Retry', exact: true }).click()
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('Learner')
  await expect(
    page.getByRole('link', { name: 'Update learning path', exact: true })
  ).toHaveAttribute('href', '/onboarding')
})

test('failed save preserves edits and retry commits only personal details without reloading', async ({
  page,
}) => {
  const { writes, calls } = await fixture(page, { failSave: true })
  await openSettings(page)
  await page.evaluate(() => {
    document.documentElement.dataset.profileTest = 'same-document'
  })
  await page.getByLabel('Display name', { exact: true }).fill('Edited learner')
  await page.getByRole('textbox', { name: 'Bio', exact: true }).fill('My draft')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Unable to save profile. Please retry.')
  await expect(page.getByRole('textbox', { name: 'Bio', exact: true })).toHaveValue('My draft')
  await expect(page.getByText('Personal details saved', { exact: true })).toHaveCount(0)
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByText('Personal details saved', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('Edited learner')
  expect(writes).toEqual(
    Array(2).fill({ displayName: 'Edited learner', bio: 'My draft', avatarUrl: '' })
  )
  expect(calls.filter(call => call === 'GET /api/auth/me')).toHaveLength(1)
  expect(await page.evaluate(() => document.documentElement.dataset.profileTest)).toBe(
    'same-document'
  )
})

test('pending save locks editing and success waits for the server', async ({ page }) => {
  let release!: () => void
  const pendingSave = new Promise<void>(resolve => {
    release = resolve
  })
  const { writes } = await fixture(page, { pendingSave })
  await openSettings(page)
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Saving...', exact: true })).toBeDisabled()
  await expect(page.getByLabel('Display name', { exact: true })).toBeDisabled()
  await expect(page.getByText('Personal details saved', { exact: true })).toHaveCount(0)
  expect(writes).toHaveLength(1)
  release()
  await expect(page.getByText('Personal details saved', { exact: true })).toBeVisible()
  await expect(page.getByLabel('Display name', { exact: true })).toBeEnabled()
})

test('profile settings fit a narrow mobile screen', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 })
  await fixture(page)
  await openSettings(page)
  await expect(page.getByLabel('Display name', { exact: true })).toHaveValue('Learner')
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
})

test('a corrupt avatar can be replaced by a resized image and saved', async ({ page }) => {
  const { writes } = await fixture(page)
  await openSettings(page)
  const upload = page.getByLabel('Upload image', { exact: true })
  await upload.evaluate(element => {
    if (!(element instanceof HTMLInputElement)) throw new Error('Expected an upload input')
    const files = new DataTransfer()
    files.items.add(new File(['corrupt image'], 'avatar.png', { type: 'image/png' }))
    element.files = files.files
    element.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect(page.getByRole('alert')).toContainText('Không đọc được ảnh')
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeEnabled()
  await upload.evaluate(element => {
    if (!(element instanceof HTMLInputElement)) throw new Error('Expected an upload input')
    const canvas = document.createElement('canvas')
    canvas.width = 300
    canvas.height = 150
    const bytes = Uint8Array.from(atob(canvas.toDataURL('image/png').split(',')[1]), char =>
      char.charCodeAt(0)
    )
    const files = new DataTransfer()
    files.items.add(new File([bytes], 'avatar.png', { type: 'image/png' }))
    element.files = files.files
    element.dispatchEvent(new Event('change', { bubbles: true }))
  })
  const preview = page.getByRole('main').getByRole('img', { name: 'Avatar', exact: true })
  await expect(preview).toHaveAttribute('src', /^data:image\/webp;base64,/)
  await expect(preview).toHaveJSProperty('naturalWidth', 150)
  await expect(preview).toHaveJSProperty('naturalHeight', 75)
  await expect(page.getByRole('alert')).toHaveCount(0)
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByText('Personal details saved', { exact: true })).toBeVisible()
  expect(writes).toHaveLength(1)
  expect(writes[0].avatarUrl).toMatch(/^data:image\/webp;base64,/)
})

test('a save response with the correct ID but stale values keeps the draft and never reports success', async ({
  page,
}) => {
  const { state } = await fixture(page, { staleSave: true })
  await openSettings(page)
  await page.getByLabel('Display name', { exact: true }).fill('New confirmed name')
  await page.getByRole('textbox', { name: 'Bio', exact: true }).fill('Keep my draft')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByRole('alert')).toContainText('Chưa xác nhận được các thay đổi')
  await expect(page.getByRole('textbox', { name: 'Bio', exact: true })).toHaveValue('Keep my draft')
  await expect(page.getByText('Personal details saved', { exact: true })).toHaveCount(0)
  state.staleSave = false
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByText('Personal details saved', { exact: true })).toBeVisible()
})

test('confirmed personal saves update the navbar without a second fallible profile read or resetting onboarding', async ({
  page,
}) => {
  const { calls } = await fixture(page, { failProfileAfterSave: true })
  await openSettings(page)
  await page.getByLabel('Display name', { exact: true }).fill('Snapshot learner')
  await page.getByRole('button', { name: 'Save changes', exact: true }).click()
  await expect(page.getByText('Personal details saved', { exact: true })).toBeVisible()
  await expect(
    page.getByRole('banner').getByRole('button', { name: /Snapshot learner/ })
  ).toBeVisible()
  await expect(page.getByRole('banner').locator('a[href="/library/javascript"]')).toBeVisible()
  expect(calls.filter(call => call === 'GET /api/profile/me')).toHaveLength(1)
  expect(calls.filter(call => call === 'GET /api/auth/me')).toHaveLength(1)
  await expect(page.getByLabel('Display name', { exact: true })).toBeEnabled()
})

test('oversized image input releases the save lock and preserves an editable profile', async ({
  page,
}) => {
  await fixture(page)
  await openSettings(page)
  await page.getByLabel('Upload image', { exact: true }).evaluate(input => {
    const files = new DataTransfer()
    files.items.add(
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })
    )
    ;(input as HTMLInputElement).files = files.files
    input.dispatchEvent(new Event('change', { bubbles: true }))
  })
  await expect(page.getByRole('alert')).toContainText('5 MB')
  await expect(page.getByRole('button', { name: 'Save changes', exact: true })).toBeEnabled()
  await page.getByLabel('Display name', { exact: true }).fill('Still editable')
})
