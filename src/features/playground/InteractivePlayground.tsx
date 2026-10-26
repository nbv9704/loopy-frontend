import { useEditorFontSize } from '../preferences/editorFontSize'
import { FiCode, FiPlay, FiTerminal } from 'react-icons/fi'
import { useAuth } from '../../contexts/AuthContext'
import { playgrounds, type PlaygroundLanguage } from './playgroundLanguages'
import { usePlaygroundRunner } from './usePlaygroundRunner'

export function InteractivePlayground({ language }: { language: PlaygroundLanguage }) {
  const { user } = useAuth()
  const fontSize = useEditorFontSize()
  const item = playgrounds[language]
  const runner = usePlaygroundRunner(language, item.code, user?.id || 'guest')
  const runError = runner.error || runner.result?.error
  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 text-white shadow-2xl shadow-black/30">
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 font-mono text-sm text-slate-400">
          <FiCode /> {item.file}
        </div>
        <button
          onClick={() => void runner.run()}
          disabled={runner.pending || !runner.capability?.supported || !runner.code.trim()}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-sm font-black text-slate-950 shadow-[0_3px_0_#0b889c] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiPlay /> {runner.pending ? 'Đang chạy...' : 'Chạy thử'}
        </button>
      </div>
      <div className="grid min-h-[520px] min-w-0 grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,360px)]">
        <div className="min-w-0 bg-[#020617] p-5">
          <textarea
            value={runner.code}
            onChange={event => runner.setCode(event.target.value)}
            readOnly={runner.pending}
            spellCheck={false}
            style={{ fontSize }}
            className="min-h-[390px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-sm leading-7 text-slate-100 outline-none transition focus:border-brand-teal/60 focus:ring-2 focus:ring-brand-teal/20"
            aria-label={`Code editor ${item.label}`}
          />
          <p className="mt-4 rounded-2xl border border-brand-teal/20 bg-brand-teal/10 p-4 text-sm leading-6 text-brand-teal">
            Playground chỉ chạy code và trả output. Nó không kiểm tra lesson, không lưu progress.
          </p>
        </div>
        <div className="grid min-w-0 border-t border-white/10 lg:border-l lg:border-t-0">
          <div className="min-w-0 border-b border-white/10 p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-teal">
              <FiTerminal /> Runner
            </div>
            {runner.resource.loading && (
              <p role="status" className="text-sm text-slate-300">
                Đang kiểm tra cấu hình runner...
              </p>
            )}
            {runner.resource.error && (
              <div role="alert" className="text-sm text-red-300">
                <p>{runner.resource.error}</p>
                <button className="mt-2 underline" onClick={runner.resource.retry}>
                  Thử lại trạng thái runner
                </button>
              </div>
            )}
            {runner.capability && (
              <p className="text-sm leading-6 text-slate-300">
                {!runner.capability.supported
                  ? runner.capability.reason
                  : runner.capability.runner === 'local'
                    ? 'JavaScript có thể chạy trên runner Loopy.'
                    : 'Runner đã được cấu hình. Kết nối được xác nhận khi chạy code.'}
              </p>
            )}
          </div>
          <div className="min-w-0 p-5">
            <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-brand-teal">
              Output
            </div>
            {runner.pending && <p role="status">Đang chạy code...</p>}
            {runError && (
              <p role="alert" className="mb-3 whitespace-pre-wrap break-words text-sm text-red-300">
                {runError}
              </p>
            )}
            <div
              role="log"
              aria-label="Playground output"
              className="max-h-96 min-h-52 min-w-0 overflow-auto whitespace-pre-wrap break-all rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-sm text-slate-300"
            >
              {runner.result?.output ||
                (runner.result && !runError ? 'Chạy xong, không có output.' : '')}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
