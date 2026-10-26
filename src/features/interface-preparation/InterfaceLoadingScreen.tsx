import type { Ref } from 'react'
import { useTranslation } from 'react-i18next'
import type { InterfaceLanguage } from '../../i18n/language'
import { LoadingScreen } from '../../components/LoadingScreen'

interface Props {
  language: InterfaceLanguage
  error?: boolean
  screenRef?: Ref<HTMLDivElement>
  onRetry?: () => void
}

/** Shared visual for session startup, interface preparation and language transitions. */
export default function InterfaceLoadingScreen({
  language,
  error = false,
  screenRef,
  onRetry,
}: Props) {
  const { t } = useTranslation()
  const text = (key: string) => t(`interfacePreparation.${key}`, { lng: language })
  return (
    <div
      ref={screenRef}
      tabIndex={-1}
      role={error ? 'alert' : 'status'}
      aria-live="polite"
      data-testid="interface-preparation"
      className={`loopy-page fixed inset-0 z-[100000] outline-none ${
        error ? 'flex min-h-screen flex-col items-center justify-center gap-5 px-6 text-center' : ''
      }`}
    >
      {!error ? (
        <LoadingScreen message={text('title')} />
      ) : (
        <>
          <span className="text-3xl font-bold tracking-tight text-brand-teal">Loopy</span>
          <h1 className="text-xl font-semibold">{text('error')}</h1>
          <p className="loopy-muted max-w-md text-sm">{text('errorDescription')}</p>
          <div className="flex flex-wrap justify-center gap-3">
            <button
              type="button"
              onClick={onRetry}
              className="rounded-xl bg-brand-teal px-5 py-3 font-semibold text-slate-950"
            >
              {text('retry')}
            </button>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="rounded-xl border loopy-border px-5 py-3"
            >
              {text('reload')}
            </button>
          </div>
        </>
      )}
    </div>
  )
}
