import type { ReactNode } from 'react'
import { useAuth } from '../../contexts/AuthContext'

/** Keep protected destinations intact while session verification is unavailable. */
export function AuthSessionBoundary({ children }: { children: ReactNode }) {
  const { user, authError, retryAuth } = useAuth()
  if (!user && authError) {
    return (
      <div
        className="loopy-page min-h-[60vh] flex flex-col items-center justify-center gap-4 px-6 text-center"
        role="alert"
      >
        <p>{authError}</p>
        <button
          type="button"
          onClick={retryAuth}
          className="rounded-button bg-brand-teal px-5 py-3 text-slate-950 font-semibold"
        >
          Thử lại
        </button>
      </div>
    )
  }
  return <>{children}</>
}
