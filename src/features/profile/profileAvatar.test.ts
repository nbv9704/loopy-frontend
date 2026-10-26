// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import { resizeAvatar } from './profileAvatar'

let renderedCanvas: HTMLCanvasElement | undefined
const NativeURL = URL
class ImageFixture {
  static instances: ImageFixture[] = []
  width = 400
  height = 200
  src = ''
  onload: (() => void) | null = null
  onerror: (() => void) | null = null
  constructor() {
    ImageFixture.instances.push(this)
  }
}
const revoke = vi.fn()
const create = vi.fn(() => 'blob:test-image')
const file = () => new File(['image'], 'photo.png', { type: 'image/png' })

beforeEach(() => {
  vi.useFakeTimers()
  ImageFixture.instances = []
  revoke.mockClear()
  create.mockClear()
  vi.stubGlobal('Image', ImageFixture)
  vi.stubGlobal(
    'URL',
    class extends NativeURL {
      static createObjectURL = create
      static revokeObjectURL = revoke
    }
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({ drawImage: vi.fn() } as any)
  vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(function (
    this: HTMLCanvasElement
  ) {
    renderedCanvas = this
    return 'data:image/webp;base64,aW1hZ2U='
  })
})
afterEach(() => {
  vi.restoreAllMocks()
  vi.unstubAllGlobals()
  vi.useRealTimers()
})

it.each(['image/svg+xml', 'image/gif', 'text/plain'])(
  'rejects unsupported %s before starting a decoder',
  async type => {
    await expect(resizeAvatar(new File(['x'], 'file', { type }))).rejects.toThrow(
      'PNG, JPEG hoặc WebP'
    )
    expect(create).not.toHaveBeenCalled()
  }
)
it('rejects empty and oversized files before allocating an image URL', async () => {
  await expect(resizeAvatar(new File([], 'empty.png', { type: 'image/png' }))).rejects.toThrow(
    '5 MB'
  )
  await expect(
    resizeAvatar(
      new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })
    )
  ).rejects.toThrow('5 MB')
  expect(create).not.toHaveBeenCalled()
})
it('resizes proportionally and releases the object URL and timer after success', async () => {
  const result = resizeAvatar(file())
  ImageFixture.instances[0].onload?.()
  await expect(result).resolves.toBe('data:image/webp;base64,aW1hZ2U=')
  expect(revoke).toHaveBeenCalledOnce()
  expect(revoke).toHaveBeenCalledWith('blob:test-image')
  expect(vi.getTimerCount()).toBe(0)
  expect(renderedCanvas?.width).toBe(150)
  expect(renderedCanvas?.height).toBe(75)
})
it('rejects pixel dimensions that exceed the processing budget and frees its source', async () => {
  const result = resizeAvatar(file())
  ImageFixture.instances[0].width = 10000
  ImageFixture.instances[0].height = 10000
  ImageFixture.instances[0].onload?.()
  await expect(result).rejects.toThrow('20 megapixel')
  expect(revoke).toHaveBeenCalledOnce()
})
it('rejects broken files and releases their sources', async () => {
  const result = resizeAvatar(file())
  ImageFixture.instances[0].onerror?.()
  await expect(result).rejects.toThrow('Không đọc được ảnh')
  expect(revoke).toHaveBeenCalledOnce()
})
it('settles a stalled decoder instead of leaving the form permanently busy', async () => {
  const result = expect(resizeAvatar(file())).rejects.toThrow('quá lâu')
  await vi.advanceTimersByTimeAsync(10000)
  await result
  expect(revoke).toHaveBeenCalledOnce()
  expect(ImageFixture.instances[0].onload).toBeNull()
})
it('supports cancellation before and during decoding without retaining timers or URLs', async () => {
  const controller = new AbortController()
  const result = expect(resizeAvatar(file(), controller.signal)).rejects.toMatchObject({
    name: 'AbortError',
  })
  controller.abort()
  await result
  expect(revoke).toHaveBeenCalledOnce()
  expect(vi.getTimerCount()).toBe(0)
  await expect(resizeAvatar(file(), controller.signal)).rejects.toMatchObject({
    name: 'AbortError',
  })
  expect(create).toHaveBeenCalledOnce()
})
