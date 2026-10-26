import { useCallback, useContext, useLayoutEffect, useRef, useState } from 'react'
import { ActionRoutePath } from '../lib/actionRoute'

interface ActionCallbacks<T> {
  onSuccess: (value: T) => void
  onError: (error: unknown) => void
}

/** One write at a time; callbacks belong to this visible form, including navigation. */
export function useAsyncAction(scope?: string, routePath?: string) {
  const inheritedPath = useContext(ActionRoutePath)
  const ownerPath = routePath ?? inheritedPath
  const [pending, setPending] = useState(false)
  const locked = useRef(false)
  const lifetime = useRef(0)
  const active = useRef(false)
  const activeScope = useRef(scope)
  const activeRoute = useRef(ownerPath)
  useLayoutEffect(() => {
    activeScope.current = scope
    activeRoute.current = ownerPath
    active.current = true
    setPending(false)
    return () => {
      // Suspense hides retained forms without cleaning up passive effects.
      active.current = false
      ++lifetime.current
      locked.current = false
    }
  }, [scope, ownerPath])

  const run = useCallback(
    async <T>(action: (isCurrent: () => boolean) => Promise<T>, callbacks: ActionCallbacks<T>) => {
      // A router transition may retain the old visible tree after browser history changes.
      const routeCurrent = () =>
        !ownerPath || typeof window === 'undefined' || window.location.pathname === ownerPath
      if (
        !active.current ||
        activeScope.current !== scope ||
        activeRoute.current !== ownerPath ||
        !routeCurrent() ||
        locked.current
      )
        return
      const owner = lifetime.current
      const ownerCurrent = () => active.current && lifetime.current === owner
      const current = () => ownerCurrent() && routeCurrent()
      locked.current = true
      setPending(true)
      try {
        const value = await action(current)
        if (current()) callbacks.onSuccess(value)
      } catch (error) {
        if (current()) callbacks.onError(error)
      } finally {
        if (ownerCurrent()) {
          locked.current = false
          setPending(false)
        }
      }
    },
    [scope, ownerPath]
  )

  return { pending, run }
}
