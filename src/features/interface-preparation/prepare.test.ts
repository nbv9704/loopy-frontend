import { afterEach, expect, it, vi } from 'vitest'
import { interfaceContentKeys } from '../../i18n/contentKeys'
import { loadContentKeys } from '../../lib/contentRequests'
import { prepareRoutes } from '../../routes/pages'
import { prepareInterface } from './prepare'

vi.mock('../../lib/contentRequests', () => ({
  loadContentKeys: vi.fn(async () => ({ items: {}, error: null })),
  retainPreparedContent: vi.fn(),
}))
vi.mock('../../routes/pages', () => ({ prepareRoutes: vi.fn(async () => undefined) }))
vi.mock('./assets', () => ({ prepareAssets: vi.fn(async () => undefined) }))
afterEach(vi.clearAllMocks)

it('shares initialization and prepares the complete selected locale without private data calls', async () => {
  await Promise.all([prepareInterface('en'), prepareInterface('en')])
  expect(prepareRoutes).toHaveBeenCalledTimes(1)
  expect(loadContentKeys).toHaveBeenCalledTimes(1)
  expect(vi.mocked(loadContentKeys).mock.calls[0].slice(0, 2)).toEqual([interfaceContentKeys, 'en'])
  await prepareInterface('vi')
  expect(vi.mocked(loadContentKeys).mock.calls[1][1]).toBe('vi')
})

it('permits complete bundled translations when CMS is unavailable', async () => {
  vi.mocked(loadContentKeys).mockResolvedValueOnce({ items: {}, error: 'Unavailable' })
  await expect(prepareInterface('en')).resolves.toBeUndefined()
})
