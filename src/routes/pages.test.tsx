// @vitest-environment jsdom
import { Suspense } from 'react'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { preparedPage } from './pages'

afterEach(cleanup)

it('warms code without mounting pages and renders prepared pages without a lazy fallback', async () => {
  const View = vi.fn(() => <p>Ready page</p>)
  const load = vi.fn(async () => ({ default: View }))
  const page = preparedPage(load)
  await Promise.all([page.preload(), page.preload()])
  expect(load).toHaveBeenCalledTimes(1)
  expect(View).not.toHaveBeenCalled()
  render(
    <Suspense fallback={<p>Page loading</p>}>
      <page.Page />
    </Suspense>
  )
  expect(screen.getByText('Ready page')).toBeTruthy()
  expect(screen.queryByText('Page loading')).toBeNull()
})

it('permits an explicit retry after a failed module download', async () => {
  const load = vi
    .fn()
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue({ default: () => <p>Recovered</p> })
  const page = preparedPage(load)
  await expect(page.preload()).rejects.toThrow('Offline')
  await page.preload()
  expect(load).toHaveBeenCalledTimes(2)
})
