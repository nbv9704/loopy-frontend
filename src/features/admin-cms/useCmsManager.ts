import { useCallback, useState } from 'react'
import { useAsyncResource } from '../../hooks/useAsyncResource'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { useDebouncedValue } from '../../hooks/useDebouncedValue'
import { getAdminErrorMessage } from '../../services/admin/errors'
import { cmsService, CmsDraft, CmsItem } from './cms.service'
import { cmsTransferSchema, CmsTransfer } from './cmsContract'

function download(blob: Blob, language: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `content-${language}.json`
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}
export function useCmsManager() {
  const categories = useAsyncResource(
    'cms-categories',
    useCallback(signal => cmsService.categories(signal), [])
  )
  const [category, setCategory] = useState<string | null>(null)
  const [language, setLanguage] = useState<'vi' | 'en'>('vi')
  const [search, setSearch] = useState('')
  const settledSearch = useDebouncedValue(search)
  const searching = settledSearch !== search
  const [offset, setOffset] = useState(0)
  const selectedCategory = category ?? categories.data?.[0]?.id ?? ''
  const loadItems = useCallback(
    (signal: AbortSignal) =>
      cmsService.list(
        { category: selectedCategory, language, search: settledSearch, offset },
        signal
      ),
    [selectedCategory, language, settledSearch, offset]
  )
  const items = useAsyncResource(
    categories.data?.length && !searching
      ? JSON.stringify([selectedCategory, language, settledSearch, offset])
      : null,
    loadItems
  )
  const action = useAsyncAction()
  const canWrite = !!items.data && !items.loading && !searching && !items.data.readOnly
  const readOnlyMessage =
    'CMS đang ở chế độ chỉ xem. Cần cập nhật cấu trúc dữ liệu trước khi chỉnh sửa hoặc import.'
  const [editor, setEditor] = useState<{ item: CmsItem | null } | null>(null)
  const [editorError, setEditorError] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [transfer, setTransfer] = useState<{ name: string; payload: CmsTransfer } | null>(null)
  const fail = (cause: unknown) =>
    setError(getAdminErrorMessage(cause, 'Không thực hiện được thao tác CMS.'))
  const refresh = () => items.retry()
  const save = (item: CmsItem | null, draft: CmsDraft) => {
    if (!canWrite) {
      setEditorError(readOnlyMessage)
      return
    }
    setEditorError(null)
    void action.run(
      () =>
        item
          ? cmsService.update(item, {
              value: draft.value,
              description: draft.description,
              type: draft.type,
            })
          : cmsService.create(draft),
      {
        onSuccess: saved => {
          setEditor(null)
          setNotice(`Đã lưu ${saved.key}.`)
          refresh()
        },
        onError: cause =>
          setEditorError(
            getAdminErrorMessage(cause, 'Không lưu được nội dung. Bản nháp được giữ lại.')
          ),
      }
    )
  }
  const remove = (item: CmsItem) => {
    if (!canWrite) {
      setError(readOnlyMessage)
      return
    }
    if (action.pending || !window.confirm(`Xóa "${item.key}"? Nội dung này sẽ bị xóa khỏi CMS.`))
      return
    setError(null)
    setNotice(null)
    void action.run(() => cmsService.remove(item), {
      onSuccess: () => {
        setNotice(`Đã xóa ${item.key}.`)
        refresh()
      },
      onError: fail,
    })
  }
  const prepareImport = (file: File) => {
    if (!canWrite) {
      setError(readOnlyMessage)
      return
    }
    setError(null)
    setNotice(null)
    void action.run(
      async () => {
        if (file.size > 5 * 1024 * 1024) throw new Error('File quá lớn. Chọn JSON tối đa5MB.')
        let input: unknown
        try {
          input = JSON.parse(await file.text())
        } catch {
          throw new Error('Không đọc được JSON. Kiểm tra định dạng file.')
        }
        const parsed = cmsTransferSchema.safeParse(input)
        if (!parsed.success)
          throw new Error(
            parsed.error.issues
              .slice(0, 8)
              .map(issue => `${issue.path.join('.')}: ${issue.message}`)
              .join('\n')
          )
        return { name: file.name, payload: parsed.data }
      },
      { onSuccess: setTransfer, onError: fail }
    )
  }
  const importFile = () => {
    if (!canWrite) {
      setError(readOnlyMessage)
      return
    }
    if (!transfer) return
    setError(null)
    void action.run(() => cmsService.import(transfer.payload), {
      onSuccess: result => {
        setTransfer(null)
        setNotice(
          `Đã import ${result.imported} items (${transfer.payload.language.toUpperCase()}).`
        )
        categories.retry()
        refresh()
      },
      onError: fail,
    })
  }
  const exportFile = () => {
    setError(null)
    setNotice(null)
    void action.run(
      async isCurrent => {
        const blob = await cmsService.export(language)
        if (isCurrent()) download(blob, language)
      },
      {
        onSuccess: () => setNotice(`Đã tải file CMS ${language.toUpperCase()}.`),
        onError: fail,
      }
    )
  }
  return {
    canWrite,
    readOnlyMessage,
    categories,
    items: { ...items, loading: items.loading || searching },
    selectedCategory,
    language,
    search,
    offset,
    pending: action.pending,
    setCategory: (value: string) => {
      setCategory(value)
      setOffset(0)
    },
    setLanguage: (value: 'vi' | 'en') => {
      setLanguage(value)
      setOffset(0)
    },
    setSearch: (value: string) => {
      setSearch(value)
      setOffset(0)
    },
    setOffset,
    refresh,
    editor,
    editorError,
    clearEditorError: () => setEditorError(null),
    openEditor: (item: CmsItem | null) => {
      if (canWrite && !action.pending) {
        setEditor({ item })
        setEditorError(null)
        setNotice(null)
      }
    },
    closeEditor: () => {
      if (!action.pending) setEditor(null)
    },
    save,
    remove,
    transfer,
    closeTransfer: () => {
      if (!action.pending) {
        setTransfer(null)
        setError(null)
      }
    },
    error,
    notice,
    prepareImport,
    importFile,
    exportFile,
  }
}
