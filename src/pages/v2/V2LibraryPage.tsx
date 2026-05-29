import { Link } from 'react-router-dom'
import { FiBookOpen, FiCheckCircle, FiClock, FiCode, FiCompass, FiLock, FiPlay, FiTarget, FiZap } from 'react-icons/fi'
import { V2PressedButton, V2PublicShell } from '../../components/v2/V2PublicShell'

type LessonState = 'done' | 'current' | 'next' | 'locked'

type JourneyLesson = {
  title: string
  time: string
  state: LessonState
  tags: string[]
}

type JourneyChapter = {
  title: string
  description: string
  lessons: JourneyLesson[]
}

const chapters: JourneyChapter[] = [
  {
    title: 'Khởi động với code thật',
    description: 'Nhìn code mẫu, chạy thử output và sửa một dòng đầu tiên.',
    lessons: [
      { title: 'Chạy code mẫu', time: '4 phút', state: 'done', tags: ['Quan sát', 'Chạy thử'] },
      { title: 'Đổi biến name', time: '6 phút', state: 'done', tags: ['Thực hành', 'Kiểm tra'] },
      { title: 'Sửa output lời chào', time: '7 phút', state: 'current', tags: ['Debug', 'Kiểm tra'] },
    ],
  },
  {
    title: 'Logic đầu tiên',
    description: 'Bắt đầu dùng điều kiện và vòng lặp bằng bài nhỏ có test rõ.',
    lessons: [
      { title: 'Nếu điểm đủ qua bài', time: '8 phút', state: 'next', tags: ['Thực hành', 'Kiểm tra'] },
      { title: 'Lặp danh sách tên', time: '9 phút', state: 'locked', tags: ['Quan sát', 'Thực hành'] },
      { title: 'Debug vòng lặp sai', time: '8 phút', state: 'locked', tags: ['Debug'] },
    ],
  },
  {
    title: 'Checkpoint nhỏ',
    description: 'Tự đọc yêu cầu, chạy thử, kiểm tra và lưu progress khi hoàn thành.',
    lessons: [
      { title: 'Mini challenge: greeting bot', time: '12 phút', state: 'locked', tags: ['Thực hành', 'Kiểm tra'] },
      { title: 'Sửa lỗi cuối cùng', time: '8 phút', state: 'locked', tags: ['Debug'] },
    ],
  },
]

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

function ProgressRing() {
  return (
    <div className="relative h-28 w-28">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="9" />
        <circle cx="50" cy="50" r="42" fill="none" stroke="#54d9c4" strokeWidth="9" strokeLinecap="round" strokeDasharray="264" strokeDashoffset="176" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <div className="text-2xl font-black">33%</div>
        <div className="text-[10px] font-black uppercase tracking-widest text-slate-400">Done</div>
      </div>
    </div>
  )
}

const V2LibraryPage: React.FC = () => {
  return (
    <V2PublicShell>
      <main>
        <section className="relative overflow-hidden px-4 py-14 md:px-6 md:py-20">
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-brand-teal/20 blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <Link to="/v2/languages/javascript" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-950">
              <FiCompass /> JavaScript path preview
            </Link>
            <div className="grid gap-8 lg:grid-cols-[1fr,380px] lg:items-start">
              <div>
                <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                  Journey Map sandbox
                </div>
                <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
                  Library không chỉ là danh sách bài. Nó là bản đồ bước tiếp theo.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                  V2 library thử layout giúp người mới biết bài nào đã xong, bài nào đang học và vì sao bài sau đang bị khóa.
                </p>
              </div>
              <aside className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/80">
                <div className="flex items-center gap-5">
                  <ProgressRing />
                  <div>
                    <div className="text-sm font-black uppercase tracking-[0.18em] text-slate-400">Tiến độ mẫu</div>
                    <h2 className="mt-2 text-2xl font-black">JavaScript Starter</h2>
                    <p className="mt-2 text-sm leading-6 text-slate-600">2/6 bài mở đầu đã hoàn thành.</p>
                  </div>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-2 text-center">
                  {[
                    ['3', 'Chương'],
                    ['8', 'Bài'],
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
                <h2 className="text-3xl font-black">Sửa output lời chào</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">
                  Bài hiện tại mở vì bạn đã hoàn thành 2 bài trước. Học 7 phút, chạy thử, kiểm tra, rồi lưu progress.
                </p>
                <div className="mt-5 rounded-2xl border border-brand-teal/30 bg-brand-teal/10 p-4">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-brand-teal">Mục tiêu</div>
                  <p className="mt-2 text-sm leading-6 text-slate-300">Đổi biến, chạy output và pass rule kiểm tra lời chào.</p>
                </div>
                <div className="mt-6">
                  <V2PressedButton to="/learn/javascript/demo">Vào lesson production</V2PressedButton>
                </div>
              </div>

              <div className="mt-4 rounded-[2rem] border border-slate-200 bg-white p-5">
                <div className="flex items-center gap-2 text-sm font-black text-brand-ocean"><FiTarget /> Quy tắc khóa bài</div>
                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Bài tiếp theo chỉ mở sau khi bài hiện tại `completeLesson` thành công. Không celebration trước khi progress lưu xong.
                </p>
              </div>
            </aside>

            <div className="grid gap-5">
              {chapters.map((chapter, chapterIndex) => (
                <section key={chapter.title} className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Chapter {chapterIndex + 1}</div>
                      <h2 className="mt-2 text-2xl font-black text-slate-950">{chapter.title}</h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{chapter.description}</p>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-[#f8fafc] px-3 py-1 text-xs font-black text-slate-500">{chapter.lessons.length} bài</div>
                  </div>
                  <div className="grid gap-3">
                    {chapter.lessons.map((lesson, lessonIndex) => (
                      <JourneyNode key={lesson.title} lesson={lesson} index={lessonIndex} />
                    ))}
                  </div>
                </section>
              ))}
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
            <h2 className="text-4xl font-black tracking-tight">Tiếp theo nên polish Learn v2.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Library v2 đã mô tả bản đồ. Bước kế tiếp là preview màn lesson nơi user thực sự quan sát, chạy thử, kiểm tra và debug.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <V2PressedButton to="/sample-lesson">Thử bài mẫu hiện tại</V2PressedButton>
              <V2PressedButton to="/v2/languages" variant="secondary">Đổi lộ trình</V2PressedButton>
            </div>
          </div>
        </section>
      </main>
    </V2PublicShell>
  )
}

export default V2LibraryPage
