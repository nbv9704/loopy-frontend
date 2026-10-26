import { beforeEach, expect, it, vi } from 'vitest'
import { api } from '../../lib/api'
import { executeProgram, executionLanguages, loadExecutionCapabilities } from './execution.service'
vi.mock('../../lib/api', () => ({ api: { executeCode: vi.fn(), getCapabilities: vi.fn() } }))
beforeEach(() => vi.resetAllMocks())
const capabilities = () =>
  Object.fromEntries(
    executionLanguages.map(language => [
      language,
      {
        supported: true,
        runner: language === 'javascript' ? 'local' : 'glot',
        requiresRunner: language !== 'javascript',
        reason: null,
      },
    ])
  )
it('supports Glot metadata and passes cancellation to the capabilities API', async () => {
  vi.mocked(api.getCapabilities).mockResolvedValue({
    success: true,
    data: { capabilities: capabilities() },
  } as never)
  const signal = new AbortController().signal
  expect((await loadExecutionCapabilities(signal)).python.runner).toBe('glot')
  expect(api.getCapabilities).toHaveBeenCalledWith(signal)
})
it.each([
  {},
  { python: true },
  { ...capabilities(), javascript: { supported: 'yes' } },
  {
    ...capabilities(),
    python: { supported: true, runner: null, requiresRunner: true, reason: null },
  },
])(
  'rejects incomplete/malformed capabilities rather than guessing supported runners (%j)',
  async data => {
    vi.mocked(api.getCapabilities).mockResolvedValue({
      success: true,
      data: { capabilities: data },
    } as never)
    await expect(loadExecutionCapabilities(new AbortController().signal)).rejects.toThrow(
      'trạng thái runner'
    )
  }
)
it.each([
  {},
  { output: 0, error: null, executionTime: 0 },
  { output: '', error: false, executionTime: 0 },
  { output: '', error: null },
  { output: '', error: null, executionTime: -1 },
])(
  'does not present a malformed successful execution as a completed empty run (%j)',
  async data => {
    vi.mocked(api.executeCode).mockResolvedValue({ success: true, data } as never)
    await expect(executeProgram('javascript', 'source')).rejects.toThrow('hợp lệ')
  }
)
it('keeps stdout before a runtime error and preserves a valid zero duration', async () => {
  const data = { output: 'before failure', error: 'ReferenceError', executionTime: 0 }
  vi.mocked(api.executeCode).mockResolvedValue({ success: true, data })
  await expect(executeProgram('javascript', 'source')).resolves.toEqual(data)
})
it('preserves an infrastructure failure as an error, without a fake result', async () => {
  vi.mocked(api.executeCode).mockResolvedValue({
    success: false,
    error: { code: 'RUNNER_UNAVAILABLE', message: 'Runner tạm dừng' },
  })
  await expect(executeProgram('python', 'source')).rejects.toThrow('Runner tạm dừng')
})
