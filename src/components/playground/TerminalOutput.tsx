import { useTranslation } from 'react-i18next'

interface TerminalOutputProps {
  logs: string[]
  onClear: () => void
}

const TerminalOutput: React.FC<TerminalOutputProps> = ({ logs, onClear }) => {
  const { t } = useTranslation()

  return (
    <div className="h-48 flex flex-col bg-black border border-brand-teal/20 rounded-card overflow-hidden flex-shrink-0">
      <div className="bg-slate-950/50 px-4 py-2 flex justify-between items-center border-b border-brand-teal/20">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-brand-teal font-mono text-xs font-semibold">
            {t('playground.terminal')}
          </span>
        </div>
        <button
          onClick={onClear}
          className="text-slate-500 hover:text-red-400 transition-colors text-xs font-medium cursor-pointer"
        >
          {t('common.clear')}
        </button>
      </div>

      <div className="flex-1 p-4 overflow-y-auto font-mono text-sm leading-relaxed bg-black">
        {logs.length === 0 ? (
          <div className="text-slate-600 text-xs flex items-center gap-2">
            <span className="animate-pulse">▮</span>
            <span>{t('playground.readyToRun')}</span>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-2 flex items-start gap-2 text-xs">
              <span className="text-brand-teal select-none flex-shrink-0">{'>'}</span>
              <span className="text-brand-teal whitespace-pre-wrap break-all">{log}</span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default TerminalOutput
