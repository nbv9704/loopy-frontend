import { useState } from 'react'
import { FiArrowLeft, FiBookOpen, FiCheckCircle, FiCode, FiCpu, FiPlay, FiSave, FiTerminal, FiTool } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { V2PressedButton, V2PublicShell } from '../../components/v2/V2PublicShell'

type LessonStep = 'see' | 'change' | 'run' | 'fix' | 'build'

const steps: Array<{ id: LessonStep; title: string; short: string; icon: typeof FiBookOpen }> = [
  { id: 'see', title: 'Quan sát', short: 'Chạy code mẫu', icon: FiBookOpen },
  { id: 'change', title: 'Thay đổi', short: 'Sửa một dòng', icon: FiCode },
  { id: 'run', title: 'Chạy thử', short: 'Xem output', icon: FiPlay },
  { id: 'fix', title: 'Sửa lỗi', short: 'Debug lỗi nhỏ', icon: FiTool },
  { id: 'build', title: 'Tổng kết', short: 'Lưu progress', icon: FiSave },
]

const stepCopy: Record<LessonStep, { title: string; description: string; button: string; terminal: string[]; code: string[]; result: string }> = {
  see: {
    title: 'Quan sát code mẫu trước khi tự viết.',
    description: 'Editor đang khóa để người mới không bị áp lực sửa ngay. Việc đầu tiên là chạy code mẫu và hiểu output.',
    button: 'Chạy code mẫu',
    terminal: ['> Đang sẵn sàng chạy code mẫu', 'Gợi ý: nhìn biến name trước khi bấm chạy.'],
    code: ['const name = "Loopy"', 'console.log(`Xin chào ${name}`)'],
    result: 'Chạy thử chỉ execute code mẫu, chưa chấm đúng/sai.',
  },
  change: {
    title: 'Sửa đúng một yêu cầu nhỏ.',
    description: 'Người học đổi biến theo task. Lúc này nút chính là kiểm tra thay đổi bằng deterministic checker.',
    button: 'Kiểm tra thay đổi',
    terminal: ['> Đang kiểm tra thay đổi của bạn...', '✓ Rule: có dùng biến name', '✓ Rule: output có lời chào'],
    code: ['const name = "Bạn mới"', 'console.log(`Xin chào ${name}`)'],
    result: 'Kiểm tra mới validate bằng rule/test case. Không dùng AI để quyết định đúng/sai.',
  },
  run: {
    title: 'Sau khi pass check, chạy thử output thật.',
    description: 'Bước này giúp người học thấy code của mình chạy ra gì. Nó không thay thế bước kiểm tra.',
    button: 'Chạy thử kết quả',
    terminal: ['> Đang chạy code đã đạt yêu cầu...', 'Xin chào Bạn mới'],
    code: ['const name = "Bạn mới"', 'console.log(`Xin chào ${name}`)'],
    result: 'Output chạy thật được hiển thị trong terminal, nhưng progress vẫn chưa lưu.',
  },
  fix: {
    title: 'Debug một lỗi nhỏ có chủ đích.',
    description: 'Loopy đưa lỗi dễ hiểu để người học tập đọc terminal và sửa vấn đề thay vì sợ lỗi.',
    button: 'Kiểm tra sửa lỗi',
    terminal: ['> Vẫn còn lỗi: ReferenceError', 'tenChuaKhaiBao is not defined'],
    code: ['const name = "Bạn mới"', 'console.log(`Xin chào ${name}`)', 'console.log(tenChuaKhaiBao)'],
    result: 'Debug step hiện là frontend-only trong production; lâu dài nên data-driven từ lesson schema.',
  },
  build: {
    title: 'Hoàn thành lesson sau khi đã debug pass.',
    description: 'Chỉ ở bước cuối Loopy mới gọi completeLesson để lưu progress. Celebration chỉ hiện sau khi lưu thành công.',
    button: 'Hoàn thành lesson',
    terminal: ['> Đang lưu hoàn thành bài học...', '✓ Progress đã lưu', '✓ Bài tiếp theo đã mở khóa'],
    code: ['const name = "Bạn mới"', 'console.log(`Xin chào ${name}`)'],
    result: 'Không celebration trước khi backend xác nhận progress đã lưu.',
  },
}

