// @vitest-environment jsdom
import { StrictMode, Suspense, type ReactNode } from 'react'
import { act, cleanup, render, renderHook, screen } from '@testing-library/react'
import { afterEach, expect, it, vi } from 'vitest'
import { useAsyncAction } from './useAsyncAction'
import { ActionRoutePath } from '../lib/actionRoute'

afterEach(cleanup)

it('inherits route ownership for all routed forms and suppresses late navigation before unmount', async () => {
  const original = window.location.href
  window.history.replaceState(null, '', '/onboarding')
  try {
    const wrapper = ({ children }: { children: ReactNode }) => (
      <ActionRoutePath.Provider value="/onboarding">{children}</ActionRoutePath.Provider>
    )
    const { result } = renderHook(() => useAsyncAction(), { wrapper })
    let release!: () => void
    const gate = new Promise<void>(resolve => {
      release = resolve
    })
    const navigate = vi.fn()
    let pending!: Promise<void>
    act(() => {
      pending = result.current.run(
        async () => {
          await gate
          return 'saved'
        },
        { onSuccess: navigate, onError: vi.fn() }
      )
    })
    window.history.pushState(null, '', '/practice')
    await act(async () => {
      release()
      await pending
    })
    expect(navigate).not.toHaveBeenCalled()
    expect(result.current.pending).toBe(false)
  } finally {
    window.history.replaceState(null, '', original)
  }
})

it('blocks follow-up writes as soon as history leaves a route, even while its tree remains mounted', async () => {
  const original = window.location.href
  window.history.replaceState(null, '', '/learn/first')
  try {
    let release!: () => void
    const gate = new Promise<void>(resolve => {
      release = resolve
    })
    const callbacks = { onSuccess: vi.fn(), onError: vi.fn() }
    const followUp = vi.fn()
    const { result } = renderHook(() => useAsyncAction('lesson', '/learn/first'))
    let pending!: Promise<void>
    act(() => {
      pending = result.current.run(async current => {
        await gate
        if (current()) followUp()
      }, callbacks)
    })
    window.history.pushState(null, '', '/library/javascript')
    await act(async () => {
      release()
      await pending
    })
    expect(followUp).not.toHaveBeenCalled()
    expect(callbacks.onSuccess).not.toHaveBeenCalled()
    expect(result.current.pending).toBe(false)
    const oldViewWrite = vi.fn()
    await act(async () => {
      await result.current.run(oldViewWrite, callbacks)
    })
    expect(oldViewWrite).not.toHaveBeenCalled()
  } finally {
    window.history.replaceState(null, '', original)
  }
})

it('rejects captured callbacks from a previous route even when the business scope stays the same', async () => {
  const original = window.location.href
  window.history.replaceState(null, '', '/first')
  try {
    const { result, rerender } = renderHook(
      ({ pathname }) => useAsyncAction('same-account', pathname),
      { initialProps: { pathname: '/first' } }
    )
    const captured = result.current.run
    window.history.pushState(null, '', '/second')
    rerender({ pathname: '/second' })
    const write = vi.fn().mockResolvedValue('saved')
    const callbacks = { onSuccess: vi.fn(), onError: vi.fn() }
    await act(async () => {
      await captured(write, callbacks)
    })
    expect(write).not.toHaveBeenCalled()
    await act(async () => {
      await result.current.run(write, callbacks)
    })
    expect(write).toHaveBeenCalledOnce()
  } finally {
    window.history.replaceState(null, '', original)
  }
})

it('refuses a captured action runner after its scope changes, before sending any write', async () => {
  const { result, rerender } = renderHook(({ scope }) => useAsyncAction(scope), {
    initialProps: { scope: 'alice' },
  })
  const previousRun = result.current.run
  rerender({ scope: 'bob' })
  const write = vi.fn().mockResolvedValue('saved')
  const callbacks = { onSuccess: vi.fn(), onError: vi.fn() }
  await act(async () => {
    await previousRun(write, callbacks)
  })
  expect(write).not.toHaveBeenCalled()
  await act(async () => {
    await result.current.run(write, callbacks)
  })
  expect(write).toHaveBeenCalledOnce()
})

it('releases a changed scope while suppressing callbacks and follow-up writes from the previous one', async () => {
  let release!: () => void
  const gate = new Promise<void>(resolve => {
    release = resolve
  })
  const callbacks = { onSuccess: vi.fn(), onError: vi.fn() }
  const oldWrite = vi.fn()
  const { result, rerender } = renderHook(({ scope }) => useAsyncAction(scope), {
    initialProps: { scope: 'lesson-a' },
  })
  let pending!: Promise<void>
  act(() => {
    pending = result.current.run(async isCurrent => {
      await gate
      if (isCurrent()) oldWrite()
    }, callbacks)
  })
  rerender({ scope: 'lesson-b' })
  expect(result.current.pending).toBe(false)
  await act(async () => {
    await result.current.run(async () => 'new', callbacks)
  })
  expect(callbacks.onSuccess).toHaveBeenCalledTimes(1)
  await act(async () => {
    release()
    await pending
  })
  expect(oldWrite).not.toHaveBeenCalled()
  expect(callbacks.onSuccess).toHaveBeenCalledTimes(1)
})

