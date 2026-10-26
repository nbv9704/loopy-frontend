import { z } from 'zod'
import { api, type ExecutionResult } from '../../lib/api'

export const executionLanguages = ['javascript', 'python', 'cpp', 'java', 'go', 'rust'] as const
const capability = z.object({
  supported: z.boolean(),
  runner: z.enum(['local', 'piston', 'glot']).nullable(),
  requiresRunner: z.boolean(),
  reason: z.string().nullable(),
})
export type ExecutionCapability = z.infer<typeof capability>

export async function loadExecutionCapabilities(signal: AbortSignal) {
  const response = await api.getCapabilities(signal)
  const parsed = z.record(z.string(), capability).safeParse(response.data?.capabilities)
  if (
    !response.success ||
    !parsed.success ||
    executionLanguages.some(language => {
      const item = parsed.success ? parsed.data[language] : undefined
      return (
        !item ||
        item.requiresRunner !== (language !== 'javascript') ||
        (item.supported &&
          (language === 'javascript'
            ? item.runner !== 'local'
            : !['piston', 'glot'].includes(item.runner ?? ''))) ||
        (!item.supported && !item.reason?.trim())
      )
    })
  )
    throw new Error('Chưa tải được trạng thái runner. Hãy thử lại.')
  return parsed.data
}

const resultSchema = z.object({
  output: z.string().max(256 * 1024),
  error: z.string().nullable(),
  executionTime: z.number().finite().nonnegative(),
})
/** Shared by Learn and Playground: a malformed response is not a successful empty run. */
export async function executeProgram(language: string, code: string): Promise<ExecutionResult> {
  const response = await api.executeCode(language, code)
  if (!response.success)
    throw new Error(response.error?.message || 'Không chạy được code. Hãy thử lại.')
  const result = resultSchema.safeParse(response.data)
  if (!result.success) throw new Error('Chưa nhận được kết quả chạy code hợp lệ. Hãy thử lại.')
  return result.data
}
