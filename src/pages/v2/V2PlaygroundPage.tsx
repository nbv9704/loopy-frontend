import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FiArrowRight, FiBookOpen, FiCode, FiCpu, FiDatabase, FiPlay, FiSave, FiTerminal, FiZap } from 'react-icons/fi'
import { V2PressedButton, V2PublicShell } from '../../components/v2/V2PublicShell'
import { useContentPreloader } from '../../hooks/useContentPreloader'
import { LoadingScreen } from '../../components/v2/LoadingScreen'
import { api } from '../../lib/api'

type PlaygroundLanguage = 'python' | 'javascript' | 'cpp' | 'java' | 'go' | 'rust'

const playgrounds: Record<PlaygroundLanguage, { label: string; file: string; icon: typeof FiCpu; code: string; output: string[] }> = {
  python: {
    label: 'Python',
    file: 'main.py',
    icon: FiCpu,
    code: 'name = "Loopy"\nprint(f"Xin chào {name}")',
    output: ['Xin chào Loopy'],
  },
  javascript: {
    label: 'JavaScript',
    file: 'main.js',
    icon: FiCode,
    code: 'const name = "Loopy"\nconsole.log(`Xin chào ${name}`)',
    output: ['Xin chào Loopy'],
  },
  cpp: {
    label: 'C++',
    file: 'main.cpp',
    icon: FiDatabase,
    code: '#include <iostream>\nusing namespace std;\n\nint main() {\n  cout << "Xin chào Loopy" << endl;\n  return 0;\n}',
    output: ['Xin chào Loopy'],
  },
  java: {
    label: 'Java',
    file: 'Main.java',
    icon: FiDatabase,
    code: 'class Main {\n  public static void main(String[] args) {\n    System.out.println("Xin chào Loopy");\n  }\n}',
    output: ['Xin chào Loopy'],
  },
  go: {
    label: 'Go',
    file: 'main.go',
    icon: FiDatabase,
    code: 'package main\n\nimport "fmt"\n\nfunc main() {\n  fmt.Println("Xin chào Loopy")\n}',
    output: ['Xin chào Loopy'],
  },
  rust: {
    label: 'Rust',
    file: 'main.rs',
    icon: FiDatabase,
    code: 'fn main() {\n    println!("Xin chào Loopy");\n}',
    output: ['Xin chào Loopy'],
  },
}

