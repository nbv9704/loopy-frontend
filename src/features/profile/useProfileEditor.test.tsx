import { Suspense } from 'react'
// @vitest-environment jsdom
import { act, cleanup, render, renderHook, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { useProfileEditor } from './useProfileEditor'
import { profileService } from './profile.service'

vi.mock('./profile.service', () => ({
  profileService: { getAccount: vi.fn(), saveAccount: vi.fn() },
}))
const profile = (id: string) => ({ id, displayName: id, bio: '', avatarUrl: '' })
const deferred = <T,>() => {
  let resolve!: (value: T) => void
  const promise = new Promise<T>(done => {
    resolve = done
  })
  return { promise, resolve }
}
beforeEach(() => {
  vi.resetAllMocks()
  vi.mocked(profileService.getAccount).mockImplementation(async id => profile(id))
})
afterEach(cleanup)

it('keeps unsaved edits when the same account renders again and supports batched field edits', async () => {
  const { result, rerender } = renderHook(() => useProfileEditor('alice', vi.fn()))
  await waitFor(() => expect(result.current.loading).toBe(false))
  act(() => {
    result.current.setValue(value => ({ ...value, displayName: 'Edited' }))
    result.current.setValue(value => ({ ...value, bio: 'Kept' }))
  })
  rerender()
  expect(result.current.value).toMatchObject({ displayName: 'Edited', bio: 'Kept' })
  expect(profileService.getAccount).toHaveBeenCalledOnce()
})

it('preserves the draft after a failed write and allows retry', async () => {
  const onSaved = vi.fn()
  vi.mocked(profileService.saveAccount)
    .mockRejectedValueOnce(new Error('Offline'))
    .mockResolvedValue(profile('Saved'))
  const { result } = renderHook(() => useProfileEditor('alice', onSaved))
  await waitFor(() => expect(result.current.loading).toBe(false))
  act(() => result.current.setValue(value => ({ ...value, bio: 'My draft' })))
  await act(async () => {
    expect(await result.current.save()).toBe(false)
  })
  expect(result.current.saveError).toBe('Offline')
  expect(result.current.value.bio).toBe('My draft')
  expect(onSaved).not.toHaveBeenCalled()
  await act(async () => {
    expect(await result.current.save()).toBe(true)
  })
  expect(onSaved).toHaveBeenCalledOnce()
  expect(result.current.saving).toBe(false)
})

it('locks writes and editing while waiting for the server, including rapid duplicate submits', async () => {
  const pending = deferred<ReturnType<typeof profile>>()
  const onSaved = vi.fn()
  vi.mocked(profileService.saveAccount).mockReturnValue(pending.promise)
  const { result } = renderHook(() => useProfileEditor('alice', onSaved))
  await waitFor(() => expect(result.current.loading).toBe(false))
  let saving!: Promise<boolean>
  act(() => {
    saving = result.current.save()
    void result.current.save()
  })
  expect(result.current.saving).toBe(true)
  act(() => result.current.setValue(value => ({ ...value, bio: 'Ignored' })))
  expect(result.current.value.bio).toBe('')
  expect(onSaved).not.toHaveBeenCalled()
  expect(profileService.saveAccount).toHaveBeenCalledOnce()
  await act(async () => {
    pending.resolve(profile('alice'))
    expect(await saving).toBe(true)
  })
})

it('clears the previous account immediately and ignores its late load or save', async () => {
  const pending = deferred<ReturnType<typeof profile>>()
  const onSaved = vi.fn()
  vi.mocked(profileService.saveAccount).mockReturnValue(pending.promise)
  const { result, rerender } = renderHook(({ id }) => useProfileEditor(id, onSaved), {
    initialProps: { id: 'alice' },
  })
  await waitFor(() => expect(result.current.value.displayName).toBe('alice'))
  let saving!: Promise<boolean>
  act(() => {
    saving = result.current.save()
  })
  rerender({ id: 'bob' })
  expect(result.current.value.displayName).toBe('')
  expect(result.current.saving).toBe(false)
  await waitFor(() => expect(result.current.value.displayName).toBe('bob'))
  await act(async () => {
    pending.resolve(profile('alice'))
    expect(await saving).toBe(false)
  })
  expect(result.current.value.displayName).toBe('bob')
  expect(onSaved).not.toHaveBeenCalled()
})

it('does not turn a committed save into a failure if refreshing account context fails', async () => {
  vi.mocked(profileService.saveAccount).mockResolvedValue(profile('alice'))
  const { result } = renderHook(() =>
    useProfileEditor('alice', vi.fn().mockRejectedValue(new Error('refresh offline')))
  )
  await waitFor(() => expect(result.current.loading).toBe(false))
  await act(async () => {
    expect(await result.current.save()).toBe(true)
  })
  expect(result.current.saveError).toBeNull()
})

it('does not let a captured save from the old account write into a new cookie session', async () => {
  const { result, rerender } = renderHook(({ id }) => useProfileEditor(id, vi.fn()), {
    initialProps: { id: 'alice' },
  })
  await waitFor(() => expect(result.current.value.displayName).toBe('alice'))
  const staleSave = result.current.save
  rerender({ id: 'bob' })
  await waitFor(() => expect(result.current.value.displayName).toBe('bob'))
  await act(async () => {
    expect(await staleSave()).toBe(false)
  })
  expect(profileService.saveAccount).not.toHaveBeenCalled()
})

it('applies the confirmed snapshot without another account read', async () => {
  const snapshot = { id: 'alice', displayName: 'New name' }
  vi.mocked(profileService.saveAccount).mockResolvedValue({ ...profile('alice'), snapshot })
  const onSaved = vi.fn().mockResolvedValue(undefined)
  const { result } = renderHook(() => useProfileEditor('alice', onSaved))
  await waitFor(() => expect(result.current.loading).toBe(false))
  await act(async () => {
    expect(await result.current.save()).toBe(true)
  })
  expect(onSaved).toHaveBeenCalledWith(snapshot)
  expect(profileService.getAccount).toHaveBeenCalledOnce()
})

it('invalidates a pending save when Suspense hides its retained form and unlocks on reveal', async () => {
  const gate = new Promise<never>(() => {})
  const pending = deferred<ReturnType<typeof profile>>()
  vi.mocked(profileService.saveAccount).mockReturnValue(pending.promise)
  const onSaved = vi.fn()
  let editor!: ReturnType<typeof useProfileEditor>
  function Form({ hidden }: { hidden: boolean }) {
    editor = useProfileEditor('alice', onSaved)
    if (hidden) throw gate
    return <p>Visible form</p>
  }
  const view = (hidden: boolean) => (
    <Suspense fallback={<p>Hidden form</p>}>
      <Form hidden={hidden} />
    </Suspense>
  )
  const { rerender } = render(view(false))
  await waitFor(() => expect(editor.loading).toBe(false))
  let saving!: Promise<boolean>
  act(() => {
    saving = editor.save()
  })
  rerender(view(true))
  expect(screen.getByText('Hidden form')).toBeTruthy()
  await act(async () => {
    pending.resolve(profile('alice'))
    expect(await saving).toBe(false)
  })
  expect(onSaved).not.toHaveBeenCalled()
  rerender(view(false))
  expect(editor.saving).toBe(false)
})
