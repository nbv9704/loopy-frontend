import { expect, test, type Page } from '@playwright/test'
import { mockApi, reply, replyRaw } from './fixtures/api'

const category = '11111111-1111-4111-8111-111111111111'
const otherCategory = '22222222-2222-4222-8222-222222222222'
const id = '33333333-3333-4333-8333-333333333333'
const row = {
  id,
  categoryId: category,
  key: 'hero.title',
  language: 'vi',
  value: 'Original title',
  description: 'Original description',
  type: 'markdown',
  revision: 7,
  createdAt: '2026-01-01T00:00:00Z',
  updatedAt: '2026-10-23T00:00:00Z',
}
const file = {
  version: '2.0',
  language: 'en',
  categories: { header: { title: { value: 'New title', type: 'html', description: null } } },
}
async function fixture(page: Page) {
  const state = {
    adminId: 'admin',
    checks: 0,
    categoryError: false,
    listError: false,
    readOnly: false,
    listReads: [] as string[],
    writeError: false,
    invalidAck: false,
    conflict: false,
    pending: Promise.resolve(),
    delayedList: Promise.resolve(),
    delayOld: false,
    current: { ...row },
    writes: [] as Array<{ method: string; path: string; body: Record<string, unknown> }>,
    total: 51,
  }
  await mockApi(page, async route => {
    const request = route.request()
    const url = new URL(request.url())
    if (url.pathname === '/api/admin-auth/me') {
      state.checks++
      return replyRaw(route, {
        success: true,
        user: { id: state.adminId, role: 'admin', is_admin: true },
      })
    }
    if (url.pathname === '/api/auth/me' || url.pathname === '/api/auth/refresh')
      return reply(route, {}, 401)
    if (url.pathname === '/api/admin/content/categories')
      return state.categoryError
        ? reply(route, { message: 'Categories unavailable' }, 503)
        : reply(route, [
            { id: category, name: 'header', displayOrder: 1 },
            { id: otherCategory, name: 'landing', displayOrder: 2 },
          ])
    if (url.pathname === '/api/admin/content/export')
      return replyRaw(route, { ...file, language: url.searchParams.get('language') })
    if (request.method() === 'GET' && url.pathname === `/api/admin/content/${id}`)
      return reply(route, state.current)
    if (request.method() === 'GET' && url.pathname === '/api/admin/content') {
      state.listReads.push(url.search)
      const language = url.searchParams.get('language') || 'vi'
      if (state.delayOld && language === 'vi') await state.delayedList
      if (state.listError) return reply(route, { message: 'List unavailable' }, 503)
      const offset = Number(url.searchParams.get('offset') || 0)
      return reply(route, {
        items:
          offset >= state.total
            ? []
            : [
                {
                  ...state.current,
                  revision: state.readOnly ? null : state.current.revision,
                  categoryId: url.searchParams.get('category'),
                  language,
                },
              ],
        total: state.total,
        limit: 20,
        offset,
        readOnly: state.readOnly,
      })
    }
    if (url.pathname.startsWith('/api/admin/content') && request.method() !== 'GET') {
      const body =
        request.method() === 'DELETE'
          ? { revision: Number(url.searchParams.get('revision')) }
          : request.postDataJSON()
      state.writes.push({ method: request.method(), path: url.pathname, body })
      await state.pending
      if (state.writeError) return reply(route, { message: 'CMS save unavailable' }, 503)
      if (state.conflict)
        return reply(
          route,
          { code: 'CMS_CONFLICT', message: 'Nội dung đã thay đổi; bản nháp được giữ lại.' },
          409
        )
      if (url.pathname.endsWith('/import'))
        return reply(route, {
          imported: state.invalidAck
            ? 0
            : Object.values(body.categories as Record<string, object>).reduce(
                (n, group) => n + Object.keys(group).length,
                0
              ),
          errors: [],
        })
      if (request.method() === 'DELETE')
        return reply(route, state.invalidAck ? { deleted: true } : { id, deleted: true })
      if (request.method() === 'PUT') {
        state.current = { ...state.current, ...body, revision: Number(body.expectedRevision) + 1 }
        return reply(route, state.invalidAck ? { ...state.current, revision: 0 } : state.current)
      }
      return reply(route, { ...row, ...body, revision: 0 })
    }
    if (url.pathname === '/api/admin/practice/sets') return reply(route, { items: [], total: 0 })
    return reply(route, [])
  })
  return state
}
async function uploadFile(page: Page, name: string, payload: unknown) {
  await page.getByLabel('Chọn file import CMS', { exact: true }).evaluate(
    (element, file) => {
      if (!(element instanceof HTMLInputElement)) throw new Error('Expected file input')
      const transfer = new DataTransfer()
      transfer.items.add(new File([file.source], file.name, { type: 'application/json' }))
      element.files = transfer.files
      element.dispatchEvent(new Event('change', { bubbles: true }))
    },
    { name, source: JSON.stringify(payload) }
  )
}

