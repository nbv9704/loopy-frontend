import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, CheckCircle, AlertCircle, FileJson, ArrowRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { contentService, BulkImportPayload } from '../../services/admin/content.service'

const BulkImportPage: React.FC = () => {
  const { t } = useTranslation()
  const [jsonInput, setJsonInput] = useState('')
  const [isImporting, setIsImporting] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleImport = async () => {
    setIsImporting(true)
    setError(null)
    setResult(null)

    try {
      const payload: BulkImportPayload = JSON.parse(jsonInput)
      const data = await contentService.bulkImport(payload)
      setResult(data)
    } catch (err: any) {
      setError(err.message || 'Lỗi phân tích JSON hoặc lỗi server')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">{t('admin.bulkImport.title')}</h1>
        <p className="text-slate-400">{t('admin.bulkImport.subtitle')}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Input area */}
        <div className="space-y-4">
          <div className="bg-slate-900 border border-white/10 rounded-2xl overflow-hidden">
            <div className="bg-white/5 px-4 py-2 border-b border-white/10 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileJson className="w-4 h-4 text-brand-teal" />
                <span className="text-white text-sm font-medium">{t('admin.bulkImport.jsonStructure')}</span>
              </div>
            </div>
            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder='{ "chapter_id": "...", "lessons": [...] }'
              className="w-full h-[500px] bg-transparent p-4 text-slate-300 font-mono text-sm focus:outline-none resize-none"
            />
          </div>

          <button
            onClick={handleImport}
            disabled={isImporting || !jsonInput.trim()}
            className="w-full py-4 bg-brand-teal hover:bg-brand-teal/80 disabled:opacity-50 disabled:cursor-not-allowed text-slate-900 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-brand-teal/20"
          >
            {isImporting ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              >
                <Upload className="w-5 h-5" />
              </motion.div>
            ) : (
              <>
                <Upload className="w-5 h-5" />
                <span>{t('admin.bulkImport.startImport')}</span>
              </>
            )}
          </button>
        </div>

        {/* Status / Result area */}
        <div className="space-y-6">
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-red-500/10 border border-red-500/20 rounded-2xl flex gap-4"
            >
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0" />
              <div>
                <h3 className="text-red-500 font-bold mb-1">{t('admin.bulkImport.importError')}</h3>
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            </motion.div>
          )}

          {result && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-green-500/10 border border-green-500/20 rounded-2xl"
            >
              <div className="flex items-center gap-3 mb-6">
                <CheckCircle className="w-6 h-6 text-green-500" />
                <h3 className="text-green-500 font-bold">{t('admin.bulkImport.importSuccess')}</h3>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">{t('admin.bulkImport.lessons')}</p>
                  <p className="text-2xl font-bold text-white">{result.lessonsCreated}</p>
                </div>
                <div className="bg-white/5 p-4 rounded-xl border border-white/5">
                  <p className="text-slate-400 text-xs uppercase tracking-wider mb-1">Test cases</p>
                  <p className="text-2xl font-bold text-white">{result.testCasesCreated}</p>
                </div>
              </div>

              {result.errors && result.errors.length > 0 && (
                <div>
                  <h4 className="text-white text-sm font-bold mb-2">{t('admin.bulkImport.minorErrors')}</h4>
                  <ul className="space-y-1">
                    {result.errors.map((err: string, i: number) => (
                      <li key={i} className="text-slate-400 text-xs flex items-start gap-2">
                        <ArrowRight className="w-3 h-3 text-brand-teal mt-0.5 shrink-0" />
                        <span>{err}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </motion.div>
          )}

          {!result && !error && (
            <div className="h-full flex flex-col items-center justify-center text-center p-12 border-2 border-dashed border-white/5 rounded-2xl">
              <FileJson className="w-16 h-16 text-slate-700 mb-4" />
              <p className="text-slate-500 max-w-xs">
                {t('admin.bulkImport.pasteHint')}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BulkImportPage
