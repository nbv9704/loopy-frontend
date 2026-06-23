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
import { useContentPreloader } from '../../hooks/useContentPreloader'
import toast from 'react-hot-toast'
import { Beaker, Lightbulb, PlayCircle, RotateCcw, Sparkles } from 'lucide-react'
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
  const { t, i18n } = useTranslation()
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
  const contentKeys = [
    'playground.lab.title',
    'playground.lab.from_lesson',
    'playground.lab.desc',
    'playground.lab.auth_notice',
    'playground.lab.login_to_run',
    'playground.lab.experiment_label',
    'playground.lab.experiment1',
    'playground.lab.experiment2',
    'playground.lab.experiment3',
    'playground.lab.action_create_file',
    'playground.lab.action_delete_all',
    'playground.lab.action_run_code',
    'playground.lab.delete_confirm',
    'playground.lab.delete_button',
    'playground.lab.cancel_button',
    'playground.lab.run_error',
    'playground.lab.run_failed',
    'playground.lab.login_required',
  ]
  const { content } = useContentPreloader(contentKeys, i18n.language)
  const text = (key: string, fallback: string) => content[key] || fallback
  const formatText = (key: string, fallback: string, values: Record<string, string | number>) => {
    let value = text(key, fallback)
    Object.entries(values).forEach(([token, replacement]) => {
      value = value.split(`{${token}}`).join(String(replacement))
    })
    return value
  }
  const experiments = [
    text('playground.lab.experiment1', 'Đổi một giá trị và dự đoán output trước khi chạy.'),
    text('playground.lab.experiment2', 'Thêm một dòng print/log để kiểm tra suy nghĩ của bạn.'),
    text('playground.lab.experiment3', 'Cố tình tạo một lỗi nhỏ rồi đọc terminal để sửa.'),
  ]

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
      toast.error(formatText('playground.lab.login_required', 'Vui lòng đăng nhập để {action}', { action: actionName }))
      navigate('/auth', { state: { from: { pathname: '/playground' } } })
      return false
    }
    return true
  }

  const handleShowNewFileModal = () => {
    if (requireAuth(text('playground.lab.action_create_file', 'tạo file mới'))) {
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
    if (!requireAuth(text('playground.lab.action_delete_all', 'xóa tất cả file'))) return
    toast(
      (toastInstance) => (
        <span className="flex flex-col gap-2">
          <span>{text('playground.lab.delete_confirm', t('playground.confirmDeleteAll'))}</span>
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
              {text('playground.lab.delete_button', 'Xóa')}
            </button>
            <button
              className="px-3 py-1 bg-slate-700 text-white rounded text-xs"
              onClick={() => toast.dismiss(toastInstance.id)}
            >
              {text('playground.lab.cancel_button', 'Hủy')}
            </button>
          </span>
        </span>
      ),
      { duration: 6000, icon: '⚠️' }
    )
  }

  const runCode = async () => {
    if (!requireAuth(text('playground.lab.action_run_code', 'chạy code'))) return
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
        setOutputLogs([`❌ ${text('playground.lab.run_error', 'LỖI')}: ${text('playground.lab.run_failed', 'Không thể thực thi mã nguồn.')}`])
      }
    } catch (err: any) {
      setOutputLogs([`❌ ${text('playground.lab.run_error', 'LỖI')}: ${err.message}`])
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
        <div className="bg-white/[0.04] border border-brand-teal/10 rounded-[1.5rem] p-5 flex-shrink-0">
          <div className="flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-teal/10 text-brand-teal">
                <Beaker className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <div className="mb-1 flex flex-wrap items-center gap-2">
                  <h1 className="text-white text-2xl font-black">{text('playground.lab.title', 'Loopy Lab')}</h1>
                  {initialTitle && (
                    <span className="rounded-full border border-brand-teal/30 bg-brand-teal/10 px-3 py-1 text-xs font-bold text-brand-teal">
                      {formatText('playground.lab.from_lesson', 'Từ bài học: {title}', { title: initialTitle })}
                    </span>
                  )}
                </div>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {formatText('playground.lab.desc', 'Thử nghiệm tự do với code. Loopy chỉ chạy file đang mở: {file}.', { file: activeFile.name })}
                </p>
                <p className="text-slate-500 text-xs mt-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                  {t('playground.autoSaved')}
                </p>
              </div>
            </div>

            <div className="grid gap-2 sm:grid-cols-3 xl:w-[560px]">
              {experiments.map((experiment, index) => (
                <div key={experiment} className="rounded-2xl border border-white/10 bg-black/20 p-3">
                  <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-brand-teal">
                    {index === 0 && <Lightbulb className="h-3.5 w-3.5" />}
                    {index === 1 && <PlayCircle className="h-3.5 w-3.5" />}
                    {index === 2 && <RotateCcw className="h-3.5 w-3.5" />}
                    {text('playground.lab.experiment_label', 'Thử')} {index + 1}
                  </div>
                  <p className="text-xs leading-5 text-slate-400">{experiment}</p>
                </div>
              ))}
            </div>
          </div>

          {!user && (
            <div className="mt-4 rounded-2xl border border-yellow-400/20 bg-yellow-400/10 p-4 text-sm text-yellow-100">
              <div className="flex items-start gap-3">
                <Sparkles className="mt-0.5 h-5 w-5 shrink-0 text-yellow-300" />
                <div>
                  <div className="font-bold">{text('playground.lab.auth_notice', 'Bạn có thể xem và sửa code. Đăng nhập để chạy và lưu Lab.')}</div>
                  <button
                    onClick={() => navigate('/auth', { state: { from: { pathname: '/playground' } } })}
                    className="mt-2 text-xs font-black uppercase tracking-widest text-yellow-300 underline"
                  >
                    {text('playground.lab.login_to_run', 'Đăng nhập để chạy code')}
                  </button>
                </div>
              </div>
            </div>
          )}
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
