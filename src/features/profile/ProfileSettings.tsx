import type { UserProfileSnapshot } from '../auth/profileSnapshot'
import { useCallback, useRef, useState } from 'react'
import { FiRefreshCw, FiSave } from 'react-icons/fi'
import toast from 'react-hot-toast'
import { PressedButton } from '../../components/PublicShell'
import { AvatarPicker } from './AvatarPicker'
import { useProfileEditor } from './useProfileEditor'
import type { ProfileText } from './profile.types'

interface Props {
  userId: string
  email: string
  initial: string
  text: ProfileText
  onSaved: (snapshot?: UserProfileSnapshot) => Promise<void>
}

export function ProfileSettings({ userId, email, initial, text, onSaved }: Props) {
  const editor = useProfileEditor(userId, onSaved)
  const [avatarBusy, setAvatarBusy] = useState(false)
  const avatarBusyRef = useRef(false)
  const onAvatarBusyChange = useCallback((busy: boolean) => {
    avatarBusyRef.current = busy
    setAvatarBusy(busy)
  }, [])
  if (editor.loading)
    return (
      <p role="status" className="loopy-body py-12 text-center">
        {text('profile.loading', 'Đang tải hồ sơ…')}
      </p>
    )
  if (editor.loadError)
    return (
      <div role="alert" className="loopy-card rounded-2xl border p-6">
        <p>{editor.loadError}</p>
        <button
          onClick={editor.retry}
          className="mt-4 rounded-lg bg-brand-teal px-5 py-3 font-bold text-slate-950"
        >
          {text('profile.retry', 'Thử lại')}
        </button>
      </div>
    )

  const save = async () => {
    if (avatarBusyRef.current) return
    if (await editor.save())
      toast.success(text('profile.toast.saved', 'Đã cập nhật thông tin cá nhân.'))
  }
  return (
    <form
      onSubmit={event => {
        event.preventDefault()
        void save()
      }}
      className="grid gap-6"
    >
      <fieldset disabled={editor.saving} className="grid min-w-0 gap-6">
        <AvatarPicker
          value={editor.value.avatarUrl}
          initial={initial}
          disabled={editor.saving}
          text={text}
          onBusyChange={onAvatarBusyChange}
          onChange={avatarUrl => editor.setValue(previous => ({ ...previous, avatarUrl }))}
        />
        <div className="loopy-card grid gap-4 rounded-[2rem] border p-6">
          <h2 className="text-sm font-black loopy-heading">
            {text('profile.settings.account_title', 'Thông tin tài khoản')}
          </h2>
          <div className="loopy-card-soft rounded-xl border p-3 text-sm font-bold loopy-muted">
            {email}
          </div>
          <label className="grid gap-2 text-sm font-bold loopy-body">
            {text('profile.settings.display_name', 'Tên hiển thị')}
            <input
              type="text"
              name="displayName"
              autoComplete="nickname"
              required
              minLength={2}
              maxLength={50}
              value={editor.value.displayName}
              onChange={event =>
                editor.setValue(previous => ({ ...previous, displayName: event.target.value }))
              }
              className="rounded-xl border loopy-border loopy-surface px-4 py-3 outline-none focus:border-brand-teal"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold loopy-body">
            {text('profile.settings.bio', 'Bio')}
            <textarea
              name="bio"
              maxLength={500}
              rows={3}
              value={editor.value.bio}
              onChange={event =>
                editor.setValue(previous => ({ ...previous, bio: event.target.value }))
              }
              className="resize-none rounded-xl border loopy-border loopy-surface px-4 py-3 outline-none focus:border-brand-teal"
            />
          </label>
          <div className="text-right text-xs loopy-muted">{editor.value.bio.length}/500</div>
        </div>
      </fieldset>
      {editor.saveError && (
        <p role="alert" className="text-sm font-bold text-red-500">
          {editor.saveError}
        </p>
      )}
      <div className="loopy-card flex flex-wrap items-center justify-between gap-4 rounded-[2rem] border p-6">
        <p className="text-sm loopy-body">
          {text('profile.settings.save_basic_desc', 'Lưu tên, bio và ảnh đại diện của bạn.')}
        </p>
        <button
          type="submit"
          disabled={editor.saving || avatarBusy}
          className="inline-flex items-center gap-2 rounded-xl bg-brand-teal px-6 py-3 text-sm font-black text-slate-950 disabled:opacity-60"
        >
          <FiSave />{' '}
          {editor.saving
            ? text('profile.settings.saving', 'Đang lưu…')
            : text('profile.settings.save_button', 'Lưu thay đổi')}
        </button>
      </div>
      <div className="loopy-card-soft rounded-[2rem] border p-6">
        <h2 className="font-black loopy-heading">
          {text('profile.settings.learning_path_title', 'Lộ trình học')}
        </h2>
        <p className="my-4 text-sm loopy-body">
          {text(
            'profile.settings.path_help',
            'Đổi ngôn ngữ và mục tiêu qua onboarding để chọn đúng lộ trình học.'
          )}
        </p>
        <PressedButton to="/onboarding" variant="secondary">
          <FiRefreshCw /> {text('profile.settings.onboarding_button', 'Cập nhật lộ trình')}
        </PressedButton>
      </div>
    </form>
  )
}
