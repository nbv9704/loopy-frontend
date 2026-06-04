import { motion, useTransform, MotionValue } from 'framer-motion'
import { ArrowRight, CheckCircle2, Code2, Compass, Play, Sparkles, Terminal, Zap } from 'lucide-react'
import { RefObject } from 'react'

interface HeroSectionV2Props {
  sectionRef: RefObject<HTMLDivElement>
  opacity: MotionValue<number>
  blur: MotionValue<number>
  onStartCoding: () => void
  onViewDocs: () => void
}

const HeroSectionV2: React.FC<HeroSectionV2Props> = ({
  sectionRef,
  opacity,
  blur,
  onStartCoding,
  onViewDocs,
}) => {
  const journeySteps = ['Xem ví dụ', 'Sửa 1 dòng', 'Chạy code', 'Sửa lỗi', 'Mở bài tiếp']

  return (
    <motion.section
      ref={sectionRef}
      style={{
        opacity,
        filter: useTransform(blur, value => `blur(${value}px)`),
      }}
      className="relative px-6 md:px-12 pt-24 pb-20 md:pt-25 md:pb-25"
    >
      <div className="max-w-[1500px] mx-auto">
        <div className="grid lg:grid-cols-[1.05fr,0.95fr] gap-12 xl:gap-16 items-center">
          <div className="space-y-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="space-y-6"
            >
              <div className="inline-flex items-center gap-2 rounded-full border border-brand-teal/30 bg-brand-teal/10 px-4 py-2 text-sm font-semibold text-brand-teal">
                <Sparkles className="h-4 w-4" />
                Lộ trình học code cho người mới bắt đầu
              </div>

              <h1 className="max-w-5xl text-5xl font-black leading-[0.95] tracking-tight text-white md:text-6xl xl:text-7xl">
                Học lập trình từ số 0, từng bước nhỏ,{' '}
                <span className="bg-gradient-to-r from-brand-teal via-brand-cyan to-white bg-clip-text text-transparent">
                  code ngay trong trình duyệt.
                </span>
              </h1>
              <p className="max-w-2xl text-lg leading-8 text-slate-300 md:text-xl">
                Loopy dẫn bạn qua bài học ngắn, thử thách vừa sức và phản hồi dễ hiểu để bạn không bị ngợp trong 20 giờ đầu tiên.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="flex flex-col gap-3 sm:flex-row"
            >
              <button
                onClick={onStartCoding}
                className="group relative inline-flex items-center justify-center gap-3 overflow-hidden rounded-2xl bg-brand-teal px-8 py-4 text-[#0a0e1a] shadow-xl shadow-brand-teal/20 transition-transform hover:-translate-y-0.5"
              >
                <div className="absolute inset-0 -translate-x-full bg-brand-cyan transition-transform duration-500 ease-out group-hover:translate-x-0" />
                <span className="relative z-10 flex items-center gap-2 text-base font-black md:text-lg">
                  <Play className="h-5 w-5" />
                  Thử bài đầu tiên miễn phí
                  <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
                </span>
              </button>

              <button
                onClick={onViewDocs}
                className="group inline-flex items-center justify-center gap-3 rounded-2xl border border-white/12 bg-white/[0.06] px-8 py-4 text-base font-bold text-white transition-all hover:border-brand-teal/50 hover:bg-white/10 md:text-lg"
              >
                <Compass className="h-5 w-5 text-brand-teal" />
                Tìm lộ trình phù hợp
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="grid gap-3 pt-2 sm:grid-cols-3"
            >
              {[
                { icon: Terminal, title: 'Không cần cài đặt', desc: 'Mở trình duyệt là chạy code' },
                { icon: Zap, title: 'Bài học 2-5 phút', desc: 'Một khái niệm, một chiến thắng nhỏ' },
                { icon: CheckCircle2, title: 'Sai có gợi ý sửa', desc: 'Hiểu lỗi thay vì bỏ cuộc' },
              ].map(item => (
                <div key={item.title} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-brand-teal/10 text-brand-teal">
                    <item.icon className="h-4 w-4" />
                  </div>
                  <div className="text-sm font-bold text-white">{item.title}</div>
                  <div className="mt-1 text-xs leading-5 text-slate-400">{item.desc}</div>
                </div>
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="relative"
          >
            <div className="relative">
              <div className="absolute -inset-4 rounded-[2rem] bg-gradient-to-br from-brand-teal/20 via-brand-cyan/20 to-transparent blur-2xl" />

              <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-gradient-to-br from-white/[0.09] to-white/[0.03] shadow-2xl backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 bg-black/20 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex gap-1.5">
                      <div className="h-3 w-3 rounded-full bg-red-400/80" />
                      <div className="h-3 w-3 rounded-full bg-yellow-400/80" />
                      <div className="h-3 w-3 rounded-full bg-green-400/80" />
                    </div>
                    <span className="font-mono text-sm text-slate-400">first-win.py</span>
                  </div>
                  <Terminal className="h-4 w-4 text-brand-teal/60" />
                </div>

                <div className="space-y-5 p-5 md:p-6">
                  <div className="rounded-2xl border border-white/10 bg-[#090d18] p-5 font-mono text-sm leading-7">
                    <div className="text-slate-600"># Nhiệm vụ: đổi tên và chạy thử</div>
                    <div><span className="text-pink-400">name</span><span className="text-slate-300"> = </span><span className="text-green-400">"An"</span></div>
                    <div><span className="text-blue-400">print</span><span className="text-slate-300">(</span><span className="text-green-400">"Xin chào, "</span><span className="text-slate-300"> + name)</span></div>
                  </div>

                  <div className="grid gap-2 sm:grid-cols-5">
                    {journeySteps.map((step, index) => (
                      <div
                        key={step}
                        className={`rounded-xl border px-3 py-2 text-center text-xs font-bold ${index === 2
                          ? 'border-brand-teal/60 bg-brand-teal/15 text-brand-teal'
                          : 'border-white/10 bg-white/[0.04] text-slate-400'
                          }`}
                      >
                        {step}
                      </div>
                    ))}
                  </div>
                </div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 1.4 }}
                  className="border-t border-white/10 bg-black/30 px-6 py-4"
                >
                  <div className="flex items-start gap-2 font-mono text-sm">
                    <span className="mt-0.5 text-brand-teal/60">{'>'}</span>
                    <div className="flex-1">
                      <div className="text-brand-teal">Xin chào, An</div>
                      <div className="mt-2 flex items-center gap-2 text-green-400">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-xs">Bài đầu tiên đã chạy thành công</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5 }}
                className="absolute -bottom-6 right-4 rounded-2xl border border-white/20 bg-gradient-to-br from-brand-cyan/90 to-brand-teal/90 px-5 py-4 shadow-2xl backdrop-blur-xl md:-right-6 md:px-6"
              >
                <div className="flex items-center gap-3">
                  <Code2 className="h-6 w-6 text-white" />
                  <div>
                    <div className="text-base font-bold text-white md:text-lg">Thắng nhỏ đầu tiên</div>
                    <div className="text-xs text-white/80">Không cần cài môi trường</div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  )
}

export default HeroSectionV2
