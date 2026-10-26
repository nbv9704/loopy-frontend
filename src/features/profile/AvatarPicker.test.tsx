// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { AvatarPicker } from './AvatarPicker'
import { Suspense } from 'react'
import { avatarPresets, resizeAvatar } from './profileAvatar'

vi.mock('./profileAvatar', () => ({
  avatarPresets: ['one.webp', 'two.webp'],
  resizeAvatar: vi.fn(),
}))
beforeEach(() => vi.resetAllMocks())
afterEach(cleanup)
const deferred = () => {
  let resolve!: (value: string) => void
  const promise = new Promise<string>(done => {
    resolve = done
  })
  return { promise, resolve }
}
const text = (_key: string, fallback: string) => fallback
const pickFile = () =>
  fireEvent.change(screen.getByLabelText('Hoặc tự tải ảnh lên'), {
    target: { files: [new File(['image'], 'photo.png', { type: 'image/png' })] },
  })

it('a preset cancels a pending upload instead of letting an old image overwrite it', async () => {
  const pending = deferred()
  vi.mocked(resizeAvatar).mockReturnValue(pending.promise)
  const onChange = vi.fn()
  const onBusyChange = vi.fn()
  render(
    <AvatarPicker
      value=""
      initial="A"
      disabled={false}
      text={text}
      onChange={onChange}
      onBusyChange={onBusyChange}
    />
  )
  pickFile()
  expect(screen.getByRole('status').textContent).toBe('Đang xử lý ảnh…')
  fireEvent.click(screen.getByRole('button', { name: 'Avatar 2' }))
  await act(async () => {
    pending.resolve('old-upload.webp')
  })
  expect(onChange).toHaveBeenCalledOnce()
  expect(onChange).toHaveBeenCalledWith(avatarPresets[1])
  expect(screen.queryByRole('status')).toBeNull()
  expect(onBusyChange).toHaveBeenLastCalledWith(false)
})

it('ignores a decoded file after its form unmounts', async () => {
  const pending = deferred()
  vi.mocked(resizeAvatar).mockReturnValue(pending.promise)
  const onChange = vi.fn()
  const { unmount } = render(
    <AvatarPicker
      value=""
      initial="A"
      disabled={false}
      text={text}
      onChange={onChange}
      onBusyChange={vi.fn()}
    />
  )
  pickFile()
  unmount()
  await act(async () => {
    pending.resolve('abandoned.webp')
  })
  expect(onChange).not.toHaveBeenCalled()
})

it('shows decode errors, releases the save lock, and permits another file', async () => {
  vi.mocked(resizeAvatar)
    .mockRejectedValueOnce(new Error('Invalid image'))
    .mockResolvedValue('valid.webp')
  const onChange = vi.fn()
  const onBusyChange = vi.fn()
  render(
    <AvatarPicker
      value=""
      initial="A"
      disabled={false}
      text={text}
      onChange={onChange}
      onBusyChange={onBusyChange}
    />
  )
  await act(async () => {
    pickFile()
  })
  expect(screen.getByRole('alert').textContent).toBe('Invalid image')
  expect(onBusyChange).toHaveBeenLastCalledWith(false)
  await act(async () => {
    pickFile()
  })
  expect(onChange).toHaveBeenCalledWith('valid.webp')
  expect(screen.queryByRole('alert')).toBeNull()
})

it('cancels decoding when Suspense hides the form and releases the busy state on reveal', async () => {
  const pending = deferred()
  vi.mocked(resizeAvatar).mockReturnValueOnce(pending.promise).mockResolvedValue('new-image.webp')
  const onChange = vi.fn()
  const onBusyChange = vi.fn()
  const gate = new Promise<never>(() => {})
  function Form({ hidden }: { hidden: boolean }) {
    if (hidden) throw gate
    return (
      <AvatarPicker
        value=""
        initial="A"
        disabled={false}
        text={text}
        onChange={onChange}
        onBusyChange={onBusyChange}
      />
    )
  }
  const view = (hidden: boolean) => (
    <Suspense fallback={<p>Hidden form</p>}>
      <Form hidden={hidden} />
    </Suspense>
  )
  const { rerender } = render(view(false))
  pickFile()
  const signal = vi.mocked(resizeAvatar).mock.calls[0][1]
  rerender(view(true))
  expect(signal?.aborted).toBe(true)
  rerender(view(false))
  expect(onBusyChange).toHaveBeenLastCalledWith(false)
  await act(async () => {
    pending.resolve('abandoned.webp')
  })
  expect(onChange).not.toHaveBeenCalled()
  await act(async () => {
    pickFile()
  })
  expect(onChange).toHaveBeenCalledWith('new-image.webp')
})