function StepRail({ currentStep, setCurrentStep }: { currentStep: LessonStep; setCurrentStep: (step: LessonStep) => void }) {
  return (
    <div className="grid gap-2">
      {steps.map((step, index) => {
        const Icon = step.icon
        const isActive = step.id === currentStep
        const isPast = steps.findIndex(item => item.id === currentStep) > index

        return (
          <button
            key={step.id}
            onClick={() => setCurrentStep(step.id)}
            className={`flex items-center gap-3 rounded-2xl border p-3 text-left transition ${isActive ? 'border-brand-teal bg-brand-teal/15 shadow-[0_4px_0_rgba(11,136,156,0.25)]' : 'border-slate-200 bg-white hover:border-brand-teal'}`}
          >
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isActive ? 'bg-slate-950 text-brand-teal' : isPast ? 'bg-brand-teal text-slate-950' : 'bg-slate-100 text-slate-500'}`}>
              {isPast ? <FiCheckCircle /> : <Icon />}
            </div>
            <div>
              <div className="font-black text-slate-900">{index + 1}. {step.title}</div>
              <div className="text-xs font-bold text-slate-500">{step.short}</div>
            </div>
          </button>
        )
      })}
    </div>
  )
}

function CodePanel({ currentStep }: { currentStep: LessonStep }) {
  const copy = stepCopy[currentStep]
  const isSee = currentStep === 'see'

  return (
    <div className="overflow-hidden rounded-[1.6rem] border border-slate-800 bg-slate-950 text-white shadow-xl shadow-slate-300/40">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-xs text-slate-400">
          <FiCode /> main.js {isSee && <span className="rounded-full bg-slate-800 px-2 py-0.5 font-sans text-[10px] font-black uppercase tracking-widest text-slate-400">locked</span>}
        </div>
        <button className="rounded-xl bg-brand-teal px-3 py-2 text-xs font-black text-slate-950 shadow-[0_3px_0_#0b889c]">{copy.button}</button>
      </div>
      <div className="grid min-h-[420px] lg:grid-cols-[1fr,0.8fr]">
        <div className="bg-[#020617] p-5 font-mono text-sm leading-8">
          {copy.code.map((line, index) => (
            <div key={`${line}-${index}`} className={line.includes('tenChua') ? 'text-rose-300' : 'text-slate-200'}>
              <span className="select-none pr-4 text-slate-600">{index + 1}</span>{line}
            </div>
          ))}
        </div>
        <div className="border-t border-white/10 bg-black/30 p-5 lg:border-l lg:border-t-0">
          <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-teal"><FiTerminal /> Terminal</div>
          <div className="grid gap-2 font-mono text-sm text-slate-300">
            {copy.terminal.map(line => <div key={line}>{line}</div>)}
          </div>
          <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-sm leading-6 text-slate-300">
            {copy.result}
          </div>
        </div>
      </div>
    </div>
  )
}

const V2LearnPage: React.FC = () => {
  const [currentStep, setCurrentStep] = useState<LessonStep>('see')
  const copy = stepCopy[currentStep]

  return (
    <V2PublicShell>
      <main>
        <section className="relative overflow-hidden px-4 py-10 md:px-6 md:py-14">
          <div className="absolute left-1/2 top-10 h-80 w-80 -translate-x-1/2 rounded-full bg-brand-teal/20 blur-3xl" />
          <div className="relative mx-auto max-w-7xl">
            <Link to="/library/javascript" className="mb-6 inline-flex items-center gap-2 text-sm font-black text-slate-500 hover:text-slate-950">
              <FiArrowLeft /> Quay lại Journey Map
            </Link>
            <div className="mb-8 grid gap-6 lg:grid-cols-[1fr,360px] lg:items-end">
              <div>
                <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                  Learn v2 sandbox
                </div>
                <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
                  Màn học phải chỉ rõ việc cần làm ngay bây giờ.
                </h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                  Preview này tập trung vào flow 5 bước của LessonViewer hiện tại, nhưng trình bày rõ hơn cho người mới.
                </p>
              </div>
              <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/80">
                <div className="flex items-center gap-3 text-brand-ocean">
                  <FiCpu />
                  <span className="text-sm font-black uppercase tracking-[0.2em]">Lesson 03</span>
                </div>
                <h2 className="mt-3 text-2xl font-black">Sửa output lời chào</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">JavaScript Starter · 7 phút · deterministic checker</p>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[360px,1fr]">
              <aside className="grid gap-4 xl:sticky xl:top-24 xl:self-start">
                <div className="rounded-[2rem] border border-slate-200 bg-white p-5">
                  <div className="mb-4 text-xs font-black uppercase tracking-[0.2em] text-slate-400">Flow hiện tại</div>
                  <StepRail currentStep={currentStep} setCurrentStep={setCurrentStep} />
                </div>

                <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white">
                  <div className="mb-3 text-xs font-black uppercase tracking-[0.2em] text-brand-teal">Mentor</div>
                  <h2 className="text-2xl font-black">{copy.title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-400">{copy.description}</p>
                </div>
              </aside>

              <div className="grid gap-5">
                <CodePanel currentStep={currentStep} />

                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    ['Chạy thử', 'Execute code và hiển thị output. Không chấm bài.'],
                    ['Kiểm tra', 'Validate bằng rule/test case deterministic.'],
                    ['Hoàn thành', 'Chỉ lưu khi completeLesson thành công.'],
                  ].map(([title, description]) => (
                    <div key={title} className="rounded-[1.5rem] border border-slate-200 bg-white p-5">
                      <h3 className="font-black text-slate-950">{title}</h3>
                      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="bg-slate-950 px-4 py-16 text-white md:px-6">
          <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
            <FiCheckCircle className="mb-4 h-10 w-10 text-brand-teal" />
            <h2 className="text-4xl font-black tracking-tight">V2 skeleton đã đủ cho review luồng chính.</h2>
            <p className="mt-4 max-w-2xl text-sm leading-6 text-slate-400">
              Nếu hướng này ổn, bước sau nên nối v2 vào data thật hoặc chọn page production đầu tiên để thay thế dần.
            </p>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <V2PressedButton to="/sample-lesson">So với sample hiện tại</V2PressedButton>
              <V2PressedButton to="/library/javascript" variant="secondary">Xem Library</V2PressedButton>
            </div>
          </div>
        </section>
      </main>
    </V2PublicShell>
  )
}

export default V2LearnPage
