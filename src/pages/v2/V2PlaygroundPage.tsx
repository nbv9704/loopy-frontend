import { useState } from 'react'
import { FiArrowRight, FiBookOpen, FiCode, FiCpu, FiDatabase, FiPlay, FiSave, FiTerminal, FiZap } from 'react-icons/fi'
import { V2PressedButton, V2PublicShell } from '../../components/v2/V2PublicShell'

type PlaygroundLanguage = 'python' | 'javascript' | 'sql'

const playgrounds: Record<PlaygroundLanguage, { label: string; file: string; icon: typeof FiCpu; code: string[]; stdin: string; output: string[] }> = {
  python: {
    label: 'Python',
    file: 'main.py',
    icon: FiCpu,
    code: ['name = input("Tên của bạn: ")', 'print(f"Xin chào {name}")'],
    stdin: 'Loopy',
    output: ['Xin chào Loopy'],
  },
  javascript: {
    label: 'JavaScript',
    file: 'main.js',
    icon: FiCode,
    code: ['const name = "Loopy"', 'console.log(`Xin chào ${name}`)'],
    stdin: '',
    output: ['Xin chào Loopy'],
  },
  sql: {
    label: 'SQL',
    file: 'query.sql',
    icon: FiDatabase,
    code: ['SELECT name, score', 'FROM learners', 'WHERE score >= 80;'],
    stdin: 'learners table',
    output: ['name   score', 'An     92', 'Binh   86'],
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

function PlaygroundMock({ language }: { language: PlaygroundLanguage }) {
  const item = playgrounds[language]

  return (
    <div className="overflow-hidden rounded-[2rem] border border-slate-800 bg-slate-950 text-white shadow-2xl shadow-slate-300/70">
      <div className="flex flex-col gap-3 border-b border-white/10 px-4 py-3 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2 font-mono text-sm text-slate-400">
          <FiCode /> {item.file}
        </div>
        <button className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-teal px-4 py-2 text-sm font-black text-slate-950 shadow-[0_3px_0_#0b889c]">
          <FiPlay /> Chạy thử
        </button>
      </div>

      <div className="grid min-h-[520px] lg:grid-cols-[1fr,360px]">
        <div className="bg-[#020617] p-5 font-mono text-sm leading-8">
          {item.code.map((line, index) => (
            <div key={`${language}-${line}`}>
              <span className="select-none pr-4 text-slate-600">{index + 1}</span>{line}
            </div>
          ))}
          <div className="mt-8 rounded-2xl border border-brand-teal/20 bg-brand-teal/10 p-4 font-sans text-sm leading-6 text-brand-teal">
            Playground chỉ chạy code và trả output. Nó không kiểm tra lesson, không lưu progress.
          </div>
        </div>

        <div className="grid border-t border-white/10 lg:border-l lg:border-t-0">
          <div className="border-b border-white/10 p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-teal"><FiTerminal /> Input / stdin</div>
            <div className="min-h-28 rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-sm text-slate-300">
              {item.stdin || 'Không cần input cho ví dụ này.'}
            </div>
          </div>
          <div className="p-5">
            <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-teal"><FiZap /> Output</div>
            <div className="min-h-32 rounded-2xl border border-white/10 bg-black/30 p-4 font-mono text-sm text-slate-300">
              {item.output.map(line => <div key={line}>{line}</div>)}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const V2PlaygroundPage: React.FC = () => {
  const [language, setLanguage] = useState<PlaygroundLanguage>('python')

  return (
    <V2PublicShell>
      <main>
        <section className="relative overflow-hidden px-4 py-14 md:px-6 md:py-20">
          <div className="absolute right-0 top-12 h-80 w-80 rounded-full bg-brand-teal/20 blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <div className="grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-end">
              <div>
                <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                  Playground v2 sandbox
                </div>
                <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
                  Chạy code tự do, không làm rối tiến độ học.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                  Playground dành cho thử nghiệm nhanh: chọn ngôn ngữ, viết code, thêm input nếu cần và xem output. Kiểm tra bài học vẫn nằm trong Learn flow.
                </p>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/80">
                <div className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Chọn runtime mẫu</div>
                <div className="mt-4 flex flex-wrap gap-3">
                  {(Object.keys(playgrounds) as PlaygroundLanguage[]).map(item => (
                    <LanguagePill key={item} language={item} active={language === item} onClick={() => setLanguage(item)} />
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-10">
              <PlaygroundMock language={language} />
            </div>
          </div>
        </section>

        <section className="bg-white px-4 py-16 md:px-6">
          <div className="mx-auto grid max-w-7xl gap-5 md:grid-cols-3">
            {[
              [FiPlay, 'Run, không Check', 'Playground chỉ execute code và trả output, không validate yêu cầu lesson.'],
              [FiTerminal, 'Có stdin/input', 'Dùng input để thử các ví dụ cần dữ liệu người dùng hoặc nhiều dòng.'],
              [FiBookOpen, 'Quay lại guided flow', 'Khi muốn học có thứ tự, quay về Journey Map hoặc lesson mẫu.'],
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
              <div className="text-sm font-black uppercase tracking-[0.2em] text-brand-ocean">Không phải completion</div>
              <h2 className="mt-3 text-4xl font-black tracking-tight md:text-5xl">Playground tách khỏi progress để người mới không hiểu nhầm.</h2>
              <p className="mt-5 text-sm leading-6 text-slate-600">
                Nếu user cần chấm bài, họ vào Learn. Nếu user cần thử nhanh một ý tưởng, họ dùng Playground. Hai flow này có nhiệm vụ khác nhau.
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
            <h2 className="text-4xl font-black tracking-tight">Sẵn sàng quay lại học có hướng dẫn?</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Playground giúp thử nhanh. Journey Map giúp biết bài nào nên làm tiếp.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <V2PressedButton to="/v2/library">Vào Journey Map</V2PressedButton>
              <V2PressedButton to="/sample-lesson" variant="secondary">Thử lesson mẫu</V2PressedButton>
            </div>
          </div>
        </section>
      </main>
    </V2PublicShell>
  )
}

export default V2PlaygroundPage