const edit = (page: Page) =>
  page.getByRole('button', { name: 'Sửa hero.title', exact: true }).click()

test('CMS remains readable with long records across desktop and narrow screens without refetching', async ({
  page,
}, testInfo) => {
  await fixture(page)
  let reads = 0
  await page.route(/\/api\/admin\/content\?/, async route => {
    if (route.request().method() !== 'GET') return route.fallback()
    reads++
    return reply(route, {
      items: [
        row,
        ...Array.from({ length: 5 }, (_, index) => ({
          ...row,
          id: `44444444-4444-4444-8444-${String(index + 1).padStart(12, '0')}`,
          key: index === 0 ? `landing.${'long_key_'.repeat(22)}` : `landing.section${index}.title`,
          description:
            index === 0
              ? 'Mô tả nội dung dài cần xuống dòng để không đẩy các nút thao tác ra ngoài màn hình.'
              : null,
          value:
            index === 0
              ? 'long-content-without-spaces-'.repeat(60)
              : 'Nội dung minh họa để kiểm tra bố cục quản lý CMS.',
        })),
      ],
      total: 6,
      limit: 20,
      offset: 0,
    })
  })
  await page.goto('/admin/content')
  await expect(page.getByRole('heading', { name: 'Quản lý nội dung', exact: true })).toBeVisible({
    timeout: 15000,
  })
  await expect(page.getByText('6 items khớp bộ lọc', { exact: true })).toBeVisible()
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 960 })
    await expect(page.getByRole('heading', { name: 'Quản lý nội dung', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tạo item', exact: true })).toBeInViewport()
    await expect(page.getByRole('button', { name: 'Import JSON', exact: true })).toBeInViewport()
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
    const editButton = page.getByRole('button', { name: 'Sửa hero.title', exact: true })
    await editButton.scrollIntoViewIfNeeded()
    await expect(editButton).toBeInViewport()
    const boxes = await editButton.evaluate(button => {
      const row = button.closest('tr')!
      const bounds = row.getBoundingClientRect()
      const action = button.getBoundingClientRect()
      return {
        rowRight: bounds.right,
        buttonRight: action.right,
        rowLeft: bounds.left,
        buttonLeft: action.left,
      }
    })
    expect(boxes.buttonRight).toBeLessThanOrEqual(boxes.rowRight)
    expect(boxes.buttonLeft).toBeGreaterThanOrEqual(boxes.rowLeft)
    await page.evaluate(() => scrollTo(0, 0))
    if (width === 1440 || width === 390)
      await page.screenshot({ path: testInfo.outputPath(`cms-${width}.png`), fullPage: true })
  }
  expect(reads).toBe(1)
})

