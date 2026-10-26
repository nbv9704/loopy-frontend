import AdminButton from '../../components/admin/AdminButton'
import { Save } from 'lucide-react'
import { useCallback, useState } from 'react'
import ModalDialog from '../../components/admin/ModalDialog'
import { useAsyncResource } from '../../hooks/useAsyncResource'
import { createCmsItem } from './cmsContract'
import { cmsService, CmsCategory, CmsDraft, CmsItem } from './cms.service'

function draftFor(item: CmsItem | null, category: string, language: 'vi' | 'en'): CmsDraft {
  return {
    categoryId: item?.categoryId ?? category,
    key: item?.key ?? '',
    language: item?.language ?? language,
    value: item?.value ?? '',
    description: item?.description ?? '',
    type: item?.type ?? 'text',
  }
}
export default function CmsEditorDialog({
  item,
  categories,
  category,
  language,
  pending,
  error,
  onSave,
  onClose,
  clearError,
}: {
  item: CmsItem | null
  categories: CmsCategory[]
  category: string
  language: 'vi' | 'en'
  pending: boolean
  error: string | null
  onSave: (item: CmsItem | null, draft: CmsDraft) => void
  onClose: () => void
  clearError: () => void
}) {
  const [working, setWorking] = useState(item)
  const [draft, setDraft] = useState(() => draftFor(item, category, language))
  const [validation, setValidation] = useState<string | null>(null)
  const [compare, setCompare] = useState(false)
  const load = useCallback((signal: AbortSignal) => cmsService.get(item!.id, signal), [item])
  const latest = useAsyncResource(compare && item ? item.id : null, load)
  const close = () => {
    if (pending) return
    if (
      JSON.stringify(draft) !== JSON.stringify(draftFor(working, category, language)) &&
      !window.confirm('Bỏ các thay đổi chưa lưu?')
    )
      return
    onClose()
  }
  return (
    <ModalDialog
      open
      label={item ? 'Sửa Content Item' : 'Tạo Content Item Mới'}
      onClose={close}
      dismissible={!pending}
      className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-2xl overflow-y-auto rounded-xl border-0 bg-white p-5 text-slate-900 shadow-xl backdrop:bg-slate-950/40"
    >
      <form
        className="space-y-4"
        onSubmit={event => {
          event.preventDefault()
          const parsed = createCmsItem.safeParse(draft)
          if (!parsed.success) {
            setValidation(
              parsed.error.issues
                .map(issue => `${issue.path.join('.')}: ${issue.message}`)
                .join('\n')
            )
            return
          }
          setValidation(null)
          onSave(working, parsed.data)
        }}
      >
        <h2 className="text-xl font-black">{item ? 'Sửa Content Item' : 'Tạo Content Item Mới'}</h2>
        {error && (
          <p role="alert" className="whitespace-pre-line rounded-lg bg-red-50 p-3 text-red-800">
            {error}
          </p>
        )}
        {validation && (
          <p role="alert" className="whitespace-pre-line text-red-800">
            {validation}
          </p>
        )}
        <fieldset disabled={pending} className="space-y-4">
          <label className="block">
            Category
            <select
              aria-label="Category của item"
              disabled={!!item}
              value={draft.categoryId}
              onChange={event => setDraft({ ...draft, categoryId: event.target.value })}
              className="mt-1 w-full rounded border p-2"
            >
              {categories.map(entry => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block">
            Key
            <input
              aria-label="Key"
              disabled={!!item}
              value={draft.key}
              maxLength={255}
              onChange={event => setDraft({ ...draft, key: event.target.value })}
              className="mt-1 w-full rounded border p-2"
            />
          </label>
          <label className="block">
            Language
            <select
              aria-label="Language của item"
              disabled={!!item}
              value={draft.language}
              onChange={event =>
                setDraft({ ...draft, language: event.target.value as 'vi' | 'en' })
              }
              className="mt-1 w-full rounded border p-2"
            >
              <option value="vi">Tiếng Việt</option>
              <option value="en">English</option>
            </select>
          </label>
          <label className="block">
            Type
            <select
              aria-label="Type"
              value={draft.type}
              onChange={event =>
                setDraft({ ...draft, type: event.target.value as CmsDraft['type'] })
              }
              className="mt-1 w-full rounded border p-2"
            >
              <option value="text">Plain Text</option>
              <option value="markdown">Markdown</option>
              <option value="html">HTML</option>
            </select>
          </label>
          <label className="block">
            Value ({draft.value.length}/5000)
            <textarea
              aria-label="Value"
              rows={6}
              maxLength={5000}
              value={draft.value}
              onChange={event => setDraft({ ...draft, value: event.target.value })}
              className="mt-1 w-full rounded border p-2"
            />
          </label>
          <label className="block">
            Description
            <textarea
              aria-label="Description"
              maxLength={2000}
              rows={2}
              value={draft.description}
              onChange={event => setDraft({ ...draft, description: event.target.value })}
              className="mt-1 w-full rounded border p-2"
            />
          </label>
        </fieldset>
        {item && error && (
          <AdminButton
            type="button"
            disabled={pending || latest.loading}
            onClick={() => {
              setCompare(true)
              latest.retry()
            }}
          >
            Tải bản mới để so sánh
          </AdminButton>
        )}
        {compare && (
          <section
            className="space-y-2 rounded border bg-slate-50 p-3"
            aria-label="So sánh bản hiện tại"
          >
            {latest.loading ? (
              <p>Đang tải bản hiện tại...</p>
            ) : latest.error ? (
              <p role="alert">{latest.error}</p>
            ) : (
              latest.data && (
                <>
                  <p>
                    Phiên bản hiện tại: {latest.data.revision}. Bản nháp phía trên chưa bị thay thế.
                  </p>
                  <textarea
                    aria-label="Nội dung đang lưu trên server"
                    readOnly
                    value={latest.data.value}
                    rows={4}
                    className="w-full rounded border p-2"
                  />
                  <AdminButton
                    type="button"
                    disabled={pending}
                    onClick={() => {
                      setWorking(latest.data!)
                      setDraft(draftFor(latest.data, category, language))
                      setCompare(false)
                      clearError()
                    }}
                  >
                    Dùng bản mới thay bản nháp
                  </AdminButton>
                </>
              )
            )}
          </section>
        )}
        <div className="flex justify-end gap-3">
          <AdminButton type="button" disabled={pending} onClick={close}>
            Hủy
          </AdminButton>
          <AdminButton variant="primary" type="submit" disabled={pending}>
            <Save size={16} aria-hidden="true" />
            {pending ? 'Đang lưu...' : 'Lưu'}
          </AdminButton>
        </div>
      </form>
    </ModalDialog>
  )
}
