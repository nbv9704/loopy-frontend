import { useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { useAsyncResource } from '../../hooks/useAsyncResource'
import { executeProgram, loadExecutionCapabilities } from '../execution/execution.service'
import type { ExecutionResult } from '../../lib/api'

export function usePlaygroundRunner(language: string, initialCode: string, accountScope: string) {
  const [code, setCode] = useState(initialCode)
  const resource = useAsyncResource('execution-capabilities', loadExecutionCapabilities)
  const scope = JSON.stringify([language, accountScope])
  const action = useAsyncAction(scope)
  const [response, setResponse] = useState<{
    scope: string
    code: string
    result?: ExecutionResult
    error?: string
  }>()
  const current = response?.scope === scope && response.code === code ? response : undefined
  const capability = resource.data?.[language]
  const run = () => {
    if (!capability?.supported || !code.trim()) return
    setResponse(undefined)
    return action.run(() => executeProgram(language, code), {
      onSuccess: result => setResponse({ scope, code, result }),
      onError: cause =>
        setResponse({
          scope,
          code,
          error: cause instanceof Error ? cause.message : 'Không chạy được code. Hãy thử lại.',
        }),
    })
  }
  return {
    code,
    setCode,
    run,
    pending: action.pending,
    capability,
    resource,
    result: current?.result,
    error: current?.error,
  }
}