test('category failure blocks an empty create form and can retry', async ({ page }) => {
  const state = await fixture(page)
  state.categoryError = true
  await page.goto('/admin/content')
  await expect(page.getByText('Categories unavailable', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tạo item', exact: true })).toBeDisabled()
  await expect(page.getByText('Không có content item phù hợp.', { exact: true })).toHaveCount(0)
  state.categoryError = false
  await page.getByRole('button', { name: 'Tải lại categories', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Sửa hero.title', exact: true })).toBeVisible()
})
test('list failure is distinct from empty and retries without showing fake zero totals', async ({
  page,
}) => {
  const state = await fixture(page)
  state.listError = true
  await page.goto('/admin/content')
  await expect(page.getByText('List unavailable', { exact: true })).toBeVisible()
  await expect(page.getByText('Không có content item phù hợp.', { exact: true })).toHaveCount(0)
  await expect(page.getByText('0 items khớp bộ lọc', { exact: true })).toHaveCount(0)
  state.listError = false
  await page.getByRole('button', { name: 'Thử lại danh sách', exact: true }).click()
  await expect(page.getByText('51 items khớp bộ lọc', { exact: true })).toBeVisible()
})
test('create uses the selected category/language and preserves the draft after failure', async ({
  page,
}) => {
  const state = await fixture(page)
  state.writeError = true
  await page.goto('/admin/content')
  await page.getByRole('combobox', { name: 'Category', exact: true }).selectOption(otherCategory)
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('en')
  await page.getByRole('button', { name: 'Tạo item', exact: true }).click()
  const dialog = page.getByRole('dialog', { name: 'Tạo Content Item Mới', exact: true })
  await expect(dialog.getByLabel('Category của item', { exact: true })).toHaveValue(otherCategory)
  await expect(dialog.getByLabel('Language của item', { exact: true })).toHaveValue('en')
  await dialog.getByRole('textbox', { name: 'Key', exact: true }).fill('new.title')
  await dialog.getByRole('textbox', { name: 'Value', exact: true }).fill('Keep draft')
  await dialog.getByRole('button', { name: 'Lưu', exact: true }).click()
  await expect(dialog.getByText('CMS save unavailable', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('textbox', { name: 'Value', exact: true })).toHaveValue(
    'Keep draft'
  )
  state.writeError = false
  await dialog.getByRole('button', { name: 'Lưu', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.getByText('Đã lưu new.title.', { exact: true })).toBeVisible()
  expect(state.writes[1].body).toMatchObject({
    categoryId: otherCategory,
    language: 'en',
    value: 'Keep draft',
  })
})
test('pending edit locks fields and Escape, and sends one versioned update', async ({ page }) => {
  const state = await fixture(page)
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/admin/content')
  await edit(page)
  const dialog = page.getByRole('dialog', { name: 'Sửa Content Item', exact: true })
  await dialog.getByRole('textbox', { name: 'Value', exact: true }).fill('Pending value')
  await dialog.getByRole('button', { name: 'Lưu', exact: true }).click()
  await expect.poll(() => state.writes.length).toBe(1)
  await expect(dialog.getByRole('textbox', { name: 'Value', exact: true })).toBeDisabled()
  await page.keyboard.press('Escape')
  await expect(dialog).toBeVisible()
  release()
  await expect(dialog).not.toBeVisible()
  expect(state.writes[0].body.expectedRevision).toBe(7)
})
test('a conflict retains the draft and loads a separate current version before explicit replacement', async ({
  page,
}) => {
  const state = await fixture(page)
  state.conflict = true
  await page.goto('/admin/content')
  await edit(page)
  const dialog = page.getByRole('dialog', { name: 'Sửa Content Item', exact: true })
  await dialog.getByRole('textbox', { name: 'Value', exact: true }).fill('My draft')
  await dialog.getByRole('button', { name: 'Lưu', exact: true }).click()
  await expect(dialog.getByRole('alert')).toContainText('bản nháp được giữ lại')
  state.current = { ...state.current, value: 'Other editor saved', revision: 8 }
  await dialog.getByRole('button', { name: 'Tải bản mới để so sánh', exact: true }).click()
  await expect(
    dialog.getByRole('textbox', { name: 'Nội dung đang lưu trên server', exact: true })
  ).toHaveValue('Other editor saved')
  await expect(dialog.getByRole('textbox', { name: 'Value', exact: true })).toHaveValue('My draft')
  await dialog.getByRole('button', { name: 'Dùng bản mới thay bản nháp', exact: true }).click()
  await expect(dialog.getByRole('textbox', { name: 'Value', exact: true })).toHaveValue(
    'Other editor saved'
  )
  await dialog.getByRole('textbox', { name: 'Value', exact: true }).fill('Merged manually')
  state.conflict = false
  await dialog.getByRole('button', { name: 'Lưu', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  expect(state.writes[1].body.expectedRevision).toBe(8)
})
test('a malformed save acknowledgement cannot close the draft or report success', async ({
  page,
}) => {
  const state = await fixture(page)
  state.invalidAck = true
  await page.goto('/admin/content')
  await edit(page)
  const dialog = page.getByRole('dialog', { name: 'Sửa Content Item', exact: true })
  await dialog.getByRole('textbox', { name: 'Value', exact: true }).fill('Keep this value')
  await dialog.getByRole('button', { name: 'Lưu', exact: true }).click()
  await expect(dialog.getByRole('alert')).toBeVisible()
  await expect(dialog.getByRole('textbox', { name: 'Value', exact: true })).toHaveValue(
    'Keep this value'
  )
  await expect(page.getByText('Đã lưu hero.title.', { exact: true })).toHaveCount(0)
})
test('a late response from a previous admin session cannot close the new editor', async ({
  page,
}) => {
  await page.clock.install()
  const state = await fixture(page)
  let release!: () => void
  state.pending = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/admin/content')
  await edit(page)
  await page.getByRole('textbox', { name: 'Value', exact: true }).fill('First admin draft')
  await page.getByRole('button', { name: 'Lưu', exact: true }).click()
  await expect.poll(() => state.writes.length).toBe(1)
  state.adminId = 'second-admin'
  await page.clock.fastForward(121000)
  await expect.poll(() => state.checks).toBeGreaterThan(1)
  await expect(page.getByRole('dialog')).not.toBeVisible()
  await page.getByRole('button', { name: 'Tạo item', exact: true }).click()
  await page.getByRole('textbox', { name: 'Value', exact: true }).fill('Second admin draft')
  const response = page.waitForResponse(result => result.request().method() === 'PUT')
  release()
  await response
  await expect(page.getByRole('textbox', { name: 'Value', exact: true })).toHaveValue(
    'Second admin draft'
  )
  await expect(
    page.getByRole('dialog', { name: 'Tạo Content Item Mới', exact: true })
  ).toBeVisible()
})
test('a late list response cannot restore the previous language', async ({ page }) => {
  const state = await fixture(page)
  let release!: () => void
  state.delayOld = true
  state.delayedList = new Promise(resolve => {
    release = resolve
  })
  await page.goto('/admin/content')
  await page.getByRole('combobox', { name: 'Language', exact: true }).selectOption('en')
  await expect(page.getByRole('button', { name: 'Sửa hero.title', exact: true })).toBeVisible()
  release()
  await page.getByRole('button', { name: 'Sửa hero.title', exact: true }).click()
  await expect(page.getByLabel('Language của item', { exact: true })).toHaveValue('en')
})
test('import is staged for review, respects file language and waits for a confirmed atomic result', async ({
  page,
}) => {
  const state = await fixture(page)
  state.invalidAck = true
  await page.goto('/admin/content')
  await uploadFile(page, 'content-en.json', file)
  const dialog = page.getByRole('dialog', { name: 'Preview import CMS', exact: true })
  await expect(dialog).toBeVisible()
  expect(state.writes).toEqual([])
  await expect(
    dialog.getByRole('button', { name: 'Xác nhận import CMS', exact: true })
  ).toBeDisabled()
  await dialog.getByRole('checkbox').check()
  await dialog.getByRole('button', { name: 'Xác nhận import CMS', exact: true }).click()
  await expect(dialog.getByRole('alert')).toBeVisible()
  expect(state.writes[0].body.language).toBe('en')
  state.invalidAck = false
  await dialog.getByRole('button', { name: 'Xác nhận import CMS', exact: true }).click()
  await expect(dialog).not.toBeVisible()
  await expect(page.getByText('Đã import 1 items (EN).', { exact: true })).toBeVisible()
})
test('unsupported file data never starts an import request', async ({ page }) => {
  const state = await fixture(page)
  await page.goto('/admin/content')
  await uploadFile(page, 'invalid.json', { ...file, version: 'future' })
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  expect(state.writes).toEqual([])
})
test('export download preserves metadata and uses the selected language', async ({ page }) => {
  await fixture(page)
  await page.goto('/admin/content')
  await page.evaluate(() => {
    const create = URL.createObjectURL.bind(URL)
    URL.createObjectURL = object => {
      if (object instanceof Blob)
        (window as Window & { cmsTestDownload?: Blob }).cmsTestDownload = object
      return create(object)
    }
  })
  const downloading = page.waitForEvent('download')
  await page.getByRole('button', { name: 'Export VI', exact: true }).click()
  const download = await downloading
  expect(download.suggestedFilename()).toBe('content-vi.json')
  expect(
    await page.evaluate(async () => {
      const blob = (window as Window & { cmsTestDownload?: Blob }).cmsTestDownload
      if (!blob) throw new Error('Export did not create a downloadable Blob')
      return JSON.parse(await blob.text())
    })
  ).toMatchObject({
    ...file,
    language: 'vi',
  })
})
test('a delete without the selected item acknowledgement cannot remove its row', async ({
  page,
}) => {
  const state = await fixture(page)
  state.invalidAck = true
  page.on('dialog', dialog => dialog.accept())
  await page.goto('/admin/content')
  await page.getByRole('button', { name: 'Xóa hero.title', exact: true }).click()
  await expect(page.getByRole('alert')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Sửa hero.title', exact: true })).toBeVisible()
  expect(state.writes[0].body).toEqual({ revision: 7 })
})
test('CMS dialogs remain usable on a phone and Escape asks before discarding a dirty draft', async ({
  page,
}) => {
  await fixture(page)
  await page.setViewportSize({ width: 390, height: 844 })
  await page.goto('/admin/content')
  await edit(page)
  const dialog = page.getByRole('dialog', { name: 'Sửa Content Item', exact: true })
  await expect(dialog.getByRole('button', { name: 'Lưu', exact: true })).toBeInViewport()
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true)
  await dialog.getByRole('textbox', { name: 'Value', exact: true }).fill('Dirty draft')
  page.once('dialog', prompt => prompt.dismiss())
  await page.keyboard.press('Escape')
  await expect(dialog).toBeVisible()
  await expect(dialog.getByRole('textbox', { name: 'Value', exact: true })).toHaveValue(
    'Dirty draft'
  )
  page.once('dialog', prompt => prompt.accept())
  await page.keyboard.press('Escape')
  await expect(dialog).not.toBeVisible()
})

test('a legacy CMS list stays visible while every write control is disabled', async ({ page }) => {
  const state = await fixture(page)
  state.readOnly = true
  await page.goto('/admin/content')
  await expect(page.getByText('CMS đang ở chế độ chỉ xem.', { exact: false })).toBeVisible()
  await expect(page.getByText('Original title', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tạo item', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Sửa hero.title', exact: true })).toBeDisabled()
  await expect(page.getByRole('button', { name: 'Xóa hero.title', exact: true })).toBeDisabled()
  await expect(page.getByLabel('Chọn file import CMS')).toBeDisabled()
  await expect(page.getByLabel('Category', { exact: true })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Export VI', exact: true })).toBeEnabled()
  expect(state.writes).toEqual([])
})
test('an empty legacy category does not enable create or import', async ({ page }) => {
  const state = await fixture(page)
  state.readOnly = true
  state.total = 0
  await page.goto('/admin/content')
  await expect(page.getByText('Không có content item phù hợp.', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tạo item', exact: true })).toBeDisabled()
  await expect(page.getByLabel('Chọn file import CMS')).toBeDisabled()
  expect(state.writes).toEqual([])
})
test('an explicit reload unlocks authoring only after the server confirms a ready schema', async ({
  page,
}) => {
  const state = await fixture(page)
  state.readOnly = true
  await page.goto('/admin/content')
  await expect(page.getByText('CMS đang ở chế độ chỉ xem.', { exact: false })).toBeVisible()
  state.readOnly = false
  await page.getByRole('button', { name: 'Tải lại items', exact: true }).click()
  await expect(page.getByRole('button', { name: 'Tạo item', exact: true })).toBeEnabled()
  await expect(page.getByRole('button', { name: 'Sửa hero.title', exact: true })).toBeEnabled()
  await expect(page.getByText('CMS đang ở chế độ chỉ xem.', { exact: false })).toHaveCount(0)
  expect(state.writes).toEqual([])
})
test('CMS search waits for typing to settle before sending one filtered request', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/admin/content')
  await expect(page.getByText('Original title', { exact: true })).toBeVisible()
  expect(state.listReads).toHaveLength(1)
  await page
    .getByLabel('Tìm key hoặc value', { exact: true })
    .pressSequentially('hero.title', { delay: 20 })
  await expect.poll(() => state.listReads.length).toBe(2)
  expect(state.listReads[1]).toContain('search=hero.title')
})

test('All shows categories together, resets pagination and keeps editor categories concrete', async ({
  page,
}) => {
  const state = await fixture(page)
  await page.goto('/admin/content')
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await expect.poll(() => state.listReads.some(query => query.includes('offset=20'))).toBe(true)
  const reads: URLSearchParams[] = []
  const lastRead = () => reads[reads.length - 1]
  await page.route(/\/api\/admin\/content\?/, async route => {
    if (route.request().method() !== 'GET') return route.fallback()
    const params = new URL(route.request().url()).searchParams
    reads.push(params)
    const items = [
      state.current,
      { ...row, id: otherCategory, key: 'landing.title', categoryId: otherCategory },
    ]
      .filter(item => !params.has('category') || item.categoryId === params.get('category'))
      .map(item => ({ ...item, language: params.get('language') }))
    return reply(route, {
      items,
      total: items.length,
      limit: 20,
      offset: Number(params.get('offset')),
    })
  })
  const filter = page.getByRole('combobox', { name: 'Category', exact: true })
  await filter.selectOption({ label: 'All' })
  await expect(page.getByText('2 items khớp bộ lọc', { exact: true })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Category', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'header', exact: true })).toBeVisible()
  await expect(page.getByRole('cell', { name: 'landing', exact: true })).toBeVisible()
  expect(reads[0].has('category')).toBe(false)
  expect(reads[0].get('offset')).toBe('0')
  await page.getByRole('button', { name: 'Tạo item', exact: true }).click()
  const create = page.getByRole('dialog', { name: 'Tạo Content Item Mới', exact: true })
  await expect(create.getByLabel('Category của item', { exact: true })).toHaveValue(category)
  await create.getByRole('button', { name: 'Hủy', exact: true }).click()
  await page.getByRole('button', { name: 'Sửa landing.title', exact: true }).click()
  const editor = page.getByRole('dialog', { name: 'Sửa Content Item', exact: true })
  await expect(editor.getByLabel('Category của item', { exact: true })).toHaveValue(otherCategory)
  await editor.getByRole('button', { name: 'Hủy', exact: true }).click()
  await page.getByLabel('Language', { exact: true }).selectOption('en')
  await page.getByLabel('Tìm key hoặc value', { exact: true }).fill('title')
  await expect.poll(() => lastRead()?.get('search')).toBe('title')
  expect(lastRead()?.get('language')).toBe('en')
  expect(lastRead()?.has('category')).toBe(false)
  await expect(filter).toHaveValue('')
  await filter.selectOption(otherCategory)
  await expect(page.getByText('1 items khớp bộ lọc', { exact: true })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Category', exact: true })).toHaveCount(0)
  expect(lastRead()?.get('category')).toBe(otherCategory)
  expect(state.writes).toEqual([])
})

for (const invalidAck of [false, true]) {
  test(`CMS save updates another open tab only after a valid acknowledgement (invalid=${invalidAck})`, async ({
    page,
    context,
  }) => {
    const state = await fixture(page)
    state.current.key = 'nav.docs'
    state.invalidAck = invalidAck
    const website = await context.newPage()
    await website.addInitScript(() => localStorage.setItem('language', 'vi'))
    let batches = 0
    await mockApi(website, async route => {
      const path = new URL(route.request().url()).pathname
      if (path === '/api/content/batch') {
        batches++
        return reply(route, {
          items: { 'nav.docs': state.current.value },
          missingKeys: [],
          ambiguousKeys: [],
        })
      }
      if (path === '/api/auth/me' || path === '/api/auth/refresh' || path === '/api/admin-auth/me')
        return reply(route, {}, 401)
      return reply(route, {})
    })
    await website.goto('/')
    const label = website.locator('header nav a[href="/docs"]')
    await expect(label).toHaveText('Original title')
    const preparedBatches = batches
    expect(preparedBatches).toBeGreaterThan(1)
    await page.goto('/admin/content')
    await page.getByRole('button', { name: 'Sửa nav.docs', exact: true }).click()
    const dialog = page.getByRole('dialog', { name: 'Sửa Content Item', exact: true })
    await dialog.getByRole('textbox', { name: 'Value', exact: true }).fill('Updated website label')
    await dialog.getByRole('button', { name: 'Lưu', exact: true }).click()
    if (invalidAck) {
      await expect(dialog.getByRole('alert')).toBeVisible()
      await expect(label).toHaveText('Original title')
      expect(batches).toBe(preparedBatches)
    } else {
      await expect(dialog).not.toBeVisible()
      await expect(label).toHaveText('Updated website label')
      expect(batches).toBe(preparedBatches * 2)
    }
    expect(state.writes).toHaveLength(1)
    await website.close()
  })
}

test('CMS uses 20-row pages and searches the entire selected category or All before pagination', async ({
  page,
}) => {
  const state = await fixture(page)
  const items = Array.from({ length: 61 }, (_, index) => ({
    ...row,
    id: `00000000-0000-4000-8000-${String(index).padStart(12, '0')}`,
    categoryId: index % 2 === 0 ? category : otherCategory,
    key: index === 60 ? 'deep.target' : `entry-${index}`,
  }))
  const reads: URLSearchParams[] = []
  await page.route('**/api/admin/content?*', async route => {
    const params = new URL(route.request().url()).searchParams
    reads.push(params)
    const limit = Number(params.get('limit')),
      offset = Number(params.get('offset'))
    const filtered = items.filter(
      item =>
        (!params.has('category') || item.categoryId === params.get('category')) &&
        item.key.includes(params.get('search') || '')
    )
    return reply(route, {
      items: filtered.slice(offset, offset + limit),
      total: filtered.length,
      limit,
      offset,
    })
  })
  await page.goto('/admin/content')
  const rows = page.getByRole('table').locator('tbody tr')
  await expect(rows).toHaveCount(20)
  await expect(page.getByText('31 items khớp bộ lọc', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await expect(rows).toHaveCount(11)
  await page.getByRole('combobox', { name: 'Category', exact: true }).selectOption({ label: 'All' })
  await expect(rows).toHaveCount(20)
  await expect(page.getByText('61 items khớp bộ lọc', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Tiếp', exact: true }).click()
  await expect(page.getByText('Trang 2', { exact: true })).toBeVisible()
  await page.getByRole('textbox', { name: 'Tìm key hoặc value', exact: true }).fill('deep.target')
  await expect(page.getByText('deep.target', { exact: true })).toBeVisible()
  await expect(rows).toHaveCount(1)
  await expect(page.getByText('1 items khớp bộ lọc', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Trước', exact: true })).toBeDisabled()
  const last = reads[reads.length - 1]
  expect(last.has('category')).toBe(false)
  expect(last.get('offset')).toBe('0')
  expect(last.get('limit')).toBe('20')
  expect(last.get('search')).toBe('deep.target')
  expect(state.writes).toEqual([])
})
