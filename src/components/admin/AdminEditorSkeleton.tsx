export default function AdminEditorSkeleton() {
  return (
    <div role="status" aria-label="Đang tải editor" className="min-w-0 space-y-6">
      <div aria-hidden="true" className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0 flex-1 basis-64 space-y-3">
          <div className="h-7 w-full max-w-52 animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-full max-w-xl animate-pulse rounded bg-slate-100" />
        </div>
        <div className="h-10 w-32 animate-pulse rounded-lg bg-slate-100" />
      </div>
      <div
        aria-hidden="true"
        className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,340px)]"
      >
        <div className="min-w-0 space-y-5">
          {[0, 1].map(index => (
            <div key={index} className="rounded-2xl border border-slate-200 bg-white p-5">
              <div className="mb-5 h-6 w-full max-w-44 animate-pulse rounded bg-slate-100" />
              <div className="h-40 animate-pulse rounded-lg bg-slate-100" />
            </div>
          ))}
        </div>
        <div className="min-w-0 space-y-3 rounded-2xl border border-slate-200 bg-white p-5">
          {[0, 1, 2, 3, 4].map(index => (
            <div key={index} className="h-10 animate-pulse rounded-lg bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  )
}
