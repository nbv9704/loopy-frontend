import AdminButton from './AdminButton'
export default function ResourceError({ error, retry }: { error: string; retry: () => void }) {
  return (
    <div
      role="alert"
      className="min-w-0 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 [overflow-wrap:anywhere]"
    >
      <p>{error}</p>
      <AdminButton className="mt-2" onClick={retry}>
        Thử lại
      </AdminButton>
    </div>
  )
}
