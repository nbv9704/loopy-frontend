import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Play, CheckCircle, ArrowRight, Zap, Sparkles, MessageCircle } from 'lucide-react'
import { api } from '../lib/api'
import { useTranslation } from 'react-i18next'
import FullscreenLoader from '../components/common/FullscreenLoader'
import CodeEditor from '../components/common/CodeEditor'

interface SampleLesson {
  title: string
  description: string
  starterCode: string
  taskDescription: string
  chapters?: {
    languageId?: string
  }
}

const SampleLessonPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [lesson, setLesson] = useState<SampleLesson | null>(null)
  const [loading, setLoading] = useState(true)
  const [userCode, setUserCode] = useState('')
  const [isCompleted, setIsCompleted] = useState(false)
  const [output, setOutput] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState(false)

  useEffect(() => {
    loadSampleLesson()
  }, [])

  const loadSampleLesson = async () => {
    try {
      const response = await api.getSampleLesson()
      if (response.success && response.data) {
        const lessonData = response.data as SampleLesson
        setLesson(lessonData)
        setUserCode(lessonData.starterCode)
      }
    } catch (error) {
      console.error('Failed to load sample lesson:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRunCode = async () => {
    if (!lesson) return

    setIsRunning(true)
    setOutput(['> ' + t('common.loading')])
    
    try {
      const lang = lesson.chapters?.languageId || 'javascript'
      const response = await api.executeCode(lang, userCode)
      if (response.success && response.data) {
        const { output: executionOutput, error } = response.data
        if (error) {
          setOutput(['❌ LỖI: ' + error])
        } else {
          setOutput(executionOutput ? executionOutput.split('\n') : ['> ' + t('common.runSuccessNoOutput')])
          
          // Check if user completed the task
          const trimmedUserCode = userCode.trim()
          const trimmedStarter = lesson.starterCode.trim()
          if (trimmedUserCode !== trimmedStarter && trimmedUserCode.length > 5) {
            setIsCompleted(true)
          }
        }
      } else {
        setOutput(['❌ LỖI: Không thể thực thi mã nguồn.'])
      }
    } catch (err: any) {
      setOutput(['❌ LỖI: ' + err.message])
    } finally {
      setIsRunning(false)
    }
  }

  if (loading) return <FullscreenLoader message={t('sampleLesson.preparation')} />
  if (!lesson) return <div>{t('common.error')}</div>

  return (
    <div className="min-h-screen bg-[#0a0e1a] text-white overflow-hidden flex flex-col">
      {/* Header */}
      <header className="p-4 border-b border-white/5 flex items-center justify-between bg-black/20 backdrop-blur-md relative z-20">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-brand-teal rounded-lg flex items-center justify-center font-bold text-slate-900">
            L
          </div>
          <span className="font-bold tracking-tight text-lg">Loopy <span className="text-brand-teal">{t('sampleLesson.title')}</span></span>
        </div>
        <button 
          onClick={() => navigate('/auth')}
          className="text-slate-400 hover:text-white text-sm font-medium transition-colors"
        >
          {t('sampleLesson.login')}
        </button>
      </header>

      <main className="flex-1 flex flex-col md:flex-row relative z-10">
        {/* Left: Content */}
        <div className="w-full md:w-1/2 p-6 md:p-12 overflow-y-auto max-h-[50vh] md:max-h-none border-b md:border-b-0 md:border-r border-white/5 bg-gradient-to-br from-black/40 to-transparent">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 text-brand-teal mb-4">
              <Sparkles className="w-5 h-5" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">{t('sampleLesson.discoverAha')}</span>
            </div>
            
            <h1 className="text-3xl md:text-5xl font-black mb-6 leading-tight">
              {lesson.title}
            </h1>
            
            <p className="text-slate-400 text-lg leading-relaxed mb-8">
              {lesson.description}
            </p>

            <div className="p-6 rounded-3xl bg-brand-teal/5 border border-brand-teal/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-12 h-12 text-brand-teal" />
              </div>
              <h3 className="text-brand-teal font-bold mb-2 flex items-center gap-2">
                <ArrowRight className="w-4 h-4" /> {t('sampleLesson.mission')}
              </h3>
              <p className="text-white text-lg font-medium leading-snug">
                {lesson.taskDescription}
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right: Code & Output */}
        <div className="w-full md:w-1/2 flex flex-col bg-slate-950/50">
          <div className="flex-1 min-h-[400px] relative">
            <CodeEditor
              value={userCode}
              onChange={(value: string) => setUserCode(value || '')}
              language={lesson.chapters?.languageId || 'javascript'}
            />
          </div>
          
          <div className="h-48 border-t border-white/5 bg-black/40 p-4 flex flex-col">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">{t('sampleLesson.consoleOutput')}</span>
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="px-6 py-2 bg-brand-teal text-slate-900 font-bold rounded-full flex items-center gap-2 hover:scale-105 transition-all shadow-lg shadow-brand-teal/20"
              >
                <Play className="w-4 h-4 fill-current" />
                {t('sampleLesson.tryIt')}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto font-mono text-sm text-brand-cyan space-y-1">
              {output.map((line, i) => (
                <div key={i}>{line}</div>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Success Modal / Signup Trigger */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="w-full max-w-md bg-slate-900 border border-brand-teal/30 rounded-[2.5rem] p-10 text-center relative overflow-hidden"
            >
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-teal to-transparent" />
              
              <div className="w-20 h-20 bg-brand-teal/20 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-teal">
                <CheckCircle className="w-10 h-10" />
              </div>
              
              <h2 className="text-3xl font-black text-white mb-4">{t('sampleLesson.wowTitle')}</h2>
              <p className="text-slate-400 mb-8 leading-relaxed">
                {t('sampleLesson.successMessage')}
              </p>
              
              <div className="space-y-4">
                <button
                  onClick={() => navigate('/auth', { state: { from: { pathname: `/library/${lesson.chapters?.languageId || 'javascript'}` } } })}
                  className="w-full py-4 bg-brand-teal text-slate-900 font-black rounded-2xl text-lg hover:scale-[1.02] transition-all shadow-xl shadow-brand-teal/20"
                >
                  {t('sampleLesson.saveAndContinue')}
                </button>
                <button
                  onClick={() => setIsCompleted(false)}
                  className="w-full py-2 text-slate-500 hover:text-white text-sm transition-colors"
                >
                  {t('sampleLesson.tryAgain')}
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-4 text-slate-600 text-xs font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1"><Zap className="w-3 h-3" /> {t('sampleLesson.free')}</div>
                <div className="flex items-center gap-1"><MessageCircle className="w-3 h-3" /> {t('sampleLesson.support')}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Decorative Background Elements */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-1/4 -left-64 w-96 h-96 bg-brand-teal/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 -right-64 w-96 h-96 bg-brand-cyan/10 rounded-full blur-[120px]" />
      </div>
    </div>
  )
}

export default SampleLessonPage
