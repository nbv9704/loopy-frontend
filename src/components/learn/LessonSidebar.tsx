import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ChevronDown, ChevronRight, Maximize2, X, CheckCircle2, ArrowRight } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Lesson {
  id: string
  chapterId: string
  lessonId: string
  title: string
  description: string
  starterCode: string
  taskDescription: string
  hint: string
  commonMistakes: string
  solutionCode: string
  isAhaLesson: boolean
  orderIndex: number
  estimated_time?: number
}

interface Chapter {
  id: string
  languageId: string
  chapterNumber: number
  title: string
  description: string
  orderIndex: number
}

interface LessonSidebarProps {
  lessons: Lesson[]
  chapters: Chapter[]
  activeLesson: string
  language: string
  currentLesson: Lesson | undefined
  completedLessons: Set<string>
  onSelectLesson: (lessonId: string) => void
}

const LessonSidebar: React.FC<LessonSidebarProps> = ({
  lessons,
  chapters,
  activeLesson,
  language,
  currentLesson,
  completedLessons,
  onSelectLesson,
}) => {
  const { t } = useTranslation()
  const hasLessons = lessons.length > 0

  // State để quản lý chương nào đang mở
  const [openChapters, setOpenChapters] = useState<Set<string>>(
    new Set(chapters.map(ch => ch.id)) // Mở tất cả chương mặc định
  )

  const toggleChapter = (chapterId: string) => {
    setOpenChapters(prev => {
      const newSet = new Set(prev)
      if (newSet.has(chapterId)) {
        newSet.delete(chapterId)
      } else {
        newSet.add(chapterId)
      }
      return newSet
    })
  }

  // State quản lý popup tóm tắt
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false)

  // Group lessons by chapter
  const lessonsByChapter = lessons.reduce(
    (acc, lesson) => {
      if (!acc[lesson.chapterId]) {
        acc[lesson.chapterId] = []
      }
      acc[lesson.chapterId].push(lesson)
      return acc
    },
    {} as Record<string, Lesson[]>
  )

  // Sort lessons by orderIndex within each chapter
  Object.keys(lessonsByChapter).forEach(chapterId => {
    lessonsByChapter[chapterId].sort((a, b) => a.orderIndex - b.orderIndex)
  })

  // Find Next Action (first uncompleted lesson)
  const nextActionLesson = lessons.find(l => !completedLessons.has(l.id))

  const totalLessons = lessons.length
  const completedCount = completedLessons.size
  const overallProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0

  return (
    <aside className="w-full lg:w-80 flex flex-col bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl overflow-hidden h-full shadow-xl">
      {/* Header */}
      <div className="bg-gradient-to-br from-brand-teal/10 to-transparent border-b border-white/10 p-5 flex-shrink-0">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-1.5 h-10 bg-gradient-to-b from-brand-teal to-brand-cyan rounded-full"></div>
          <div>
            <h2 className="text-white text-base font-bold">
              {language === 'javascript' ? 'JavaScript' : language === 'python' ? 'Python' : 'C++'}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <p className="text-slate-400 text-sm">
                {completedCount} / {totalLessons}
              </p>
              <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden w-24">
                <div 
                  className="h-full bg-brand-teal transition-all duration-500" 
                  style={{ width: `${overallProgress}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Next Action */}
      {hasLessons && nextActionLesson && (
        <div className="px-3 pt-3 flex-shrink-0">
          <button
            onClick={() => onSelectLesson(nextActionLesson.id)}
            className="w-full py-3 px-4 rounded-xl bg-brand-teal/10 border border-brand-teal/30 hover:bg-brand-teal/20 transition-colors flex items-center justify-between group cursor-pointer"
          >
            <div className="flex flex-col items-start">
              <span className="text-brand-teal text-xs font-bold uppercase tracking-wider mb-0.5">Tiếp tục học</span>
              <span className="text-white text-sm font-medium text-left line-clamp-1">{nextActionLesson.title}</span>
            </div>
            <ArrowRight className="w-5 h-5 text-brand-teal group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}

      {/* Lesson Directory */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-2">
        {hasLessons ? (
          chapters.map(chapter => {
            const chapterLessons = lessonsByChapter[chapter.id] || []
            const isOpen = openChapters.has(chapter.id)
            const hasActiveLesson = chapterLessons.some(l => l.id === activeLesson)

            return (
              <div key={chapter.id} className="space-y-1">
                {/* Chapter Header */}
                <button
                  onClick={() => toggleChapter(chapter.id)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded transition-all cursor-pointer border ${
                    hasActiveLesson
                      ? 'bg-brand-teal/5 border-brand-teal/20'
                      : 'border-transparent hover:bg-white/5 hover:border-white/10'
                  }`}
                >
                  {isOpen ? (
                    <ChevronDown className="w-4 h-4 text-brand-teal" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  )}
                  <div className="flex-1 text-left">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-brand-teal font-semibold text-xs">
                          {t('learn.chapter')} {chapter.chapterNumber}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono">
                        {chapterLessons.filter(l => completedLessons.has(l.id)).length}/{chapterLessons.length}
                      </span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{chapter.title}</p>
                    {/* Chapter progress bar */}
                    <div className="mt-1.5 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-brand-teal to-brand-cyan transition-all duration-500"
                        style={{ width: `${Math.round((chapterLessons.filter(l => completedLessons.has(l.id)).length / (chapterLessons.length || 1)) * 100)}%` }}
                      />
                    </div>
                  </div>
                </button>

                {/* Chapter Lessons */}
                {isOpen && (
                  <div className="ml-4 space-y-1">
                    {chapterLessons.map(lesson => {
                      const isCompleted = completedLessons.has(lesson.id)
                      const isActive = activeLesson === lesson.id
                      const isNext = !isCompleted && !isActive && nextActionLesson?.id === lesson.id

                      return (
                        <button
                          key={lesson.id}
                          onClick={() => onSelectLesson(lesson.id)}
                          className={`w-full text-left px-3 py-2.5 rounded transition-all cursor-pointer flex items-center gap-3 border ${
                            isActive
                              ? 'bg-brand-teal/10 border-brand-teal/30'
                              : isNext
                                ? 'bg-brand-cyan/5 border-brand-cyan/20'
                                : 'border-transparent hover:bg-white/5 hover:border-white/10'
                          }`}
                        >
                          {/* State indicator */}
                          <div className="flex-shrink-0">
                            {isCompleted ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : isActive ? (
                              <div className="w-4 h-4 rounded-full border-2 border-brand-teal bg-brand-teal/20" />
                            ) : isNext ? (
                              <div className="w-4 h-4 rounded-full border-2 border-brand-cyan animate-pulse" />
                            ) : (
                              <div className="w-4 h-4 rounded-full border border-slate-700" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <span
                              className={`text-xs font-mono leading-tight block truncate ${
                                isActive ? 'text-white' : isCompleted ? 'text-slate-500' : 'text-slate-400'
                              }`}
                            >
                              {lesson.title}
                            </span>
                            <div className="flex items-center gap-2 mt-0.5">
                              {lesson.estimated_time && (
                                <span className="text-[10px] text-slate-600">{lesson.estimated_time} phút</span>
                              )}
                              {lesson.isAhaLesson && (
                                <span className="text-[10px] text-yellow-400/80 font-bold">⚡ Aha!</span>
                              )}
                              {isNext && (
                                <span className="text-[10px] text-brand-cyan font-bold">→ Tiếp theo</span>
                              )}
                            </div>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          })
        ) : (
          <div className="p-4 text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 bg-yellow-400/10 border-2 border-yellow-400/30 rounded-lg flex items-center justify-center">
                <AlertCircle className="w-10 h-10 text-yellow-400" />
              </div>
            </div>
            <h3 className="text-yellow-400 font-semibold text-sm mb-2">{t('learn.comingSoon')}</h3>
            <p className="text-slate-400 text-xs mb-2">{t('learn.noLessonsYet')}</p>
            <p className="text-slate-500 text-[10px]">
              {t('learn.developingContent', { language: language.toUpperCase() })}
            </p>
          </div>
        )}
      </nav>

      {/* Key Insight Panel */}
      {hasLessons && currentLesson && currentLesson.description && (
        <div className="border-t border-yellow-400/20 bg-gradient-to-br from-yellow-400/10 to-transparent p-5 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-7 h-7 border-2 border-yellow-400/50 rounded-lg flex items-center justify-center bg-yellow-400/10">
              <span className="text-yellow-400 text-sm font-bold">!</span>
            </div>
            <div className="flex-1 overflow-hidden">
              <h4 className="text-yellow-400 text-sm font-bold mb-2">
                {t('learn.summary', 'Tóm tắt')}
              </h4>
              <p className="text-slate-300 text-sm leading-relaxed whitespace-pre-wrap line-clamp-3">
                {currentLesson.description}
              </p>
              {currentLesson.description.length > 100 && (
                <button
                  onClick={() => setIsSummaryModalOpen(true)}
                  className="mt-2 text-xs font-semibold text-yellow-400/80 hover:text-yellow-400 flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <Maximize2 className="w-3 h-3" />
                  {t('learn.readMore', 'Xem chi tiết')}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary Modal */}
      {isSummaryModalOpen && currentLesson && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-slate-900 border border-yellow-400/30 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-white/10 flex items-center justify-between bg-yellow-400/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 border-2 border-yellow-400/50 rounded-lg flex items-center justify-center bg-yellow-400/10">
                  <span className="text-yellow-400 font-bold">!</span>
                </div>
                <h3 className="text-yellow-400 font-bold text-lg">
                  {t('learn.summary', 'Tóm tắt')}
                </h3>
              </div>
              <button
                onClick={() => setIsSummaryModalOpen(false)}
                className="p-2 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 overflow-y-auto">
              <div className="prose prose-invert prose-yellow max-w-none text-slate-300 text-sm leading-relaxed font-sans">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {currentLesson.description}
                </ReactMarkdown>
              </div>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

export default LessonSidebar
