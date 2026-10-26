export const avatarPresets = [
  '/images/avatar/croc.webp',
  '/images/avatar/fox.webp',
  '/images/avatar/penguin.webp',
  '/images/avatar/tiger.webp',
]

export function normalizeAvatarUrl(value?: string | null): string {
  if (!value) return ''
  return value.includes('dicebear.com') || value.includes('bottts') ? avatarPresets[0] : value
}

const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_PIXELS = 20_000_000
const IMAGE_TIMEOUT_MS = 10_000
const supportedTypes = new Set(['image/png', 'image/jpeg', 'image/webp'])

/** Bounded, cancellable decoding; source URLs are always released after settling. */
export function resizeAvatar(file: File, signal?: AbortSignal): Promise<string> {
  if (signal?.aborted) return Promise.reject(new DOMException('Aborted', 'AbortError'))
  if (!supportedTypes.has(file.type))
    return Promise.reject(new Error('Chỉ hỗ trợ ảnh PNG, JPEG hoặc WebP.'))
  if (!file.size || file.size > MAX_FILE_SIZE)
    return Promise.reject(new Error('Ảnh phải có dung lượng từ 1 byte đến 5 MB.'))
  return new Promise((resolve, reject) => {
    let source: string | undefined
    const image = new Image()
    let settled = false
    const finish = (error?: Error, value?: string) => {
      if (settled) return
      settled = true
      clearTimeout(timer)
      signal?.removeEventListener('abort', abort)
      image.onload = null
      image.onerror = null
      if (source) URL.revokeObjectURL(source)
      if (error) {
        image.src = ''
        reject(error)
      } else resolve(value!)
    }
    const abort = () => finish(new DOMException('Aborted', 'AbortError'))
    const invalidImage = () => finish(new Error('Không đọc được ảnh. Vui lòng chọn ảnh khác.'))
    const timer = setTimeout(
      () => finish(new Error('Xử lý ảnh quá lâu. Vui lòng chọn ảnh khác hoặc thử lại.')),
      IMAGE_TIMEOUT_MS
    )
    signal?.addEventListener('abort', abort, { once: true })
    image.onerror = invalidImage
    image.onload = () => {
      try {
        if (!image.width || !image.height || image.width * image.height > MAX_PIXELS)
          return finish(
            new Error('Ảnh có kích thước không hợp lệ hoặc quá lớn (tối đa 20 megapixel).')
          )
        const scale = Math.min(1, 150 / Math.max(image.width, image.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.width * scale))
        canvas.height = Math.max(1, Math.round(image.height * scale))
        const context = canvas.getContext('2d')
        if (!context) return invalidImage()
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        const result = canvas.toDataURL('image/webp', 0.8)
        if (!/^data:image\/(?:webp|png|jpeg);base64,/.test(result) || result.length > 200 * 1024)
          return invalidImage()
        finish(undefined, result)
      } catch {
        invalidImage()
      }
    }
    try {
      source = URL.createObjectURL(file)
      image.src = source
    } catch {
      invalidImage()
    }
  })
}
