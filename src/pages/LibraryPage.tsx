import React, { useEffect, useState, useMemo } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'
import { FiBookOpen, FiCheckCircle, FiLock, FiPlay, FiArrowLeft, FiClock, FiStar, FiChevronDown, FiChevronRight, FiZap, FiTarget, FiAward } from 'react-icons/fi'
import { useLessonData } from '../hooks/useLessonData'
import { useAuth } from '../contexts/AuthContext'
import Header from '../components/common/Header'
import SEO from '../components/common/SEO'
import LoadingSpinner from '../components/common/LoadingSpinner'
import { getLanguageMetadata } from '../utils/seo'

const pathLabels: Record<string, { title: string; subtitle: string; destination: string }> = {
  javascript: {
    title: 'JavaScript Web Starter',
    subtitle: 'Học từng bước để tạo tương tác đầu tiên trên web.',
    destination: 'Xây dựng một ứng dụng web nhỏ có tương tác thật.',
  },
  python: {
    title: 'Python Foundations',
    subtitle: 'Bắt đầu nhẹ với logic, biến và output dễ hiểu.',
    destination: 'Viết chương trình Python giải quyết vấn đề nhỏ trong đời thực.',
  },
  cpp: {
    title: 'C++ School Foundations',
    subtitle: 'Xây nền tư duy lập trình và giải bài theo từng bước.',
    destination: 'Nắm input/output, điều kiện, vòng lặp và tư duy thuật toán cơ bản.',
  },
}

