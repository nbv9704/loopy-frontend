import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { FiBookOpen, FiCheckCircle, FiClock, FiCode, FiCompass, FiLock, FiPlay, FiTarget, FiZap } from 'react-icons/fi'
import { V2PressedButton, V2PublicShell } from '../../components/v2/V2PublicShell'
import { api } from '../../lib/api'

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
  current: 'border-slate-950 bg-white text-slate-950 shadow-[0_5px_0_rgba(15,23,42,0.18)]',
  next: 'border-slate-300 bg-white text-slate-800',
  locked: 'border-slate-200 bg-slate-100 text-slate-400',
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
            <div className="font-black text-slate-900">{lesson.title}</div>
            <div className="mt-1 flex items-center gap-1.5 text-xs font-bold text-slate-500"><FiClock /> {lesson.time}</div>
          </div>
        </div>
        {isCurrent && <div className="rounded-full bg-brand-teal px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-950">Bước tiếp theo</div>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {lesson.tags.map(tag => (
          <span key={tag} className="rounded-full border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-black text-slate-500">{tag}</span>
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

const V2LibraryPage: React.FC = () => {
  const { language } = useParams<{ language: string }>()
  const slug = language || 'javascript'
  
  const [chapters, setChapters] = useState<JourneyChapter[]>([])
  const [progress, setProgress] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch chapters by language
        const chaptersResponse = await api.getChaptersByLanguage(slug)
        
        if (chaptersResponse.success && chaptersResponse.data && Array.isArray(chaptersResponse.data)) {
          // Fetch lessons for each chapter
          const chaptersData: JourneyChapter[] = await Promise.all(
            ((chaptersResponse.data as any[]) || []).map(async (chapter: any) => {
              const lessonsResponse = await api.getLessonsByChapter(chapter.id)
              const lessons = (lessonsResponse.success && lessonsResponse.data ? lessonsResponse.data : []) as any[]
              
              return {
                id: chapter.id,
                title: chapter.title || chapter.name || 'Untitled Chapter',
                description: chapter.description || 'Học các bài trong chương này.',
                lessons: lessons.map((lesson: any, index: number) => ({
                  id: lesson.id,
                  title: lesson.title || 'Untitled Lesson',
                  time: `${5 + index * 2} phút`,
                  state: (index === 0 ? 'done' : index === 1 ? 'current' : index === 2 ? 'next' : 'locked') as LessonState,
                  tags: ['Quan sát', 'Thực hành'],
                })),
              }
            })
          )
          
          setChapters(chaptersData as any)
          
          // Calculate progress (simple: 1/3 done)
          const totalLessons = chaptersData.reduce((sum, ch) => sum + ch.lessons.length, 0)
          const doneLessons = chaptersData.reduce((sum, ch) => sum + ch.lessons.filter(l => l.state === 'done').length, 0)
          setProgress(totalLessons > 0 ? Math.round((doneLessons / totalLessons) * 100) : 0)
        } else {
          setError('Không thể tải danh sách chương')
        }
      } catch (err) {
        console.error('Error fetching chapters:', err)
        setError('Lỗi khi tải danh sách chương')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [slug])

  const nextLesson = chapters
    .flatMap(ch => ch.lessons)
    .find(l => l.state === 'current')

  return (
    <V2PublicShell>
      <main>
        <section className="relative overflow-hidden px-4 py-14 md:px-6 md:py-20">
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-brand-teal/20 blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <Link to="/languages" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-950">
              <FiCompass /> Quay lại danh sách lộ trình
            </Link>
            <div className="grid gap-8 lg:grid-cols-[1fr,380px] lg:items-start">
              <div>
                <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                  Journey Map
                </div>
                <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
                  Library không chỉ là danh sách bài. Nó là bản đồ bước tiếp theo.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                  Bạn có thể thấy bài nào đã xong, bài nào đang học và vì sao bài sau đang bị khóa.
                </p>
              </div>
              <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/80">
                <div className="flex items-center gap-5">
                  <ProgressRing progress={progress} />
                  <div>
                    <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Tiến độ</div>
                    <h2 className="mt-2 text-2xl font-black">{slug.charAt(0).toUpperCase() + slug.slice(1)} Starter</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{progress}% bài đã hoàn thành.</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {[
                    [chapters.length.toString(), 'Chương'],
                    [chapters.reduce((sum, ch) => sum + ch.lessons.length, 0).toString(), 'Bài'],
                    ['1', 'Next'],
                  ].map(([value, label]) => (
                    <div key={label} className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-3">
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
              <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/80">
                <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-teal">
                  <FiPlay /> Bước tiếp theo
                </div>
                <h2 className="text-3xl font-black">{nextLesson?.title || 'Chưa có bài'}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  {nextLesson ? 'Bài này mở vì bạn đã hoàn thành bài trước. Học, chạy thử, kiểm tra, rồi lưu progress.' : 'Hoàn thành bài hiện tại để mở bài tiếp theo.'}
                </p>
                {nextLesson && (
                  <div className="mt-5 rounded-2xl border border-brand-teal/30 bg-brand-teal/10 p-4">
                    <div className="text-xs font-black uppercase tracking-[0.18em] text-brand-teal">Mục tiêu</div>
                    <p className="mt-2 text-sm leading-6 text-slate-300">Sửa code theo yêu cầu và pass rule kiểm tra.</p>
                  </div>
                )}
                <div className="mt-6">
                  {nextLesson && (
                    <V2PressedButton to={`/learn/${slug}/${nextLesson.id}`}>Vào lesson</V2PressedButton>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-[2rem] border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 text-sm font-black text-brand-ocean"><FiTarget /> Quy tắc khóa bài</div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Bài tiếp theo chỉ mở sau khi bài hiện tại hoàn thành thành công. Không celebration trước khi progress lưu xong.
                </p>
              </div>
            </aside>

            <div className="grid gap-5">
              {loading && (
                <div className="text-center text-slate-600">
                  Đang tải danh sách chương...
                </div>
              )}
              
              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                  {error}
                </div>
              )}
              
              {!loading && chapters.length > 0 && ((chapters as any) || []).map((chapter: JourneyChapter, chapterIndex: number) => (
                <section key={chapter.id} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Chapter {chapterIndex + 1}</div>
                      <h2 className="mt-2 text-2xl font-black text-slate-950">{chapter.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{chapter.description}</p>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-[#f8fafc] px-3 py-1 text-xs font-black text-slate-500">{chapter.lessons.length} bài</div>
                  </div>
                  <div className="grid gap-3">
                    {chapter.lessons.map((lesson: JourneyLesson, lessonIndex: number) => (
                      <JourneyNode key={lesson.id} lesson={lesson} index={lessonIndex} />
                    ))}
                  </div>
                </section>
              ))}
              
              {!loading && chapters.length === 0 && !error && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                  Chưa có chương nào cho lộ trình này.
                </div>
              )}
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            {[
              [FiBookOpen, 'Rõ bài hiện tại', 'Người mới không phải tự đoán học tiếp ở đâu.'],
              [FiCode, 'Liên kết với Learn', 'Library chỉ chọn bài, Learn mới là nơi chạy và kiểm tra code.'],
              [FiZap, 'Progress đáng tin', 'Chỉ mở khóa sau khi backend xác nhận hoàn thành.'],
            ].map(([Icon, title, description]) => {
              const CardIcon = Icon as typeof FiBookOpen
              return (
                <div key={title as string} className="rounded-[2rem] border border-slate-200 bg-[#f8fafc] p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-brand-teal shadow-[0_4px_0_#54d9c4]"><CardIcon /></div>
                  <h3 className="text-2xl font-black">{title as string}</h3>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{description as string}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="bg-slate-950 px-4 py-16 text-white md:px-6">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <FiCheckCircle className="mb-4 h-10 w-10 text-brand-teal" />
            <h2 className="text-4xl font-black tracking-tight">Sẵn sàng bắt đầu?</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Bài đầu tiên sẽ dạy bạn quan sát code mẫu, chạy thử output, rồi sửa một dòng nhỏ.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              {nextLesson && (
                <V2PressedButton to={`/learn/${slug}/${nextLesson.id}`}><FiPlay /> Vào bài tiếp theo</V2PressedButton>
              )}
              <V2PressedButton to="/languages" variant="secondary">Đổi lộ trình</V2PressedButton>
            </div>
          </div>
        </section>
      </main>
    </V2PublicShell>
  )
}

export default V2LibraryPage
