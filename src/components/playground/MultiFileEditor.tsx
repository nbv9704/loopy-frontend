import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import FileExplorer from './FileExplorer'
import CodeEditorPane from './CodeEditorPane'
import TerminalOutput from './TerminalOutput'
import NewFileModal from './NewFileModal'
import { detectLanguage, getLanguageConfig, getLanguageExtension } from '../../utils/languageConfig'
import { api } from '../../lib/api'
import toast from 'react-hot-toast'
import {
  CodeFile,
  loadFiles,
  saveFiles,
  loadActiveFileId,
  saveActiveFileId,
  clearStorage,
} from '../../utils/playgroundStorage'

interface MultiFileEditorProps {
  initialCode?: string
  initialLanguage?: string
  initialTitle?: string
}

const PlaygroundMultiFileUI: React.FC<MultiFileEditorProps> = ({ initialCode, initialLanguage, initialTitle }) => {
  const { t } = useTranslation()
  const [files, setFiles] = useState<CodeFile[]>(() => {
    if (initialCode && initialLanguage) {
      const ext = initialLanguage === 'python' ? 'py' : initialLanguage === 'cpp' ? 'cpp' : 'js'
      const name = initialTitle ? `${initialTitle.replace(/\s+/g, '_').substring(0, 20)}.${ext}` : `lesson.${ext}`
      return [{ id: 'lesson-import', name, language: initialLanguage, code: initialCode }]
    }
    return loadFiles()
  })
  const navigate = useNavigate()
  const { user } = useAuth()
  const [activeFileId, setActiveFileId] = useState(() => {
    if (initialCode) return 'lesson-import'
    return loadActiveFileId(loadFiles())
  })
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

  const requireAuth = (actionName: string) => {
    if (!user) {
      toast.error(`Vui lòng đăng nhập để ${actionName}`)
      navigate('/auth', { state: { from: { pathname: '/playground' } } })
      return false
    }
    return true
  }

  const handleShowNewFileModal = () => {
    if (requireAuth('tạo file mới')) {
      setShowNewFileModal(true)
    }
  }

  const addNewFile = (name: string) => {
    if (files.length >= maxFiles) {
      toast.error(t('playground.maxFilesReached', { max: maxFiles }))
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
      toast.error(t('playground.mustKeepOneFile'))
      return
    }
    const newFiles = files.filter(f => f.id !== id)
    setFiles(newFiles)
    if (activeFileId === id) {
      setActiveFileId(newFiles[0].id)
    }
  }

  const clearAllFiles = () => {
    if (!requireAuth('xóa tất cả file')) return
    toast(
      (toastInstance) => (
        <span className="flex flex-col gap-2">
          <span>{t('playground.confirmDeleteAll')}</span>
          <span className="flex gap-2">
            <button
              className="px-3 py-1 bg-red-500 text-white rounded text-xs font-semibold"
              onClick={() => {
                toast.dismiss(toastInstance.id)
                clearStorage()
                const freshFiles = loadFiles()
                setFiles(freshFiles)
                setActiveFileId(freshFiles[0].id)
                setOutputLogs([])
              }}
            >
              Xóa
            </button>
            <button
              className="px-3 py-1 bg-slate-700 text-white rounded text-xs"
              onClick={() => toast.dismiss(toastInstance.id)}
            >
              Hủy
            </button>
          </span>
        </span>
      ),
      { duration: 6000, icon: '⚠️' }
    )
  }

  const runCode = async () => {
    if (!requireAuth('chạy code')) return
    setOutputLogs(['> ' + t('common.loading') + '...'])
    
    try {
      const response = await api.executeCode(activeFile.language, activeFile.code)
      if (response.success && response.data) {
        const { output, error } = response.data
        if (error) {
          setOutputLogs([`❌ LỖI: ${error}`])
        } else {
          setOutputLogs(output ? output.split('\n') : [t('playground.runSuccessNoOutput')])
        }
      } else {
        setOutputLogs(['❌ LỖI: Không thể thực thi mã nguồn.'])
      }
    } catch (err: any) {
      setOutputLogs([`❌ LỖI: ${err.message}`])
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
        onNewFile={handleShowNewFileModal}
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
