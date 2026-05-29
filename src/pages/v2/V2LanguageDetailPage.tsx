import type { IconType } from 'react-icons'
import { Link, useParams } from 'react-router-dom'
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiCode, FiCpu, FiDatabase, FiGitBranch, FiGlobe, FiLayers, FiPlay, FiTerminal, FiZap } from 'react-icons/fi'
import { V2PressedButton, V2PublicShell } from '../../components/v2/V2PublicShell'

type LessonTag = 'Quan sát' | 'Thực hành' | 'Kiểm tra' | 'Debug'

type SyllabusLesson = {
  title: string
  tags: LessonTag[]
}

type SyllabusSection = {
  title: string
  description: string
  lessons: SyllabusLesson[]
}

type LanguageDetail = {
  name: string
  slug: string
  icon: IconType
  accent: string
  subtitle: string
  promise: string
  fit: string
  firstWin: string
  codeFile: string
  codeSample: string[]
  output: string
  syllabus: SyllabusSection[]
}

const sharedSyllabus: SyllabusSection[] = [
  {
    title: 'Bắt đầu thật nhỏ',
    description: 'Làm quen editor, chạy code mẫu, đọc output và sửa một dòng đầu tiên.',
    lessons: [
      { title: 'Chạy code mẫu đầu tiên', tags: ['Quan sát', 'Thực hành'] },
      { title: 'Đổi giá trị và xem output', tags: ['Thực hành', 'Kiểm tra'] },
      { title: 'Sửa lỗi cú pháp nhỏ', tags: ['Debug', 'Kiểm tra'] },
    ],
  },
  {
    title: 'Nền tảng logic',
    description: 'Biến, điều kiện và vòng lặp được học bằng bài ngắn có kiểm tra rõ ràng.',
    lessons: [
      { title: 'Lưu dữ liệu bằng biến', tags: ['Quan sát', 'Thực hành'] },
      { title: 'Rẽ nhánh bằng điều kiện', tags: ['Thực hành', 'Kiểm tra'] },
      { title: 'Lặp lại thao tác an toàn', tags: ['Debug', 'Kiểm tra'] },
    ],
  },
  {
    title: 'Tự tin làm bài mới',
    description: 'Tổng hợp các bước đã học thành mini challenge có run, check và debug.',
    lessons: [
      { title: 'Đọc yêu cầu và chia nhỏ', tags: ['Quan sát'] },
      { title: 'Viết lời giải ngắn', tags: ['Thực hành', 'Kiểm tra'] },
      { title: 'Hoàn thành checkpoint', tags: ['Debug', 'Kiểm tra'] },
    ],
  },
]

