import { useState } from 'react'
import { FiArrowRight, FiCheckCircle, FiCode, FiCompass, FiCpu, FiGlobe, FiMap, FiPlay, FiSave, FiTarget } from 'react-icons/fi'
import { V2PressedButton, V2PublicShell } from '../../components/v2/V2PublicShell'

type GoalId = 'zero' | 'web' | 'school' | 'try'
type ExperienceId = 'new' | 'some' | 'basic'

const goals: Array<{ id: GoalId; title: string; description: string; language: string; icon: typeof FiCompass }> = [
  { id: 'zero', title: 'Tôi bắt đầu từ số 0', description: 'Ưu tiên Python và bài đầu thật nhỏ để hiểu output.', language: 'Python', icon: FiCompass },
  { id: 'web', title: 'Tôi muốn làm web', description: 'Bắt đầu với JavaScript và tương tác trong trình duyệt.', language: 'JavaScript', icon: FiGlobe },
  { id: 'school', title: 'Tôi học cho trường/lớp', description: 'Đi theo nền tảng input/output và tư duy giải bài.', language: 'C++', icon: FiCpu },
  { id: 'try', title: 'Tôi chỉ muốn thử trước', description: 'Vào lesson mẫu ngắn để xem mình có hợp không.', language: 'Python', icon: FiPlay },
]

const experiences: Array<{ id: ExperienceId; title: string; description: string }> = [
  { id: 'new', title: 'Chưa từng code', description: 'Loopy sẽ giải thích bằng ví dụ nhỏ và ít thuật ngữ.' },
  { id: 'some', title: 'Đã xem qua nhưng chưa tự làm', description: 'Ưu tiên thực hành và debug lỗi dễ hiểu.' },
  { id: 'basic', title: 'Biết chút cơ bản', description: 'Đi nhanh hơn qua phần quan sát, tập trung kiểm tra.' },
]

function StepBar({ step }: { step: number }) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {[1, 2, 3].map(item => (
        <div key={item} className={`h-2 rounded-full ${step >= item ? 'bg-brand-teal' : 'bg-slate-200'}`} />
      ))}
    </div>
  )
}

