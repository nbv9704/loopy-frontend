import AdminButton from '../../components/admin/AdminButton'
import { Save } from 'lucide-react'
import { useState } from 'react'
import ModalDialog from '../../components/admin/ModalDialog'
import { keywordDraft, KeywordDraft } from './moderation.service'

const initial: KeywordDraft = { keyword: '', category: 'general', language: 'all' }
export default function KeywordDialog({
  pending,
  error,
  onClose,
  onSave,
}: {
  pending: boolean
  error: string | null
  onClose: () => void
  onSave: (draft: KeywordDraft) => void
}) {
  const [draft, setDraft] = useState(initial)
  const [validation, setValidation] = useState<string | null>(null)
  const close = () => {
    if (pending) return
    if (
      JSON.stringify(draft) !== JSON.stringify(initial) &&
      !window.confirm('Bỏ bản nháp từ khóa?')
    )
      return
    onClose()
  }
  return (
    <ModalDialog
      open
      label="Thêm từ khóa"
      onClose={close}
      dismissible={!pending}
      className="w-[calc(100%-2rem)] max-w-lg rounded-xl p-0 backdrop:bg-black/50"
    >
      <form
        className="space-y-4 p-6"
        onSubmit={event => {
          event.preventDefault()
          const parsed = keywordDraft.safeParse(draft)
          if (!parsed.success) {
            setValidation(parsed.error.issues[0].message)
            return
          }
          setValidation(null)
          onSave(parsed.data)
        }}
      >
        <h2 className="text-xl font-bold">Thêm từ khóa</h2>
        {(validation || error) && (
          <p role="alert" className="text-red-700">
            {validation || error}
          </p>
        )}
        <fieldset disabled={pending} className="space-y-4 disabled:opacity-60">
          <label className="block">
            Từ khóa
            <input
              autoFocus
              required
              maxLength={120}
              value={draft.keyword}
              onChange={e => setDraft({ ...draft, keyword: e.target.value })}
              className="mt-1 block w-full rounded-lg border p-2"
            />
          </label>
          <label className="block">
            Nhóm
            <select
              value={draft.category}
              onChange={e =>
                setDraft({ ...draft, category: e.target.value as KeywordDraft['category'] })
              }
              className="mt-1 block w-full rounded-lg border p-2"
            >
              <option value="general">Chung</option>
              <option value="profanity">Tục tĩu</option>
              <option value="hate_speech">Thù ghét</option>
              <option value="spam">Spam</option>
            </select>
          </label>
          <label className="block">
            Ngôn ngữ ghi chú
            <select
              value={draft.language}
              onChange={e =>
                setDraft({ ...draft, language: e.target.value as KeywordDraft['language'] })
              }
              className="mt-1 block w-full rounded-lg border p-2"
            >
              <option value="all">Tất cả</option>
              <option value="vi">Tiếng Việt</option>
              <option value="en">Tiếng Anh</option>
            </select>
          </label>
          <p className="text-sm text-slate-600">
            Ngôn ngữ là metadata; bộ lọc hiện kiểm tra mọi từ khóa đang bật.
          </p>
        </fieldset>
        <div className="flex justify-end gap-3">
          <AdminButton type="button" disabled={pending} onClick={close}>
            Hủy
          </AdminButton>
          <AdminButton variant="primary" type="submit" disabled={pending || !draft.keyword.trim()}>
            <Save size={16} aria-hidden="true" />
            {pending ? 'Đang lưu...' : 'Lưu từ khóa'}
          </AdminButton>
        </div>
      </form>
    </ModalDialog>
  )
}