const languageDetails: Record<string, LanguageDetail> = {
  python: {
    name: 'Python',
    slug: 'python',
    icon: FiCpu,
    accent: 'bg-amber-200 text-amber-950 border-amber-300',
    subtitle: 'Bắt đầu nhẹ nhất cho người mới',
    promise: 'Học Python bằng output rõ ràng, ít nhiễu cú pháp và nhiều lần thử nhỏ.',
    fit: 'Bạn mới bắt đầu và muốn hiểu tư duy lập trình trước khi học tool phức tạp.',
    firstWin: 'In dòng chữ đầu tiên, đổi biến và biết vì sao output thay đổi.',
    codeFile: 'main.py',
    codeSample: ['name = "Loopy"', 'print(f"Xin chào {name}")'],
    output: 'Xin chào Loopy',
    syllabus: sharedSyllabus,
  },
  javascript: {
    name: 'JavaScript',
    slug: 'javascript',
    icon: FiCode,
    accent: 'bg-yellow-200 text-yellow-950 border-yellow-300',
    subtitle: 'Đường vào web tương tác',
    promise: 'Học JavaScript qua console, biến, function và những thay đổi thấy được ngay.',
    fit: 'Bạn muốn hiểu cách web phản hồi với hành động của người dùng.',
    firstWin: 'Chạy console log đầu tiên và sửa text bằng biến.',
    codeFile: 'main.js',
    codeSample: ['const name = "Loopy"', 'console.log(`Xin chào ${name}`)'],
    output: 'Xin chào Loopy',
    syllabus: sharedSyllabus,
  },
  html: {
    name: 'HTML',
    slug: 'html',
    icon: FiGlobe,
    accent: 'bg-orange-200 text-orange-950 border-orange-300',
    subtitle: 'Cấu trúc trang web đầu tiên',
    promise: 'Học HTML bằng cách chỉnh tag thật và xem trang thay đổi từng bước.',
    fit: 'Bạn muốn biết một trang web được dựng từ những khối nào.',
    firstWin: 'Tạo heading, đoạn văn và link đầu tiên.',
    codeFile: 'index.html',
    codeSample: ['<h1>Xin chào Loopy</h1>', '<p>Mình đang học HTML.</p>'],
    output: 'Trang hiển thị heading và đoạn văn.',
    syllabus: sharedSyllabus,
  },
  css: {
    name: 'CSS',
    slug: 'css',
    icon: FiLayers,
    accent: 'bg-sky-200 text-sky-950 border-sky-300',
    subtitle: 'Biến trang thô thành giao diện rõ ràng',
    promise: 'Học CSS qua selector, spacing, màu sắc và layout nhỏ dễ nhìn thấy.',
    fit: 'Bạn đã thấy HTML và muốn làm giao diện gọn, đẹp, responsive hơn.',
    firstWin: 'Đổi màu, khoảng cách và layout của một card.',
    codeFile: 'style.css',
    codeSample: ['.card {', '  padding: 16px;', '  border-radius: 20px;', '}'],
    output: 'Card có spacing và bo góc rõ ràng.',
    syllabus: sharedSyllabus,
  },
  sql: {
    name: 'SQL',
    slug: 'sql',
    icon: FiDatabase,
    accent: 'bg-emerald-200 text-emerald-950 border-emerald-300',
    subtitle: 'Hỏi dữ liệu bằng câu lệnh ngắn',
    promise: 'Học SQL bằng bảng nhỏ, query rõ ràng và kết quả kiểm tra được.',
    fit: 'Bạn muốn lấy, lọc và tổng hợp dữ liệu mà không cần viết app hoàn chỉnh.',
    firstWin: 'Viết SELECT đầu tiên và lọc dữ liệu bằng WHERE.',
    codeFile: 'query.sql',
    codeSample: ['SELECT name, score', 'FROM learners', 'WHERE score >= 80;'],
    output: 'Bảng kết quả chỉ còn learner đạt điều kiện.',
    syllabus: sharedSyllabus,
  },
  git: {
    name: 'Git',
    slug: 'git',
    icon: FiGitBranch,
    accent: 'bg-rose-200 text-rose-950 border-rose-300',
    subtitle: 'Lưu phiên bản code không sợ hỏng',
    promise: 'Học Git bằng thao tác nhỏ: xem thay đổi, commit, branch và quay lại an toàn.',
    fit: 'Bạn đã bắt đầu code và muốn biết cách lưu từng bước làm việc.',
    firstWin: 'Tạo commit đầu tiên và hiểu working tree đang sạch hay bẩn.',
    codeFile: 'terminal',
    codeSample: ['git status', 'git add index.html', 'git commit -m "first page"'],
    output: 'Working tree clean sau commit.',
    syllabus: sharedSyllabus,
  },
}

const tagClasses: Record<LessonTag, string> = {
  'Quan sát': 'bg-slate-100 text-slate-700 border-slate-200',
  'Thực hành': 'bg-brand-teal/15 text-brand-ocean border-brand-teal/30',
  'Kiểm tra': 'bg-emerald-100 text-emerald-800 border-emerald-200',
  Debug: 'bg-rose-100 text-rose-800 border-rose-200',
}

function LessonTagPill({ tag }: { tag: LessonTag }) {
  return <span className={`rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${tagClasses[tag]}`}>{tag}</span>
}

function CodePreview({ detail }: { detail: LanguageDetail }) {
  return (
    <div className="rounded-[2rem] border border-slate-200 bg-white p-3 shadow-xl shadow-slate-200/70">
      <div className="overflow-hidden rounded-[1.5rem] bg-slate-950 text-white">
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
          <div className="font-mono text-xs text-slate-400">{detail.codeFile}</div>
          <div className="rounded-xl bg-brand-teal px-3 py-2 text-xs font-black text-slate-950 shadow-[0_3px_0_#0b889c]">Kiểm tra</div>
        </div>
        <div className="bg-[#020617] p-5 font-mono text-sm leading-7">
          {detail.codeSample.map((line, index) => (
            <div key={`${line}-${index}`}><span className="select-none pr-4 text-slate-600">{index + 1}</span>{line}</div>
          ))}
        </div>
        <div className="border-t border-white/10 bg-black/30 p-4">
          <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-brand-teal"><FiTerminal /> Output</div>
          <div className="font-mono text-sm text-slate-300">{detail.output}</div>
        </div>
      </div>
    </div>
  )
}

