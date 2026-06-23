import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiBookOpen, FiCheckCircle, FiChevronDown, FiClock, FiCode, FiCompass, FiLock, FiPlay, FiTarget, FiZap } from 'react-icons/fi'
import { PressedButton, PublicShell } from '../components/PublicShell'
import { api } from '../lib/api'
import { useContentPreloader } from '../hooks/useContentPreloader'
import { LoadingScreen } from '../components/LoadingScreen'

type LessonState = 'done' | 'current' | 'next' | 'locked'

type JourneyLesson = {
  id: string
  title: string
  time: string
  state: LessonState
  tags: string[]
}

type JourneyChapter = {
  id: string
  title: string
  description: string
  lessons: JourneyLesson[]
}

const stateStyles: Record<LessonState, string> = {
  done: 'border-brand-teal bg-brand-teal/15 text-brand-ocean',
  current: 'border-brand-teal loopy-surface text-brand-teal shadow-[0_5px_0_rgba(15,23,42,0.18)]',
  next: 'border-brand-teal/40 loopy-surface text-[color:var(--loopy-text)]',
  locked: 'loopy-border loopy-surface-soft loopy-muted',
}

function JourneyNode({ lesson, index }: { lesson: JourneyLesson; index: number }) {
  const isLocked = lesson.state === 'locked'
  const isDone = lesson.state === 'done'
  const isCurrent = lesson.state === 'current'

  return (
    <div className={`relative rounded-[1.5rem] border p-4 transition ${stateStyles[lesson.state]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl text-sm font-black ${isDone ? 'bg-brand-teal text-slate-950' : isCurrent ? 'bg-slate-950 text-brand-teal' : 'bg-white text-slate-500'}`}>
            {isLocked ? <FiLock /> : isDone ? <FiCheckCircle /> : index + 1}
          </div>
          <div>
            <div className="font-black loopy-heading">{lesson.title}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-500"><FiClock /> {lesson.time}</div>
          </div>
        </div>
        {isCurrent && <div className="rounded-full bg-brand-teal px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-950">Bước tiếp theo</div>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {lesson.tags.map(tag => (
          <span key={tag} className="loopy-surface rounded-full border loopy-border px-2.5 py-1 text-[11px] font-black loopy-muted">{tag}</span>
        ))}
      </div>
    </div>
  )
}

function ProgressRing({ progress }: { progress: number }) {
  const circumference = 264
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className="relative h-28 w-28">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="9" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="#54d9c4" strokeWidth="9" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-black">{progress}%</div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Done</div>
      </div>
    </div>
  )
}

