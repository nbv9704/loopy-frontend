import { useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { requestLessonHint, type LessonHintInput } from './lessonHint.service'

/** A hint belongs to a particular visible lesson, source and runtime output. */
export function useLessonHint(scope: string, input: LessonHintInput) {
  const key = JSON.stringify([scope, input])
  const { pending, run } = useAsyncAction(key)
  const [result, setResult] = useState<{ key: string; hint?: string; error?: string }>()
  const current = result?.key === key ? result : undefined
  const ask = () => {
    if (!input.lessonId) return
    setResult(undefined)
    return run(() => requestLessonHint(input), {
      onSuccess: hint => setResult({ key, hint }),
      onError: cause =>
        setResult({
          key,
          error: cause instanceof Error ? cause.message : 'Không lấy được gợi ý. Hãy thử lại.',
        }),
    })
  }
  return { hint: current?.hint, error: current?.error, pending, ask }
}
