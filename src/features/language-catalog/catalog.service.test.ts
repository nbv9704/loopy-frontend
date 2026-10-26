import { afterEach, expect, it, vi } from 'vitest'
import { api } from '../../lib/api'
import { loadCatalogLanguages, readCatalogLanguages } from './catalog.service'

afterEach(() => vi.restoreAllMocks())

it('reads both supported catalog envelopes and preserves confirmed empty results', () => {
  expect(readCatalogLanguages([])).toEqual([])
  expect(readCatalogLanguages({ languages: [] })).toEqual([])
  expect(
    readCatalogLanguages({
      languages: [
        { id: ' python ', name: 'Python', display_name: ' Python display ' },
        { id: 'javascript', name: 'JS', displayName: 'JavaScript' },
      ],
    })
  ).toEqual([
    { id: 'python', name: 'Python display' },
    { id: 'javascript', name: 'JavaScript' },
  ])
})

it.each([
  undefined,
  null,
  {},
  { items: [] },
  [null],
  [{ id: '', name: 'Python' }],
  [{ id: 'python', name: 5 }],
  [
    { id: 'python', name: 'Python' },
    { id: ' python ', name: 'Again' },
  ],
])('rejects malformed or duplicate responses instead of showing an empty catalog (%#)', data => {
  expect(() => readCatalogLanguages(data)).toThrow()
})

it('forwards cancellation and surfaces API failure for the page retry state', async () => {
  const signal = new AbortController().signal
  const request = vi.spyOn(api, 'request').mockResolvedValue({ success: false })
  await expect(loadCatalogLanguages(signal)).rejects.toThrow('unavailable')
  expect(request).toHaveBeenCalledWith('/api/languages', { signal, suppressErrorToast: true })
})
