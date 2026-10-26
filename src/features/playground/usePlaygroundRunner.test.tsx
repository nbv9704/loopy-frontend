// @vitest-environment jsdom
import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { usePlaygroundRunner } from './usePlaygroundRunner'
import { executeProgram, loadExecutionCapabilities } from '../execution/execution.service'
vi.mock('../execution/execution.service', () => ({
  executeProgram: vi.fn(),
  loadExecutionCapabilities: vi.fn(),
}))
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(loadExecutionCapabilities).mockResolvedValue({
    javascript: { supported: true, runner: 'local', requiresRunner: false, reason: null },
  })
})
afterEach(cleanup)
it('blocks runs while capabilities are unknown, and allows retry without replacing the draft', async () => {
  vi.mocked(loadExecutionCapabilities).mockRejectedValueOnce(new Error('Unavailable'))
  const { result } = renderHook(() => usePlaygroundRunner('javascript', 'starter', 'account'))
  await waitFor(() => expect(result.current.resource.error).toBe('Unavailable'))
  act(() => {
    result.current.setCode('draft')
    void result.current.run()
  })
  expect(executeProgram).not.toHaveBeenCalled()
  act(() => result.current.resource.retry())
  await waitFor(() => expect(result.current.capability?.supported).toBe(true))
  expect(result.current.code).toBe('draft')
})
it('locks duplicate runs and ignores a pending response after the account changes', async () => {
  let release!: (result: any) => void
  vi.mocked(executeProgram).mockReturnValue(
    new Promise(resolve => {
      release = resolve
    })
  )
  const { result, rerender } = renderHook(
    ({ account }) => usePlaygroundRunner('javascript', 'starter', account),
    { initialProps: { account: 'first' } }
  )
  await waitFor(() => expect(result.current.capability?.supported).toBe(true))
  act(() => {
    void result.current.run()
    void result.current.run()
  })
  expect(executeProgram).toHaveBeenCalledTimes(1)
  rerender({ account: 'second' })
  await act(async () => release({ output: 'old', error: null, executionTime: 0 }))
  expect(result.current.result).toBeUndefined()
  expect(result.current.pending).toBe(false)
})
it('removes old output when code or account changes and retains an editable draft after failure', async () => {
  vi.mocked(executeProgram)
    .mockResolvedValueOnce({ output: 'result', error: null, executionTime: 0 })
    .mockRejectedValue(new Error('Offline'))
  const { result, rerender } = renderHook(
    ({ account }) => usePlaygroundRunner('javascript', 'starter', account),
    { initialProps: { account: 'first' } }
  )
  await waitFor(() => expect(result.current.capability?.supported).toBe(true))
  await act(async () => {
    await result.current.run()
  })
  expect(result.current.result?.output).toBe('result')
  rerender({ account: 'second' })
  expect(result.current.result).toBeUndefined()
  act(() => result.current.setCode('draft'))
  await act(async () => {
    await result.current.run()
  })
  expect(result.current.error).toBe('Offline')
  expect(result.current.code).toBe('draft')
})
