import { useTranslation } from 'react-i18next'

export default function ResourceLoadError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  const { i18n } = useTranslation()
  return (
    <div role="alert" className="loopy-card rounded-2xl border p-6">
      <p className="font-semibold loopy-heading">{message}</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-xl bg-brand-teal px-5 py-3 font-bold text-slate-950"
      >
        {i18n.language.startsWith('vi') ? 'Thử lại' : 'Try again'}
      </button>
    </div>
  )
}