const V2OnboardingPage: React.FC = () => {
  const [step, setStep] = useState(1)
  const [selectedGoal, setSelectedGoal] = useState<GoalId>('web')
  const [selectedExperience, setSelectedExperience] = useState<ExperienceId>('new')
  const goal = goals.find(item => item.id === selectedGoal) || goals[1]
  const experience = experiences.find(item => item.id === selectedExperience) || experiences[0]

  return (
    <V2PublicShell>
      <main className="px-4 py-12 md:px-6 md:py-16">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 grid gap-8 lg:grid-cols-[0.9fr,1.1fr] lg:items-end">
            <div>
              <div className="mb-5 inline-flex rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">
                Journey Builder v2
              </div>
              <h1 className="max-w-4xl text-5xl font-black tracking-tight text-slate-950 md:text-7xl">
                Onboarding phải chọn được bước học đầu tiên, không chỉ hỏi cho vui.
              </h1>
              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
                Sandbox này preview flow 3 bước: mục tiêu, kinh nghiệm, xác nhận lộ trình. Production vẫn phải lưu profile thành công trước khi chuyển trang.
              </p>
            </div>
            <div className="rounded-[2rem] border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/80">
              <div className="mb-4 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiMap /> Tiến trình</div>
              <StepBar step={step} />
              <div className="mt-4 text-sm font-bold text-slate-500">Bước {step}/3 · {step === 1 ? 'Mục tiêu' : step === 2 ? 'Kinh nghiệm' : 'Preview lộ trình'}</div>
            </div>
          </div>

          <div className="grid gap-8 lg:grid-cols-[1fr,380px]">
            <section className="rounded-[2rem] border border-slate-200 bg-white p-6 shadow-sm md:p-8">
              {step === 1 && (
                <div>
                  <h2 className="text-3xl font-black tracking-tight md:text-4xl">Bạn muốn Loopy giúp đạt điều gì trước?</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">Chọn mục tiêu gần nhất. Đây là cách Loopy gợi ý lộ trình đầu tiên.</p>
                  <div className="mt-6 grid gap-3 md:grid-cols-2">
                    {goals.map(item => {
                      const Icon = item.icon
                      const active = selectedGoal === item.id
                      return (
                        <button key={item.id} onClick={() => setSelectedGoal(item.id)} className={`rounded-[1.5rem] border p-5 text-left transition ${active ? 'border-brand-teal bg-brand-teal/10 shadow-[0_4px_0_rgba(11,136,156,0.2)]' : 'border-slate-200 bg-[#f8fafc] hover:border-brand-teal'}`}>
                          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-950 text-brand-teal"><Icon /></div>
                          <h3 className="text-xl font-black">{item.title}</h3>
                          <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                          <div className="mt-4 rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-black text-slate-500">Gợi ý: {item.language}</div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div>
                  <h2 className="text-3xl font-black tracking-tight md:text-4xl">Bạn đã từng code đến đâu?</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">Câu trả lời này chỉ dùng để điều chỉnh tốc độ giải thích, không khóa lộ trình.</p>
                  <div className="mt-6 grid gap-3">
                    {experiences.map(item => {
                      const active = selectedExperience === item.id
                      return (
                        <button key={item.id} onClick={() => setSelectedExperience(item.id)} className={`flex items-start gap-4 rounded-[1.5rem] border p-5 text-left transition ${active ? 'border-brand-teal bg-brand-teal/10' : 'border-slate-200 bg-[#f8fafc] hover:border-brand-teal'}`}>
                          <div className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl ${active ? 'bg-brand-teal text-slate-950' : 'bg-white text-slate-400'}`}>
                            {active ? <FiCheckCircle /> : <FiCode />}
                          </div>
                          <div>
                            <h3 className="text-xl font-black">{item.title}</h3>
                            <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {step === 3 && (
                <div>
                  <h2 className="text-3xl font-black tracking-tight md:text-4xl">Lộ trình đầu tiên đã sẵn sàng.</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">Trong production, bước này sẽ gọi API lưu profile. Nếu save fail thì không chuyển trang.</p>
                  <div className="mt-6 rounded-[1.5rem] border border-brand-teal/30 bg-brand-teal/10 p-6">
                    <div className="text-xs font-black uppercase tracking-[0.2em] text-brand-ocean">Recommended path</div>
                    <h3 className="mt-3 text-4xl font-black">{goal.language} Starter</h3>
                    <p className="mt-3 text-sm leading-6 text-slate-600">Mục tiêu: {goal.title}. Kinh nghiệm: {experience.title}.</p>
                    <div className="mt-5 grid gap-3 md:grid-cols-3">
                      {['Bài đầu: chạy code mẫu', 'Flow: quan sát -> sửa -> kiểm tra', 'Progress: lưu sau completeLesson'].map(item => (
                        <div key={item} className="rounded-2xl border border-slate-200 bg-white p-4 text-sm font-bold text-slate-700">{item}</div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-8 flex flex-col justify-between gap-3 border-t border-slate-200 pt-6 sm:flex-row">
                <button onClick={() => setStep(prev => Math.max(1, prev - 1))} className="rounded-2xl border border-slate-300 bg-white px-5 py-3 text-sm font-black text-slate-700 shadow-[0_4px_0_#cbd5e1] disabled:opacity-40" disabled={step === 1}>
                  Quay lại
                </button>
                {step < 3 ? (
                  <button onClick={() => setStep(prev => Math.min(3, prev + 1))} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand-teal px-5 py-3 text-sm font-black text-slate-950 shadow-[0_5px_0_#0b889c]">
                    Tiếp tục <FiArrowRight />
                  </button>
                ) : (
                  <V2PressedButton to="/v2/library"><FiSave /> Preview Journey Map</V2PressedButton>
                )}
              </div>
            </section>

            <aside className="grid gap-4 lg:self-start">
              <div className="rounded-[2rem] border border-slate-200 bg-slate-950 p-6 text-white shadow-xl shadow-slate-200/70">
                <div className="mb-4 flex items-center gap-2 text-xs font-black uppercase tracking-[0.2em] text-brand-teal"><FiTarget /> Preview</div>
                <h2 className="text-3xl font-black">{goal.language} Starter</h2>
                <p className="mt-3 text-sm leading-6 text-slate-400">Loopy sẽ mở bài đầu phù hợp, thay vì đưa bạn vào catalog tự chọn.</p>
                <div className="mt-5 grid gap-2">
                  {['Không celebration trước khi lưu', 'Không navigate nếu save profile fail', 'CTA đầu tiên là bài học thật'].map(item => (
                    <div key={item} className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-slate-300"><FiCheckCircle className="text-brand-teal" /> {item}</div>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-slate-200 bg-white p-6">
                <div className="mb-3 flex items-center gap-2 text-sm font-black text-brand-ocean"><FiPlay /> Vì sao cần onboarding?</div>
                <p className="text-sm leading-6 text-slate-600">Người mới không cần thấy toàn bộ catalog ngay. Họ cần một bài đầu rõ ràng và một đường quay lại nếu bị kẹt.</p>
              </div>
            </aside>
          </div>
        </div>
      </main>
    </V2PublicShell>
  )
}

export default V2OnboardingPage