it('lets a multi-step action skip subsequent writes when its owner is no longer active', async () => {
  let release!: () => void
  const firstRequest = new Promise<void>(resolve => {
    release = resolve
  })
  const followUpWrite = vi.fn()
  const callbacks = { onSuccess: vi.fn(), onError: vi.fn() }
  const { result, unmount } = renderHook(() => useAsyncAction())
  let initiallyCurrent = false
  let pending!: Promise<void>
  act(() => {
    pending = result.current.run(async isCurrent => {
      initiallyCurrent = isCurrent()
      await firstRequest
      if (isCurrent()) followUpWrite()
    }, callbacks)
  })
  expect(initiallyCurrent).toBe(true)
  unmount()
  release()
  await pending
  expect(followUpWrite).not.toHaveBeenCalled()
  expect(callbacks.onSuccess).not.toHaveBeenCalled()
})

it('locks duplicate writes synchronously and unlocks after completion under StrictMode', async () => {
  let resolve!: (value: string) => void
  const action = vi.fn(
    () =>
      new Promise<string>(done => {
        resolve = done
      })
  )
  const callbacks = { onSuccess: vi.fn(), onError: vi.fn() }
  const { result } = renderHook(() => useAsyncAction(), { wrapper: StrictMode })
  act(() => {
    void result.current.run(action, callbacks)
    void result.current.run(action, callbacks)
  })
  expect(action).toHaveBeenCalledTimes(1)
  expect(result.current.pending).toBe(true)
  await act(async () => {
    resolve('saved')
  })
  expect(callbacks.onSuccess).toHaveBeenCalledWith('saved')
  expect(result.current.pending).toBe(false)
  await act(async () => {
    await result.current.run(async () => 'second', callbacks)
  })
  expect(callbacks.onSuccess).toHaveBeenLastCalledWith('second')
})

for (const failed of [false, true]) {
  it(`ignores a late ${failed ? 'failure' : 'success'} after the form unmounts`, async () => {
    let finish!: () => void
    const action = () =>
      new Promise<string>((resolve, reject) => {
        finish = () => (failed ? reject(new Error('late')) : resolve('saved'))
      })
    const callbacks = { onSuccess: vi.fn(), onError: vi.fn() }
    const { result, unmount } = renderHook(() => useAsyncAction())
    let pending!: Promise<void>
    act(() => {
      pending = result.current.run(action, callbacks)
    })
    unmount()
    finish()
    await pending
    expect(callbacks.onSuccess).not.toHaveBeenCalled()
    expect(callbacks.onError).not.toHaveBeenCalled()
  })
}

it('unlocks a failed action so a preserved draft can be retried', async () => {
  const callbacks = { onSuccess: vi.fn(), onError: vi.fn() }
  const { result } = renderHook(() => useAsyncAction())
  const error = new Error('unavailable')
  await act(async () => {
    await result.current.run(async () => {
      throw error
    }, callbacks)
  })
  expect(callbacks.onError).toHaveBeenCalledWith(error)
  expect(result.current.pending).toBe(false)
  await act(async () => {
    await result.current.run(async () => 'saved', callbacks)
  })
  expect(callbacks.onSuccess).toHaveBeenCalledWith('saved')
})

it('invalidates callbacks when Suspense hides a retained form and unlocks it on reveal', async () => {
  const suspended = new Promise<never>(() => {})
  let editor!: ReturnType<typeof useAsyncAction>
  function Form({ hidden }: { hidden: boolean }) {
    editor = useAsyncAction()
    if (hidden) throw suspended
    return <p>Editor visible</p>
  }
  const view = (hidden: boolean) => (
    <Suspense fallback={<p>Loading another page</p>}>
      <Form hidden={hidden} />
    </Suspense>
  )
  const { rerender } = render(view(false))
  let finish!: (value: string) => void
  const callbacks = { onSuccess: vi.fn(), onError: vi.fn() }
  let pending!: Promise<void>
  act(() => {
    pending = editor.run(
      () =>
        new Promise<string>(resolve => {
          finish = resolve
        }),
      callbacks
    )
  })
  rerender(view(true))
  expect(screen.getByText('Loading another page')).toBeTruthy()
  await act(async () => {
    finish('old save')
    await pending
  })
  expect(callbacks.onSuccess).not.toHaveBeenCalled()
  rerender(view(false))
  expect(editor.pending).toBe(false)
  await act(async () => {
    await editor.run(async () => 'new save', callbacks)
  })
  expect(callbacks.onSuccess).toHaveBeenCalledWith('new save')
})
