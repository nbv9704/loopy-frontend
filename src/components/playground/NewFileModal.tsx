import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'

interface NewFileModalProps {
  onSubmit: (name: string) => void
  onCancel: () => void
}

const NewFileModal: React.FC<NewFileModalProps> = ({ onSubmit, onCancel }) => {
  const { t } = useTranslation()
  const [fileName, setFileName] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!fileName.trim()) {
      toast.error(t('playground.enterFileName'))
      return
    }
    onSubmit(fileName)
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 border-2 border-brand-teal/50 rounded-card p-6 max-w-md w-full">
        <h3 className="text-white text-xl font-bold mb-4">{t('playground.createNewFile')}</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-slate-400 text-sm font-medium mb-2 block">
              {t('playground.fileName')}
            </label>
            <input
              type="text"
              value={fileName}
              onChange={e => setFileName(e.target.value)}
              placeholder={t('playground.fileNamePlaceholder')}
              className="w-full bg-slate-950 border border-brand-teal/20 rounded px-4 py-2 text-white font-mono text-sm focus:border-brand-teal focus:outline-none"
              autoFocus
            />
            <p className="text-slate-500 text-xs mt-2">{t('playground.languageAutoDetect')}</p>
            <p className="text-slate-600 text-xs mt-1">{t('playground.supportedExtensions')}</p>
          </div>
          <div className="flex gap-2 pt-2">
            <button
              type="submit"
              className="flex-1 rounded-button px-4 py-2 bg-brand-teal text-bg-primary font-semibold text-sm hover:bg-brand-cyan transition-all cursor-pointer"
            >
              {t('playground.createFile')}
            </button>
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 rounded-button px-4 py-2 bg-slate-800 border border-white/10 text-slate-400 font-semibold text-sm hover:bg-slate-700 transition-all cursor-pointer"
            >
              {t('playground.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default NewFileModal
