import { useEffect, useState } from 'react'
import type { IconType } from 'react-icons'
import { Link, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { FiArrowLeft, FiCheckCircle, FiCode, FiCpu, FiDatabase, FiGitBranch, FiGlobe, FiLayers, FiPlay, FiTerminal } from 'react-icons/fi'
import { V2PressedButton, V2PublicShell } from '../../components/v2/V2PublicShell'
import { api } from '../../lib/api'
import { useContentPreloader } from '../../hooks/useContentPreloader'
import { LoadingScreen } from '../../components/v2/LoadingScreen'

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

// Icon mapping for languages
const iconMap: Record<string, typeof FiCpu> = {
  python: FiCpu,
  javascript: FiCode,
  html: FiGlobe,
  css: FiLayers,
  sql: FiDatabase,
  git: FiGitBranch,
  cpp: FiCpu,
  c: FiCpu,
}

// Accent color mapping for languages
const accentMap: Record<string, string> = {
  python: 'bg-amber-200 text-amber-950 border-amber-300',
  javascript: 'bg-yellow-200 text-yellow-950 border-yellow-300',
  html: 'bg-orange-200 text-orange-950 border-orange-300',
  css: 'bg-sky-200 text-sky-950 border-sky-300',
  sql: 'bg-emerald-200 text-emerald-950 border-emerald-300',
  git: 'bg-rose-200 text-rose-950 border-rose-300',
  cpp: 'bg-purple-200 text-purple-950 border-purple-300',
  c: 'bg-indigo-200 text-indigo-950 border-indigo-300',
}

// Language descriptions
const descriptionMap: Record<string, { subtitle: string; promise: string; fit: string; firstWin: string; codeFile: string; codeSample: string[]; output: string }> = {
  python: {
    subtitle: 'Bắt đầu nhẹ nhất cho người mới',
    promise: 'Học Python bằng output rõ ràng, ít nhiễu cú pháp và nhiều lần thử nhỏ.',
    fit: 'Bạn mới bắt đầu và muốn hiểu tư duy lập trình trước khi học tool phức tạp.',
    firstWin: 'In dòng chữ đầu tiên, đổi biến và biết vì sao output thay đổi.',
    codeFile: 'main.py',
    codeSample: ['name = "Loopy"', 'print(f"Xin chào {name}")'],
    output: 'Xin chào Loopy',
  },
  javascript: {
    subtitle: 'Đường vào web tương tác',
    promise: 'Học JavaScript qua console, biến, function và những thay đổi thấy được ngay.',
    fit: 'Bạn muốn hiểu cách web phản hồi với hành động của người dùng.',
    firstWin: 'Chạy console log đầu tiên và sửa text bằng biến.',
    codeFile: 'main.js',
    codeSample: ['const name = "Loopy"', 'console.log(`Xin chào ${name}`)'],
    output: 'Xin chào Loopy',
  },
  html: {
    subtitle: 'Cấu trúc trang web đầu tiên',
    promise: 'Học HTML bằng cách chỉnh tag thật và xem trang thay đổi từng bước.',
    fit: 'Bạn muốn biết một trang web được dựng từ những khối nào.',
    firstWin: 'Tạo heading, đoạn văn và link đầu tiên.',
    codeFile: 'index.html',
    codeSample: ['<h1>Xin chào Loopy</h1>', '<p>Mình đang học HTML.</p>'],
    output: 'Trang hiển thị heading và đoạn văn.',
  },
  css: {
    subtitle: 'Biến trang thô thành giao diện rõ ràng',
    promise: 'Học CSS qua selector, spacing, màu sắc và layout nhỏ dễ nhìn thấy.',
    fit: 'Bạn đã thấy HTML và muốn làm giao diện gọn, đẹp, responsive hơn.',
    firstWin: 'Đổi màu, khoảng cách và layout của một card.',
    codeFile: 'style.css',
    codeSample: ['.card {', '  padding: 16px;', '  border-radius: 20px;', '}'],
    output: 'Card có spacing và bo góc rõ ràng.',
  },
  sql: {
    subtitle: 'Hỏi dữ liệu bằng câu lệnh ngắn',
    promise: 'Học SQL bằng bảng nhỏ, query rõ ràng và kết quả kiểm tra được.',
    fit: 'Bạn muốn lấy, lọc và tổng hợp dữ liệu mà không cần viết app hoàn chỉnh.',
    firstWin: 'Viết SELECT đầu tiên và lọc dữ liệu bằng WHERE.',
    codeFile: 'query.sql',
    codeSample: ['SELECT name, score', 'FROM learners', 'WHERE score >= 80;'],
    output: 'Bảng kết quả chỉ còn learner đạt điều kiện.',
  },
  git: {
    subtitle: 'Lưu phiên bản code không sợ hỏng',
    promise: 'Học Git bằng thao tác nhỏ: xem thay đổi, commit, branch và quay lại an toàn.',
    fit: 'Bạn đã bắt đầu code và muốn biết cách lưu từng bước làm việc.',
    firstWin: 'Tạo commit đầu tiên và hiểu working tree đang sạch hay bẩn.',
    codeFile: 'terminal',
    codeSample: ['git status', 'git add index.html', 'git commit -m "first page"'],
    output: 'Working tree clean sau commit.',
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
  const { i18n } = useTranslation()
  const slug = language || 'javascript'
  
  const [chapters, setChapters] = useState<any[]>([])
  const [apiLoading, setApiLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Define all content keys needed for this page (including header)
  const contentKeys = [
    // Header content
    'nav.learn',
    'nav.playground',
    'nav.practice',
    'nav.docs',
    'nav.settings',
    'nav.logout',
    // Detail page content
    `language.${slug}.title`,
    `language.${slug}.subtitle`,
    'detail.back_btn',
    'detail.fit_label',
    'detail.first_win_label',
    'detail.start_btn',
    'detail.syllabus_btn',
    'detail.syllabus.badge',
    'detail.syllabus.title',
    'detail.syllabus.desc',
    'detail.loading',
    'detail.empty',
    'detail.cta.title',
    'detail.cta.desc',
    'detail.cta.btn1',
    'detail.cta.btn2',
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

  // Fetch curriculum from API (must be called before early return)
  useEffect(() => {
    const fetchCurriculum = async () => {
      try {
        setApiLoading(true)
        setError(null)
        
        const response = await api.getCurriculum(slug)
        const responseData = response.data as any
        const apiChapters = Array.isArray(responseData)
          ? responseData
          : Array.isArray(responseData?.chapters)
            ? responseData.chapters
            : []
        const apiLessons = Array.isArray(responseData?.lessons) ? responseData.lessons : []
        
        if (response.success && apiChapters.length > 0) {
          const syllabusData: SyllabusSection[] = apiChapters.map((chapter: any) => {
            const lessons = apiLessons
              .filter((lesson: any) => lesson.chapterId === chapter.id || lesson.chapter_id === chapter.id)
              .sort((a: any, b: any) => (a.orderIndex ?? a.order_index ?? 0) - (b.orderIndex ?? b.order_index ?? 0))

            return {
              title: chapter.title || chapter.name || 'Untitled Chapter',
              description: chapter.description || 'Học các bài trong chương này.',
              lessons: lessons.map((lesson: any) => ({
                title: lesson.title || 'Untitled Lesson',
                tags: ['Quan sát', 'Thực hành'] as LessonTag[],
              })),
            }
          })
          
          setChapters(syllabusData as any)
        } else {
          setChapters([])
        }
      } catch (err) {
        console.error('Error fetching curriculum:', err)
        setError('Lỗi khi tải syllabus')
      } finally {
        setApiLoading(false)
      }
    }

    fetchCurriculum()
  }, [slug])

  // Show loading screen while content is being fetched
  if (contentLoading) {
    return <LoadingScreen message="Loading language detail..." />
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
  const backBtn = content['detail.back_btn'] || 'Tất cả lộ trình'
  const fitLabel = content['detail.fit_label'] || 'Phù hợp nếu'
  const firstWinLabel = content['detail.first_win_label'] || 'First win'
  const startBtn = content['detail.start_btn'] || 'Bắt đầu bài đầu tiên'
  const syllabusBtn = content['detail.syllabus_btn'] || 'Xem syllabus'
  const syllabusBadge = content['detail.syllabus.badge'] || 'Syllabus'
  const syllabusTitle = content['detail.syllabus.title'] || 'Từng chương là một checkpoint nhỏ.'
  const syllabusDesc = content['detail.syllabus.desc'] || 'Mỗi chương gồm các bài học nhỏ với hành động rõ ràng: quan sát, thực hành, kiểm tra và debug.'
  const loadingText = content['detail.loading'] || 'Đang tải danh sách chương...'
  const emptyText = content['detail.empty'] || 'Chưa có chương nào cho lộ trình này.'
  const ctaTitle = content['detail.cta.title'] || 'Sẵn sàng bắt đầu?'
  const ctaDesc = content['detail.cta.desc'] || 'Bài đầu tiên sẽ dạy bạn quan sát code mẫu, chạy thử output, rồi sửa một dòng nhỏ. Không áp lực, chỉ học từng bước.'
  const ctaBtn1 = content['detail.cta.btn1'] || 'Bắt đầu bài đầu tiên'
  const ctaBtn2 = content['detail.cta.btn2'] || 'Đổi lộ trình'

  // Get language detail from description map
  const desc = descriptionMap[slug] || descriptionMap.javascript
  const icon = iconMap[slug] || FiCode
  const accent = accentMap[slug] || 'bg-slate-200 text-slate-950 border-slate-300'

  const detail: LanguageDetail = {
    name: slug.charAt(0).toUpperCase() + slug.slice(1),
    slug: slug,
    icon: icon,
    accent: accent,
    subtitle: desc.subtitle,
    promise: desc.promise,
    fit: desc.fit,
    firstWin: desc.firstWin,
    codeFile: desc.codeFile,
    codeSample: desc.codeSample,
    output: desc.output,
    syllabus: [], // Will be populated from API
  }

  const syllabusToDisplay = chapters.length > 0 ? chapters : []

  return (
    <V2PublicShell headerContent={headerContent} footerContent={footerContent}>
      <main>
        <section className="relative overflow-hidden px-4 py-14 md:px-6 md:py-20">
          <div className="absolute left-0 top-16 h-72 w-72 rounded-full bg-brand-teal/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.9fr,1.1fr] lg:items-center">
            <div>
              <Link to="/languages" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-950">
                <FiArrowLeft /> {backBtn}
              </Link>
              <div className="mb-5 flex items-center gap-4">
                <div className={`flex h-16 w-16 items-center justify-center rounded-2xl border text-3xl shadow-[0_5px_0_rgba(15,23,42,0.14)] ${detail.accent}`}><detail.icon /></div>
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
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{fitLabel}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{detail.fit}</p>
                </div>
                <div className="rounded-2xl border border-slate-200 bg-white p-4">
                  <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{firstWinLabel}</div>
                  <p className="mt-2 text-sm leading-6 text-slate-600">{detail.firstWin}</p>
                </div>
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <V2PressedButton to={`/library/${detail.slug}`}><FiPlay /> {startBtn}</V2PressedButton>
                <V2PressedButton to="#syllabus" variant="secondary">{syllabusBtn}</V2PressedButton>
              </div>
            </div>
            <CodePreview detail={detail} />
          </div>
        </section>

        <section id="syllabus" className="bg-white px-4 py-16 md:px-6">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.7fr,1.3fr]">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.2em] text-brand-ocean">{syllabusBadge}</div>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{syllabusTitle}</h2>
              <p className="mt-5 text-sm leading-6 text-slate-600">
                {syllabusDesc}
              </p>
            </div>
            <div className="grid gap-4">
              {apiLoading && (
                <div className="text-center text-slate-600">
                  {loadingText}
                </div>
              )}
              
              {error && (
                <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                  {error}
                </div>
              )}
              
              {!apiLoading && syllabusToDisplay.length > 0 && ((syllabusToDisplay as any) || []).map((section: SyllabusSection, sectionIndex: number) => (
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
                    {section.lessons.map((lesson: SyllabusLesson, lessonIndex: number) => (
                      <div key={lesson.title} className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4">
                        <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-sm font-black text-slate-500">{lessonIndex + 1}</div>
                        <div className="flex-1">
                          <div className="font-black text-slate-900">{lesson.title}</div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {lesson.tags.map(tag => (
                              <LessonTagPill key={tag} tag={tag} />
                            ))}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
              
              {!apiLoading && syllabusToDisplay.length === 0 && !error && (
                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center text-slate-600">
                  {emptyText}
                </div>
              )}
            </div>
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
              <V2PressedButton to={`/library/${detail.slug}`}><FiPlay /> {ctaBtn1}</V2PressedButton>
              <V2PressedButton to="/languages" variant="secondary">{ctaBtn2}</V2PressedButton>
            </div>
          </div>
        </section>
      </main>
    </V2PublicShell>
  )
}

export default V2LanguageDetailPage
