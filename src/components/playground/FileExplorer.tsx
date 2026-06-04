import { Plus, X, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface CodeFile {
  id: string
  name: string
  language: string
  code: string
}

interface FileExplorerProps {
  files: CodeFile[]
  activeFileId: string
  maxFiles: number
  onFileSelect: (id: string) => void
  onFileDelete: (id: string) => void
  onNewFile: () => void
  onClearAll: () => void
  getLanguageConfig: (language: string) => { icon: string; color: string }
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  files,
  activeFileId,
  maxFiles,
  onFileSelect,
  onFileDelete,
  onNewFile,
  onClearAll,
  getLanguageConfig,
}) => {
  const { t } = useTranslation()

  return (
    <aside className="w-full lg:w-80 flex flex-col bg-white/3 border border-brand-teal/10 rounded-card overflow-hidden h-full">
      <div className="bg-slate-950/50 border-b border-brand-teal/20 p-4 flex-shrink-0">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-gradient-to-b from-brand-teal to-brand-cyan rounded"></div>
            <div>
              <h2 className="text-white text-sm font-semibold">{t('playground.fileList')}</h2>
              <p className="text-slate-500 text-xs">
                {t('playground.filesCount', { count: files.length, max: maxFiles })}
              </p>
            </div>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {files.map(file => {
          const langConfig = getLanguageConfig(file.language)

          // Map colors to proper Tailwind classes
          const colorClasses: Record<string, { border: string; bg: string; text: string }> = {
            yellow: {
              border: 'border-yellow-400/50',
              bg: 'bg-yellow-400/5',
              text: 'text-yellow-400',
            },
            cyan: { border: 'border-cyan-400/50', bg: 'bg-cyan-400/5', text: 'text-cyan-400' },
            blue: { border: 'border-blue-400/50', bg: 'bg-blue-400/5', text: 'text-blue-400' },
            fuchsia: {
              border: 'border-fuchsia-400/50',
              bg: 'bg-fuchsia-400/5',
              text: 'text-fuchsia-400',
            },
            purple: {
              border: 'border-purple-400/50',
              bg: 'bg-purple-400/5',
              text: 'text-purple-400',
            },
            orange: {
              border: 'border-orange-400/50',
              bg: 'bg-orange-400/5',
              text: 'text-orange-400',
            },
            green: { border: 'border-green-400/50', bg: 'bg-green-400/5', text: 'text-green-400' },
            slate: { border: 'border-slate-400/50', bg: 'bg-slate-400/5', text: 'text-slate-400' },
            indigo: {
              border: 'border-indigo-400/50',
              bg: 'bg-indigo-400/5',
              text: 'text-indigo-400',
            },
            red: { border: 'border-red-400/50', bg: 'bg-red-400/5', text: 'text-red-400' },
          }

          const colors = colorClasses[langConfig.color] || colorClasses.cyan

          return (
            <div
              key={file.id}
              className={`flex items-center gap-2 px-3 py-3 rounded transition-all border ${
                activeFileId === file.id
                  ? 'bg-brand-teal/10 border-brand-teal/30'
                  : 'border-transparent hover:bg-white/5 hover:border-white/10'
              }`}
            >
              <button
                onClick={() => onFileSelect(file.id)}
                className="flex-1 flex items-center gap-2 text-left cursor-pointer"
              >
                <div
                  className={`w-8 h-6 border rounded flex items-center justify-center ${colors.border} ${colors.bg}`}
                >
                  <span className={`text-[7px] font-bold font-mono ${colors.text}`}>
                    {langConfig.icon}
                  </span>
                </div>
                <span
                  className={`text-sm font-mono ${
                    activeFileId === file.id ? 'text-white' : 'text-slate-400'
                  }`}
                >
                  {file.name}
                </span>
              </button>
              {files.length > 1 && (
                <button
                  onClick={() => onFileDelete(file.id)}
                  className="text-slate-500 hover:text-red-400 transition-colors p-1 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          )
        })}
      </nav>

      <div className="border-t border-brand-teal/20 p-3 flex-shrink-0 space-y-2">
        <button
          onClick={onNewFile}
          disabled={files.length >= maxFiles}
          className={`w-full rounded-button px-4 py-3 bg-brand-teal/20 border border-brand-teal/50 text-brand-teal text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
            files.length >= maxFiles
              ? 'opacity-50 cursor-not-allowed'
              : 'cursor-pointer hover:bg-brand-teal/30 hover:border-brand-teal'
          }`}
        >
          <Plus className="w-4 h-4" />
          {t('playground.newFile')}
        </button>

        <button
          onClick={onClearAll}
          className="w-full rounded-button px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer hover:bg-red-500/20 hover:border-red-400"
        >
          <Trash2 className="w-3 h-3" />
          {t('playground.deleteAll')}
        </button>
      </div>
    </aside>
  )
}

export default FileExplorer