const LibraryPage: React.FC = () => {
  const { language } = useParams<{ language: string }>()
  const { i18n } = useTranslation()
  const slug = language || 'javascript'
  
  const [userLearningPath, setUserLearningPath] = useState<string>('first_steps')
  const [chapters, setChapters] = useState<JourneyChapter[]>([])
  const [progress, setProgress] = useState(0)
  const [apiLoading, setApiLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set())

  // Define all content keys needed for this page (including header)
  const contentKeys = [
    // Header content
    'nav.learn',
    'nav.playground',
    'nav.practice',
    'nav.docs',
    'nav.settings',
    'nav.logout',
    // Library page content
    'library.title',
    'library.subtitle',
    'library.badge',
    'library.back_btn',
    'library.progress.label',
    'library.progress.done',
    'library.next.badge',
    'library.next.empty',
    'library.next.active_desc',
    'library.next.locked_desc',
    'library.next.goal_badge',
    'library.next.goal_desc',
    'library.next.btn',
    'library.lock_rule.badge',
    'library.lock_rule.desc',
    'library.loading',
    'library.empty',
    'library.feat1.title',
    'library.feat1.desc',
    'library.feat2.title',
    'library.feat2.desc',
    'library.feat3.title',
    'library.feat3.desc',
    'library.cta.title',
    'library.cta.desc',
    'library.cta.btn_next',
    'library.cta.btn_change',
    // Footer content
    'footer.aboutLoopy',
    'footer.about',
    'footer.team',
    'footer.contact',
    'footer.resources',
    'footer.docs',
    'footer.blog',
    'footer.faq',
    'footer.description',
    'footer.allRightsReserved',
    'footer.privacy',
    'footer.terms',
  ]

  // Preload all content at once
  const { content, loading: contentLoading } = useContentPreloader(contentKeys, i18n.language)

  // Load user profile to get their selected learning path
  useEffect(() => {
    const loadUserProfile = async () => {
      const profileRes = await api.getMyProfile()
      const profile = (profileRes.data as any)?.profile || profileRes.data
      const pathFromProfile = profile?.learningPath || profile?.learning_path || profile?.learningGoal || profile?.learning_goal
      if (profileRes.success && typeof pathFromProfile === 'string' && pathFromProfile.trim()) {
        setUserLearningPath(pathFromProfile)
      }
    }

    loadUserProfile().catch(() => {
      setUserLearningPath('first_steps')
    })
  }, [])

  // Fetch curriculum from API (must be called before early return)
  useEffect(() => {
    const fetchData = async () => {
      try {
        setApiLoading(true)
        setError(null)

        const [curriculumRes, progressRes] = await Promise.all([
          api.getCurriculumByPath(slug, userLearningPath),
          api.getUserProgress().catch(() => ({ data: { progress: [] } }))
        ])

        const responseData = curriculumRes.data as any
        const progressRecords = (progressRes.data as any)?.progress || []
        
        const apiChapters = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.chapters)
            ? responseData.chapters
            : []
        const apiLessons = Array.isArray(responseData?.lessons) ? responseData.lessons : []
        
        if (curriculumRes.success && apiChapters.length > 0) {
          // Flatten and sort all lessons to easily find current/next
          const allLessonsSorted = [...apiLessons].sort((a: any, b: any) => (a.orderIndex ?? a.order_index ?? 0) - (b.orderIndex ?? b.order_index ?? 0))
          
          let foundCurrent = false
          const lessonStates = new Map<string, LessonState>()
          
          for (let i = 0; i < allLessonsSorted.length; i++) {
            const lesson = allLessonsSorted[i]
            const lessonId = lesson.id // This is the UUID
            
            const progress = progressRecords.find((p: any) => 
              p.lessonId === lessonId || p.lesson_id === lessonId
            )
            
            if (progress?.status === 'completed') {
              lessonStates.set(lessonId, 'done')
            } else if (!foundCurrent) {
              lessonStates.set(lessonId, 'current')
              foundCurrent = true
              
              // Set the next one if it exists
              if (i + 1 < allLessonsSorted.length) {
                lessonStates.set(allLessonsSorted[i + 1].id, 'next')
              }
            } else {
              if (!lessonStates.has(lessonId)) {
                lessonStates.set(lessonId, 'locked')
              }
            }
          }

          const chaptersData: JourneyChapter[] = apiChapters.map((chapter: any) => {
            const lessons = apiLessons
              .filter((lesson: any) => lesson.chapterId === chapter.id || lesson.chapter_id === chapter.id)
              .sort((a: any, b: any) => (a.orderIndex ?? a.order_index ?? 0) - (b.orderIndex ?? b.order_index ?? 0))

            return {
              id: chapter.id,
              title: chapter.title || chapter.name || 'Untitled Chapter',
              description: chapter.description || 'Học các bài trong chương này.',
              lessons: lessons.map((lesson: any) => {
                const id = lesson.lessonId || lesson.lesson_id || lesson.id
                return {
                  id,
                  title: lesson.title || 'Untitled Lesson',
                  time: `${lesson.estimatedTime || lesson.estimated_time || 10} phút`,
                  state: lessonStates.get(lesson.id) || 'locked',
                  tags: ['Quan sát', 'Thực hành'],
                }
              }),
            }
          })
          
          setChapters(chaptersData as any)
          
          const totalLessons = chaptersData.reduce((sum, ch) => sum + ch.lessons.length, 0)
          const doneLessons = chaptersData.reduce((sum, ch) => sum + ch.lessons.filter(l => l.state === 'done').length, 0)
          setProgress(totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0)
        } else {
          setChapters([])
          setProgress(0)
        }
      } catch (err) {
        console.error('Error fetching curriculum:', err)
        setError('Lỗi khi tải danh sách bài học')
      } finally {
        setApiLoading(false)
      }
    }

    fetchData()
  }, [slug, userLearningPath])

  useEffect(() => {
    if (chapters.length === 0) {
      setExpandedChapters(new Set())
      return
    }

    setExpandedChapters(current => {
      if (current.size > 0) return current
      const activeChapter = chapters.find(ch => ch.lessons.some(lesson => lesson.state === 'current')) || chapters[0]
      return new Set([activeChapter.id])
    })
  }, [chapters])

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(current => {
      const next = new Set(current)
      if (next.has(chapterId)) {
        next.delete(chapterId)
      } else {
        next.add(chapterId)
      }
      return next
    })
  }

  // Show loading screen while content is being fetched
  if (contentLoading) {
    return <LoadingScreen message="Loading library..." />
  }

  // Extract header content
  const headerContent = {
    'nav.learn': content['nav.learn'],
    'nav.playground': content['nav.playground'],
    'nav.practice': content['nav.practice'],
    'nav.docs': content['nav.docs'],
    'nav.settings': content['nav.settings'],
    'nav.logout': content['nav.logout'],
  }

  // Extract footer content
  const footerContent = {
    'footer.aboutLoopy': content['footer.aboutLoopy'],
    'footer.about': content['footer.about'],
    'footer.team': content['footer.team'],
    'footer.contact': content['footer.contact'],
    'footer.resources': content['footer.resources'],
    'footer.docs': content['footer.docs'],
    'footer.blog': content['footer.blog'],
    'footer.faq': content['footer.faq'],
    'footer.description': content['footer.description'],
    'footer.allRightsReserved': content['footer.allRightsReserved'],
    'footer.privacy': content['footer.privacy'],
    'footer.terms': content['footer.terms'],
  }

  // Extract content values with fallbacks
  const libraryTitle = content['library.title'] || 'Library không chỉ là danh sách bài. Nó là bản đồ bước tiếp theo.'
  const librarySubtitle = content['library.subtitle'] || 'Bạn có thể thấy bài nào đã xong, bài nào đang học và vì sao bài sau đang bị khóa.'
  const libraryBadge = content['library.badge'] || 'Journey Map'
  const backBtn = content['library.back_btn'] || 'Quay lại danh sách lộ trình'
  const progressLabel = content['library.progress.label'] || 'Tiến độ'
  const progressDone = content['library.progress.done'] || 'bài đã hoàn thành.'
  const nextBadge = content['library.next.badge'] || 'Bước tiếp theo'
  const nextEmpty = content['library.next.empty'] || 'Chưa có bài'
  const nextActiveDesc = content['library.next.active_desc'] || 'Bài này mở vì bạn đã hoàn thành bài trước. Học, chạy thử, kiểm tra, rồi lưu progress.'
  const nextLockedDesc = content['library.next.locked_desc'] || 'Hoàn thành bài hiện tại để mở bài tiếp theo.'
  const nextGoalBadge = content['library.next.goal_badge'] || 'Mục tiêu'
  const nextGoalDesc = content['library.next.goal_desc'] || 'Sửa code theo yêu cầu và pass rule kiểm tra.'
  const nextBtn = content['library.next.btn'] || 'Vào lesson'
  const lockRuleBadge = content['library.lock_rule.badge'] || 'Quy tắc khóa bài'
  const lockRuleDesc = content['library.lock_rule.desc'] || 'Bài tiếp theo chỉ mở sau khi bài hiện tại hoàn thành thành công. Không celebration trước khi progress lưu xong.'
  const loadingText = content['library.loading'] || 'Đang tải danh sách chương...'
  const emptyText = content['library.empty'] || 'Chưa có chương nào cho lộ trình này.'
  const feat1Title = content['library.feat1.title'] || 'Rõ bài hiện tại'
  const feat1Desc = content['library.feat1.desc'] || 'Người mới không phải tự đoán học tiếp ở đâu.'
  const feat2Title = content['library.feat2.title'] || 'Liên kết với Learn'
  const feat2Desc = content['library.feat2.desc'] || 'Library chỉ chọn bài, Learn mới là nơi chạy và kiểm tra code.'
  const feat3Title = content['library.feat3.title'] || 'Progress đáng tin'
  const feat3Desc = content['library.feat3.desc'] || 'Chỉ mở khóa sau khi backend xác nhận hoàn thành.'
  const ctaTitle = content['library.cta.title'] || 'Sẵn sàng bắt đầu?'
  const ctaDesc = content['library.cta.desc'] || 'Bài đầu tiên sẽ dạy bạn quan sát code mẫu, chạy thử output, rồi sửa một dòng nhỏ.'
  const ctaNextBtn = content['library.cta.btn_next'] || 'Vào bài tiếp theo'
  const ctaChangeBtn = content['library.cta.btn_change'] || 'Đổi lộ trình'

  const nextLesson = chapters
    .flatMap(ch => ch.lessons)
    .find(l => l.state === 'current')

  return (
    <PublicShell headerContent={headerContent} footerContent={footerContent}>
      <main>
        <section className="relative overflow-hidden px-4 py-14 md:px-6 md:py-20">
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-brand-teal/20 blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <Link to="/languages" className="mb-6 inline-flex items-center gap-2 text-sm font-black loopy-muted hover:text-brand-teal">
              <FiCompass /> {backBtn}
            </Link>
            <div className="grid gap-8 lg:grid-cols-[1fr,380px] lg:items-start">
              <div>
                <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                  {libraryBadge}
                </div>
                
                <h1 className="loopy-heading max-w-4xl text-5xl font-black tracking-tight md:text-7xl">
                  {libraryTitle}
                </h1>
                <p className="loopy-body mt-6 max-w-2xl text-lg leading-8">
                  {librarySubtitle}
                </p>
              </div>
              <aside className="loopy-card rounded-[2rem] border p-5 shadow-xl">
                <div className="flex items-center gap-5">
                  <ProgressRing progress={progress} />
                  <div>
                    <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">{progressLabel}</div>
                    <h2 className="mt-2 text-2xl font-black">{slug.charAt(0).toUpperCase() + slug.slice(1)} Starter</h2>
                    <p className="mt-2 text-sm leading-6 loopy-muted">{progress}% {progressDone}</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {[
                    [chapters.length.toString(), 'Chương'],
                    [chapters.reduce((sum, ch) => sum + ch.lessons.length, 0).toString(), 'Bài'],
                    ['1', 'Next'],
                  ].map(([value, label]) => (
                    <div key={label} className="loopy-card-soft rounded-2xl border p-3">
                      <div className="text-xl font-black">{value}</div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">{label}</div>
                    </div>
                  ))}
                </div>
              </aside>
            </div>
          </div>
        </section>

        <section className="px-4 pb-16 md:px-6">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[380px,1fr]">
            <aside className="lg:sticky lg:top-24 lg:self-start">
              <div className="rounded-[2rem] border border-white/10 bg-slate-950 p-6 text-white shadow-xl">
                <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-teal">
                  <FiPlay /> {nextBadge}
                </div>
                <h2 className="text-3xl font-black">{nextLesson?.title || nextEmpty}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {nextLesson ? nextActiveDesc : nextLockedDesc}
                </p>
                {nextLesson && (
                  <div className="mt-5 rounded-2xl border border-brand-teal/30 bg-brand-teal/10 p-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-brand-teal">{nextGoalBadge}</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">{nextGoalDesc}</p>
                  </div>
                )}
                <div className="mt-6">
                  {nextLesson && (
                    <PressedButton to={`/learn/${slug}/${nextLesson.id}`}>{nextBtn}</PressedButton>
                  )}
                </div>
              </div>

              <div className="loopy-card mt-4 rounded-[2rem] border p-5">
                <div className="flex items-center gap-2 text-sm font-black text-brand-ocean"><FiTarget /> {lockRuleBadge}</div>
                <p className="mt-3 text-sm leading-6 loopy-muted">
                  {lockRuleDesc}
                </p>
              </div>
            </aside>

            <div className="grid gap-5">
              {apiLoading && (
                <div className="text-center loopy-muted">
                  {loadingText}
                </div>
              )}
              
              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                  {error}
                </div>
              )}
              
              {!apiLoading && chapters.length > 0 && (
                <div className="max-h-[calc(100vh-8rem)] space-y-4 overflow-y-auto pr-1 lg:pr-3">
                  {chapters.map((chapter: JourneyChapter, chapterIndex: number) => {
                    const isExpanded = expandedChapters.has(chapter.id)
                    const currentCount = chapter.lessons.filter(lesson => lesson.state === 'current').length
                    const doneCount = chapter.lessons.filter(lesson => lesson.state === 'done').length

                    return (
                      <section key={chapter.id} className="loopy-card overflow-hidden rounded-[2rem] border shadow-sm transition hover:shadow-lg">
                        <button
                          type="button"
                          onClick={() => toggleChapter(chapter.id)}
                          aria-expanded={isExpanded}
                          className="flex w-full flex-col gap-3 p-5 text-left transition hover:bg-brand-teal/5 sm:flex-row sm:items-start sm:justify-between"
                        >
                          <div>
                            <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Chapter {chapterIndex + 1}</div>
                            <h2 className="loopy-heading mt-2 text-2xl font-black">{chapter.title}</h2>
                            <p className="loopy-body mt-2 text-sm leading-6">{chapter.description}</p>
                            <div className="mt-3 flex flex-wrap gap-2">
                              <span className="loopy-surface-soft rounded-full border loopy-border px-3 py-1 text-xs font-black loopy-muted">{chapter.lessons.length} bài</span>
                              {doneCount > 0 && (
                                <span className="rounded-full border border-brand-teal/30 bg-brand-teal/10 px-3 py-1 text-xs font-black text-brand-ocean">{doneCount} đã xong</span>
                              )}
                              {currentCount > 0 && (
                                <span className="rounded-full border border-amber-300/50 bg-amber-100 px-3 py-1 text-xs font-black text-amber-700">Đang học</span>
                              )}
                            </div>
                          </div>
                          <div className="flex shrink-0 items-center gap-3">
                            <span className="text-xs font-black uppercase tracking-[0.16em] loopy-muted">
                              {isExpanded ? 'Thu gọn' : 'Mở'}
                            </span>
                            <span className={`flex h-10 w-10 items-center justify-center rounded-2xl border loopy-border loopy-surface-soft transition ${isExpanded ? 'rotate-180 text-brand-ocean' : 'loopy-muted'}`}>
                              <FiChevronDown />
                            </span>
                          </div>
                        </button>

                        <div className={`grid transition-all duration-300 ease-out ${isExpanded ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                          <div className="overflow-hidden">
                            <div className="grid gap-3 border-t loopy-border p-5 pt-4">
                              {chapter.lessons.map((lesson: JourneyLesson, lessonIndex: number) => (
                                <JourneyNode key={lesson.id} lesson={lesson} index={lessonIndex} />
                              ))}
                            </div>
                          </div>
                        </div>
                      </section>
                    )
                  })}
                </div>
              )}
              
              {!apiLoading && chapters.length === 0 && !error && (
                <div className="loopy-card-soft rounded-2xl border p-6 text-center loopy-muted">
                  {emptyText}
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="loopy-surface px-4 py-16 md:px-6">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            {[
              [FiBookOpen, feat1Title, feat1Desc],
              [FiCode, feat2Title, feat2Desc],
              [FiZap, feat3Title, feat3Desc],
            ].map(([Icon, title, description]) => {
              const CardIcon = Icon as typeof FiBookOpen
              return (
                <div key={title as string} className="loopy-card-soft rounded-[2rem] border p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-brand-teal shadow-[0_4px_0_#54d9c4]"><CardIcon /></div>
                  <h3 className="text-2xl font-black">{title as string}</h3>
                  <p className="loopy-body mt-3 text-sm leading-6">{description as string}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="bg-slate-950 px-4 py-16 text-white md:px-6">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <FiCheckCircle className="mb-4 h-10 w-10 text-brand-teal" />
            <h2 className="text-4xl font-black tracking-tight">{ctaTitle}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              {ctaDesc}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {nextLesson && (
                <PressedButton to={`/learn/${slug}/${nextLesson.id}`}><FiPlay /> {ctaNextBtn}</PressedButton>
              )}
              <PressedButton to="/languages" variant="secondary">{ctaChangeBtn}</PressedButton>
            </div>
          </div>
        </section>
      </main>
    </PublicShell>
  )
}

export default LibraryPage
