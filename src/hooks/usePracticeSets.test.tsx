// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { usePracticeSets } from './usePracticeSets'
import { practiceService } from '../services/practice.service'

vi.mock('../services/practice.service', () => ({ practiceService: { listSets: vi.fn() } }))
const response = (id: string) => ({ items: [{ id }], total: 1, limit: 24, offset: 0 })
beforeEach(() => vi.resetAllMocks())
afterEach(cleanup)

it('distinguishes a service error from an empty catalog and supports retry', async () => {
  vi.mocked(practiceService.listSets).mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue({ items: [], total: 0, limit: 24, offset: 0 })
  const { result } = renderHook(() => usePracticeSets({ limit: 24 }))
  await waitFor(() => expect(result.current.setsError).toBe('Offline'))
  expect(result.current.setsLoading).toBe(false)
  act(() => result.current.retrySets())
  await waitFor(() => expect(result.current.setsError).toBeNull())
  await waitFor(() => expect(result.current.setsLoading).toBe(false))
  expect(result.current.sets).toEqual([])
})

it('does not refetch just because an equivalent parameter object is recreated', async () => {
  vi.mocked(practiceService.listSets).mockResolvedValue(response('one') as never)
  const { result, rerender } = renderHook(() => usePracticeSets({ limit: 24 }))
  await waitFor(() => expect(result.current.sets).toHaveLength(1))
  rerender()
  expect(practiceService.listSets).toHaveBeenCalledTimes(1)
})

it('ignores a response from the previous filter/account scope', async () => {
  let finish!: (data: any) => void
  vi.mocked(practiceService.listSets).mockReturnValueOnce(new Promise(resolve => { finish = resolve }))
    .mockResolvedValue(response('new') as never)
  const { result, rerender } = renderHook(({ user }) => usePracticeSets({ mine: true }, user), { initialProps: { user: 'old' } })
  await waitFor(() => expect(practiceService.listSets).toHaveBeenCalledTimes(1))
  rerender({ user: 'new' })
  expect(result.current.sets).toEqual([])
  await waitFor(() => expect(result.current.sets[0]?.id).toBe('new'))
  await act(async () => { finish(response('old')) })
  expect(result.current.sets[0]?.id).toBe('new')
})

it('clears private results immediately when disabled on signout', async () => {
  vi.mocked(practiceService.listSets).mockResolvedValue(response('private') as never)
  const { result, rerender } = renderHook(({ enabled }) => usePracticeSets({ mine: true }, 'user', enabled), { initialProps: { enabled: true } })
  await waitFor(() => expect(result.current.sets).toHaveLength(1))
  rerender({ enabled: false })
  expect(result.current.sets).toEqual([])
  expect(result.current.setsLoading).toBe(false)
  expect(practiceService.listSets).toHaveBeenCalledTimes(1)
})
