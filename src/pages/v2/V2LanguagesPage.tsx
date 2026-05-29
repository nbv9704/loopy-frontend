import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FiArrowRight, FiCheckCircle, FiCode, FiCompass, FiCpu, FiDatabase, FiGitBranch, FiGlobe, FiHelpCircle, FiLayers, FiPlay, FiTerminal } from 'react-icons/fi'
import { V2PressedButton, V2PublicShell } from '../../components/v2/V2PublicShell'
import { api } from '../../lib/api'

type LanguageCard = {
  name: string
  slug: string
  icon: typeof FiCpu
  accent: string
  fit: string
  next: string
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
const descriptionMap: Record<string, { fit: string; next: string }> = {
  python: {
    fit: 'Bạn mới bắt đầu và muốn thấy kết quả nhanh.',
    next: 'In output, biến, điều kiện, vòng lặp.',
  },
  javascript: {
    fit: 'Bạn muốn hiểu web tương tác và logic frontend.',
    next: 'Console, biến, function, DOM cơ bản.',
  },
  html: {
    fit: 'Bạn muốn dựng cấu trúc trang web đầu tiên.',
    next: 'Tag, heading, link, form và semantic layout.',
  },
  css: {
    fit: 'Bạn muốn biến trang thô thành giao diện rõ ràng.',
    next: 'Selector, box model, flex, responsive.',
  },
  sql: {
    fit: 'Bạn muốn hỏi dữ liệu bằng câu lệnh ngắn.',
    next: 'SELECT, WHERE, JOIN, GROUP BY.',
  },
  git: {
    fit: 'Bạn muốn lưu phiên bản code mà không sợ làm hỏng.',
    next: 'Init, add, commit, branch, merge.',
  },
  cpp: {
    fit: 'Bạn muốn học lập trình hệ thống và hiệu năng cao.',
    next: 'Biến, con trỏ, class, STL cơ bản.',
  },
  c: {
    fit: 'Bạn muốn hiểu lập trình cấp thấp và bộ nhớ.',
    next: 'Biến, mảng, con trỏ, struct cơ bản.',
  },
}

const howItWorks = [
  {
    title: 'Chọn lộ trình',
    description: 'Mỗi card nói rõ phù hợp với ai, không bắt bạn đoán nên học gì trước.',
    icon: FiCompass,
  },
  {
    title: 'Làm bài đầu tiên',
    description: 'Vào lesson nhỏ, nhìn code mẫu, sửa một dòng và chạy output thật.',
    icon: FiPlay,
  },
  {
    title: 'Kiểm tra và lưu tiến độ',
    description: 'Loopy chấm bằng rule/test case. Progress chỉ lưu khi hoàn thành thật.',
    icon: FiCheckCircle,
  },
]

function LanguageCard({ language }: { language: LanguageCard }) {
  const Icon = language.icon

  return (
    <Link to={`/languages/${language.slug}`} className="group rounded-[2rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-brand-teal hover:shadow-xl hover:shadow-slate-200/80">
      <div className="flex items-start justify-between gap-4">
        <div className={`flex h-14 w-14 items-center justify-center rounded-2xl border text-2xl shadow-[0_4px_0_rgba(15,23,42,0.12)] ${language.accent}`}>
          <Icon />
        </div>
        <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-black uppercase tracking-wider text-slate-500 group-hover:border-brand-teal group-hover:text-brand-ocean">
          Xem map
        </div>
      </div>
      <h2 className="mt-5 text-2xl font-black tracking-tight text-slate-950">{language.name}</h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{language.fit}</p>
      <div className="mt-5 rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
        <div className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Bắt đầu với</div>
        <div className="mt-2 text-sm font-bold leading-6 text-slate-700">{language.next}</div>
      </div>
      <div className="mt-5 flex items-center gap-2 text-sm font-black text-brand-ocean">
        Bắt đầu lộ trình <FiArrowRight className="transition group-hover:translate-x-1" />
      </div>
    </Link>
  )
}

const V2LanguagesPage: React.FC = () => {
  const [languages, setLanguages] = useState<LanguageCard[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        setLoading(true)
        setError(null)
        const response = await api.getLanguages()
        
        if (response.success && response.data && Array.isArray(response.data)) {
          // Transform API response to LanguageCard format
          const cards: LanguageCard[] = response.data.map((lang: any) => {
            const slug = lang.slug || lang.name?.toLowerCase() || ''
            const description = descriptionMap[slug] || { fit: 'Học lập trình với Loopy.', next: 'Bắt đầu từ bài đầu tiên.' }
            
            return {
              name: lang.name || 'Unknown',
              slug: slug,
              icon: iconMap[slug] || FiCode,
              accent: accentMap[slug] || 'bg-slate-200 text-slate-950 border-slate-300',
              fit: description.fit,
              next: description.next,
            }
          })
          setLanguages(cards)
        } else {
          setError('Không thể tải danh sách lộ trình')
        }
      } catch (err) {
        console.error('Error fetching languages:', err)
        setError('Lỗi khi tải danh sách lộ trình')
      } finally {
        setLoading(false)
      }
    }

    fetchLanguages()
  }, [])

  return (
    <V2PublicShell>
      <main>
        <section className="relative overflow-hidden px-4 py-16 md:px-6 md:py-20">
          <div className="absolute right-0 top-8 h-72 w-72 rounded-full bg-brand-teal/20 blur-3xl" />
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr,1.15fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                Lộ trình học
              </div>
              <h1 className="max-w-3xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
                Chọn ngôn ngữ theo mục tiêu, không theo danh sách dài.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Catalog v2 tập trung vào câu hỏi của người mới: "mình nên bắt đầu ở đâu?". Mỗi lộ trình nói rõ phù hợp với ai và bài đầu tiên sẽ làm gì.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <V2PressedButton to="/onboarding"><FiPlay /> Thử bài đầu tiên</V2PressedButton>
                <V2PressedButton to="/onboarding" variant="secondary">Tìm lộ trình phù hợp</V2PressedButton>
              </div>
            </div>

            <div className="rounded-[2rem] border border-slate-200 bg-white p-4 shadow-xl shadow-slate-200/80">
              <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                <div className="mb-4 flex items-center justify-between">
                  <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-teal">Không biết bắt đầu?</div>
                  <FiHelpCircle className="text-brand-teal" />
                </div>
                <div className="grid gap-3">
                  {['Muốn web hiển thị đẹp', 'Muốn code logic dễ hiểu', 'Muốn làm việc với dữ liệu'].map((goal, index) => (
                    <div key={goal} className={`rounded-2xl border px-4 py-3 ${index === 1 ? 'border-brand-teal bg-brand-teal/10' : 'border-white/10 bg-white/[0.04]'}`}>
                      <div className="text-sm font-black">{goal}</div>
                      <div className="mt-1 text-xs text-slate-400">Loopy gợi ý lộ trình và bài đầu phù hợp.</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <div className="text-sm font-black uppercase tracking-[0.2em] text-brand-ocean">Browse languages</div>
                <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Các lộ trình có sẵn</h2>
              </div>
            </div>
            
            {loading && (
              <div className="mt-8 text-center text-slate-600">
                Đang tải danh sách lộ trình...
              </div>
            )}
            
            {error && (
              <div className="mt-8 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-rose-700">
                {error}
              </div>
            )}
            
            {!loading && languages.length > 0 && (
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {languages.map(language => <LanguageCard key={language.slug} language={language} />)}
              </div>
            )}
          </div>
        </section>

        <section className="px-4 py-16 md:px-6">
          <div className="mx-auto max-w-7xl">
            <div className="max-w-2xl">
              <div className="text-sm font-black uppercase tracking-[0.2em] text-brand-ocean">How it works</div>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Từ catalog đến bài học trong 3 bước.</h2>
            </div>
            <div className="mt-8 grid gap-4 md:grid-cols-3">
              {howItWorks.map((step, index) => {
                const Icon = step.icon
                return (
                  <div key={step.title} className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm">
                    <div className="mb-5 flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-brand-teal shadow-[0_4px_0_#54d9c4]"><Icon /></div>
                      <div className="text-sm font-black uppercase tracking-[0.2em] text-slate-400">Step {index + 1}</div>
                    </div>
                    <h3 className="text-2xl font-black">{step.title}</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">{step.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        <section className="bg-slate-950 px-4 py-16 text-white md:px-6">
          <div className="mx-auto grid max-w-7xl gap-8 md:grid-cols-[0.8fr,1.2fr] md:items-center">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.2em] text-brand-teal">Next action</div>
              <h2 className="mt-3 text-4xl font-black tracking-tight">Vẫn chưa chắc nên học gì?</h2>
              <p className="mt-4 text-sm leading-6 text-slate-400">Đi qua onboarding ngắn để Loopy gợi ý hướng bắt đầu thay vì tự lục catalog.</p>
            </div>
            <div className="rounded-[2rem] border border-white/10 bg-white/[0.04] p-6">
              <div className="flex items-center gap-3 text-brand-teal">
                <FiTerminal />
                <span className="font-mono text-sm">recommend --for beginner</span>
              </div>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <V2PressedButton to="/onboarding">Tìm lộ trình phù hợp</V2PressedButton>
                <V2PressedButton to="/onboarding" variant="secondary">Bỏ qua, học thử ngay</V2PressedButton>
              </div>
            </div>
          </div>
        </section>
      </main>
    </V2PublicShell>
  )
}

export default V2LanguagesPage