const V2LanguageDetailPage: React.FC = () => {
  const { language } = useParams<{ language: string }>()
  const detail = languageDetails[language || 'javascript'] || languageDetails.javascript
  const Icon = detail.icon
  const related = Object.values(languageDetails).filter(item => item.slug !== detail.slug).slice(0, 3)

  return (
    <V2PublicShell>
      <main>
        <section className="relative overflow-hidden px-4 py-14 md:px-6 md:py-20">
          <div className="absolute left-0 top-16 h-72 w-72 rounded-full bg-brand-teal/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
            <div>
              <Link to="/v2/languages" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-950">
                <FiArrowLeft /> Tất cả lộ trình
              </Link>
              <div className="mb-5 flex items-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border text-3xl shadow-[0_5px_0_rgba(15,23,42,0.14)] ${detail.accent}`}><Icon /></div>
                <div>
                  <div className="text-sm font-black uppercase tracking-[0.2em] text-brand-ocean">Lộ trình {detail.name}</div>
                  <div className="mt-1 text-sm font-bold text-slate-500">{detail.subtitle}</div>
                </div>
              </div>
              <h1 className="max-w-3xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
                Học {detail.name} bằng một syllabus có đường đi rõ.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">{detail.promise}</p>
              <div className="mt-8 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Phù hợp nếu</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{detail.fit}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">First win</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{detail.firstWin}</p>
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <V2PressedButton to={`/library/${detail.slug}`}><FiPlay /> Bắt đầu bài đầu tiên</V2PressedButton>
                <V2PressedButton to="#syllabus" variant="secondary">Xem syllabus</V2PressedButton>
              </div>
            </div>
            <CodePreview detail={detail} />
          </div>
        </section>

        <section id="syllabus" className="bg-white px-4 py-16 md:px-6">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.7fr,1.3fr]">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.2em] text-brand-ocean">Syllabus</div>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Từng chương là một checkpoint nhỏ.</h2>
              <p className="mt-5 text-sm leading-6 text-slate-600">
                V2 detail page ưu tiên syllabus trước marketing. Tags phản ánh hành vi thật trong Loopy: quan sát, thực hành, kiểm tra và debug.
              </p>
            </div>
            <div className="grid gap-4">
              {detail.syllabus.map((section, sectionIndex) => (
                <div key={section.title} className="rounded-[2rem] border border-slate-200 bg-[#f8fafc] p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Chapter {sectionIndex + 1}</div>
                      <h3 className="mt-2 text-2xl font-black text-slate-950">{section.title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{section.description}</p>
                    </div>
                    <div className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-500">{section.lessons.length} bài</div>
                  </div>
                  <div className="mt-5 grid gap-2">
                    {section.lessons.map((lesson, lessonIndex) => (
                      <div key={lesson.title} className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-950 text-sm font-black text-brand-teal">{lessonIndex + 1}</div>
                          <div className="font-black text-slate-800">{lesson.title}</div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {lesson.tags.map(tag => <LessonTagPill key={tag} tag={tag} />)}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="px-4 py-16 md:px-6">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
              <div className="flex items-center gap-3 text-brand-ocean">
                <FiZap />
                <span className="text-sm font-black uppercase tracking-[0.2em]">Run vs Check</span>
              </div>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
                  <h3 className="font-black">Chạy thử</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Chỉ execute code và cho bạn xem output.</p>
                </div>
                <div className="rounded-2xl border border-brand-teal/30 bg-brand-teal/10 p-4">
                  <h3 className="font-black text-brand-ocean">Kiểm tra</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-600">Chấm bằng rule/test case trước khi lưu progress.</p>
                </div>
              </div>
            </div>
            <div>
              <div className="text-sm font-black uppercase tracking-[0.2em] text-brand-ocean">Related paths</div>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Có thể học song song sau khi có nền.</h2>
              <div className="mt-6 grid gap-3">
                {related.map(item => {
                  const RelatedIcon = item.icon
                  return (
                    <Link key={item.slug} to={`/v2/languages/${item.slug}`} className="group flex items-center justify-between rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-brand-teal hover:shadow-lg hover:shadow-slate-200">
                      <div className="flex items-center gap-3">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${item.accent}`}><RelatedIcon /></div>
                        <div>
                          <div className="font-black">{item.name}</div>
                          <div className="text-xs text-slate-500">{item.subtitle}</div>
                        </div>
                      </div>
                      <FiArrowRight className="text-slate-400 transition group-hover:translate-x-1 group-hover:text-brand-ocean" />
                    </Link>
                  )
                })}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 px-4 py-16 text-white md:px-6">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <FiCheckCircle className="mb-4 h-10 w-10 text-brand-teal" />
            <h2 className="text-4xl font-black tracking-tight">Sẵn sàng làm bài đầu tiên?</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Route v2 này mới là preview visual. CTA đưa về journey production hiện tại để không tạo flow giả.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <V2PressedButton to={`/library/${detail.slug}`}>Bắt đầu {detail.name}</V2PressedButton>
              <V2PressedButton to="/v2/languages" variant="secondary">Xem lộ trình khác</V2PressedButton>
            </div>
          </div>
        </section>
      </main>
    </V2PublicShell>
  )
}

export default V2LanguageDetailPage
