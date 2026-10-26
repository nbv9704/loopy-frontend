import { useLayoutEffect, useRef, useState } from 'react'
import { avatarPresets, resizeAvatar } from './profileAvatar'
import type { ProfileText } from './profile.types'

interface Props {
  value: string
  initial: string
  disabled: boolean
  onChange: (value: string) => void
  onBusyChange: (busy: boolean) => void
  text: ProfileText
}

export function AvatarPicker({ value, initial, disabled, onChange, onBusyChange, text }: Props) {
  const busyCallback = useRef(onBusyChange)
  busyCallback.current = onBusyChange
  const revision = useRef(0)
  const uploadController = useRef<AbortController | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)
  useLayoutEffect(() => {
    setProcessing(false)
    busyCallback.current(false)
    return () => {
      ++revision.current
      uploadController.current?.abort()
      uploadController.current = null
    }
  }, [])
  const choose = (avatar: string) => {
    if (disabled) return
    uploadController.current?.abort()
    ++revision.current
    onBusyChange(false)
    setProcessing(false)
    setError(null)
    onChange(avatar)
  }
  const upload = async (file?: File) => {
    if (!file || disabled) return
    const token = ++revision.current
    uploadController.current?.abort()
    const controller = new AbortController()
    uploadController.current = controller
    setError(null)
    setProcessing(true)
    onBusyChange(true)
    try {
      const avatar = await resizeAvatar(file, controller.signal)
      if (revision.current === token) onChange(avatar)
    } catch (failure) {
      if (revision.current === token)
        setError(failure instanceof Error ? failure.message : 'Không đọc được ảnh.')
    } finally {
      if (revision.current === token) {
        uploadController.current = null
        setProcessing(false)
        onBusyChange(false)
      }
    }
  }
  return (
    <div className="loopy-card rounded-[2rem] border p-6 shadow-sm">
      <h2 className="mb-4 text-sm font-black loopy-heading">
        {text('profile.settings.avatar_title', 'Ảnh đại diện')}
      </h2>
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="loopy-surface flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-3xl border-2 loopy-border">
          {value ? (
            <img src={value} alt="Avatar" className="h-full w-full object-cover" />
          ) : (
            <span className="text-4xl font-black text-brand-teal">{initial}</span>
          )}
        </div>
        <div className="grid flex-1 gap-4">
          <p className="text-xs font-black loopy-muted">
            {text('profile.settings.choose_preset', 'Chọn ảnh có sẵn')}
          </p>
          <div className="flex flex-wrap gap-3">
            {avatarPresets.map((preset, index) => (
              <button
                key={preset}
                type="button"
                disabled={disabled}
                aria-label={`Avatar ${index + 1}`}
                aria-pressed={value === preset}
                onClick={() => choose(preset)}
                className={`h-12 w-12 overflow-hidden rounded-xl border-2 ${value === preset ? 'border-brand-teal' : 'loopy-border'}`}
              >
                <img src={preset} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
            {value && (
              <button
                type="button"
                disabled={disabled}
                onClick={() => choose('')}
                className="text-sm font-bold text-rose-500"
              >
                {text('profile.settings.remove_avatar', 'Xóa ảnh')}
              </button>
            )}
          </div>
          <label className="grid gap-2 text-sm font-bold loopy-body">
            {text('profile.settings.upload_label', 'Hoặc tự tải ảnh lên')}
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              disabled={disabled}
              onChange={event => {
                const file = event.target.files?.[0]
                event.target.value = ''
                void upload(file)
              }}
            />
          </label>
          <p className="text-xs loopy-muted">
            {text('profile.settings.upload_help', 'Ảnh sẽ được thu nhỏ để tiết kiệm dữ liệu.')}
          </p>
          {processing && (
            <p role="status" className="text-sm loopy-body">
              {text('profile.settings.processing_avatar', 'Đang xử lý ảnh…')}
            </p>
          )}
          {error && (
            <p role="alert" className="text-sm text-red-500">
              {error}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