const LibraryPage: React.FC = () => {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { user, loading: authLoading } = useAuth()
  const { language = 'javascript' } = useParams<{ language: string }>()
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())

  // Auth guard: redirect guests to auth, unboarded users to onboarding
  useEffect(() => {
    if (!authLoading) {
      if (!user) {
        navigate('/auth', { state: { from: { pathname: `/library/${language}` } } })
      } else if (!user.onboardingCompleted) {
        navigate('/onboarding')
      }
    }
  }, [user, authLoading, navigate, language])

  const { lessons, chapters, loading, completedLessons } = useLessonData(language, undefined, user?.id)

  const metadata = getLanguageMetadata(language)
  const pathLabel = pathLabels[language] || {
    title: `${language.toUpperCase()} Journey`,
    subtitle: 'Học theo từng bước nhỏ và thực hành ngay trong trình duyệt.',
    destination: 'Hoàn thành các bài học nền tảng đầu tiên.',
  }

  const totalLessons = lessons.length
  const completedCount = completedLessons.size
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  // Find the first incomplete lesson for "Resume" CTA
  const sortedLessons = useMemo(() => {
    return [...lessons].sort((a, b) => a.orderIndex - b.orderIndex)
  }, [lessons])

  const nextLesson = useMemo(() => {
    return sortedLessons.find(l => !completedLessons.has(l.id))
  }, [sortedLessons, completedLessons])

  const nextLessonChapter = useMemo(() => {
    if (!nextLesson) return null
    return chapters.find(c => c.id === nextLesson.chapterId)
  }, [nextLesson, chapters])

  // Auto-expand the chapter containing the next lesson
  useEffect(() => {
    if (nextLesson && nextLessonChapter) {
      setExpandedChapters(prev => new Set(prev).add(nextLessonChapter.id))
    }
  }, [nextLesson, nextLessonChapter])

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev)
      if (next.has(chapterId)) {
        next.delete(chapterId)
      } else {
        next.add(chapterId)
      }
      return next
    })
  }

  // Determine if a lesson is locked (must complete previous lessons first)
  const isLessonLocked = (lessonIndex: number): boolean => {
    if (lessonIndex === 0) return false
    const prevLesson = sortedLessons[lessonIndex - 1]
    return prevLesson ? !completedLessons.has(prevLesson.id) : false
  }

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col">
        <Header />
        <div className="flex-grow flex items-center justify-center">
          <LoadingSpinner size="lg" />
        </div>
      </div>
    )
  }

  // Don't render content if user isn't properly authenticated
  if (!user || !user.onboardingCompleted) return null

  const sortedChapters = [...chapters].sort((a, b) => a.orderIndex - b.orderIndex)

  return (
    <>
      <SEO {...metadata} title={`${t('learn.curriculum')} - ${language.toUpperCase()}`} />
      <div className="min-h-screen bg-[#0a0e1a] flex flex-col pb-20">
        <Header />

        <div className="relative pt-28 px-4 sm:px-6 lg:px-8 overflow-hidden flex-1">
          {/* Ambient background */}
          <div className="absolute inset-0 pointer-events-none opacity-20">
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-brand-teal/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-brand-cyan/10 rounded-full blur-[100px]" />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            {/* Back button */}
            <button
              onClick={() => navigate('/languages')}
              className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6 cursor-pointer group text-sm"
            >
              <FiArrowLeft className="group-hover:-translate-x-1 transition-transform" />
              <span>Đổi ngôn ngữ</span>
            </button>

            <div className="mb-8 rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.08] to-white/[0.03] p-6 md:p-8">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-brand-teal">
                    <FiTarget className="h-3.5 w-3.5" /> Journey Map
                  </div>
                  <h1 className="text-3xl font-black tracking-tight text-white md:text-5xl">
                    Bạn đang học: {pathLabel.title}
                  </h1>
                  <p className="mt-3 max-w-2xl text-base leading-7 text-slate-400 md:text-lg">
                    {pathLabel.subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3 rounded-3xl border border-white/10 bg-black/20 p-4 text-center">
                  <div>
                    <div className="text-2xl font-black text-white">{progressPercent}%</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Tiến độ</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white">{user.currentStreak || 0}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Streak</div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-white">{user.points || completedCount * 10}</div>
                    <div className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Điểm</div>
                  </div>
                </div>
              </div>
            </div>

            {/* ============ 2-COLUMN LAYOUT (Mimo-inspired) ============ */}
            <div className="flex flex-col lg:flex-row gap-8">

              {/* ─── LEFT COLUMN: Sticky Summary + Resume ─── */}
              <div className="lg:w-[380px] lg:shrink-0">
                <div className="lg:sticky lg:top-24 space-y-6">

                  {/* Progress Ring Card */}
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8">
                    <div className="flex items-center gap-6">
                      {/* Circular Progress */}
                      <div className="relative w-24 h-24 shrink-0">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="8" />
                          <motion.circle
                            cx="50" cy="50" r="42" fill="none"
                            stroke="url(#progressGradient)" strokeWidth="8" strokeLinecap="round"
                            strokeDasharray={`${2 * Math.PI * 42}`}
                            initial={{ strokeDashoffset: 2 * Math.PI * 42 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 42 * (1 - progressPercent / 100) }}
                            transition={{ duration: 1, ease: 'easeOut' }}
                          />
                          <defs>
                            <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                              <stop offset="0%" stopColor="var(--color-brand-teal, #54d9c4)" />
                              <stop offset="100%" stopColor="var(--color-brand-cyan, #22d3ee)" />
                            </linearGradient>
                          </defs>
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-2xl font-black text-white">{progressPercent}%</span>
                        </div>
                      </div>

                      <div>
                        <h1 className="text-2xl font-extrabold text-white tracking-tight mb-1">
                          {pathLabel.title}
                        </h1>
                        <p className="text-slate-500 text-sm">
                          {completedCount}/{totalLessons} bài hoàn thành
                        </p>
                      </div>
                    </div>

                    {/* Stats row */}
                    <div className="flex items-center gap-4 mt-6 pt-6 border-t border-white/5">
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <FiBookOpen className="w-3.5 h-3.5" /> {chapters.length} chương
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <FiStar className="w-3.5 h-3.5 text-yellow-400" /> {user.points || completedCount * 10} điểm
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-400">
                        <FiZap className="w-3.5 h-3.5 text-orange-400" /> {user.currentStreak || 0} ngày
                      </div>
                    </div>
                  </div>

                  {/* ─── RESUME CTA (Codecademy-inspired giant button) ─── */}
                  {nextLesson && (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => navigate(`/learn/${language}/${nextLesson.lessonId}`)}
                      className="w-full bg-gradient-to-r from-brand-teal to-brand-cyan text-[#0a0e1a] rounded-3xl p-6 cursor-pointer text-left group relative overflow-hidden"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-brand-cyan to-brand-teal opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <div className="relative z-10">
                        <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest opacity-70 mb-2">
                          <FiPlay className="w-3 h-3" /> Bước tiếp theo
                        </div>
                        <h3 className="text-xl font-extrabold mb-1">{nextLesson.title}</h3>
                        <p className="text-sm opacity-70 line-clamp-1">
                          {nextLessonChapter?.title && `${nextLessonChapter.title} · `}
                          {nextLesson.estimated_time || 5} phút
                        </p>
                        <div className="mt-4 rounded-2xl bg-[#0a0e1a]/15 px-4 py-3 text-sm font-bold">
                          Học 5 phút, chạy code thật, mở khóa bài tiếp theo.
                        </div>
                      </div>
                      <div className="absolute right-6 top-8 z-10">
                        <div className="w-12 h-12 rounded-full bg-[#0a0e1a]/20 flex items-center justify-center group-hover:bg-[#0a0e1a]/30 transition-all">
                          <FiPlay className="w-6 h-6 ml-0.5" />
                        </div>
                      </div>
                    </motion.button>
                  )}

                  {/* All complete state */}
                  {!nextLesson && totalLessons > 0 && (
                    <div className="bg-green-500/10 border border-green-500/20 rounded-3xl p-6 text-center">
                      <FiAward className="w-10 h-10 text-green-400 mx-auto mb-3" />
                      <h3 className="text-lg font-bold text-green-400 mb-1">Hoàn thành xuất sắc! 🎉</h3>
                      <p className="text-slate-400 text-sm">Bạn đã chinh phục toàn bộ lộ trình {language}.</p>
                    </div>
                  )}

                  {/* Target Project Preview (Mimo-inspired) */}
                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                    <div className="flex items-center gap-2 text-brand-teal font-bold text-sm mb-3">
                      <FiTarget className="w-4 h-4" /> Đích đến của bạn
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">{pathLabel.destination}</p>
                  </div>

                  <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-6">
                    <div className="flex items-center gap-2 text-brand-teal font-bold text-sm mb-3">
                      <FiLock className="w-4 h-4" /> Vì sao có bài bị khóa?
                    </div>
                    <p className="text-slate-400 text-sm leading-relaxed">
                      Loopy mở từng bài theo thứ tự để bạn không bị nhảy cóc. Hoàn thành bài trước để mở khóa bài tiếp theo.
                    </p>
                  </div>
                </div>
              </div>

              {/* ─── RIGHT COLUMN: Chapters & Lessons (Progressive Disclosure) ─── */}
              <div className="flex-1 min-w-0">
                <div className="space-y-4">
                  {sortedChapters.length === 0 && (
                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-10 text-center">
                      <FiBookOpen className="mx-auto mb-4 h-12 w-12 text-brand-teal" />
                      <h2 className="text-2xl font-black text-white">Lộ trình này chưa có bài học</h2>
                      <p className="mx-auto mt-3 max-w-md text-slate-400">
                        Nội dung đang được chuẩn bị. Bạn có thể đổi ngôn ngữ hoặc quay lại sau.
                      </p>
                      <button
                        onClick={() => navigate('/languages')}
                        className="mt-6 rounded-2xl bg-brand-teal px-6 py-3 font-black text-[#0a0e1a]"
                      >
                        Chọn lộ trình khác
                      </button>
                    </div>
                  )}
                  {sortedChapters.map((chapter, chapterIdx) => {
                    const chapterLessons = sortedLessons.filter(l => l.chapterId === chapter.id)
                    const chapterCompleted = chapterLessons.filter(l => completedLessons.has(l.id)).length
                    const chapterTotal = chapterLessons.length
                    const isChapterDone = chapterCompleted === chapterTotal && chapterTotal > 0
                    const isExpanded = expandedChapters.has(chapter.id)

                    return (
                      <div key={chapter.id} className="relative">
                        {/* Chapter Header (Clickable - Progressive Disclosure) */}
                        <button
                          onClick={() => toggleChapter(chapter.id)}
                          className={`w-full flex items-center gap-4 p-5 rounded-2xl border transition-all cursor-pointer group text-left ${isChapterDone
                            ? 'bg-green-500/5 border-green-500/20 hover:border-green-500/40'
                            : 'bg-white/5 border-white/10 hover:border-brand-teal/30 hover:bg-white/[0.07]'
                            }`}
                        >
                          {/* Chapter number badge */}
                          <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-black text-lg shrink-0 ${isChapterDone
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-brand-teal/10 border border-brand-teal/20 text-brand-teal'
                            }`}>
                            {isChapterDone ? <FiCheckCircle className="w-5 h-5" /> : chapterIdx + 1}
                          </div>

                          <div className="flex-1 min-w-0">
                            <h2 className="text-lg font-bold text-white group-hover:text-brand-teal transition-colors truncate">
                              {chapter.title}
                            </h2>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-slate-500">{chapterCompleted}/{chapterTotal} bài</span>
                              {/* Mini progress bar */}
                              <div className="flex-1 max-w-[120px] h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all ${isChapterDone ? 'bg-green-500' : 'bg-brand-teal'}`}
                                  style={{ width: `${chapterTotal > 0 ? (chapterCompleted / chapterTotal) * 100 : 0}%` }}
                                />
                              </div>
                            </div>
                          </div>

                          {/* Expand/Collapse icon */}
                          <div className="text-slate-500 group-hover:text-white transition-colors">
                            {isExpanded ? <FiChevronDown className="w-5 h-5" /> : <FiChevronRight className="w-5 h-5" />}
                          </div>
                        </button>

                        {/* Lesson List (Collapsible) */}
                        <AnimatePresence>
                          {isExpanded && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: 'auto', opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.25, ease: 'easeInOut' }}
                              className="overflow-hidden"
                            >
                              <div className="pl-6 pt-2 pb-2 space-y-1.5">
                                {chapterLessons.map((lesson) => {
                                  const globalIndex = sortedLessons.findIndex(l => l.id === lesson.id)
                                  const isCompleted = completedLessons.has(lesson.id)
                                  const isLocked = isLessonLocked(globalIndex)
                                  const isCurrent = nextLesson?.id === lesson.id
                                  const isAha = lesson.isAhaLesson

                                  return (
                                    <motion.button
                                      key={lesson.id}
                                      whileHover={isLocked ? {} : { x: 4 }}
                                      disabled={isLocked}
                                      onClick={() => !isLocked && navigate(`/learn/${language}/${lesson.lessonId}`)}
                                      className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left transition-all ${isLocked
                                        ? 'opacity-40 cursor-not-allowed'
                                        : isCurrent
                                          ? 'bg-brand-teal/10 border border-brand-teal/30 cursor-pointer'
                                          : 'hover:bg-white/5 cursor-pointer'
                                        }`}
                                    >
                                      {/* Status icon */}
                                      <div className="shrink-0">
                                        {isCompleted ? (
                                          <div className="w-7 h-7 rounded-full bg-green-500/20 flex items-center justify-center text-green-400">
                                            <FiCheckCircle className="w-4 h-4" />
                                          </div>
                                        ) : isLocked ? (
                                          <div className="w-7 h-7 rounded-full bg-slate-800 flex items-center justify-center text-slate-600">
                                            <FiLock className="w-3.5 h-3.5" />
                                          </div>
                                        ) : isCurrent ? (
                                          <div className="w-7 h-7 rounded-full bg-brand-teal flex items-center justify-center text-[#0a0e1a]">
                                            <FiPlay className="w-3.5 h-3.5 ml-0.5" />
                                          </div>
                                        ) : (
                                          <div className="w-7 h-7 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-500">
                                            <FiPlay className="w-3 h-3 ml-0.5" />
                                          </div>
                                        )}
                                      </div>

                                      {/* Content */}
                                      <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                          <span className={`font-semibold text-sm truncate ${isCompleted ? 'text-slate-400' : isCurrent ? 'text-brand-teal' : 'text-white'
                                            }`}>
                                            {lesson.title}
                                          </span>
                                          {isAha && (
                                            <span className="px-1.5 py-0.5 bg-brand-cyan/20 text-brand-cyan text-[9px] font-black uppercase tracking-widest rounded shrink-0">
                                              AHA
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex items-center gap-3 mt-0.5">
                                          <span className="text-[11px] text-slate-600 flex items-center gap-1">
                                            <FiClock className="w-3 h-3" /> {lesson.estimated_time || 5}m
                                          </span>
                                          <span className={`text-[11px] font-bold uppercase ${lesson.difficulty === 'beginner' ? 'text-green-500/60' :
                                            lesson.difficulty === 'intermediate' ? 'text-yellow-500/60' : 'text-red-500/60'
                                            }`}>
                                            {lesson.difficulty}
                                          </span>
                                          {isLocked && (
                                            <span className="text-[11px] text-slate-600">Hoàn thành bài trước để mở khóa</span>
                                          )}
                                        </div>
                                      </div>

                                      {/* Right arrow for current */}
                                      {isCurrent && !isLocked && (
                                        <FiChevronRight className="w-4 h-4 text-brand-teal shrink-0" />
                                      )}
                                    </motion.button>
                                  )
                                })}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>

                        {/* Milestone marker between chapters */}
                        {chapterIdx < sortedChapters.length - 1 && isChapterDone && (
                          <div className="flex items-center gap-3 py-3 pl-6">
                            <div className="w-px h-6 bg-green-500/30" />
                            <span className="text-[10px] font-bold uppercase tracking-widest text-green-500/50">
                              ✓ Checkpoint hoàn thành
                            </span>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default LibraryPage
