import { useMemo, useState } from 'react'
import { useAsyncAction } from '../../hooks/useAsyncAction'
import { bulkImportService } from './import.service'
import { getAdminErrorMessage } from '../../services/admin/errors'
import { previewImport, type ImportResult } from './importPreview'

export function useBulkImport() {
  const [source, setSource] = useState('')
  const [reviewed, setReviewed] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const preview = useMemo(() => previewImport(source), [source])
  const action = useAsyncAction()

  const edit = (value: string) => {
    if (action.pending) return
    setSource(value)
    setReviewed(false)
    setResult(null)
    setError(null)
  }
  const submit = () => {
    if (!preview.payload || !reviewed || result) return
    setError(null)
    void action.run(() => bulkImportService.bulkImport(preview.payload), {
      onSuccess: setResult,
      onError: cause =>
        setError(getAdminErrorMessage(cause, 'Không import được. Payload được giữ lại.')),
    })
  }
  return {
    source,
    edit,
    preview,
    reviewed,
    setReviewed,
    result,
    error,
    pending: action.pending,
    submit,
  }
}
