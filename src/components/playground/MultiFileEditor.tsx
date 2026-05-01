import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import FileExplorer from './FileExplorer'
import CodeEditorPane from './CodeEditorPane'
import TerminalOutput from './TerminalOutput'
import NewFileModal from './NewFileModal'
import { detectLanguage, getLanguageConfig, getLanguageExtension } from '../../utils/languageConfig'
import { executeCode, formatError } from '../../utils/codeExecution'
import {
  CodeFile,
  loadFiles,
  saveFiles,
  loadActiveFileId,
  saveActiveFileId,
  clearStorage,
} from '../../utils/playgroundStorage'

const PlaygroundMultiFileUI: React.FC = () => {
  const { t } = useTranslation()
  const [files, setFiles] = useState<CodeFile[]>(() => loadFiles())
  const [activeFileId, setActiveFileId] = useState(() => loadActiveFileId(loadFiles()))
  const [outputLogs, setOutputLogs] = useState<string[]>([])
  const [showNewFileModal, setShowNewFileModal] = useState(false)

  const activeFile = files.find(f => f.id === activeFileId) || files[0]
  const maxFiles = 10

  // Save files to localStorage whenever they change
  useEffect(() => {
    saveFiles(files)
  }, [files])

  // Save active file ID to localStorage
  useEffect(() => {
    saveActiveFileId(activeFileId)
  }, [activeFileId])

  const updateFileCode = (code: string) => {
    setFiles(files.map(f => (f.id === activeFileId ? { ...f, code } : f)))
  }

  const addNewFile = (name: string) => {
    if (files.length >= maxFiles) {
      alert(t('playground.maxFilesReached', { max: maxFiles }))
      return
    }
    const language = detectLanguage(name)
    const newFile: CodeFile = {
      id: Date.now().toString(),
      name,
      language,
      code: `// ${name}\n`,
    }
    setFiles([...files, newFile])
    setActiveFileId(newFile.id)
    setShowNewFileModal(false)
  }

  const deleteFile = (id: string) => {
    if (files.length === 1) {
      alert(t('playground.mustKeepOneFile'))
      return
    }
    const newFiles = files.filter(f => f.id !== id)
    setFiles(newFiles)
    if (activeFileId === id) {
      setActiveFileId(newFiles[0].id)
    }
  }

  const clearAllFiles = () => {
    if (confirm(t('playground.confirmDeleteAll'))) {
      clearStorage()
      const freshFiles = loadFiles()
      setFiles(freshFiles)
      setActiveFileId(freshFiles[0].id)
      setOutputLogs([])
    }
  }

  const runCode = () => {
    setOutputLogs([])
    const result = executeCode(activeFile.code, activeFile.language)

    if (result.error) {
      setOutputLogs([...result.logs, formatError(result.error)])
    } else if (result.logs.length === 0) {
      setOutputLogs([t('playground.runSuccessNoOutput')])
    } else {
      setOutputLogs(result.logs)
    }
  }

  return (
    <div className="flex flex-col lg:flex-row gap-4 h-full">
      <FileExplorer
        files={files}
        activeFileId={activeFileId}
        maxFiles={maxFiles}
        onFileSelect={setActiveFileId}
        onFileDelete={deleteFile}
        onNewFile={() => setShowNewFileModal(true)}
        onClearAll={clearAllFiles}
        getLanguageConfig={lang => {
          const config = getLanguageConfig(lang)
          return { icon: config.icon, color: config.color }
        }}
      />

      <main className="flex-1 flex flex-col gap-4 min-w-0 h-full">
        <div className="bg-white/3 border border-brand-teal/10 rounded-card p-5 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="w-1 h-full bg-gradient-to-b from-brand-teal to-transparent rounded"></div>
            <div className="flex-1">
              <h1 className="text-white text-xl font-bold mb-2">{activeFile.name}</h1>
              <p className="text-slate-300 text-sm leading-relaxed">
                {t('playground.freePlayground')}
              </p>
              <p className="text-slate-500 text-xs mt-2 flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                {t('playground.autoSaved')}
              </p>
            </div>
          </div>
        </div>

        <CodeEditorPane
          activeFile={activeFile}
          onCodeChange={updateFileCode}
          onRunCode={runCode}
          getLanguageExtension={getLanguageExtension}
        />

        <TerminalOutput logs={outputLogs} onClear={() => setOutputLogs([])} />
      </main>

      {showNewFileModal && (
        <NewFileModal onSubmit={addNewFile} onCancel={() => setShowNewFileModal(false)} />
      )}
    </div>
  )
}

export default PlaygroundMultiFileUI
