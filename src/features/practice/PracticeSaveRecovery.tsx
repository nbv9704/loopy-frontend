export function PracticeSaveRecovery({
  message,
  pending,
  onRetry,
  onBack,
}: {
  message: string
  pending: boolean
  onRetry: () => void
  onBack: () => void
}) {
  return (
    <div role="alert" className="loopy-card rounded-xl border border-amber-500/40 p-5">
      <p>{message}</p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={onRetry}
          className="rounded-lg bg-brand-teal px-4 py-2 font-bold text-slate-950 disabled:opacity-50"
        >
          {pending ? 'Đang tải kết quả…' : 'Tải lại kết quả'}
        </button>
        <button type="button" onClick={onBack} className="rounded-lg border px-4 py-2 font-bold">
          Về danh sách bộ bài
        </button>
      </div>
    </div>
  )
}
