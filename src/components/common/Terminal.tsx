import { useTranslation } from 'react-i18next'

interface TerminalProps {
  logs: string[]
  onClear: () => void
  isActive?: boolean
}

const Terminal: React.FC<TerminalProps> = ({ logs, onClear, isActive = true }) => {
  const { t } = useTranslation()
  return (
    <div
      className={`h-40 flex flex-col bg-black border border-brand-teal/20 rounded-card overflow-hidden flex-shrink-0 ${!isActive ? 'opacity-50' : ''}`}
    >
      {/* Terminal Header */}
      <div className="bg-slate-950/50 px-4 py-2 flex justify-between items-center border-b border-brand-teal/20">
        <div className="flex items-center gap-2">
          <span className="text-brand-teal font-mono text-xs font-semibold">Terminal</span>
        </div>
        <button
          onClick={onClear}
          disabled={!isActive}
          className={`text-slate-500 transition-colors text-xs font-medium ${
            isActive ? 'hover:text-red-400 cursor-pointer' : 'cursor-not-allowed opacity-50'
          }`}
        >
          {t('common.clear')}
        </button>
      </div>

      {/* Terminal Content */}
      <div className="flex-1 p-4 overflow-y-auto font-mono text-sm leading-relaxed bg-black">
        {logs.length === 0 ? (
          <div className="text-slate-600 text-xs flex items-center gap-2">
            <span className="animate-pulse">▮</span>
            <span>{isActive ? t('learn.readyToRun') : t('common.noLessons')}</span>
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} className="mb-2 flex items-start gap-2 text-xs">
              <span className="text-brand-teal select-none flex-shrink-0">{'>'}</span>
              <span
                className={`whitespace-pre-wrap break-all ${
                  log.startsWith('❌') ? 'text-red-400' : 'text-brand-teal'
                }`}
              >
                {log}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  )
}

export default Terminal
