import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, CheckCircle, Code2, Lightbulb, MessageCircle, Play, RotateCcw, Sparkles, Zap } from 'lucide-react'
import { api } from '../lib/api'
import { useTranslation } from 'react-i18next'
import FullscreenLoader from '../components/common/FullscreenLoader'
import CodeEditor from '../components/common/CodeEditor'
import headerLogo from '../assets/images/logos/header/logo-w256.png'

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
  const lessonLang = lesson?.chapters?.languageId || 'javascript'
  const steps = ['See', 'Change', 'Run', 'Win']

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
          setOutput(['Lỗi khi chạy code:', error, 'Gợi ý: đọc dòng lỗi đầu tiên, sửa một chỗ nhỏ rồi chạy lại.'])
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
        setOutput(['Không thể thực thi mã nguồn. Hãy thử chạy lại sau vài giây.'])
      }
    } catch (err: any) {
      setOutput(['Lỗi khi chạy code:', err.message])
    } finally {
      setIsRunning(false)
    }
  }

  if (loading) return <FullscreenLoader message={t('sampleLesson.preparation')} />
  if (!lesson) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#0a0e1a] px-6 text-white">
        <div className="max-w-md rounded-3xl border border-white/10 bg-white/[0.04] p-8 text-center">
          <h1 className="text-2xl font-black">Chưa tải được bài học thử</h1>
          <p className="mt-3 text-slate-400">Bạn thử tải lại trang hoặc quay về trang chủ để bắt đầu lại.</p>
          <button
            onClick={() => navigate('/')}
            className="mt-6 rounded-2xl bg-brand-teal px-6 py-3 font-black text-[#0a0e1a]"
          >
            Về trang chủ
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col overflow-hidden bg-[#0a0e1a] text-white">
      <header className="relative z-20 flex items-center justify-between border-b border-white/10 bg-black/25 px-4 py-3 backdrop-blur-xl md:px-6">
        <button onClick={() => navigate('/')} className="flex items-center gap-3">
          <img src={headerLogo} alt="Loopy" className="h-9 object-contain" />
          <span className="hidden rounded-full border border-brand-teal/25 bg-brand-teal/10 px-3 py-1 text-xs font-bold text-brand-teal sm:inline-flex">
            Bài học thử - không cần đăng nhập
          </span>
        </button>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            className="hidden text-sm font-semibold text-slate-400 transition-colors hover:text-white sm:block"
          >
            Trang chủ
          </button>
          <button
            onClick={() => navigate('/auth')}
            className="rounded-full bg-white/10 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-white/15"
          >
            {t('sampleLesson.login')}
          </button>
        </div>
      </header>

      <main className="relative z-10 grid flex-1 lg:grid-cols-[0.85fr,1.15fr]">
        <aside className="border-b border-white/10 bg-gradient-to-br from-black/45 to-transparent p-5 lg:max-h-[calc(100vh-65px)] lg:overflow-y-auto lg:border-b-0 lg:border-r lg:p-8 xl:p-10">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-2xl lg:mx-0"
          >
            <div className="mb-6 flex items-center gap-2 text-brand-teal">
              <Sparkles className="h-5 w-5" />
              <span className="text-xs font-bold uppercase tracking-[0.2em]">Thắng nhỏ đầu tiên</span>
            </div>

            <h1 className="mb-4 text-3xl font-black leading-tight md:text-5xl">
              {lesson.title}
            </h1>
            <p className="mb-7 text-lg leading-8 text-slate-400">
              {lesson.description}
            </p>

            <div className="mb-6 grid grid-cols-4 gap-2">
              {steps.map((step, index) => (
                <div
                  key={step}
                  className={`rounded-2xl border px-3 py-3 text-center text-xs font-black ${
                    index === 2
                      ? 'border-brand-teal/50 bg-brand-teal/15 text-brand-teal'
                      : 'border-white/10 bg-white/[0.04] text-slate-400'
                  }`}
                >
                  <div className="mb-1 text-[10px] text-slate-500">{index + 1}</div>
                  {step}
                </div>
              ))}
            </div>

            <div className="group relative overflow-hidden rounded-3xl border border-brand-teal/15 bg-brand-teal/[0.06] p-6">
              <div className="absolute right-0 top-0 p-4 opacity-10 transition-opacity group-hover:opacity-20">
                <Zap className="h-12 w-12 text-brand-teal" />
              </div>
              <h3 className="mb-2 flex items-center gap-2 font-bold text-brand-teal">
                <ArrowRight className="h-4 w-4" /> Nhiệm vụ của bạn
              </h3>
              <p className="text-lg font-medium leading-snug text-white">
                {lesson.taskDescription}
              </p>
            </div>

            <div className="mt-5 rounded-3xl border border-white/10 bg-white/[0.04] p-5">
              <div className="mb-2 flex items-center gap-2 font-bold text-white">
                <Lightbulb className="h-5 w-5 text-yellow-300" />
                Gợi ý nhỏ
              </div>
              <p className="text-sm leading-6 text-slate-400">
                Đừng cố làm hoàn hảo. Hãy sửa một dòng, bấm “Chạy thử”, nhìn output rồi điều chỉnh tiếp.
              </p>
            </div>
          </motion.div>
        </aside>

        <section className="flex min-h-[620px] flex-col bg-slate-950/55">
          <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-4 py-3 md:px-5">
            <div>
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Code2 className="h-4 w-4 text-brand-teal" />
                Editor
              </div>
              <p className="mt-1 text-xs text-slate-500">Ngôn ngữ: {lessonLang}</p>
            </div>
            <button
              onClick={() => setUserCode(lesson.starterCode)}
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-bold text-slate-300 transition-colors hover:border-brand-teal/40 hover:text-brand-teal"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              Đặt lại
            </button>
          </div>

          <div className="relative min-h-[360px] flex-1">
            <CodeEditor
              value={userCode}
              onChange={(value: string) => setUserCode(value || '')}
              language={lessonLang}
            />
          </div>

          <div className="flex h-56 flex-col border-t border-white/10 bg-black/45 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Terminal output</span>
              <button
                onClick={handleRunCode}
                disabled={isRunning}
                className="flex items-center gap-2 rounded-full bg-brand-teal px-6 py-2 font-black text-slate-900 shadow-lg shadow-brand-teal/20 transition-all hover:scale-105 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Play className="h-4 w-4 fill-current" />
                {isRunning ? 'Đang chạy...' : 'Chạy thử'}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto rounded-2xl border border-white/10 bg-[#070a12] p-4 font-mono text-sm text-brand-cyan">
              {output.length > 0 ? (
                <div className="space-y-1">
                  {output.map((line, i) => (
                    <div key={`${line}-${i}`}>{line || ' '}</div>
                  ))}
                </div>
              ) : (
                <div className="text-slate-600">Bấm “Chạy thử” để xem code tạo ra output gì.</div>
              )}
            </div>
          </div>
        </section>
      </main>

      {/* Success Modal / Signup Trigger */}
      <AnimatePresence>
        {isCompleted && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="relative w-full max-w-md overflow-hidden rounded-[2.5rem] border border-brand-teal/30 bg-slate-900 p-8 text-center md:p-10"
            >
              <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-brand-teal to-transparent" />

              <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-brand-teal/20 text-brand-teal">
                <CheckCircle className="h-10 w-10" />
              </div>

              <h2 className="mb-4 text-3xl font-black text-white">Bạn vừa có chiến thắng đầu tiên.</h2>
              <p className="mb-8 leading-relaxed text-slate-400">
                Code của bạn đã chạy. Tạo tài khoản để lưu tiến độ và học tiếp đúng lộ trình này.
              </p>

              <div className="space-y-4">
                <button
                  onClick={() => navigate('/auth', { state: { from: { pathname: `/library/${lessonLang}` } } })}
                  className="w-full rounded-2xl bg-brand-teal py-4 text-lg font-black text-slate-900 shadow-xl shadow-brand-teal/20 transition-all hover:scale-[1.02]"
                >
                  {t('sampleLesson.saveAndContinue')}
                </button>
                <button
                  onClick={() => setIsCompleted(false)}
                  className="w-full py-2 text-sm text-slate-500 transition-colors hover:text-white"
                >
                  {t('sampleLesson.tryAgain')}
                </button>
              </div>

              <div className="mt-8 flex items-center justify-center gap-4 text-xs font-bold uppercase tracking-widest text-slate-600">
                <div className="flex items-center gap-1"><Zap className="h-3 w-3" /> {t('sampleLesson.free')}</div>
                <div className="flex items-center gap-1"><MessageCircle className="h-3 w-3" /> {t('sampleLesson.support')}</div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute -left-64 top-1/4 h-96 w-96 rounded-full bg-brand-teal/10 blur-[120px]" />
        <div className="absolute -right-64 bottom-1/4 h-96 w-96 rounded-full bg-brand-cyan/10 blur-[120px]" />
      </div>
    </div>
  )
}

export default SampleLessonPage