function LanguagePill({ language, active, onClick }: { language: PlaygroundLanguage; active: boolean; onClick: () => void }) {
  const item = playgrounds[language]
  const Icon = item.icon

  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 rounded-2xl border px-4 py-3 text-sm font-black transition ${active ? 'border-brand-teal bg-brand-teal/15 text-brand-ocean shadow-[0_4px_0_rgba(11,136,156,0.18)]' : 'border-slate-200 bg-white text-slate-600 hover:border-brand-teal'}`}
    >
      <Icon /> {item.label}
    </button>
  )
}

function InteractivePlayground({ language }: { language: PlaygroundLanguage }) {
  const item = playgrounds[language]
  const [code, setCode] = useState(item.code)
  const [output, setOutput] = useState<string[]>(item.output)
  const [error, setError] = useState<string | null>(null)
  const [running, setRunning] = useState(false)

  useEffect(() => {
    setCode(item.code)
    setOutput(item.output)
    setError(null)
  }, [item])

  const runCode = async () => {
    setRunning(true)
    setError(null)
    setOutput(['Đang chạy code...'])

    try {
      const response = await api.executeCode(language, code)
      const result = response.data

      if (!response.success || !result) {
        setOutput([])
        setError(response.error?.message || 'Không thể thực thi code.')
        return
      }

      if (result.error) {
        setOutput(result.output ? result.output.split('\n') : [])
        setError(result.error)
        return
      }

      setOutput(result.output ? result.output.split('\n') : ['Chạy xong, không có output.'])
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Không thể kết nối runner.'
      setOutput([])
      setError(message)
    } finally {
      setRunning(false)
    }
  }

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 text-white shadow-2xl shadow-slate-300/70">
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 font-mono text-sm text-slate-400">
          <FiCode /> {item.file}
        </div>
        <button
          onClick={runCode}
          disabled={running}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-sm font-black text-slate-950 shadow-[0_3px_0_#0b889c] transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <FiPlay /> {running ? 'Đang chạy...' : 'Chạy thử'}
        </button>
      </div>

      <div className="grid min-h-[520px] lg:grid-cols-[1fr,360px]">
        <div className="bg-[#020617] p-5">
          <textarea
            value={code}
            onChange={event => setCode(event.target.value)}
            spellCheck={false}
            className="min-h-[390px] w-full resize-none rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-sm leading-7 text-slate-100 outline-none transition focus:border-brand-teal/60 focus:ring-2 focus:ring-brand-teal/20"
            aria-label={`Code editor ${item.label}`}
          />
          <div className="mt-4 rounded-2xl border border-brand-teal/20 bg-brand-teal/10 p-4 font-sans text-sm leading-6 text-brand-teal">
            Playground chỉ chạy code và trả output. Nó không kiểm tra lesson, không lưu progress.
          </div>
        </div>

        <div className="grid border-t border-white/10 lg:border-l lg:border-t-0">
          <div className="border-b border-white/10 p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-teal"><FiTerminal /> Runner</div>
            <div className="rounded-2xl border border-white/10 bg-black/30 p-4 text-sm leading-6 text-slate-300">
              Dùng backend `/api/execute`. Python/C++/Java/Go/Rust sẽ chạy qua Piston nếu có, hoặc Glot fallback nếu đã cấu hình token.
            </div>
          </div>
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-teal"><FiZap /> Output</div>
            <div className="min-h-52 rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-sm text-slate-300">
              {error && <div className="mb-3 whitespace-pre-wrap text-red-300">❌ {error}</div>}
              {output.map((line, index) => <div key={`${line}-${index}`}>{line}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const V2PlaygroundPage: React.FC = () => {
  const { i18n } = useTranslation()
  const [language, setLanguage] = useState<PlaygroundLanguage>('python')

  // Define all content keys needed for this page (including header)
  const contentKeys = [
    // Header content
    'nav.learn',
    'nav.playground',
    'nav.practice',
    'nav.docs',
    'nav.settings',
    'nav.logout',
    // Playground page content
    'playground.title',
    'playground.subtitle',
    'playground.badge',
    'playground.runtime_label',
    'playground.no_input',
    'playground.run_btn',
    'playground.sandbox_note',
    'playground.feat1.title',
    'playground.feat1.desc',
    'playground.feat2.title',
    'playground.feat2.desc',
    'playground.feat3.title',
    'playground.feat3.desc',
    'playground.separate.badge',
    'playground.separate.title',
    'playground.separate.desc',
    'playground.cta.title',
    'playground.cta.desc',
    'playground.cta.btn_journey',
    'playground.cta.btn_path',
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
  const { content, loading } = useContentPreloader(contentKeys, i18n.language)

  // Show loading screen while content is being fetched
  if (loading) {
    return <LoadingScreen message="Loading playground..." />
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
  const playgroundTitle = content['playground.title'] || 'Chạy code tự do, không làm rối tiến độ học.'
  const playgroundSubtitle = content['playground.subtitle'] || 'Playground dành cho thử nghiệm nhanh: chọn ngôn ngữ, viết code, thêm input nếu cần và xem output. Kiểm tra bài học vẫn nằm trong Learn flow.'
  const playgroundBadge = content['playground.badge'] || 'Playground v2 sandbox'
  const runtimeLabel = content['playground.runtime_label'] || 'Chọn runtime mẫu'
  const feat1Title = content['playground.feat1.title'] || 'Run, không Check'
  const feat1Desc = content['playground.feat1.desc'] || 'Playground chỉ execute code và trả output, không validate yêu cầu lesson.'
  const feat2Title = content['playground.feat2.title'] || 'Có stdin/input'
  const feat2Desc = content['playground.feat2.desc'] || 'Dùng input để thử các ví dụ cần dữ liệu người dùng hoặc nhiều dòng.'
  const feat3Title = content['playground.feat3.title'] || 'Quay lại guided flow'
  const feat3Desc = content['playground.feat3.desc'] || 'Khi muốn học có thứ tự, quay về Journey Map hoặc lesson mẫu.'
  const separateBadge = content['playground.separate.badge'] || 'Không phải completion'
  const separateTitle = content['playground.separate.title'] || 'Playground tách khỏi progress để người mới không hiểu nhầm.'
  const separateDesc = content['playground.separate.desc'] || 'Nếu user cần chấm bài, họ vào Learn. Nếu user cần thử nhanh một ý tưởng, họ dùng Playground. Hai flow này có nhiệm vụ khác nhau.'
  const ctaTitle = content['playground.cta.title'] || 'Sẵn sàng quay lại học có hướng dẫn?'
  const ctaDesc = content['playground.cta.desc'] || 'Playground giúp thử nhanh. Journey Map giúp biết bài nào nên làm tiếp.'
  const ctaBtnJourney = content['playground.cta.btn_journey'] || 'Vào Journey Map'
  const ctaBtnPath = content['playground.cta.btn_path'] || 'Tìm lộ trình'

  return (
    <V2PublicShell headerContent={headerContent} footerContent={footerContent}>
      <main>
        <section className="relative overflow-hidden px-4 py-14 md:px-6 md:py-20">
          <div className="absolute right-0 top-12 h-80 w-80 rounded-full bg-brand-teal/20 blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-end">
              <div>
                <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                  {playgroundBadge}
                </div>
                <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
                  {playgroundTitle}
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                  {playgroundSubtitle}
                </p>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/80">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">{runtimeLabel}</div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {(Object.keys(playgrounds) as PlaygroundLanguage[]).map(item => (
                    <LanguagePill key={item} language={item} active={language === item} onClick={() => setLanguage(item)} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10">
              <InteractivePlayground language={language} />
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            {[
              [FiPlay, feat1Title, feat1Desc],
              [FiTerminal, feat2Title, feat2Desc],
              [FiBookOpen, feat3Title, feat3Desc],
            ].map(([Icon, title, description]) => {
              const CardIcon = Icon as typeof FiPlay
              return (
                <div key={title as string} className="rounded-[2rem] border border-slate-200 bg-[#f8fafc] p-6">
                  <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-brand-teal shadow-[0_4px_0_#54d9c4]"><CardIcon /></div>
                  <h2 className="text-2xl font-black">{title as string}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{description as string}</p>
                </div>
              )
            })}
          </div>
        </section>

        <section className="px-4 py-16 md:px-6">
          <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.8fr,1.2fr] lg:items-center">
            <div>
              <div className="text-sm font-black uppercase tracking-[0.2em] text-brand-ocean">{separateBadge}</div>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">{separateTitle}</h2>
              <p className="mt-5 text-sm leading-6 text-slate-600">
                {separateDesc}
              </p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
              <div className="grid gap-3">
                {[
                  ['Chạy thử', 'Có trong Playground và Learn, chỉ hiển thị output.'],
                  ['Kiểm tra', 'Chỉ trong lesson, validate bằng deterministic checker.'],
                  ['Lưu progress', 'Chỉ sau khi `completeLesson` thành công.'],
                ].map(([title, description]) => (
                  <div key={title} className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-[#f8fafc] p-4">
                    <div>
                      <div className="font-black">{title}</div>
                      <div className="mt-1 text-sm text-slate-600">{description}</div>
                    </div>
                    <FiArrowRight className="shrink-0 text-brand-ocean" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 px-4 py-16 text-white md:px-6">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <FiSave className="mb-4 h-10 w-10 text-brand-teal" />
            <h2 className="text-4xl font-black tracking-tight">{ctaTitle}</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              {ctaDesc}
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <V2PressedButton to="/library/javascript">{ctaBtnJourney}</V2PressedButton>
              <V2PressedButton to="/onboarding" variant="secondary">{ctaBtnPath}</V2PressedButton>
            </div>
          </div>
        </section>
      </main>
    </V2PublicShell>
  )
}

export default V2PlaygroundPage
