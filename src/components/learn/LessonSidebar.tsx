import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { AlertCircle, ChevronDown, ChevronRight } from 'lucide-react'

interface Lesson {
  id: string
  chapter_id: string
  lesson_id: string
  title: string
  description: string
  content: string
  code: string
  insight: string
  order_index: number
}

interface Chapter {
  id: string
  language_id: string
  chapter_number: number
  title: string
  description: string
  order_index: number
}

interface LessonSidebarProps {
  lessons: Lesson[]
  chapters: Chapter[]
  activeLesson: string
  language: string
  currentLesson: Lesson | undefined
  onSelectLesson: (lessonId: string) => void
}

const LessonSidebar: React.FC<LessonSidebarProps> = ({
  lessons,
  chapters,
  activeLesson,
  language,
  currentLesson,
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

  // Group lessons by chapter
  const lessonsByChapter = lessons.reduce(
    (acc, lesson) => {
      if (!acc[lesson.chapter_id]) {
        acc[lesson.chapter_id] = []
      }
      acc[lesson.chapter_id].push(lesson)
      return acc
    },
    {} as Record<string, Lesson[]>
  )

  // Sort lessons by order_index within each chapter
  Object.keys(lessonsByChapter).forEach(chapterId => {
    lessonsByChapter[chapterId].sort((a, b) => a.order_index - b.order_index)
  })

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
            <p className="text-slate-400 text-sm">
              {t('learn.lessonsCount', { count: lessons.length })}
            </p>
          </div>
        </div>
      </div>

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
                    <div className="flex items-center gap-2">
                      <span className="text-brand-teal font-semibold text-xs">
                        {t('learn.chapter')} {chapter.chapter_number}
                      </span>
                      <span className="text-slate-500 text-[10px]">({chapterLessons.length})</span>
                    </div>
                    <p className="text-slate-400 text-xs mt-0.5">{chapter.title}</p>
                  </div>
                </button>

                {/* Chapter Lessons */}
                {isOpen && (
                  <div className="ml-4 space-y-1">
                    {chapterLessons.map(lesson => (
                      <button
                        key={lesson.id}
                        onClick={() => onSelectLesson(lesson.id)}
                        className={`w-full text-left px-3 py-2.5 rounded transition-all cursor-pointer flex items-center gap-3 border ${
                          activeLesson === lesson.id
                            ? 'bg-brand-teal/10 border-brand-teal/30'
                            : 'border-transparent hover:bg-white/5 hover:border-white/10'
                        }`}
                      >
                        <span
                          className={`text-xs font-mono flex-1 leading-tight ${
                            activeLesson === lesson.id ? 'text-white' : 'text-slate-400'
                          }`}
                        >
                          {lesson.title}
                        </span>
                      </button>
                    ))}
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
      {hasLessons && currentLesson && (
        <div className="border-t border-yellow-400/20 bg-gradient-to-br from-yellow-400/10 to-transparent p-5 flex-shrink-0">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-7 h-7 border-2 border-yellow-400/50 rounded-lg flex items-center justify-center bg-yellow-400/10">
              <span className="text-yellow-400 text-sm font-bold">!</span>
            </div>
            <div className="flex-1">
              <h4 className="text-yellow-400 text-sm font-bold mb-2">{t('learn.keyInsight')}</h4>
              <p className="text-slate-300 text-sm leading-relaxed">{currentLesson.insight}</p>
            </div>
          </div>
        </div>
      )}
    </aside>
  )
}

export default LessonSidebar
