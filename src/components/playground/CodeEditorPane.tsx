import { useState, useEffect } from 'react'
import CodeMirror from '@uiw/react-codemirror'
import { oneDark } from '@codemirror/theme-one-dark'
import { Play } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface CodeFile {
  id: string
  name: string
  language: string
  code: string
}

interface CodeEditorPaneProps {
  activeFile: CodeFile
  onCodeChange: (code: string) => void
  onRunCode: () => void
  getLanguageExtension: (language: string) => any
}

const CodeEditorPane: React.FC<CodeEditorPaneProps> = ({
  activeFile,
  onCodeChange,
  onRunCode,
  getLanguageExtension,
}) => {
  const { t } = useTranslation()
  const [fontSize, setFontSize] = useState(14)

  useEffect(() => {
    const savedFontSize = localStorage.getItem('editor_font_size')

    if (savedFontSize) setFontSize(parseInt(savedFontSize))

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'editor_font_size' && e.newValue) {
        setFontSize(parseInt(e.newValue))
      }
    }

    const handleFontSizeChange = () => {
      const savedFontSize = localStorage.getItem('editor_font_size')
      if (savedFontSize) setFontSize(parseInt(savedFontSize))
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('fontSizeChanged', handleFontSizeChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('fontSizeChanged', handleFontSizeChange)
    }
  }, [])
  return (
    <div className="flex-1 flex flex-col bg-white/3 border border-brand-teal/10 rounded-card overflow-hidden min-h-0">
      <div className="bg-slate-950/50 px-4 py-2 flex items-center justify-between border-b border-brand-teal/20 flex-shrink-0">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-slate-900/50 border border-white/10 rounded">
            <div className="w-2 h-2 bg-brand-teal rounded-full animate-pulse"></div>
            <span className="text-slate-400 font-mono text-xs">{activeFile.name}</span>
          </div>
        </div>
        <button
          onClick={onRunCode}
          className="rounded-button px-6 py-2 bg-brand-teal/20 border border-brand-teal/50 text-brand-teal text-sm font-semibold cursor-pointer hover:bg-brand-teal/30 hover:border-brand-teal transition-all flex items-center gap-2"
        >
          <Play className="w-4 h-4" />
          {t('playground.runCode')}
        </button>
      </div>

      <div className="flex-1 relative min-h-0 overflow-hidden">
        <CodeMirror
          value={activeFile.code}
          height="100%"
          theme={oneDark}
          extensions={[getLanguageExtension(activeFile.language)]}
          onChange={onCodeChange}
          className="h-full text-sm"
          style={{
            fontSize: `${fontSize}px`,
            fontFamily: '"JetBrains Mono", "Fira Code", Consolas, monospace',
          }}
        />
      </div>
    </div>
  )
}

export default CodeEditorPane
