import { useCallback, useEffect, useState } from 'react'

interface ResourceState<T> {
  scope: string | null
  data: T | null
  loading: boolean
  error: string | null
}

/** Callers memoize load; key identifies every input/account that owns the result. */
export function useAsyncResource<T>(key: string | null, load: (signal: AbortSignal) => Promise<T>) {
  const [revision, setRevision] = useState(0)
  const scope = key === null ? null : JSON.stringify([key, revision])
  const [state, setState] = useState<ResourceState<T>>({
    scope: null,
    data: null,
    loading: false,
    error: null,
  })
  const retry = useCallback(() => setRevision(value => value + 1), [])

  useEffect(() => {
    if (scope === null) {
      setState({ scope: null, data: null, loading: false, error: null })
      return
    }
    const controller = new AbortController()
    setState({ scope, data: null, loading: true, error: null })
    void (async () => {
      try {
        // Skip effects abandoned in the same turn (StrictMode replay or a new scope).
        await Promise.resolve()
        if (controller.signal.aborted) return
        const data = await load(controller.signal)
        if (!controller.signal.aborted) setState({ scope, data, loading: false, error: null })
      } catch (error) {
        if (!controller.signal.aborted)
          setState({
            scope,
            data: null,
            loading: false,
            error:
              error instanceof Error ? error.message : 'Không tải được dữ liệu. Vui lòng thử lại.',
          })
      }
    })()
    return () => controller.abort()
  }, [scope, load])

  // Hide the old account/filter synchronously, before effects run.
  const current = scope !== null && state.scope === scope
  return {
    data: current ? state.data : null,
    error: current ? state.error : null,
    loading: scope !== null && (!current || state.loading),
    retry,
  }
}
